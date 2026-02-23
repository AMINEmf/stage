<?php

namespace Database\Factories;

use App\Models\CimrAffiliation;
use Illuminate\Database\Eloquent\Factories\Factory;

class CimrAffiliationFactory extends Factory
{
    protected $model = CimrAffiliation::class;

    public function definition(): array
    {
        $prenom = $this->faker->firstName();
        $nom = $this->faker->lastName();
        $salaireCotisable = $this->faker->randomFloat(2, 5000, 25000);
        $tauxEmployeur = $this->faker->randomElement([3.0, 4.0, 5.0, 6.0]);
        
        return [
            'employe' => $nom . ' ' . $prenom,
            'matricule' => 'MAT' . $this->faker->unique()->numberBetween(1000, 9999),
            'cin' => strtoupper($this->faker->randomLetter() . $this->faker->randomLetter() . $this->faker->numberBetween(100000, 999999)),
            'poste' => $this->faker->randomElement([
                'Développeur', 'Comptable', 'Chef de projet', 'Designer', 
                'Commercial', 'RH', 'Technicien', 'Manager', 'Analyste'
            ]),
            'date_embauche' => $this->faker->dateTimeBetween('-5 years', '-6 months'),
            'departement_id' => $this->faker->numberBetween(1, 5),
            'numero_cimr' => 'CIMR' . $this->faker->unique()->numberBetween(100000, 999999),
            'date_affiliation' => $this->faker->dateTimeBetween('-4 years', '-1 month'),
            'date_fin_affiliation' => $this->faker->optional(0.2)->dateTimeBetween('now', '+2 years'),
            'salaire_cotisable' => $salaireCotisable,
            'taux_employeur' => $tauxEmployeur,
            'montant_cotisation' => round($salaireCotisable * $tauxEmployeur / 100, 2),
            'statut' => $this->faker->randomElement(['actif', 'actif', 'actif', 'suspendu']),
            'fiche_affiliation' => null,
        ];
    }

    public function actif(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'actif',
            'date_fin_affiliation' => null,
        ]);
    }

    public function suspendu(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'suspendu',
        ]);
    }
}
