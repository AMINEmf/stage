<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pays;
use App\Models\Ville;
use App\Models\Commune;
use Illuminate\Support\Facades\Http;

class FullDataSeeder extends Seeder
{
    public function run(): void
    {
        $response = Http::get('https://restcountries.com/v3.1/all');

        if ($response->successful()) {
            $countries = $response->json();

            foreach ($countries as $country) {
                if (!isset($country['name']['common'])) continue;

                $pays = Pays::create([
                    'nom' => $country['name']['common'],
                    'code_pays' => $country['cca2'] ?? 'XX',
                ]);

                $this->seedVillesPourPays($pays);
            }
        }
    }

    private function seedVillesPourPays($pays)
    {
        $fakeCities = [
            'City 1 of ' . $pays->nom,
            'City 2 of ' . $pays->nom,
            'City 3 of ' . $pays->nom,
        ];

        foreach ($fakeCities as $cityName) {
            $ville = Ville::create([
                'nom' => $cityName,
                'pays_id' => $pays->id,
            ]);

            $this->seedCommunesPourVille($ville);
        }
    }

    private function seedCommunesPourVille($ville)
    {
        $fakeCommunes = [
            'Commune A in ' . $ville->nom,
            'Commune B in ' . $ville->nom,
            'Commune C in ' . $ville->nom,
        ];

        foreach ($fakeCommunes as $communeName) {
            Commune::create([
                'nom' => $communeName,
                'ville_id' => $ville->id,
            ]);
        }
    }
}
