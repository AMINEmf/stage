<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VehiculeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('vehicules')->insert([
            [
                'marque' => 'Toyota',
                'matricule' => '1234-AB-01',
                'model' => 'Corolla',
                'capacite' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'marque' => 'Renault',
                'matricule' => '5678-CD-02',
                'model' => 'Clio',
                'capacite' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'marque' => 'Mercedes',
                'matricule' => '9876-EF-03',
                'model' => 'Sprinter',
                'capacite' => 15,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
