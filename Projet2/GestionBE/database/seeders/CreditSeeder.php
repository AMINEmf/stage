<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;
use Carbon\Carbon; 

class CreditSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        for ($i = 1; $i <= 25; $i++) {
            $montant = rand(10000, 40000);
            $taux = rand(2, 5); // taux en %
            $nbr_mois = rand(12, 36);

            $montant_total = $montant + ($montant * $taux / 100);
            $mensualite = $montant_total / $nbr_mois;

            DB::table('credits')->insert([
                'montant_credit' => $montant,
                'date_credit' => Carbon::now()->subMonths(rand(1, 12)),
                'nbr_mois' => $nbr_mois,
                'taux_interet' => $taux,
                'mensualite' => round($mensualite, 2),
                'statut' => 'en_attente',
                'montant_total' => round($montant_total, 2),
                'id_employe' => $i, // clé étrangère vers employes.id
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
