<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed du département
        $this->call(DepartementSeeder::class);

        // Seed des rôles et permissions
        $this->call(RolesAndPermissionsSeeder::class);

        // Seed de toutes les données si nécessaire
        $this->call(FullDataSeeder::class);

        // Seed des affiliés CIMR si nécessaire
        $this->call(CleanCimrSeeder::class);

        // Ajouter d'autres seeders si besoin
        // $this->call(AutreSeeder::class);
        $this->call([ContratSeeder::class]);

        $this->call([CreditSeeder::class]);

        $this->call([CreditTypeSeeder::class]);

        $this->call([AncienneteSeeder::class]);
    }
}