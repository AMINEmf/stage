<?php

namespace Database\Seeders;

use App\Models\Employe;
use App\Models\GpEmployePosteHistorique;
use App\Models\Poste;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CarriereSeeder extends Seeder
{
    /**
     * Seed careers with required pivots:
     * - poste <-> competences
     * - employe <-> competences
     * - historique with Validé + Proposé statuses
     */
    public function run(): void
    {
        if (!Schema::hasTable('gp_employe_poste_historiques')) {
            $this->command?->warn('Table gp_employe_poste_historiques introuvable, seed ignore.');
            return;
        }

        $postes = Poste::query()->orderBy('id')->get();
        $employes = Employe::query()
            ->where(function ($q) {
                $q->whereNull('active')->orWhere('active', 1);
            })
            ->orderBy('id')
            ->limit(30)
            ->get();

        if ($employes->isEmpty() || $postes->isEmpty()) {
            $this->command?->warn('Aucun employe ou poste disponible: CarriereSeeder ignore.');
            return;
        }

        $hasStatut = Schema::hasColumn('gp_employe_poste_historiques', 'statut');
        $hasPosteIdOnEmploye = Schema::hasColumn('employes', 'poste_id');
        $canSeedPosteCompetences = Schema::hasTable('gp_poste_competence');
        $canSeedEmployeCompetences = Schema::hasTable('gp_employe_competence');
        $competenceIds = Schema::hasTable('gp_competences')
            ? DB::table('gp_competences')->orderBy('id')->pluck('id')->values()
            : collect();

        $now = now();
        $posteCompetenceMap = [];

        if ($canSeedPosteCompetences && $competenceIds->isNotEmpty()) {
            $posteCompetencePayload = [];
            $totalCompetences = $competenceIds->count();

            foreach ($postes as $index => $poste) {
                $start = $index % $totalCompetences;
                $picked = $competenceIds->slice($start, 3)->values();
                if ($picked->count() < 3) {
                    $picked = $picked->merge($competenceIds->take(3 - $picked->count()));
                }

                foreach ($picked->values() as $offset => $competenceId) {
                    $posteCompetencePayload[] = [
                        'poste_id' => $poste->id,
                        'competence_id' => $competenceId,
                        'niveau_requis' => min(5, 2 + $offset),
                        'is_required' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $posteCompetenceMap[(int) $poste->id][] = (int) $competenceId;
                }
            }

            if (!empty($posteCompetencePayload)) {
                DB::table('gp_poste_competence')->upsert(
                    $posteCompetencePayload,
                    ['poste_id', 'competence_id'],
                    ['niveau_requis', 'is_required', 'updated_at']
                );
            }
        }

        $postesPool = $postes->values();
        $totalPostes = $postesPool->count();
        $employeeCompetencePayload = [];

        foreach ($employes as $index => $employe) {
            $currentPoste = null;
            if (!empty($employe->poste_id)) {
                $currentPoste = $postesPool->firstWhere('id', $employe->poste_id);
            }
            if (!$currentPoste) {
                $currentPoste = $postesPool[$index % $totalPostes];
            }

            if (!$currentPoste) {
                continue;
            }

            $gradeId = $currentPoste->grade_id;
            $dateDebut = now()->subMonths(max(1, 6 - $index))->toDateString();

            if ($hasPosteIdOnEmploye && (int) $employe->poste_id !== (int) $currentPoste->id) {
                $employe->poste_id = $currentPoste->id;
                $employe->save();
            }

            $existingActive = GpEmployePosteHistorique::query()->where('employe_id', $employe->id);
            if ($hasStatut) {
                $existingActive->where('statut', 'Validé');
            }
            $existingActive = $existingActive->whereNull('date_fin')->exists();

            if (!$existingActive) {
                $activePayload = [
                    'employe_id' => $employe->id,
                    'poste_id' => $currentPoste->id,
                    'grade_id' => $gradeId,
                    'date_debut' => $dateDebut,
                    'date_fin' => null,
                ];
                if ($hasStatut) {
                    $activePayload['statut'] = 'Validé';
                }
                GpEmployePosteHistorique::createWithAutoType($activePayload);
            }

            if ($hasStatut && $totalPostes > 1) {
                $proposedPoste = $postesPool[($index + 1) % $totalPostes];
                if ((int) $proposedPoste->id === (int) $currentPoste->id && $totalPostes > 2) {
                    $proposedPoste = $postesPool[($index + 2) % $totalPostes];
                }

                if ((int) $proposedPoste->id !== (int) $currentPoste->id) {
                    $alreadyHasProposal = GpEmployePosteHistorique::query()
                        ->where('employe_id', $employe->id)
                        ->where('poste_id', $proposedPoste->id)
                        ->where('statut', 'Proposé')
                        ->exists();

                    if (!$alreadyHasProposal) {
                        GpEmployePosteHistorique::createWithAutoType([
                            'employe_id' => $employe->id,
                            'poste_id' => $proposedPoste->id,
                            'grade_id' => $proposedPoste->grade_id,
                            'date_debut' => now()->toDateString(),
                            'date_fin' => null,
                            'statut' => 'Proposé',
                        ], 'suggestion');
                    }
                }
            }

            if ($canSeedEmployeCompetences && $competenceIds->isNotEmpty()) {
                $requiredForPoste = collect($posteCompetenceMap[(int) $currentPoste->id] ?? [])->take(2)->values();
                if ($requiredForPoste->isEmpty()) {
                    $start = $index % $competenceIds->count();
                    $requiredForPoste = $competenceIds->slice($start, 2)->values();
                    if ($requiredForPoste->count() < 2) {
                        $requiredForPoste = $requiredForPoste->merge($competenceIds->take(2 - $requiredForPoste->count()));
                    }
                }

                $extraCompetenceId = $competenceIds[($index + 3) % $competenceIds->count()];
                $employeeCompetenceIds = $requiredForPoste->push($extraCompetenceId)->unique()->values();

                foreach ($employeeCompetenceIds as $offset => $competenceId) {
                    $employeeCompetencePayload[] = [
                        'employe_id' => $employe->id,
                        'competence_id' => $competenceId,
                        'niveau_acquis' => max(1, min(5, 3 + (($index + $offset) % 3))),
                        'date_acquisition' => now()->subMonths((($index + $offset) % 18) + 1)->toDateString(),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        if ($canSeedEmployeCompetences && !empty($employeeCompetencePayload)) {
            DB::table('gp_employe_competence')->upsert(
                $employeeCompetencePayload,
                ['employe_id', 'competence_id'],
                ['niveau_acquis', 'date_acquisition', 'updated_at']
            );
        }

        $this->command?->info('CarriereSeeder execute: carrieres, competences et propositions ajoutes/mis a jour.');
    }
}
