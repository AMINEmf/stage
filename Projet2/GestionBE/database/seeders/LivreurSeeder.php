<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LivreurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('livreurs')->insert([
            [
                'nom' => 'El Idrissi',
                'prenom' => 'Mohamed',
                'cin' => 'AB123456',
                'tele' => '0600123456',
                'adresse' => 'Rue 1, Casablanca',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nom' => 'Bouzekri',
                'prenom' => 'Ali',
                'cin' => 'CD789012',
                'tele' => '0612345678',
                'adresse' => 'Rue 2, Rabat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nom' => 'Ouahbi',
                'prenom' => 'Fatima',
                'cin' => 'EF345678',
                'tele' => '0623456789',
                'adresse' => 'Rue 3, Marrakech',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
