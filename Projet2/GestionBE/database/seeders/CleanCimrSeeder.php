<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CimrAffiliation;
use App\Models\CimrDeclaration;
use App\Models\Employe;
use App\Models\Departement;
use Carbon\Carbon;

class CleanCimrSeeder extends Seeder
{
    /**
     * Nettoie et recrée les données CIMR de manière cohérente.
     */
    public function run(): void
    {
        $this->command->info('🧹 Nettoyage des données CIMR existantes...');
        
        // Supprimer toutes les déclarations et affiliations existantes
        CimrDeclaration::truncate();
        CimrAffiliation::truncate();
        
        $this->command->info('✅ Données CIMR nettoyées');

        // Récupérer les employés actifs existants
        $employes = Employe::where('active', true)->get();
        
        if ($employes->count() === 0) {
            $this->command->warn('⚠️ Aucun employé actif trouvé. Création de quelques employés...');
            $employes = Employe::factory()->count(25)->create();
        }
        
        $this->command->info('👥 ' . $employes->count() . ' employés actifs disponibles');

        // Créer des affiliations CIMR pour 70% des employés actifs (pas tous ne sont affiliés)
        $this->command->info('📋 Création des affiliations CIMR...');
        
        $employesAffiliables = $employes->random(min(intval($employes->count() * 0.7), $employes->count()));
        $affiliations = [];
        
        foreach ($employesAffiliables as $employe) {
            $salaireCotisable = $employe->salaire_base ?? rand(4000, 15000);
            $tauxEmployeur = rand(3, 6);
            $montantCotisation = ($salaireCotisable * $tauxEmployeur) / 100;
            
            $dateAffiliation = Carbon::now()->subMonths(rand(6, 36));
            
            $affiliation = CimrAffiliation::create([
                'employe' => $employe->nom . ' ' . $employe->prenom,
                'matricule' => $employe->matricule,
                'cin' => $employe->cin,
                'poste' => $employe->fonction ?? 'Non défini',
                'date_embauche' => $employe->date_embauche,
                'numero_cimr' => 'CIMR-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT),
                'date_affiliation' => $dateAffiliation->format('Y-m-d'),
                'date_fin_affiliation' => null,
                'salaire_cotisable' => $salaireCotisable,
                'taux_employeur' => $tauxEmployeur,
                'montant_cotisation' => $montantCotisation,
                'statut' => 'actif',
                'departement_id' => $employe->departement_id ?? Departement::first()?->id ?? 1,
            ]);
            
            $affiliations[] = $affiliation;
        }
        
        $this->command->info('✅ ' . count($affiliations) . ' affiliations CIMR créées');

        // Créer des déclarations mensuelles pour les 6 derniers mois
        $this->command->info('📝 Création des déclarations mensuelles...');
        
        $declarationsCount = 0;
        $currentDate = Carbon::now();
        
        // Pour chaque mois des 6 derniers mois
        for ($i = 0; $i < 6; $i++) {
            $declarationDate = $currentDate->copy()->subMonths($i);
            $mois = $declarationDate->month;
            $annee = $declarationDate->year;
            
            // Sélectionner les affiliations actives à cette date
            $affiliationsActives = collect($affiliations)->filter(function ($affiliation) use ($declarationDate) {
                $dateAff = Carbon::parse($affiliation->date_affiliation);
                return $dateAff->lte($declarationDate);
            });
            
            if ($affiliationsActives->count() === 0) continue;
            
            // Déterminer le statut selon l'ancienneté du mois
            if ($i === 0) {
                $statut = 'a_declarer'; // Mois en cours
            } elseif ($i <= 2) {
                $statut = 'declare'; // 1-2 mois passés
            } else {
                $statut = 'paye'; // Plus anciens
            }
            
            // Créer une déclaration pour chaque affilié actif ce mois
            foreach ($affiliationsActives as $affiliation) {
                CimrDeclaration::create([
                    'employe' => $affiliation->employe,
                    'matricule' => $affiliation->matricule,
                    'departement_id' => $affiliation->departement_id,
                    'mois' => $mois,
                    'annee' => $annee,
                    'montant_cimr_employeur' => $affiliation->montant_cotisation,
                    'statut' => $statut,
                ]);
                
                $declarationsCount++;
            }
        }
        
        $this->command->info('✅ ' . $declarationsCount . ' déclarations CIMR créées');

        // Résumé final
        $this->command->info('');
        $this->command->info('🎉 Seeding CIMR terminé avec succès !');
        $this->command->info('   - ' . Employe::where('active', true)->count() . ' employés actifs');
        $this->command->info('   - ' . CimrAffiliation::count() . ' affiliations CIMR');
        $this->command->info('   - ' . CimrDeclaration::count() . ' déclarations CIMR');
        
        // Afficher les stats par statut
        $stats = CimrDeclaration::selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');
        
        $this->command->info('   Répartition des déclarations:');
        foreach ($stats as $statut => $count) {
            $this->command->info("      - {$statut}: {$count}");
        }
    }
}
