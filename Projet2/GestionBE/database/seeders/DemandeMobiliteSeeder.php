<?php

namespace Database\Seeders;

use App\Models\DemandeMobilite;
use App\Models\Employe;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DemandeMobiliteSeeder extends Seeder
{
    private const REQUIRED_TABLES = [
        'demandes_mobilite',
        'employes',
    ];

    private const RH_RESPONSABLES = [
        'Salma Idrissi',
        'Karim Berrada',
        'Imane El Fassi',
        'Nabil Rahmani',
    ];

    private const DEFAULT_TARGET_POSTES = [
        'Chef de projet',
        'Coordinateur senior',
        'Responsable d equipe',
        'Charge de mission',
        'Referent metier',
    ];

    public function run(): void
    {
        if (!$this->requiredTablesExist()) {
            $this->command?->warn('DemandeMobiliteSeeder ignore: tables manquantes.');
            return;
        }

        $employees = Employe::query()
            ->with(['poste:id,nom', 'departement:id,nom', 'departements:id,nom'])
            ->where(function ($query) {
                $query->whereNull('active')->orWhere('active', 1);
            })
            ->orderBy('id')
            ->limit(40)
            ->get();

        if ($employees->isEmpty()) {
            $this->command?->warn('DemandeMobiliteSeeder ignore: aucun employe disponible.');
            return;
        }

        $creatorId = $this->resolveCreatorId();
        $processedRows = 0;

        foreach ($employees as $index => $employee) {
            $rows = [
                $this->buildRow($employee, $index, 0, $creatorId),
            ];

            if ($index % 4 === 0) {
                $rows[] = $this->buildRow($employee, $index, 1, $creatorId);
            }

            foreach ($rows as $row) {
                DemandeMobilite::query()->updateOrCreate(
                    [
                        'employe_id' => $row['employe_id'],
                        'poste_souhaite' => $row['poste_souhaite'],
                        'type_mobilite' => $row['type_mobilite'],
                    ],
                    $row
                );

                $processedRows++;
            }
        }

        $this->command?->info(
            sprintf('DemandeMobiliteSeeder execute: %d demandes de mobilite ajoutees/mises a jour.', $processedRows)
        );
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

    private function resolveCreatorId(): ?int
    {
        if (!Schema::hasTable('users')) {
            return null;
        }

        $id = DB::table('users')->orderBy('id')->value('id');

        return $id ? (int) $id : null;
    }

    private function buildRow(Employe $employee, int $index, int $variant, ?int $creatorId): array
    {
        $typeCount = count(DemandeMobilite::TYPES_MOBILITE);
        $statusCount = count(DemandeMobilite::STATUTS);
        $sourceCount = count(DemandeMobilite::SOURCES_DEMANDE);
        $disponibilitePosteCount = count(DemandeMobilite::DISPONIBILITE_POSTE_VALUES);

        $typeIndex = ($index + $variant) % $typeCount;
        $statusIndex = ($index + ($variant * 2)) % $statusCount;
        $sourceIndex = ($index + $variant) % $sourceCount;

        $departmentName = $this->resolveDepartmentName($employee);
        $currentPoste = $this->resolveCurrentPoste($employee);
        $targetPoste = $this->resolveTargetPoste($departmentName, $index, $variant);

        $status = DemandeMobilite::STATUTS[$statusIndex];
        $typeMobilite = DemandeMobilite::TYPES_MOBILITE[$typeIndex];
        $sourceDemande = (($index + $variant) % 5 === 0)
            ? null
            : DemandeMobilite::SOURCES_DEMANDE[$sourceIndex];

        $needTrainingSelector = ($index + $variant) % 3;
        $besoinFormation = null;
        if ($needTrainingSelector === 0) {
            $besoinFormation = true;
        } elseif ($needTrainingSelector === 1) {
            $besoinFormation = false;
        }

        $avisManagerPool = [
            'Avis favorable avec accompagnement progressif.',
            'Bon potentiel observe pour la mobilite proposee.',
            'Demande pertinente, a valider selon les priorites de l equipe.',
        ];

        $rhCommentPool = [
            'Profil compatible avec le poste cible et plan d integration valide.',
            'Decision a confirmer avec les besoins operationnels du trimestre.',
            'Mobilite retenue avec suivi RH sur les 3 premiers mois.',
        ];

        $formationPool = [
            'Formation courte en gestion de projet et communication inter-equipes.',
            'Mise a niveau technique sur les outils metier du poste cible.',
            'Parcours d integration de 2 semaines avec mentoring interne.',
        ];

        $impactPool = [
            'Impact positif attendu sur la polyvalence de l equipe.',
            'Repartition de charge a ajuster sur le mois en cours.',
            'Mobilite pouvant accelerer la couverture des besoins critiques.',
        ];

        $disponibilite = now()->addDays(10 + (($index + $variant) % 9) * 7)->toDateString();

        return [
            'employe_id' => $employee->id,
            'poste_actuel' => $currentPoste,
            'departement_actuel' => $departmentName,
            'poste_souhaite' => $targetPoste,
            'type_mobilite' => $typeMobilite,
            'source_demande' => $sourceDemande,
            'motivation' => $this->buildMotivation($employee, $typeMobilite, $targetPoste),
            'disponibilite' => $disponibilite,
            'avis_manager' => $statusIndex > 0
                ? $avisManagerPool[($index + $variant) % count($avisManagerPool)]
                : null,
            'cv_interne_path' => null,
            'cv_interne_nom_original' => null,
            'compatibilite_profil_poste' => [
                'Adequation elevee',
                'Adequation moyenne',
                'Adequation a confirmer',
            ][($index + $variant) % 3],
            'besoin_formation' => $besoinFormation,
            'details_formation' => $besoinFormation === true
                ? $formationPool[($index + $variant) % count($formationPool)]
                : null,
            'disponibilite_poste' => DemandeMobilite::DISPONIBILITE_POSTE_VALUES[
                ($index + $variant) % $disponibilitePosteCount
            ],
            'impact_organisationnel' => $impactPool[($index + $variant) % count($impactPool)],
            'commentaire_rh' => $statusIndex >= 3
                ? $rhCommentPool[($index + $variant) % count($rhCommentPool)]
                : null,
            'statut' => $status,
            'created_by' => $creatorId,
            'rh_responsable' => self::RH_RESPONSABLES[($index + $variant) % count(self::RH_RESPONSABLES)],
        ];
    }

    private function resolveDepartmentName(Employe $employee): string
    {
        $directDepartment = $employee->departement?->nom;
        if (!empty($directDepartment)) {
            return (string) $directDepartment;
        }

        $pivotDepartment = $employee->departements->first()?->nom;
        if (!empty($pivotDepartment)) {
            return (string) $pivotDepartment;
        }

        return 'Direction Generale';
    }

    private function resolveCurrentPoste(Employe $employee): string
    {
        $poste = $employee->poste?->nom;
        if (!empty($poste)) {
            return (string) $poste;
        }

        if (!empty($employee->fonction)) {
            return (string) $employee->fonction;
        }

        return 'Poste non renseigne';
    }

    private function resolveTargetPoste(string $departmentName, int $index, int $variant): string
    {
        $normalizedDepartment = strtolower($departmentName);
        $pool = self::DEFAULT_TARGET_POSTES;

        if (str_contains($normalizedDepartment, 'ressources') || str_contains($normalizedDepartment, 'rh')) {
            $pool = ['HR Business Partner', 'Responsable Formation', 'Charge Recrutement', 'Coordinateur RH'];
        } elseif (str_contains($normalizedDepartment, 'informatique') || str_contains($normalizedDepartment, 'it')) {
            $pool = ['Chef de projet IT', 'Analyste Systeme', 'Administrateur SI', 'Responsable Support'];
        } elseif (str_contains($normalizedDepartment, 'finance') || str_contains($normalizedDepartment, 'compta')) {
            $pool = ['Controleur de gestion', 'Chef Comptable', 'Analyste Financier', 'Responsable Tresorerie'];
        } elseif (str_contains($normalizedDepartment, 'production') || str_contains($normalizedDepartment, 'qualite')) {
            $pool = ['Superviseur Production', 'Responsable Qualite', 'Planificateur Atelier', 'Coordinateur Process'];
        }

        return $pool[($index + ($variant * 2)) % count($pool)];
    }

    private function buildMotivation(Employe $employee, string $typeMobilite, string $targetPoste): string
    {
        $fullName = trim(($employee->nom ?? '') . ' ' . ($employee->prenom ?? ''));

        return sprintf(
            'Demande de %s pour %s vers le poste "%s" afin de renforcer son evolution professionnelle et la couverture des besoins de l organisation.',
            $typeMobilite,
            $fullName !== '' ? $fullName : 'l employe',
            $targetPoste
        );
    }
}
