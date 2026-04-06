<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FormationSeeder extends Seeder
{
    /**
     * Seed sample formations and optional mapping to competences.
     */
    public function run(): void
    {
        if (!Schema::hasTable('formations')) {
            $this->command?->warn('Table formations introuvable, seed ignore.');
            return;
        }

        $now = now();

        $formationRows = [
            [
                'code' => 'FOR-RH-001',
                'titre' => 'Gestion des Carrieres RH',
                'domaine' => 'Ressources Humaines',
                'type' => 'Interne',
                'mode_formation' => 'Presentiel',
                'duree' => '2 jours',
                'statut' => 'Planifie',
                'date_debut' => now()->subDays(45)->toDateString(),
                'date_fin' => now()->subDays(44)->toDateString(),
                'budget' => 5000,
                'organisme' => 'Academie RH Interne',
                'effectif' => 15,
            ],
            [
                'code' => 'FOR-RH-002',
                'titre' => 'Techniques de Recrutement',
                'domaine' => 'Ressources Humaines',
                'type' => 'Interne',
                'mode_formation' => 'Hybride',
                'duree' => '3 jours',
                'statut' => 'Planifie',
                'date_debut' => now()->subDays(30)->toDateString(),
                'date_fin' => now()->subDays(28)->toDateString(),
                'budget' => 6200,
                'organisme' => 'Academie RH Interne',
                'effectif' => 20,
            ],
            [
                'code' => 'FOR-MGT-001',
                'titre' => 'Leadership et Management',
                'domaine' => 'Management',
                'type' => 'Externe',
                'mode_formation' => 'Presentiel',
                'duree' => '4 jours',
                'statut' => 'En cours',
                'date_debut' => now()->subDays(10)->toDateString(),
                'date_fin' => now()->addDays(4)->toDateString(),
                'budget' => 10000,
                'organisme' => 'Cabinet Atlas Formation',
                'effectif' => 12,
            ],
            [
                'code' => 'FOR-DATA-001',
                'titre' => 'Power BI pour RH',
                'domaine' => 'Data RH',
                'type' => 'Interne',
                'mode_formation' => 'En ligne',
                'duree' => '12 heures',
                'statut' => 'Termine',
                'date_debut' => now()->subDays(70)->toDateString(),
                'date_fin' => now()->subDays(60)->toDateString(),
                'budget' => 3500,
                'organisme' => 'Digital Learning Center',
                'effectif' => 25,
            ],
        ];

        $hasModeFormation = Schema::hasColumn('formations', 'mode_formation');
        $hasEffectif = Schema::hasColumn('formations', 'effectif');
        $hasFormateurEmployeId = Schema::hasColumn('formations', 'formateur_employe_id');
        $hasFormateurId = Schema::hasColumn('formations', 'formateur_id');

        $payload = [];
        foreach ($formationRows as $row) {
            $item = [
                'code' => $row['code'],
                'titre' => $row['titre'],
                'domaine' => $row['domaine'],
                'type' => $row['type'],
                'duree' => $row['duree'],
                'statut' => $row['statut'],
                'date_debut' => $row['date_debut'],
                'date_fin' => $row['date_fin'],
                'budget' => $row['budget'],
                'organisme' => $row['organisme'],
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($hasModeFormation) {
                $item['mode_formation'] = $row['mode_formation'];
            }
            if ($hasEffectif) {
                $item['effectif'] = $row['effectif'];
            }
            if ($hasFormateurEmployeId) {
                $item['formateur_employe_id'] = null;
            }
            if ($hasFormateurId) {
                $item['formateur_id'] = null;
            }

            $payload[] = $item;
        }

        $updateColumns = [
            'titre',
            'domaine',
            'type',
            'duree',
            'statut',
            'date_debut',
            'date_fin',
            'budget',
            'organisme',
            'updated_at',
        ];

        if ($hasModeFormation) {
            $updateColumns[] = 'mode_formation';
        }
        if ($hasEffectif) {
            $updateColumns[] = 'effectif';
        }
        if ($hasFormateurEmployeId) {
            $updateColumns[] = 'formateur_employe_id';
        }
        if ($hasFormateurId) {
            $updateColumns[] = 'formateur_id';
        }

        DB::table('formations')->upsert($payload, ['code'], $updateColumns);

        if (Schema::hasTable('gp_formation_competences') && Schema::hasTable('gp_competences')) {
            $formationIds = DB::table('formations')
                ->whereIn('code', array_column($formationRows, 'code'))
                ->pluck('id', 'code');

            $competenceIds = DB::table('gp_competences')
                ->whereIn('nom', [
                    'Communication',
                    'Travail en equipe',
                    'Leadership',
                    'Gestion de projet',
                    'Recrutement',
                    'Power BI',
                ])
                ->pluck('id', 'nom');

            $links = [
                ['formation' => 'FOR-RH-001', 'competence' => 'Gestion de projet', 'niveau_cible' => 3, 'poids' => 4],
                ['formation' => 'FOR-RH-001', 'competence' => 'Communication', 'niveau_cible' => 4, 'poids' => 4],
                ['formation' => 'FOR-RH-002', 'competence' => 'Recrutement', 'niveau_cible' => 4, 'poids' => 5],
                ['formation' => 'FOR-RH-002', 'competence' => 'Communication', 'niveau_cible' => 3, 'poids' => 3],
                ['formation' => 'FOR-MGT-001', 'competence' => 'Leadership', 'niveau_cible' => 5, 'poids' => 5],
                ['formation' => 'FOR-MGT-001', 'competence' => 'Travail en equipe', 'niveau_cible' => 4, 'poids' => 4],
                ['formation' => 'FOR-DATA-001', 'competence' => 'Power BI', 'niveau_cible' => 4, 'poids' => 5],
            ];

            $pivotPayload = [];
            foreach ($links as $link) {
                $formationId = $formationIds[$link['formation']] ?? null;
                $competenceId = $competenceIds[$link['competence']] ?? null;

                if (!$formationId || !$competenceId) {
                    continue;
                }

                $pivotPayload[] = [
                    'formation_id' => $formationId,
                    'competence_id' => $competenceId,
                    'niveau_cible' => $link['niveau_cible'],
                    'poids' => $link['poids'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($pivotPayload)) {
                DB::table('gp_formation_competences')->upsert(
                    $pivotPayload,
                    ['formation_id', 'competence_id'],
                    ['niveau_cible', 'poids', 'updated_at']
                );
            }
        }

        $this->command?->info('FormationSeeder execute: formations ajoutees/mises a jour.');
    }
}
