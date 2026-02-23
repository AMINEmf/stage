<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CimrAffiliation;
use App\Models\CimrDeclaration;
use App\Models\Accident;
use App\Models\AccidentType;
use App\Models\AccidentNature;
use App\Models\AccidentLieu;
use App\Models\Employe;
use App\Models\Departement;
use Carbon\Carbon;

class CimrAccidentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer des départements d'abord si aucun n'existe
        $this->command->info('🏢 Vérification/Création des départements...');
        
        $departementNoms = [
            'Ressources Humaines',
            'Comptabilité',
            'Production',
            'Commercial',
            'Informatique',
            'Qualité',
            'Logistique',
            'Direction',
        ];
        
        foreach ($departementNoms as $nom) {
            Departement::firstOrCreate(['nom' => $nom]);
        }
        
        $this->command->info('✅ ' . Departement::count() . ' départements disponibles');

        // Créer des employés
        $this->command->info('👥 Création des employés fictifs...');
        
        $employes = Employe::factory()->count(50)->create();
        
        // Ajouter quelques cadres
        Employe::factory()->cadre()->count(10)->create();
        
        // Ajouter quelques employés inactifs
        Employe::factory()->inactif()->count(5)->create();
        
        $this->command->info('✅ ' . Employe::count() . ' employés créés');

        $this->command->info('🏭 Création des types, natures et lieux d\'accidents...');
        
        // Créer les types d'accidents
        $types = [
            'Chute de plain-pied',
            'Chute de hauteur',
            'Manipulation de charges',
            'Accident de circulation',
            'Contact avec machine',
            'Projection de particules',
            'Coupure',
            'Brûlure',
        ];
        
        foreach ($types as $type) {
            AccidentType::firstOrCreate(['nom' => $type]);
        }
        
        // Créer les natures d'accidents
        $natures = [
            'Fracture',
            'Contusion',
            'Plaie',
            'Entorse',
            'Luxation',
            'Brûlure thermique',
            'Traumatisme crânien',
            'Lésion musculaire',
        ];
        
        foreach ($natures as $nature) {
            AccidentNature::firstOrCreate(['nom' => $nature]);
        }
        
        // Créer les lieux d'accidents
        $lieux = [
            'Atelier de production',
            'Entrepôt',
            'Bureau',
            'Parking',
            'Escalier',
            'Cantine',
            'Zone de chargement',
            'Extérieur',
        ];
        
        foreach ($lieux as $lieu) {
            AccidentLieu::firstOrCreate(['nom' => $lieu]);
        }

        $this->command->info('✅ Types, natures et lieux créés');

        // Créer des affiliations CIMR
        $this->command->info('👥 Création des affiliations CIMR...');
        
        $affiliations = CimrAffiliation::factory()->count(15)->create();
        
        $this->command->info('✅ ' . $affiliations->count() . ' affiliations CIMR créées');

        // Créer des déclarations CIMR pour les derniers 6 mois
        $this->command->info('📋 Création des déclarations CIMR...');
        
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        
        $declarationsCount = 0;
        
        // Pour chaque affiliation active, créer des déclarations sur plusieurs mois
        foreach ($affiliations->where('statut', 'actif')->take(10) as $affiliation) {
            // Créer des déclarations pour les 6 derniers mois
            for ($i = 0; $i < 6; $i++) {
                $date = Carbon::now()->subMonths($i);
                
                CimrDeclaration::create([
                    'employe' => $affiliation->employe,
                    'matricule' => $affiliation->matricule,
                    'departement_id' => $affiliation->departement_id,
                    'mois' => $date->month,
                    'annee' => $date->year,
                    'montant_cimr_employeur' => $affiliation->montant_cotisation,
                    'statut' => $i === 0 ? 'a_declarer' : ($i < 3 ? 'declare' : 'paye'),
                ]);
                
                $declarationsCount++;
            }
        }
        
        $this->command->info('✅ ' . $declarationsCount . ' déclarations CIMR créées');

        // Créer des accidents
        $this->command->info('⚠️ Création des accidents de travail...');
        
        $typeIds = AccidentType::pluck('id')->toArray();
        $natureIds = AccidentNature::pluck('id')->toArray();
        $lieuIds = AccidentLieu::pluck('id')->toArray();
        
        $accidents = [];
        $employes = [
            ['nom' => 'Alaoui Mohammed', 'matricule' => 'MAT1001'],
            ['nom' => 'Benali Fatima', 'matricule' => 'MAT1002'],
            ['nom' => 'Chakir Hassan', 'matricule' => 'MAT1003'],
            ['nom' => 'Darif Sara', 'matricule' => 'MAT1004'],
            ['nom' => 'El Amrani Youssef', 'matricule' => 'MAT1005'],
            ['nom' => 'Fassi Karim', 'matricule' => 'MAT1006'],
            ['nom' => 'Ghazi Laila', 'matricule' => 'MAT1007'],
            ['nom' => 'Hajji Omar', 'matricule' => 'MAT1008'],
        ];
        
        $statuts = ['en cours', 'déclaré', 'clôturé'];
        $heures = ['08:30', '09:15', '10:00', '11:45', '14:00', '15:30', '16:45'];
        $commentaires = [
            'Accident survenu lors d\'une manipulation de matériel.',
            'L\'employé a glissé sur le sol mouillé.',
            'Blessure légère suite à un faux mouvement.',
            'Accident lors du déchargement de marchandises.',
            'Contact accidentel avec une surface chaude.',
            'Chute d\'un objet depuis une étagère.',
            null,
            'Incident lors de l\'utilisation d\'un équipement.',
        ];
        
        for ($i = 0; $i < 20; $i++) {
            $employe = $employes[array_rand($employes)];
            $arretTravail = rand(0, 100) < 40;
            
            Accident::create([
                'employe' => $employe['nom'],
                'matricule' => $employe['matricule'],
                'date_accident' => Carbon::now()->subDays(rand(1, 365)),
                'heure' => $heures[array_rand($heures)],
                'accident_lieu_id' => $lieuIds[array_rand($lieuIds)],
                'accident_type_id' => $typeIds[array_rand($typeIds)],
                'accident_nature_id' => $natureIds[array_rand($natureIds)],
                'arret_travail' => $arretTravail,
                'duree_arret' => $arretTravail ? rand(1, 30) : 0,
                'statut' => $statuts[array_rand($statuts)],
                'commentaire' => $commentaires[array_rand($commentaires)],
                'departement_id' => rand(1, 5),
            ]);
        }
        
        $this->command->info('✅ 20 accidents de travail créés');
        
        $this->command->info('');
        $this->command->info('🎉 Seeding terminé avec succès !');
        $this->command->info('   - ' . Departement::count() . ' départements');
        $this->command->info('   - ' . Employe::count() . ' employés');
        $this->command->info('   - ' . AccidentType::count() . ' types d\'accidents');
        $this->command->info('   - ' . AccidentNature::count() . ' natures d\'accidents');
        $this->command->info('   - ' . AccidentLieu::count() . ' lieux d\'accidents');
        $this->command->info('   - ' . CimrAffiliation::count() . ' affiliations CIMR');
        $this->command->info('   - ' . CimrDeclaration::count() . ' déclarations CIMR');
        $this->command->info('   - ' . Accident::count() . ' accidents de travail');
    }
}
