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
        $this->call([
            DepartementSeeder::class,
            GpCompetenceSeeder::class,
            FormationSeeder::class,
            CarriereSeeder::class,
            DemandeMobiliteSeeder::class,
            CnssSeeder::class,
            MutuelleSeeder::class,
            RolesAndPermissionsSeeder::class,
            ClientSeeder::class,
        ]);

    }
}
