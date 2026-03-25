<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class ContratSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        for ($i = 1; $i <= 25; $i++) {

            DB::table('contrats')->insert([
                'employe_id' => $i,
                'numero_contrat' => 'CTR-' . str_pad($i, 3, '0', STR_PAD_LEFT),

                // Type dynamique
                'type_contrat' => match(true) {
                    in_array($i, [1,3,7,8,9,12,13,15,17,19,20,21,22,23,25]) => 'CDI',
                    in_array($i, [2,4,5,6,10,11,14,16,18,24]) => 'CDD',
                    default => 'CDI'
                },

                'arret_prevu' => in_array($i, [2,4,5,6,10,11,14,16,18,24]) ? now()->addMonths(6) : null,
                'duree_prevu' => in_array($i, [2,4,5,6,10,11,14,16,18,24]) ? 12 : null,

                'design' => 'Contrat employé ' . $i,

                'debut_le' => now()->subYears(rand(1,10)),

                'arret_effectif' => null,
                'duree_effective' => null,
                'motif_depart' => null,
                'dernier_jour_travaille' => null,
                'notification_rupture' => null,

                'engagement_procedure' => now(),
                'signature_rupture_conventionnelle' => null,
                'transaction_en_cours' => 0,

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
