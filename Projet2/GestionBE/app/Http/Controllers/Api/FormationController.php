<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Formation;
use App\Models\FormationParticipant;
use App\Services\SmartSuggestionScorer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class FormationController extends Controller
{
    private function participantsCacheKey(int $formationId): string
    {
        return "formation:{$formationId}:participants:v2";
    }

    private function participantsAttendanceCacheKey(int $formationId): string
    {
        return "formation:{$formationId}:participants_with_attendance:v1";
    }

    private function forgetParticipantsCaches(int $formationId): void
    {
        Cache::forget($this->participantsCacheKey($formationId));
        Cache::forget($this->participantsAttendanceCacheKey($formationId));
    }

    private function isInternalTrainerOfFormation(Formation $formation, int $employeId): bool
    {
        return ($formation->type === 'Interne')
            && !empty($formation->formateur_employe_id)
            && (int) $formation->formateur_employe_id === (int) $employeId;
    }

    /**
     * Helper to format a formation with formateur_nom.
     */
    private function formatFormationResponse(Formation $formation)
    {
        $hasFormateurCols = Schema::hasColumns('formations', ['formateur_employe_id', 'formateur_id']);
        
        // Load relations
        $formation->load([
            'formateurEmploye:id,matricule,nom,prenom',
            'formateur:id,name',
        ]);
        $formation->loadCount('participants');

        // Add formateur_nom
        if (!$hasFormateurCols) {
            $formation->formateur_nom = null;
        } else {
            if ($formation->type === 'Interne' && $formation->formateurEmploye) {
                $e = $formation->formateurEmploye;
                $formation->formateur_nom = trim(($e->nom ?? '') . ' ' . ($e->prenom ?? ''));
            } elseif ($formation->type === 'Externe' && $formation->formateur) {
                $formation->formateur_nom = $formation->formateur->name;
            } else {
                $formation->formateur_nom = null;
            }
        }

        return $formation;
    }

    /**
     * Compute participant status based on formation dates.
     * - Before date_debut: "En attente"
     * - Between date_debut and date_fin: "En cours"
     * - After date_fin: "Terminé"
     */
    private function computeParticipantStatus(Formation $formation): string
    {
        $today = now()->startOfDay();
        $dateDebut = $formation->date_debut ? \Carbon\Carbon::parse($formation->date_debut)->startOfDay() : null;
        $dateFin = $formation->date_fin ? \Carbon\Carbon::parse($formation->date_fin)->startOfDay() : null;

        if (!$dateDebut) {
            return 'En attente';
        }

        if ($today->lt($dateDebut)) {
            return 'En attente';
        }

        if ($dateFin && $today->gt($dateFin)) {
            return 'Terminé';
        }

        return 'En cours';
    }

    /**
     * List all formations with participant count.
     */
    public function index(Request $request)
    {
        try {
            $hasFormateurCols = Schema::hasColumns('formations', ['formateur_employe_id', 'formateur_id']);
            $hasParticipantsTable = Schema::hasTable('formation_participants');
            $includeSessions = $request->boolean('include_sessions', false);

            $query = Formation::query();

            if ($hasParticipantsTable) {
                $query->withCount('participants');
            }

            $hasSessionsTable = Schema::hasTable('formation_sessions');
            if ($hasSessionsTable) {
                $query->withCount('sessions');
                if ($includeSessions) {
                    $query->with([
                        'sessions' => function ($q) {
                            $q->select('id', 'formation_id', 'date', 'heure_debut', 'heure_fin', 'salle', 'statut')
                                ->orderBy('date')
                                ->orderBy('heure_debut');
                        }
                    ]);
                }
            }

            if ($hasFormateurCols) {
                $query->with(['formateurEmploye:id,matricule,nom,prenom', 'formateur:id,name']);
            }

            if ($request->filled('statut')) {
                $query->where('statut', $request->statut);
            }
            if ($request->filled('domaine')) {
                $query->where('domaine', $request->domaine);
            }

            $formations = $query->orderByDesc('created_at')->get();

            $formations->each(function ($f) use ($hasFormateurCols) {
                if (!$hasFormateurCols) {
                    $f->formateur_nom = null;
                } else {
                    if ($f->type === 'Interne' && $f->formateurEmploye) {
                        $e = $f->formateurEmploye;
                        $f->formateur_nom = trim(($e->nom ?? '') . ' ' . ($e->prenom ?? ''));
                    } elseif ($f->type === 'Externe' && $f->formateur) {
                        $f->formateur_nom = $f->formateur->name;
                    } else {
                        $f->formateur_nom = null;
                    }
                }
                // Don't compute attendance rate in list view (causes N+1 queries)
                // It's only computed in show() for details view
                $f->attendance_rate = null;
            });

            return response()->json($formations);

        } catch (\Exception $e) {
            Log::error('FormationController@index error: ' . $e->getMessage());
            // Fallback : retourner les formations brutes sans relations
            try {
                return response()->json(Formation::orderByDesc('created_at')->get());
            } catch (\Exception $e2) {
                return response()->json(Formation::all());
            }
        }
    }

    /**
     * Create a new formation.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:formations,code',
            'titre' => 'required|string|max:255',
            'domaine' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'mode_formation' => 'nullable|string|max:255',
            'duree' => 'nullable|string|max:255',
            'statut' => 'nullable|string|max:255',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'budget' => 'nullable|numeric|min:0',
            'organisme' => 'nullable|string|max:255',
            'effectif' => 'nullable|integer|min:1',
            'formateur_employe_id' => 'nullable|exists:employes,id',
            'formateur_id' => 'nullable|exists:formateurs,id',
            'competence_ids' => 'nullable|array',
            'competence_ids.*' => 'integer|exists:gp_competences,id',
        ]);

        // Extract competence_ids before creating formation
        $competenceIds = $data['competence_ids'] ?? [];
        unset($data['competence_ids']);

        // Clear the other formateur field depending on type
        if (($data['type'] ?? null) === 'Interne') {
            $data['formateur_id'] = null;
        } elseif (($data['type'] ?? null) === 'Externe') {
            $data['formateur_employe_id'] = null;
        }

        $formation = Formation::create($data);

        // Sync competences if provided
        if (!empty($competenceIds)) {
            $formation->competences()->sync($competenceIds);
        }

        return response()->json($this->formatFormationResponse($formation), 201);
    }

    /**
     * Show a single formation with its participants.
     */
    public function show(Request $request, Formation $formation)
    {
        if ($request->boolean('compact')) {
            $hasFormateurCols = Schema::hasColumns('formations', ['formateur_employe_id', 'formateur_id']);

            $compactLoads = [];
            if ($hasFormateurCols) {
                $compactLoads = [
                    'formateurEmploye:id,matricule,nom,prenom',
                    'formateur:id,name',
                ];
            }

            if (!empty($compactLoads)) {
                $formation->load($compactLoads);
            }

            $formation->loadCount('participants');
            if (Schema::hasTable('formation_sessions')) {
                $formation->loadCount('sessions');
                $formation->attendance_rate = null;
            }

            if ($formation->type === 'Interne' && $formation->formateurEmploye) {
                $e = $formation->formateurEmploye;
                $formation->formateur_nom = trim(($e->nom ?? '') . ' ' . ($e->prenom ?? ''));
            } elseif ($formation->type === 'Externe' && $formation->formateur) {
                $formation->formateur_nom = $formation->formateur->name;
            } else {
                $formation->formateur_nom = null;
            }

            $formation->competence_ids = [];

            return response()->json($formation);
        }

        $formation->load([
            'participants.employe:id,matricule,nom,prenom,departement_id',
            'participants.employe.departements:id,nom',
            'formateurEmploye:id,matricule,nom,prenom',
            'formateur:id,name',
            'competences:id,nom,categorie',
        ]);
        $formation->loadCount('participants');

        if (Schema::hasTable('formation_sessions')) {
            $formation->loadCount('sessions');
            $formation->attendance_rate = $formation->getAttendanceRateAttribute();
        }

        // Add formateur_nom
        if ($formation->type === 'Interne' && $formation->formateurEmploye) {
            $e = $formation->formateurEmploye;
            $formation->formateur_nom = trim(($e->nom ?? '') . ' ' . ($e->prenom ?? ''));
        } elseif ($formation->type === 'Externe' && $formation->formateur) {
            $formation->formateur_nom = $formation->formateur->name;
        } else {
            $formation->formateur_nom = null;
        }

        // Add competence_ids for form binding
        $formation->competence_ids = $formation->competences->pluck('id')->toArray();

        return response()->json($formation);
    }

    /**
     * Lightweight summary endpoint used by participants page.
     */
    public function summary(Formation $formation)
    {
        $payload = Formation::query()
            ->select([
                'id',
                'code',
                'titre',
                'domaine',
                'type',
                'statut',
                'effectif',
                'date_debut',
                'date_fin',
                'formateur_employe_id',
                'formateur_id',
            ])
            ->findOrFail($formation->id);

        $payload->participants_count = (int) DB::table('formation_participants')
            ->where('formation_id', (int) $formation->id)
            ->count();

        return response()->json($payload);
    }

    /**
     * Update a formation.
     */
    public function update(Request $request, Formation $formation)
    {
        $data = $request->validate([
            'code' => 'sometimes|required|string|max:50|unique:formations,code,' . $formation->id,
            'titre' => 'sometimes|required|string|max:255',
            'domaine' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'mode_formation' => 'nullable|string|max:255',
            'duree' => 'nullable|string|max:255',
            'statut' => 'nullable|string|max:255',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'budget' => 'nullable|numeric|min:0',
            'organisme' => 'nullable|string|max:255',
            'effectif' => 'nullable|integer|min:1',
            'formateur_employe_id' => 'nullable|exists:employes,id',
            'formateur_id' => 'nullable|exists:formateurs,id',
            'competence_ids' => 'nullable|array',
            'competence_ids.*' => 'integer|exists:gp_competences,id',
        ]);

        // Extract competence_ids before updating formation
        $competenceIds = null;
        if (array_key_exists('competence_ids', $data)) {
            $competenceIds = $data['competence_ids'];
            unset($data['competence_ids']);
        }

        // Validate that new effectif is not less than current participants count
        if (isset($data['effectif'])) {
            $currentCount = $formation->participants()->count();
            if ($data['effectif'] < $currentCount) {
                return response()->json([
                    'message' => "L'effectif ne peut pas être inférieur au nombre actuel de participants ({$currentCount})."
                ], 422);
            }
        }

        // Clear the other formateur field depending on type
        if (($data['type'] ?? $formation->type) === 'Interne') {
            $data['formateur_id'] = null;
        } elseif (($data['type'] ?? $formation->type) === 'Externe') {
            $data['formateur_employe_id'] = null;
        }

        $nextType = $data['type'] ?? $formation->type;
        $nextFormateurEmployeId = $data['formateur_employe_id'] ?? $formation->formateur_employe_id;

        if ($nextType === 'Interne' && !empty($nextFormateurEmployeId)) {
            $isAlreadyParticipant = $formation->participants()
                ->where('employe_id', $nextFormateurEmployeId)
                ->exists();

            if ($isAlreadyParticipant) {
                return response()->json([
                    'message' => 'Le formateur interne ne peut pas être participant de la même formation.'
                ], 422);
            }
        }

        $formation->update($data);

        // Sync competences if provided
        if ($competenceIds !== null) {
            $formation->competences()->sync($competenceIds);
        }

        return response()->json($this->formatFormationResponse($formation));
    }

    /**
     * Delete a formation.
     */
    public function destroy(Formation $formation)
    {
        $formation->delete();
        return response()->json(['message' => 'Formation supprimée']);
    }

    /**
     * List participants for a formation.
     */
    public function participants(Formation $formation)
    {
        $formationId = (int) $formation->id;

        $participants = Cache::remember(
            $this->participantsCacheKey($formationId),
            now()->addSeconds(30),
            function () use ($formation, $formationId) {
                // Compute status once for all participants.
                $computedStatus = $this->computeParticipantStatus($formation);

                return DB::table('formation_participants as fp')
                    ->join('employes as e', 'e.id', '=', 'fp.employe_id')
                    ->leftJoin('departements as d', 'd.id', '=', 'e.departement_id')
                    ->where('fp.formation_id', $formationId)
                    ->select(
                        'fp.id',
                        'fp.employe_id',
                        'e.matricule',
                        'e.nom',
                        'e.prenom',
                        DB::raw("COALESCE(d.nom, '') as departement_nom"),
                        'fp.note',
                        'fp.commentaire',
                        'fp.attestation',
                        'fp.created_at'
                    )
                    ->orderBy('e.nom')
                    ->orderBy('e.prenom')
                    ->get()
                    ->map(function ($p) use ($computedStatus) {
                        return [
                            'id' => $p->id,
                            'employe_id' => $p->employe_id,
                            'matricule' => $p->matricule,
                            'employe' => trim(($p->nom ?? '') . ' ' . ($p->prenom ?? '')),
                            'departement' => $p->departement_nom ?? '',
                            'statut' => $computedStatus,
                            'note' => $p->note,
                            'commentaire' => $p->commentaire,
                            'attestation' => $p->attestation,
                            'created_at' => $p->created_at,
                        ];
                    })
                    ->values()
                    ->all();
            }
        );

        return response()->json($participants);
    }

    /**
     * Add a participant to a formation.
     */
    public function addParticipant(Request $request, Formation $formation)
    {
        $data = $request->validate([
            'employe_id' => 'required|exists:employes,id',
            'note' => 'nullable|string|max:255',
            'commentaire' => 'nullable|string',
        ]);

        // Check if already exists
        $exists = FormationParticipant::where('formation_id', $formation->id)
            ->where('employe_id', $data['employe_id'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Ce participant est déjà inscrit à cette formation.'], 422);
        }

        if ($this->isInternalTrainerOfFormation($formation, (int) $data['employe_id'])) {
            return response()->json([
                'message' => 'Le formateur interne ne peut pas être participant de la même formation.'
            ], 422);
        }

        // Check if formation has reached maximum capacity (effectif)
        if ($formation->effectif) {
            $currentCount = $formation->participants()->count();
            if ($currentCount >= $formation->effectif) {
                return response()->json([
                    'message' => "La formation a atteint sa capacité maximale ({$formation->effectif} participants)."
                ], 422);
            }
        }

        $participant = FormationParticipant::create([
            'formation_id' => $formation->id,
            'employe_id' => $data['employe_id'],
            'statut' => 'Inscrit', // Status is now computed from formation dates
            'note' => $data['note'] ?? null,
            'commentaire' => $data['commentaire'] ?? null,
        ]);

        $this->forgetParticipantsCaches((int) $formation->id);

        $participant->load(['employe:id,matricule,nom,prenom,departement_id', 'employe.departements:id,nom']);

        // Compute status based on formation dates
        $computedStatus = $this->computeParticipantStatus($formation);

        $emp = $participant->employe;
        return response()->json([
            'id' => $participant->id,
            'employe_id' => $participant->employe_id,
            'matricule' => $emp?->matricule,
            'employe' => trim(($emp?->nom ?? '') . ' ' . ($emp?->prenom ?? '')),
            'departement' => $emp?->departements?->first()?->nom ?? '',
            'statut' => $computedStatus, // Computed from formation dates
            'note' => $participant->note,
            'commentaire' => $participant->commentaire,
            'attestation' => $participant->attestation,
            'created_at' => $participant->created_at,
        ], 201);
    }

    /**
     * Update a participant.
     * Note: statut is computed from formation dates, not editable.
     */
    public function updateParticipant(Request $request, Formation $formation, FormationParticipant $participant)
    {
        $data = $request->validate([
            'note' => 'nullable|string|max:255',
            'commentaire' => 'nullable|string',
            'attestation' => 'nullable|string',
        ]);

        $participant->update($data);

        $this->forgetParticipantsCaches((int) $formation->id);

        // Return with computed status
        $computedStatus = $this->computeParticipantStatus($formation);
        $participant->load(['employe:id,matricule,nom,prenom,departement_id', 'employe.departements:id,nom']);
        $emp = $participant->employe;

        return response()->json([
            'id' => $participant->id,
            'employe_id' => $participant->employe_id,
            'matricule' => $emp?->matricule,
            'employe' => trim(($emp?->nom ?? '') . ' ' . ($emp?->prenom ?? '')),
            'departement' => $emp?->departements?->first()?->nom ?? '',
            'statut' => $computedStatus,
            'note' => $participant->note,
            'commentaire' => $participant->commentaire,
            'attestation' => $participant->attestation,
            'created_at' => $participant->created_at,
        ]);
    }

    /**
     * Remove a participant from a formation.
     */
    public function removeParticipant(Formation $formation, FormationParticipant $participant)
    {
        $participant->delete();
        $this->forgetParticipantsCaches((int) $formation->id);
        return response()->json(['message' => 'Participant retiré']);
    }

    /**
     * GET /formations/{formation}/participants-with-attendance
     *
     * Returns each participant with aggregated attendance statistics:
     *   total_sessions  – number of sessions for the formation
     *   total_present   – rows where statut = 'Présent'
     *   total_absent    – rows where statut = 'Absent'
     *   total_retard    – rows where statut = 'Retard'
     *   attendance_rate – (total_present / total_sessions) * 100, null when 0 sessions
     */
    public function participantsWithAttendance(Formation $formation)
    {
        $formationId = (int) $formation->id;

        $payload = Cache::remember(
            $this->participantsAttendanceCacheKey($formationId),
            now()->addSeconds(30),
            function () use ($formationId) {
                $rows = DB::table('formation_participants as fp')
                    ->join('employes as e', 'e.id', '=', 'fp.employe_id')
                    ->leftJoin('departements as d', 'd.id', '=', 'e.departement_id')
                    ->where('fp.formation_id', $formationId)
                    ->select([
                        'fp.id',
                        'fp.employe_id',
                        'fp.statut',
                        'fp.note',
                        'fp.commentaire',
                        'fp.attestation',
                        'fp.created_at',
                        'e.matricule',
                        'e.nom',
                        'e.prenom',
                        DB::raw("COALESCE(d.nom, '') as departement_nom"),
                    ])
                    ->orderBy('e.nom')
                    ->orderBy('e.prenom')
                    ->get();

                // Fast-path: no participant means no expensive attendance aggregation.
                if ($rows->isEmpty()) {
                    return [];
                }

                $totalSessions = (int) DB::table('formation_sessions')
                    ->where('formation_id', $formationId)
                    ->count();

                $attendanceByEmployee = collect();
                if ($totalSessions > 0) {
                    $employeeIds = $rows->pluck('employe_id')->unique()->values()->all();
                    if (!empty($employeeIds)) {
                        $attendanceByEmployee = DB::table('formation_attendance as fa')
                            ->join('formation_sessions as fs', 'fs.id', '=', 'fa.session_id')
                            ->where('fs.formation_id', $formationId)
                            ->whereIn('fa.employe_id', $employeeIds)
                            ->groupBy('fa.employe_id')
                            ->select(
                                'fa.employe_id',
                                DB::raw("SUM(CASE WHEN fa.statut = 'Présent' THEN 1 ELSE 0 END) AS total_present"),
                                DB::raw("SUM(CASE WHEN fa.statut = 'Absent' THEN 1 ELSE 0 END) AS total_absent"),
                                DB::raw("SUM(CASE WHEN fa.statut = 'Retard' THEN 1 ELSE 0 END) AS total_retard")
                            )
                            ->get()
                            ->keyBy('employe_id');
                    }
                }

                return $rows->map(function ($row) use ($totalSessions, $attendanceByEmployee) {
                    $attendance = $attendanceByEmployee->get($row->employe_id);
                    $totalPresent = (int) ($attendance->total_present ?? 0);
                    $totalAbsent = (int) ($attendance->total_absent ?? 0);
                    $totalRetard = (int) ($attendance->total_retard ?? 0);
                    $attendanceRate = $totalSessions > 0
                        ? round(($totalPresent / $totalSessions) * 100, 1)
                        : null;

                    return [
                        'id'              => $row->id,
                        'employe_id'      => $row->employe_id,
                        'matricule'       => $row->matricule,
                        'employe'         => trim(($row->nom ?? '') . ' ' . ($row->prenom ?? '')),
                        'departement'     => $row->departement_nom,
                        'statut'          => $row->statut,
                        'note'            => $row->note,
                        'commentaire'     => $row->commentaire,
                        'attestation'     => $row->attestation,
                        'created_at'      => $row->created_at,
                        'total_sessions'  => $totalSessions,
                        'total_present'   => $totalPresent,
                        'total_absent'    => $totalAbsent,
                        'total_retard'    => $totalRetard,
                        'attendance_rate' => $attendanceRate,
                    ];
                })->values()->all();
            }
        );

        return response()->json($payload);
    }

    /**
     * AI-suggested participants for a formation.
     *
     * Rules:
     *  1. Prefer employees whose department name matches formation.domaine
     *  2. Exclude already-registered participants
     *  3. Sort by lowest formation count, then oldest last-training date
     *  4. Return top 10
     */
    public function suggestedParticipants(Formation $formation)
    {
        $domaine     = $formation->domaine ?? '';
        $domainLower = strtolower(trim($domaine));

        // IDs already registered
        $registeredIds = $formation->participants()->pluck('employe_id')->toArray();
        if ($formation->type === 'Interne' && !empty($formation->formateur_employe_id)) {
            $registeredIds[] = (int) $formation->formateur_employe_id;
        }

        // Aggregate formation stats per employee in ONE query
        $stats = DB::table('formation_participants')
            ->select(
                'employe_id',
                DB::raw('COUNT(*) as total_formations'),
                DB::raw('MAX(created_at) as last_formation_date')
            )
            ->groupBy('employe_id')
            ->get()
            ->keyBy('employe_id');

        // Active employees not already registered
        $employees = \App\Models\Employe::with(['departements:id,nom'])
            ->whereNotIn('id', $registeredIds)
            ->whereNull('date_sortie')
            ->get();

        $suggestions = $employees->map(function ($emp) use ($stats, $domainLower) {
            $deptNames = $emp->departements->pluck('nom')->toArray();

            // Soft domain match: dept name contains domaine or vice-versa
            $domainMatch = false;
            if ($domainLower !== '') {
                foreach ($deptNames as $deptName) {
                    if (
                        stripos($deptName, $domainLower) !== false ||
                        stripos($domainLower, $deptName) !== false
                    ) {
                        $domainMatch = true;
                        break;
                    }
                }
            }

            $empStats       = $stats->get($emp->id);
            $formationsCount = (int) ($empStats?->total_formations ?? 0);
            $lastDate        = $empStats?->last_formation_date ?? null;

            return [
                'id'                  => $emp->id,
                'matricule'           => $emp->matricule,
                'nom_complet'         => trim(($emp->nom ?? '') . ' ' . ($emp->prenom ?? '')),
                'departement'         => $deptNames[0] ?? '—',
                'domain_match'        => $domainMatch,
                'formations_count'    => $formationsCount,
                'last_formation_date' => $lastDate,
            ];
        });

        // Sort: domain-matched first, then by formations_count ASC, last_date ASC (oldest = less trained recently)
        if ($domainLower !== '') {
            $matched   = $suggestions->filter(fn($s) => $s['domain_match']);
            $unmatched = $suggestions->filter(fn($s) => !$s['domain_match']);

            $sortFn = fn($col) => $col->sortBy([
                fn($a, $b) => $a['formations_count'] <=> $b['formations_count'],
                fn($a, $b) => ($a['last_formation_date'] ?? '0000') <=> ($b['last_formation_date'] ?? '0000'),
            ])->values();

            $result = $sortFn($matched);
            if ($result->count() < 10) {
                $result = $result->concat($sortFn($unmatched))->take(10);
            }
        } else {
            $result = $suggestions->sortBy([
                fn($a, $b) => $a['formations_count'] <=> $b['formations_count'],
                fn($a, $b) => ($a['last_formation_date'] ?? '0000') <=> ($b['last_formation_date'] ?? '0000'),
            ])->take(10)->values();
        }

        return response()->json($result->values());
    }

    /**
     * Smart scored suggestions for a formation.
     *
     * GET /formations/{formation}/smart-suggestions
     *
     * Uses SmartSuggestionScorer to compute a 0-100 score per employee
     * based on skill gap coverage, domain match, training recency,
     * total training count, and attendance history.
     */
    public function smartSuggestions(Formation $formation)
    {
        try {
            // IDs already registered
            $registeredIds = $formation->participants()->pluck('employe_id')->toArray();
            if ($formation->type === 'Interne' && !empty($formation->formateur_employe_id)) {
                $registeredIds[] = (int) $formation->formateur_employe_id;
            }

            // Aggregate formation stats per employee in one query
            $stats = DB::table('formation_participants')
                ->select(
                    'employe_id',
                    DB::raw('COUNT(*) as total_formations'),
                    DB::raw('MAX(created_at) as last_formation_date')
                )
                ->groupBy('employe_id')
                ->get()
                ->keyBy('employe_id');

            // Active employees not already registered
            $employees = \App\Models\Employe::with(['departements:id,nom'])
                ->whereNotIn('id', $registeredIds)
                ->whereNull('date_sortie')
                ->get();

            $employeeIds = $employees->pluck('id')->toArray();

            // Build scorer and preload bulk data
            $scorer = new SmartSuggestionScorer($formation, $stats);
            $scorer->loadFormationCompetences();        // Skills taught by this formation
            $scorer->loadPosteRequirements($employeeIds); // Skills required for each employee's poste
            $scorer->loadEmployeeCompetences($employeeIds);
            $scorer->loadRecentDomainFormations($employeeIds);
            $scorer->loadAttendanceRates($employeeIds);

            // Score all candidates
            $scored = $employees->map(function ($emp) use ($scorer) {
                $deptNames = $emp->departements->pluck('nom')->toArray();
                return $scorer->score($emp, $deptNames);
            });

            // Sort by score DESC, return top 10
            $result = $scored->sortByDesc('score')->take(10)->values();

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('FormationController@smartSuggestions error: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur lors du calcul des suggestions.'], 500);
        }
    }

    /**
     * Get competences for a formation.
     */
    public function getCompetences(Formation $formation)
    {
        $competences = $formation->competences()->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'nom' => $c->nom,
                'domaine' => $c->domaine,
                'niveau_cible' => $c->pivot->niveau_cible,
                'poids' => $c->pivot->poids,
            ];
        });

        return response()->json($competences);
    }

    /**
     * Sync competences for a formation.
     * Expects: { competence_ids: [1, 2, 3] } or { competences: [{ id: 1, niveau_cible: 3, poids: 1 }, ...] }
     */
    public function syncCompetences(Request $request, Formation $formation)
    {
        try {
            // Support both simple array of IDs and detailed array with pivot data
            if ($request->has('competences')) {
                // Detailed format: [{ id: 1, niveau_cible: 3, poids: 1 }, ...]
                $syncData = [];
                foreach ($request->input('competences', []) as $comp) {
                    $id = is_array($comp) ? ($comp['id'] ?? null) : $comp;
                    if ($id) {
                        $syncData[$id] = [
                            'niveau_cible' => $comp['niveau_cible'] ?? null,
                            'poids' => $comp['poids'] ?? 1,
                        ];
                    }
                }
                $formation->competences()->sync($syncData);
            } else {
                // Simple format: [1, 2, 3]
                $ids = $request->input('competence_ids', []);
                $formation->competences()->sync($ids);
            }

            return response()->json([
                'message' => 'Compétences mises à jour',
                'competences' => $formation->competences()->get()->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'nom' => $c->nom,
                        'niveau_cible' => $c->pivot->niveau_cible,
                        'poids' => $c->pivot->poids,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('FormationController@syncCompetences error: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur lors de la mise à jour des compétences.'], 500);
        }
    }
}
