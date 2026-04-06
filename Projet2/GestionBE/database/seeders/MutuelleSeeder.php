<?php

namespace Database\Seeders;

use App\Models\AffiliationMutuelle;
use App\Models\Departement;
use App\Models\Employe;
use App\Models\Mutuelle;
use App\Models\MutuelleDocument;
use App\Models\MutuelleOperation;
use App\Models\RegimeMutuelle;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class MutuelleSeeder extends Seeder
{
    private const REQUIRED_TABLES = [
        'employes',
        'departements',
        'mutuelles',
        'regimes_mutuelle',
        'affiliations_mutuelle',
        'mutuelle_operations',
        'mutuelle_documents',
    ];

    private const TYPE_OPTIONS = [
        'DEPOT_DOSSIER',
        'REMBOURSEMENT',
        'PRISE_EN_CHARGE',
        'RECLAMATION',
        'ATTESTATION',
        'REGULARISATION',
    ];

    private const STATUT_OPTIONS = ['EN_COURS', 'TERMINEE', 'REMBOURSEE', 'ANNULEE'];

    public function run(): void
    {
        if (!$this->requiredTablesExist()) {
            $this->command?->warn('MutuelleSeeder ignore: tables manquantes.');
            return;
        }

        $this->ensureReferenceData();

        $employees = Employe::query()
            ->where(function ($query) {
                $query->whereNull('active')->orWhere('active', 1);
            })
            ->orderBy('id')
            ->get();

        if ($employees->isEmpty()) {
            $this->command?->warn('MutuelleSeeder ignore: aucun employe disponible.');
            return;
        }

        $regimes = $this->seedMutuellesAndRegimes();
        $affiliations = $this->seedAffiliations($employees, $regimes);
        $operations = $this->seedOperations($affiliations);
        $this->seedDocuments($operations);

        $this->command?->info('MutuelleSeeder execute: mutuelles, regimes, affiliations, operations et documents mis a jour.');
    }

    private function requiredTablesExist(): bool
    {
        foreach (self::REQUIRED_TABLES as $table) {
            if (!Schema::hasTable($table)) {
                return false;
            }
        }

        return true;
    }

    private function ensureReferenceData(): void
    {
        if (Departement::query()->count() === 0) {
            Departement::query()->create(['nom' => 'Direction Generale', 'parent_id' => null]);
        }

        if (Employe::query()->count() === 0) {
            Employe::factory()->count(18)->actif()->create();
        }
    }

    private function seedMutuellesAndRegimes(): Collection
    {
        $dataset = [
            [
                'nom' => 'CNOPS',
                'active' => true,
                'regimes' => [
                    [
                        'libelle' => 'CNOPS Standard',
                        'taux_couverture' => 70,
                        'cotisation_mensuelle' => 220,
                        'part_employeur_pct' => 60,
                        'part_employe_pct' => 40,
                        'active' => true,
                    ],
                    [
                        'libelle' => 'CNOPS Plus',
                        'taux_couverture' => 85,
                        'cotisation_mensuelle' => 320,
                        'part_employeur_pct' => 65,
                        'part_employe_pct' => 35,
                        'active' => true,
                    ],
                ],
            ],
            [
                'nom' => 'MAMDA Mutuelle',
                'active' => true,
                'regimes' => [
                    [
                        'libelle' => 'MAMDA Essentiel',
                        'taux_couverture' => 65,
                        'cotisation_mensuelle' => 180,
                        'part_employeur_pct' => 55,
                        'part_employe_pct' => 45,
                        'active' => true,
                    ],
                    [
                        'libelle' => 'MAMDA Famille',
                        'taux_couverture' => 80,
                        'cotisation_mensuelle' => 290,
                        'part_employeur_pct' => 60,
                        'part_employe_pct' => 40,
                        'active' => true,
                    ],
                ],
            ],
        ];

        $regimes = collect();

        foreach ($dataset as $mutuelleData) {
            $mutuelle = Mutuelle::query()->updateOrCreate(
                ['nom' => $mutuelleData['nom']],
                ['active' => $mutuelleData['active']]
            );

            foreach ($mutuelleData['regimes'] as $regimeData) {
                $regime = RegimeMutuelle::query()->updateOrCreate(
                    [
                        'mutuelle_id' => $mutuelle->id,
                        'libelle' => $regimeData['libelle'],
                    ],
                    [
                        'taux_couverture' => $regimeData['taux_couverture'],
                        'cotisation_mensuelle' => $regimeData['cotisation_mensuelle'],
                        'part_employeur_pct' => $regimeData['part_employeur_pct'],
                        'part_employe_pct' => $regimeData['part_employe_pct'],
                        'active' => $regimeData['active'],
                    ]
                );

                $regimes->push($regime);
            }
        }

        return $regimes->values();
    }

    private function seedAffiliations(Collection $employees, Collection $regimes): Collection
    {
        if ($regimes->isEmpty()) {
            return collect();
        }

        $selectedEmployees = $employees->take(min(30, $employees->count()))->values();

        return $selectedEmployees->map(function (Employe $employee, int $index) use ($regimes) {
            $regime = $regimes[$index % $regimes->count()];

            $isResilie = $index % 8 === 0;
            $status = $isResilie ? 'RESILIE' : 'ACTIVE';

            $dateAdhesion = Carbon::now()->subMonths(18 + $index)->startOfMonth();
            $dateResiliation = $isResilie ? $dateAdhesion->copy()->addMonths(8) : null;

            $hasChildren = (int) ($employee->nb_enfants ?? 0) > 0;
            $isMarried = stripos((string) $employee->situation_fm, 'Mari') !== false;

            return AffiliationMutuelle::query()->updateOrCreate(
                ['employe_id' => $employee->id],
                [
                    'mutuelle_id' => $regime->mutuelle_id,
                    'regime_mutuelle_id' => $regime->id,
                    'numero_adherent' => sprintf('ADH-%06d', $employee->id),
                    'date_adhesion' => $dateAdhesion->toDateString(),
                    'date_resiliation' => $dateResiliation?->toDateString(),
                    'ayant_droit' => $hasChildren,
                    'conjoint_ayant_droit' => $isMarried,
                    'statut' => $status,
                    'commentaire' => 'Affiliation mutuelle seedee automatiquement',
                ]
            );
        });
    }

    private function seedOperations(Collection $affiliations): Collection
    {
        $operations = collect();

        foreach ($affiliations as $index => $affiliation) {
            $employee = Employe::query()->find($affiliation->employe_id);
            if (!$employee) {
                continue;
            }

            $baseDossier = sprintf('MUT-%05d', $affiliation->id);
            $count = $affiliation->statut === 'ACTIVE' ? 3 : 1;

            for ($i = 0; $i < $count; $i++) {
                $type = self::TYPE_OPTIONS[($index + $i) % count(self::TYPE_OPTIONS)];
                $status = self::STATUT_OPTIONS[($index + $i) % count(self::STATUT_OPTIONS)];
                $dateOperation = Carbon::now()->subDays(($index * 4) + ($i * 6));
                $dateDepot = $dateOperation->copy()->addDay();

                $beneficiary = $this->resolveBeneficiaryPayload($affiliation, $employee, $i);

                $montantTotal = round(320 + (($index + 1) * 28) + ($i * 35), 2);
                $montantRembourse = round($montantTotal * (0.45 + (($index + $i) % 4) * 0.12), 2);
                $montantRembourse = min($montantRembourse, $montantTotal);
                $reste = round(max($montantTotal - $montantRembourse, 0), 2);

                $dateRemboursement = $this->resolveRemboursementDate($status, $dateOperation, $i);

                $operation = MutuelleOperation::query()->updateOrCreate(
                    [
                        'affiliation_id' => $affiliation->id,
                        'numero_dossier' => $baseDossier,
                        'date_operation' => $dateOperation->toDateString(),
                        'type_operation' => $type,
                    ],
                    [
                        'beneficiaire_type' => $beneficiary['type'],
                        'beneficiaire_nom' => $beneficiary['name'],
                        'lien_parente' => $beneficiary['relation'],
                        'date_depot' => $dateDepot->toDateString(),
                        'date_remboursement' => $dateRemboursement,
                        'statut' => $status,
                        'montant_total' => $montantTotal,
                        'montant_rembourse' => $montantRembourse,
                        'reste_a_charge' => $reste,
                        'commentaire' => 'Operation mutuelle seedee automatiquement',
                    ]
                );

                $operations->push($operation);
            }
        }

        return $operations;
    }

    private function resolveBeneficiaryPayload(
        AffiliationMutuelle $affiliation,
        Employe $employee,
        int $operationIndex
    ): array {
        $fullName = trim($employee->nom . ' ' . $employee->prenom);

        if ($operationIndex === 1 && $affiliation->conjoint_ayant_droit) {
            return [
                'type' => 'CONJOINT',
                'name' => 'Conjoint(e) de ' . $fullName,
                'relation' => 'Conjoint(e)',
            ];
        }

        if ($operationIndex === 2 && $affiliation->ayant_droit) {
            return [
                'type' => 'ENFANT',
                'name' => 'Enfant de ' . $fullName,
                'relation' => 'Enfant',
            ];
        }

        return [
            'type' => 'EMPLOYE',
            'name' => $fullName,
            'relation' => 'Employe',
        ];
    }

    private function resolveRemboursementDate(string $status, Carbon $dateOperation, int $operationIndex): ?string
    {
        if (!in_array($status, ['TERMINEE', 'REMBOURSEE'], true)) {
            return null;
        }

        return $dateOperation->copy()->addDays(20 + $operationIndex)->toDateString();
    }

    private function seedDocuments(Collection $operations): void
    {
        $affiliationIds = $operations
            ->pluck('affiliation_id')
            ->filter()
            ->unique()
            ->values();

        $affiliationsById = AffiliationMutuelle::query()
            ->whereIn('id', $affiliationIds)
            ->get()
            ->keyBy('id');

        $operations->values()->each(function (MutuelleOperation $operation, int $index) use ($affiliationsById) {
            if ($index % 2 !== 0) {
                return;
            }

            $affiliation = $affiliationsById->get($operation->affiliation_id);
            if (!$affiliation) {
                return;
            }

            $fileName = sprintf('justificatif_mutuelle_%d.pdf', $operation->id);

            MutuelleDocument::query()->updateOrCreate(
                [
                    'operation_id' => $operation->id,
                    'file_name' => $fileName,
                ],
                [
                    'employe_id' => $affiliation->employe_id,
                    'type_document' => $index % 4 === 0 ? 'FACTURE' : 'ORDONNANCE',
                    'nom' => sprintf('Document operation %d', $operation->id),
                    'file_path' => sprintf('mutuelles/documents/seed_mutuelle_%d.pdf', $operation->id),
                ]
            );
        });
    }
}
