<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCarriereRequest;
use App\Models\Employe;
use App\Models\Poste;
use App\Models\GpEmployePosteHistorique;
use App\Services\ManagerHierarchyValidator;
use App\Services\ManagerAutoAssignService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CarriereController extends Controller
{
    private function formatDuration(?string $start, ?string $end): string
    {
        if (!$start) return '—';
        try {
            $startDate = Carbon::parse($start);
        } catch (\Exception $e) {
            return '—';
        }

        $endDate = null;
        if ($end) {
            try {
                $endDate = Carbon::parse($end);
            } catch (\Exception $e) {
                $endDate = Carbon::now();
            }
        } else {
            $endDate = Carbon::now();
        }

        if ($endDate->lessThan($startDate)) {
            return '—';
        }

        $totalDays = $startDate->diffInDays($endDate);

        // Format relatif pour les durées récentes (moins de 24h)
        if ($totalDays === 0) {
            $totalMinutes = $startDate->diffInMinutes($endDate);
            $totalHours = $startDate->diffInHours($endDate);
            
            if ($totalMinutes < 1) {
                return "À l'instant";
            } elseif ($totalMinutes < 60) {
                return "Il y a {$totalMinutes} min";
            } else {
                $remainingMinutes = $totalMinutes % 60;
                if ($remainingMinutes > 0) {
                    return "Il y a {$totalHours}h {$remainingMinutes}min";
                }
                return "Il y a {$totalHours}h";
            }
        }

        // Format "Il y a X jour(s)" pour 1-6 jours
        if ($totalDays === 1) {
            return "Il y a 1 jour";
        } elseif ($totalDays < 7) {
            return "Il y a {$totalDays} jours";
        }

        // For durations less than ~30 days, show weeks/days
        $months = $startDate->diffInMonths($endDate);
        if ($months === 0) {
            $weeks = intdiv($totalDays, 7);
            $days = $totalDays % 7;
            $parts = [];
            if ($weeks > 0) $parts[] = $weeks . ' sem.';
            if ($days > 0) $parts[] = $days . ' j';
            return empty($parts) ? '—' : implode(' ', $parts);
        }

        $years = $startDate->diffInYears($endDate);
        $remainingMonths = $startDate->copy()->addYears($years)->diffInMonths($endDate);

        $parts = [];
        if ($years > 0) $parts[] = $years . ' an' . ($years > 1 ? 's' : '');
        if ($remainingMonths > 0) $parts[] = $remainingMonths . ' mois';
        if (empty($parts)) return '—';
        return implode(' ', $parts);
    }

    public function index(Request $request)
    {
        // Retourner TOUTES les entrées d'historique de poste, pas juste la plus récente par employé
        $query = GpEmployePosteHistorique::query()
            ->with([
                'employe.manager:id,nom,prenom,matricule',
                'poste.grade',
                'grade',
            ])
            ->orderBy('date_debut', 'desc')
            ->orderBy('created_at', 'desc'); // Tri secondaire: les plus récemment créées en premier

        if ($departementId = $request->query('departement_id')) {
            $query->whereHas('employe', function ($q) use ($departementId) {
                $q->where(function ($sub) use ($departementId) {
                    $sub->where('departement_id', $departementId)
                        ->orWhereHas('departements', function ($dept) use ($departementId) {
                            $dept->where('departement_id', $departementId);
                        });
                });
            });
        }

        $perPage = (int) $request->query('per_page', 0);

        $transform = function ($historique) {
            $employe = $historique->employe;
            $poste = $historique->poste;
            $grade = $historique->grade ?? $poste?->grade;
            $manager = $employe?->manager;
            $managerNomComplet = $manager
                ? trim(($manager->nom ?? '') . ' ' . ($manager->prenom ?? ''))
                : null;

            return [
                'id' => $historique->id,
                'employe_id' => $employe?->id,
                'matricule' => $employe?->matricule,
                'full_name' => $employe ? trim(($employe->nom ?? '') . ' ' . ($employe->prenom ?? '')) : '—',
                'manager_id' => $employe?->manager_id,
                'manager_name' => $managerNomComplet,
                'manager' => $manager ? [
                    'id' => $manager->id,
                    'nom' => $manager->nom,
                    'prenom' => $manager->prenom,
                    'nom_complet' => $managerNomComplet,
                    'matricule' => $manager->matricule,
                ] : null,
                'poste_actuel' => $poste?->nom ?? '—',
                'grade' => $grade?->code ?? $grade?->label ?? null,
                'departement_id' => $employe?->departement_id,
                'departement_name' => $employe?->departement?->nom ?? null,
                'date_debut_poste' => $historique->date_debut,
                'date_fin_poste' => $historique->date_fin,
                'periode' => $this->formatDuration($historique->date_debut, $historique->date_fin),
                'type_evolution' => $historique->type_evolution,
                'statut' => $historique->statut,
                'derniere_promotion' => $historique->date_debut,
            ];
        };

        if ($perPage > 0) {
            $paginator = $query->paginate($perPage);
            $paginator->getCollection()->transform($transform);
            return response()->json($paginator);
        }

        $rows = $query->get()->map($transform)->values();
        return response()->json($rows);
    }

    public function parcours($id)
    {
        $employe = Employe::with(['contrat', 'competences', 'manager:id,nom,prenom,matricule'])->findOrFail($id);

        // Historique validé (parcours actif)
        $historiques = GpEmployePosteHistorique::with(['poste', 'grade'])
            ->where('employe_id', $employe->id)
            ->where('statut', 'Validé')
            ->orderByDesc('date_debut')
            ->orderByDesc('created_at') // Tri secondaire par date de création
            ->get()
            ->map(function ($row) {
                return [
                    'type' => 'poste',
                    'poste' => $row->poste?->nom,
                    'grade' => $row->grade?->code,
                    'date_debut' => $row->date_debut,
                    'date_fin' => $row->date_fin,
                    'type_evolution' => $row->type_evolution,
                    'duration' => $this->formatDuration($row->date_debut, $row->date_fin),
                ];
            })->values();

        // Formations suivies par l'employé
        $formations = DB::table('formation_participants')
            ->join('formations', 'formation_participants.formation_id', '=', 'formations.id')
            ->where('formation_participants.employe_id', $employe->id)
            ->select(
                'formations.titre as formation',
                'formations.domaine',
                'formations.date_debut',
                'formations.date_fin'
            )
            ->get()
            ->map(function ($row) {
                return [
                    'type' => 'formation',
                    'formation' => $row->formation,
                    'domaine' => $row->domaine,
                    'date_debut' => $row->date_debut,
                    'date_fin' => $row->date_fin,
                ];
            });

        // Fusionner et trier chronologiquement
        $parcours = $historiques->concat($formations)->sortByDesc('date_debut')->values();

        \Log::info('PARCOURS DEBUG', [
            'employe_id' => $employe->id,
            'historiques_count' => $historiques->count(),
            'formations_count' => $formations->count(),
            'parcours_count' => $parcours->count(),
            'parcours_data' => $parcours->toArray()
        ]);

        // Postes proposés (en attente de validation)
        $postesEnAttente = GpEmployePosteHistorique::with(['poste.competences', 'grade'])
            ->where('employe_id', $employe->id)
            ->where('statut', 'Proposé')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'poste' => $row->poste?->nom,
                    'poste_id' => $row->poste_id,
                    'grade' => $row->grade?->code ?? $row->grade?->label,
                    'date_proposition' => $row->created_at?->format('Y-m-d'),
                    'type_evolution' => $row->type_evolution,
                    'competences_requises' => $row->poste?->competences->map(function ($c) {
                        return [
                            'id' => $c->id,
                            'nom' => $c->nom,
                            'categorie' => $c->categorie,
                            'niveau_requis' => $c->pivot->niveau_requis ?? null,
                        ];
                    })->values(),
                ];
            })->values();

        $latestContrat = $employe->contrat->first();

        return response()->json([
            'employe_id' => $employe->id,
            'matricule' => $employe->matricule,
            'full_name' => trim(($employe->nom ?? '') . ' ' . ($employe->prenom ?? '')),
            'manager_id' => $employe->manager_id,
            'manager' => $employe->manager ? [
                'id' => $employe->manager->id,
                'nom' => $employe->manager->nom,
                'prenom' => $employe->manager->prenom,
                'nom_complet' => trim(($employe->manager->nom ?? '') . ' ' . ($employe->manager->prenom ?? '')),
                'matricule' => $employe->manager->matricule,
            ] : null,
            'email' => $employe->email,
            'telephone' => $employe->tel,
            'date_embauche' => $employe->date_embauche,
            'date_entree' => $employe->date_entree,
            'type_contrat' => $latestContrat?->type_contrat,
            'competences' => $employe->competences->map(function ($c) {
                return [
                    'id' => $c->id,
                    'nom' => $c->nom,
                    'categorie' => $c->categorie,
                    'description' => $c->description,
                    'niveau' => $c->pivot->niveau,
                    'niveau_acquis' => $c->pivot->niveau_acquis,
                    'date_acquisition' => $c->pivot->date_acquisition,
                ];
            })->values(),
            'parcours' => $parcours,
            'postes_en_attente' => $postesEnAttente,
        ]);
    }

    public function store(StoreCarriereRequest $request)
    {
        $data = $request->validated();

        $employe = Employe::findOrFail($data['employe_id']);
        $poste = Poste::with('grade')->findOrFail($data['poste_id']);
        $gradeId = $data['grade_id'] ?? $poste->grade_id;

        if (empty($data['manager_id'])) {
            $autoManagerId = app(ManagerAutoAssignService::class)->suggestManagerId($employe);
            if ($autoManagerId) {
                $data['manager_id'] = $autoManagerId;
            }
        }

        if (array_key_exists('manager_id', $data)) {
            $managerError = app(ManagerHierarchyValidator::class)->validate(
                (int) $employe->id,
                $data['manager_id'] ? (int) $data['manager_id'] : null
            );

            if ($managerError) {
                return response()->json(['message' => $managerError], 422);
            }
        }

        DB::transaction(function () use ($employe, $poste, $gradeId, $data) {
            // Clôturer le poste actif existant
            GpEmployePosteHistorique::where('employe_id', $employe->id)
                ->whereNull('date_fin')
                ->update(['date_fin' => now()->toDateString()]);

            // Mettre à jour le poste actuel
            $employe->poste_id = $poste->id;
            if (array_key_exists('manager_id', $data)) {
                $employe->manager_id = $data['manager_id'];
            }
            $employe->save();

            // Créer nouvelle ligne avec type_evolution automatique
            GpEmployePosteHistorique::createWithAutoType([
                'employe_id' => $employe->id,
                'poste_id' => $poste->id,
                'grade_id' => $gradeId,
                'date_debut' => now()->toDateString(),
                'date_fin' => null,
                'statut' => 'Validé',
            ]);
        });

        return response()->json([
            'message' => 'Évolution de carrière enregistrée avec succès.',
            'employe_id' => $employe->id,
            'poste_id' => $poste->id,
            'grade_id' => $gradeId,
            'manager_id' => $employe->manager_id,
        ], 201);
    }

    public function destroy($id)
    {
        $historique = GpEmployePosteHistorique::with('employe')->findOrFail($id);

        DB::transaction(function () use ($historique) {
            // Clôturer l'historique actuel
            $historique->date_fin = now()->toDateString();
            $historique->save();

            // Créer une nouvelle entrée "Désaffectation"
            GpEmployePosteHistorique::create([
                'employe_id' => $historique->employe_id,
                'poste_id' => $historique->poste_id,
                'grade_id' => $historique->grade_id,
                'date_debut' => now()->toDateString(),
                'date_fin' => now()->toDateString(),
                'type_evolution' => 'Désaffectation',
                'statut' => 'Validé',
            ]);

            // Mettre à jour l'employé : plus de poste actif
            $historique->employe->poste_id = null;
            $historique->employe->save();
        });

        return response()->json([
            'message' => 'Employé désaffecté avec succès.',
        ]);
    }

    /**
     * Accept a pending poste assignment
     * IMPORTANT: Ceci crée une NOUVELLE ligne dans l'historique, ne modifie pas l'existante
     */
    public function acceptPoste($id)
    {
        $proposition = GpEmployePosteHistorique::with(['poste', 'employe'])->findOrFail($id);

        if ($proposition->statut !== 'Proposé') {
            return response()->json([
                'message' => 'Ce poste n\'est pas en attente de validation.',
            ], 400);
        }

        DB::transaction(function () use ($proposition) {
            // 1. Clôturer tous les postes actifs de cet employé
            GpEmployePosteHistorique::where('employe_id', $proposition->employe_id)
                ->where('id', '!=', $proposition->id)
                ->whereNull('date_fin')
                ->where('statut', 'Validé')
                ->update(['date_fin' => now()->toDateString()]);

            // 2. Marquer la proposition comme 'Accepté' pour qu'elle disparaisse de l'onglet "Propositions en cours"
            $proposition->statut = 'Accepté';
            $proposition->save();

            // 3. Créer une NOUVELLE ligne d'historique pour l'acceptation
            $realTypeEvolution = GpEmployePosteHistorique::calculateTypeEvolution(
                $proposition->employe_id,
                $proposition->poste_id,
                $proposition->grade_id,
                null // pas suggestion, donc calcul normal
            );

            $newHistorique = GpEmployePosteHistorique::create([
                'employe_id' => $proposition->employe_id,
                'poste_id' => $proposition->poste_id,
                'grade_id' => $proposition->grade_id,
                'date_debut' => now()->toDateString(),
                'date_fin' => null,
                'type_evolution' => $realTypeEvolution,
                'statut' => 'Validé',
            ]);

            // 4. Mettre à jour le poste actuel de l'employé
            $proposition->employe->poste_id = $proposition->poste_id;
            $proposition->employe->save();
        });

        return response()->json([
            'message' => 'Poste accepté avec succès.',
        ]);
    }

    /**
     * Refuse a pending poste assignment
     */
    public function refusePoste($id)
    {
        $historique = GpEmployePosteHistorique::findOrFail($id);

        if ($historique->statut !== 'Proposé') {
            return response()->json([
                'message' => 'Ce poste n\'est pas en attente de validation.',
            ], 400);
        }

        $historique->statut = 'Refusé';
        $historique->save();

        return response()->json([
            'message' => 'Poste refusé.',
        ]);
    }

    /**
     * Get pending postes for a specific employee
     */
    public function getPostesEnAttente($employeId)
    {
        $postesEnAttente = GpEmployePosteHistorique::where('employe_id', $employeId)
            ->where('statut', 'Proposé')
            ->with(['poste.competences', 'grade'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($historique) {
                return [
                    'id' => $historique->id,
                    'poste' => $historique->poste?->nom ?? 'N/A',
                    'grade' => $historique->grade?->label ?? null,
                    'date_proposition' => $historique->created_at?->format('d/m/Y'),
                    'type_evolution' => $historique->type_evolution,
                    'competences_requises' => $historique->poste?->competences->map(function ($comp) {
                        return [
                            'id' => $comp->id,
                            'nom' => $comp->nom,
                            'categorie' => $comp->categorie,
                            'niveau_requis' => $comp->pivot->niveau_requis ?? null,
                        ];
                    }) ?? [],
                ];
            });

        return response()->json($postesEnAttente);
    }

    /**
     * Get pending postes for multiple employees in one request.
     */
    public function getPostesEnAttenteBatch(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => ['required', 'array', 'min:1', 'max:500'],
            'employee_ids.*' => ['integer', 'distinct', 'exists:employes,id'],
        ]);

        $employeeIds = collect($validated['employee_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($employeeIds->isEmpty()) {
            return response()->json(['data' => []]);
        }

        $rows = GpEmployePosteHistorique::query()
            ->whereIn('employe_id', $employeeIds->all())
            ->where('statut', 'Proposé')
            ->with(['poste.competences', 'grade'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('employe_id');

        $rowsByEmployee = [];
        foreach ($employeeIds as $employeeId) {
            $rowsByEmployee[(string) $employeeId] = $rows
                ->get($employeeId, collect())
                ->map(function ($historique) {
                    return [
                        'id' => $historique->id,
                        'poste' => $historique->poste?->nom ?? 'N/A',
                        'grade' => $historique->grade?->label ?? null,
                        'date_proposition' => $historique->created_at?->format('d/m/Y'),
                        'type_evolution' => $historique->type_evolution,
                        'competences_requises' => $historique->poste?->competences->map(function ($comp) {
                            return [
                                'id' => $comp->id,
                                'nom' => $comp->nom,
                                'categorie' => $comp->categorie,
                                'niveau_requis' => $comp->pivot->niveau_requis ?? null,
                            ];
                        }) ?? [],
                    ];
                })
                ->values();
        }

        return response()->json(['data' => $rowsByEmployee]);
    }
}

