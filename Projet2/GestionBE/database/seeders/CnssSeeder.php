<?php

namespace Database\Seeders;

use App\Models\CnssAffiliation;
use App\Models\CnssDeclaration;
use App\Models\CnssDeclarationDetail;
use App\Models\CnssDocument;
use App\Models\CnssOperation;
use App\Models\DeclarationIndividuelleCnss;
use App\Models\Departement;
use App\Models\Employe;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class CnssSeeder extends Seeder
{
    private const REQUIRED_TABLES = [
        'employes',
        'departements',
        'cnss_affiliations',
        'cnss_operations',
        'cnss_documents',
        'declarations_individuelles_cnss',
        'declarations_cnss',
        'details_declaration_cnss',
    ];

    private const TYPES_AVEC_MONTANTS = ['PAIEMENT', 'REGULARISATION', 'REMBOURSEMENT', 'MUTUELLE'];

    private const TYPE_OPERATIONS = ['MUTUELLE', 'PAIEMENT', 'REGULARISATION', 'ATTESTATION'];

    private const OPERATION_STATUTS = ['EN_COURS', 'TERMINEE', 'ANNULEE'];

    private const DECLARATION_STATUTS = ['EN_ATTENTE', 'DECLARE', 'PAYE'];

    public function run(): void
    {
        if (!$this->requiredTablesExist()) {
            $this->command?->warn('CnssSeeder ignore: tables manquantes.');
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
            $this->command?->warn('CnssSeeder ignore: aucun employe disponible.');
            return;
        }

        $affiliations = $this->seedAffiliations($employees);
        $operations = $this->seedOperations($affiliations);
        $this->seedDocuments($operations);
        $this->seedIndividualDeclarations($affiliations);
        $this->seedGlobalDeclarations();

        $this->command?->info('CnssSeeder execute: affiliations, operations, documents et declarations CNSS mis a jour.');
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

    private function seedAffiliations(Collection $employees): Collection
    {
        $maxEmployees = min(30, $employees->count());
        $selected = $employees->take($maxEmployees)->values();

        return $selected->map(function (Employe $employee, int $index) {
            $status = 'Actif';
            if ($index % 9 === 0) {
                $status = 'Inactif';
            } elseif ($index % 13 === 0) {
                $status = 'Suspendu';
            }

            $startDate = Carbon::now()->subMonths(20 + $index)->startOfMonth();
            $endDate = $status === 'Actif' ? null : $startDate->copy()->addMonths(6 + ($index % 4));

            $salary = (float) ($employee->salaire_base ?? $employee->salaire_moyen ?? 4500);
            if ($salary <= 0) {
                $salary = 4500 + ($index * 95);
            }

            return CnssAffiliation::query()->updateOrCreate(
                ['employe_id' => $employee->id],
                [
                    'numero_cnss' => sprintf('CNSS-%06d', $employee->id),
                    'salaire' => round($salary, 2),
                    'date_debut' => $startDate->toDateString(),
                    'date_fin' => $endDate?->toDateString(),
                    'statut' => $status,
                    'departement_id' => $employee->departement_id,
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

            $operationsPerAffiliation = $affiliation->statut === 'Actif' ? 3 : 1;

            for ($i = 0; $i < $operationsPerAffiliation; $i++) {
                $type = self::TYPE_OPERATIONS[($index + $i) % count(self::TYPE_OPERATIONS)];
                $status = self::OPERATION_STATUTS[($index + $i) % count(self::OPERATION_STATUTS)];
                $dateOperation = Carbon::now()->subDays(($index * 5) + ($i * 8));

                $beneficiary = $this->resolveBeneficiaryPayload($employee, $i);
                $amounts = $this->resolveAmountPayload($type, $index, $i);

                $reference = sprintf('CNSS-OP-%d-%d', $affiliation->id, $i + 1);

                $operation = CnssOperation::query()->updateOrCreate(
                    ['reference' => $reference],
                    [
                        'employe_id' => $employee->id,
                        'type_operation' => $type,
                        'date_operation' => $dateOperation->toDateString(),
                        'beneficiary_type' => $beneficiary['type'],
                        'beneficiary_name' => $beneficiary['name'],
                        'beneficiary_relation' => $beneficiary['relation'],
                        'montant' => $amounts['montant'],
                        'montant_total' => $amounts['montant_total'],
                        'taux_remboursement' => null,
                        'montant_rembourse' => $amounts['montant_rembourse'],
                        'montant_reste_a_charge' => $amounts['montant_reste_a_charge'],
                        'statut' => $status,
                        'notes' => 'Operation CNSS seedee automatiquement',
                        'created_by' => null,
                        'updated_by' => null,
                    ]
                );

                $operations->push($operation);
            }
        }

        return $operations;
    }

    private function resolveBeneficiaryPayload(Employe $employee, int $operationIndex): array
    {
        $fullName = trim($employee->nom . ' ' . $employee->prenom);

        if ($operationIndex === 1) {
            return [
                'type' => 'CONJOINT',
                'name' => 'Conjoint(e) de ' . $fullName,
                'relation' => 'Conjoint(e)',
            ];
        }

        if ($operationIndex === 2) {
            return [
                'type' => 'ENFANT',
                'name' => 'Enfant de ' . $fullName,
                'relation' => 'Enfant',
            ];
        }

        return [
            'type' => 'EMPLOYE',
            'name' => null,
            'relation' => null,
        ];
    }

    private function resolveAmountPayload(string $typeOperation, int $affiliationIndex, int $operationIndex): array
    {
        $default = [
            'montant' => null,
            'montant_total' => null,
            'montant_rembourse' => null,
            'montant_reste_a_charge' => null,
        ];

        if (!in_array($typeOperation, self::TYPES_AVEC_MONTANTS, true)) {
            return $default;
        }

        $montantTotal = round(250 + (($affiliationIndex + 1) * 35) + ($operationIndex * 40), 2);
        $montantRembourse = round($montantTotal * (0.5 + (($affiliationIndex + $operationIndex) % 3) * 0.1), 2);
        $montantRembourse = min($montantRembourse, $montantTotal);

        return [
            'montant' => $montantTotal,
            'montant_total' => $montantTotal,
            'montant_rembourse' => $montantRembourse,
            'montant_reste_a_charge' => round(max($montantTotal - $montantRembourse, 0), 2),
        ];
    }

    private function seedDocuments(Collection $operations): void
    {
        $operations->values()->each(function (CnssOperation $operation, int $index) {
            if ($index % 2 !== 0) {
                return;
            }

            $storedName = sprintf('cnss-documents/seed_cnss_%d.pdf', $operation->id);

            CnssDocument::query()->updateOrCreate(
                ['stored_name' => $storedName],
                [
                    'employe_id' => $operation->employe_id,
                    'operation_id' => $operation->id,
                    'original_name' => sprintf('justificatif_cnss_%d.pdf', $operation->id),
                    'mime_type' => 'application/pdf',
                    'size' => 1024 + ($index * 10),
                    'document_type' => $index % 4 === 0 ? 'BORDEREAU' : 'JUSTIFICATIF',
                    'uploaded_by' => null,
                ]
            );
        });
    }

    private function seedIndividualDeclarations(Collection $affiliations): void
    {
        $activeAffiliations = $affiliations
            ->filter(fn (CnssAffiliation $affiliation) => strtolower((string) $affiliation->statut) === 'actif')
            ->values();

        if ($activeAffiliations->isEmpty()) {
            return;
        }

        $periods = collect(range(0, 2))->map(function (int $offset) {
            $date = Carbon::now()->subMonths($offset);

            return [
                'mois' => (int) $date->month,
                'annee' => (int) $date->year,
                'status' => $this->resolveIndividualDeclarationStatus($offset),
            ];
        });

        foreach ($periods as $period) {
            foreach ($activeAffiliations as $index => $affiliation) {
                $baseSalary = (float) ($affiliation->salaire ?? 0);
                if ($baseSalary <= 0) {
                    $baseSalary = 5000;
                }

                $salary = round($baseSalary + (($index % 4) * 120), 2);
                $calc = DeclarationIndividuelleCnss::calculerCotisations($salary);

                DeclarationIndividuelleCnss::query()->updateOrCreate(
                    [
                        'employe_id' => $affiliation->employe_id,
                        'mois' => $period['mois'],
                        'annee' => $period['annee'],
                    ],
                    [
                        'jours_travailles' => 26 - ($index % 3),
                        'salaire_brut_imposable' => $salary,
                        'base_plafonnee' => $calc['base_plafonnee'],
                        'cotisation_salarie' => $calc['cotisation_salarie'],
                        'cotisation_patronale' => $calc['cotisation_patronale'],
                        'statut' => $period['status'],
                    ]
                );
            }
        }
    }

    private function resolveIndividualDeclarationStatus(int $offset): string
    {
        if ($offset === 0) {
            return 'non_declare';
        }

        if ($offset === 1) {
            return 'declare';
        }

        return 'valide';
    }

    private function seedGlobalDeclarations(): void
    {
        $periods = DeclarationIndividuelleCnss::query()
            ->select('mois', 'annee')
            ->distinct()
            ->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->limit(3)
            ->get();

        foreach ($periods as $periodIndex => $period) {
            $individuals = DeclarationIndividuelleCnss::query()
                ->where('mois', $period->mois)
                ->where('annee', $period->annee)
                ->get();

            if ($individuals->isEmpty()) {
                continue;
            }

            $montantTotal = round($individuals->sum(function (DeclarationIndividuelleCnss $row) {
                return (float) $row->cotisation_salarie + (float) $row->cotisation_patronale;
            }), 2);

            $status = self::DECLARATION_STATUTS[min($periodIndex, count(self::DECLARATION_STATUTS) - 1)];

            $declaration = CnssDeclaration::query()->updateOrCreate(
                [
                    'mois' => (int) $period->mois,
                    'annee' => (int) $period->annee,
                ],
                [
                    'montant_total' => $montantTotal,
                    'statut' => $status,
                ]
            );

            CnssDeclarationDetail::query()->where('declaration_cnss_id', $declaration->id)->delete();

            $detailRows = $individuals->map(function (DeclarationIndividuelleCnss $individual) use ($declaration) {
                $affiliationId = CnssAffiliation::query()
                    ->where('employe_id', $individual->employe_id)
                    ->whereIn('statut', ['Actif', 'ACTIF'])
                    ->value('id');

                if (!$affiliationId) {
                    $affiliationId = CnssAffiliation::query()
                        ->where('employe_id', $individual->employe_id)
                        ->value('id');
                }

                if (!$affiliationId) {
                    return null;
                }

                return [
                    'declaration_cnss_id' => $declaration->id,
                    'employe_id' => $individual->employe_id,
                    'affiliation_cnss_id' => $affiliationId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->filter()->values()->all();

            if (!empty($detailRows)) {
                CnssDeclarationDetail::query()->insert($detailRows);
            }
        }
    }
}
