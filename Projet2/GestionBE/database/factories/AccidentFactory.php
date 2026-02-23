<?php

namespace Database\Factories;

use App\Models\Accident;
use App\Models\AccidentType;
use App\Models\AccidentNature;
use App\Models\AccidentLieu;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccidentFactory extends Factory
{
    protected $model = Accident::class;

    public function definition(): array
    {
        $prenom = $this->faker->firstName();
        $nom = $this->faker->lastName();
        $arretTravail = $this->faker->boolean(40);
        
        return [
            'employe' => $nom . ' ' . $prenom,
            'matricule' => 'MAT' . $this->faker->numberBetween(1000, 9999),
            'date_accident' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'heure' => $this->faker->time('H:i'),
            'accident_lieu_id' => $this->faker->numberBetween(1, 5),
            'accident_type_id' => $this->faker->numberBetween(1, 5),
            'accident_nature_id' => $this->faker->numberBetween(1, 5),
            'arret_travail' => $arretTravail,
            'duree_arret' => $arretTravail ? $this->faker->numberBetween(1, 30) : 0,
            'statut' => $this->faker->randomElement(['en cours', 'déclaré', 'clôturé']),
            'commentaire' => $this->faker->optional(0.7)->sentence(10),
            'departement_id' => $this->faker->numberBetween(1, 5),
        ];
    }

    public function enCours(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'en cours',
        ]);
    }

    public function cloture(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'clôturé',
        ]);
    }

    public function avecArret(): static
    {
        return $this->state(fn (array $attributes) => [
            'arret_travail' => true,
            'duree_arret' => $this->faker->numberBetween(5, 30),
        ]);
    }
}
