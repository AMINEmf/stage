<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VehiculeLivreurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('vehicule_livreurs')->insert([
            [
                'livreur_id' => 1, // Assuming a Livreur with ID 1 exists
                'vehicule_id' => 1, // Assuming a Vehicule with ID 1 exists
                'date_debut_affectation' => '2024-01-01',
                'date_fin_affectation' => null,
                'kilometrage_debut' => 50000,
                'kilometrage_fin' => null,
                'heure' => '08:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'livreur_id' => 2,
                'vehicule_id' => 2,
                'date_debut_affectation' => '2024-02-01',
                'date_fin_affectation' => null,
                'kilometrage_debut' => 30000,
                'kilometrage_fin' => null,
                'heure' => '09:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'livreur_id' => 3,
                'vehicule_id' => 3,
                'date_debut_affectation' => '2024-03-01',
                'date_fin_affectation' => null,
                'kilometrage_debut' => 45000,
                'kilometrage_fin' => null,
                'heure' => '10:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
