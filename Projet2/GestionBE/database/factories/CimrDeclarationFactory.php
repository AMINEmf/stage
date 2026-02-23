<?php

namespace Database\Factories;

use App\Models\CimrDeclaration;
use App\Models\CimrAffiliation;
use Illuminate\Database\Eloquent\Factories\Factory;

class CimrDeclarationFactory extends Factory
{
    protected $model = CimrDeclaration::class;

    public function definition(): array
    {
        $year = $this->faker->numberBetween(2024, 2026);
        $month = $this->faker->numberBetween(1, 12);
        
        $prenom = $this->faker->firstName();
        $nom = $this->faker->lastName();
        
        return [
            'employe' => $nom . ' ' . $prenom,
            'matricule' => 'MAT' . $this->faker->numberBetween(1000, 9999),
            'departement_id' => $this->faker->numberBetween(1, 5),
            'mois' => $month,
            'annee' => $year,
            'montant_cimr_employeur' => $this->faker->randomFloat(2, 100, 2000),
            'statut' => $this->faker->randomElement(['a_declarer', 'declare', 'paye']),
        ];
    }

    public function declare(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'declare',
        ]);
    }

    public function paye(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'paye',
        ]);
    }

    public function aDeclarer(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'a_declarer',
        ]);
    }

    public function forMonth(int $month, int $year): static
    {
        return $this->state(fn (array $attributes) => [
            'mois' => $month,
            'annee' => $year,
        ]);
    }
}
