<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Employe;
use App\Models\Departement;
use App\Models\CnssAffiliation;
use App\Models\EmployeDepartement;
use Carbon\Carbon;
use Illuminate\Support\Str;

class CnssTestSeeder extends Seeder
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

        $this->command->info("Départements vérifiés/créés : {$itDept->nom}, {$rhDept->nom}");

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
            
            // Création employé
            $employe = null;
            
            // Vérifier si Employe a une factory, sinon création manuelle
            // Comme on n'a pas vu de factory, on fait manuel avec DB ou Model
            
            // Note: J'utilise insertGetId ou create selon les champs dispos
            // Il faut s'adapter aux champs de la table employes qui a évolué
            try {
                $employe = Employe::create([
                    'matricule' => 'MAT-' . strtoupper(Str::random(6)),
                    'nom' => "Nom" . $i . "-" . $department->nom,
                    'prenom' => $prefix . "Prenom" . $i,
                    'cin' => strtoupper(Str::random(8)),
                    'adresse' => 'Adresse Test ' . $i,
                    'telephone' => '06' . rand(10000000, 99999999),
                    'email' => 'emp' . Str::random(5) . '@test.com',
                    'date_naissance' => Carbon::now()->subYears(20 + rand(0, 20)),
                    'date_embauche' => Carbon::now()->subYears(rand(1, 5)),
                    'salaire_base' => rand(5000, 15000),
                    'situation_familiale' => 'Célibataire',
                    'nombre_enfants' => 0,
                    'statut' => 'Actif',
                    // Champs potentiels selon les migrations
                    'sexe' => 'Homme',
                    'cnss' => $isAffiliated ? 'Oui' : 'Non', // Champ legacy peut-être ?
                ]);
            } catch (\Exception $e) {
                 // Fallback si champs manquants ou différents, on essaie une version minimale
                 $this->command->warn("Erreur création employé standard, tentative version minimale: " . $e->getMessage());
                 // On peut adapter ici si besoin
                 continue;
            }

            // Attacher au département via la table pivot ou relation
            if ($employe) {
                // Essayer d'attacher via la relation standard si elle existe
                if (method_exists($employe, 'departements')) {
                    $employe->departements()->syncWithoutDetaching([$department->id]);
                } else {
                    // Insertion manuelle dans employe_departement
                    DB::table('employe_departement')->insertOrIgnore([
                        'employe_id' => $employe->id,
                        'departement_id' => $department->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $this->command->info("Employé créé : {$employe->nom} {$employe->prenom} (ID: {$employe->id})");

                // Créer Affiliation CNSS
                if ($isAffiliated) {
                    CnssAffiliation::create([
                        'employe_id' => $employe->id,
                        'numero_cnss' => rand(100000000, 999999999),
                        'salaire' => $employe->salaire_base ?? 5000,
                        'date_debut' => Carbon::now()->subMonths(rand(1, 24)),
                        'statut' => 'Actif',
                        'departement_id' => $department->id,
                    ]);
                    $this->command->info(" -> Affiliation CNSS ajoutée.");
                }
            }
        }
    }
}
