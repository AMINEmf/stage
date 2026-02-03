<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Employe;
use App\Models\Departement;
use App\Models\CnssAffiliation;
use Carbon\Carbon;
use Illuminate\Support\Str;

class CnssTestSeederV2 extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. S'assurer d'avoir des départements
        $itDept = Departement::firstOrCreate(
            ['nom' => 'Département IT']
        );
        
        $rhDept = Departement::firstOrCreate(
            ['nom' => 'Ressources Humaines']
        );

        $this->command->info("Départements utilisés : {$itDept->nom} (ID: {$itDept->id}), {$rhDept->nom} (ID: {$rhDept->id})");

        // 2. Créer des employés pour IT (3 affiliés, 2 non affiliés)
        $this->createEmployeesForDepartment($itDept, 5, 3);

        // 3. Créer des employés pour RH (3 affiliés, 2 non affiliés)
        $this->createEmployeesForDepartment($rhDept, 5, 3);
    }

    private function createEmployeesForDepartment($department, $totalCount, $affiliatedCount)
    {
        for ($i = 0; $i < $totalCount; $i++) {
            $isAffiliated = $i < $affiliatedCount;
            $prefix = $isAffiliated ? '[CNSS] ' : '[NON-CNSS] ';
            
            try {
                // Utilisation des champs corrects basés sur la structure réelle
                $employeData = [
                    'matricule' => 'M-' . strtoupper(Str::random(5)),
                    'nom' => "Nom" . $i . "-" . $department->nom,
                    'prenom' => $prefix . "Prenom" . $i,
                    'num_badge' => rand(100, 9999),
                    'cin' => strtoupper(Str::random(8)),
                    'adresse' => 'Adresse Test ' . $i,
                    'tel' => '06' . rand(10000000, 99999999),
                    'email' => 'emp' . Str::random(5) . '@test.com',
                    'date_naiss' => Carbon::now()->subYears(20 + rand(0, 20)),
                    'date_embauche' => Carbon::now()->subYears(rand(1, 5)),
                    'salaire_base' => rand(5000, 15000),
                    'situation_fm' => 'Célibataire',
                    'nb_enfants' => 0,
                    'active' => 1,
                    'sexe' => 'Homme',
                    'departement_id' => $department->id, // Champ direct
                    // Remplir aussi le champ legacy cnss pour éviter confusion, ou laisser vide
                    'cnss' => $isAffiliated ? rand(100000000, 999999999) : null,
                ];

                $employe = Employe::create($employeData);

                $this->command->info("Employé créé : {$employe->nom} (ID: {$employe->id})");

                // Créer Affiliation CNSS dans la NOUVELLE table
                if ($isAffiliated) {
                    CnssAffiliation::create([
                        'employe_id' => $employe->id,
                        'numero_cnss' => $employeData['cnss'] ?? rand(100000000, 999999999),
                        'salaire' => $employe->salaire_base ?? 5000,
                        'date_debut' => $employe->date_embauche,
                        'statut' => 'Actif',
                        'departement_id' => $department->id,
                    ]);
                    $this->command->info(" -> Affiliation CNSS record ajouté.");
                }
            } catch (\Exception $e) {
                 $this->command->warn("Erreur création employé: " . $e->getMessage());
            }
        }
    }
}
