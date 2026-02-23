<?php

namespace Database\Factories;

use App\Models\AccidentNature;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccidentNatureFactory extends Factory
{
    protected $model = AccidentNature::class;

    protected static array $natures = [
        'Fracture',
        'Contusion',
        'Plaie',
        'Entorse',
        'Luxation',
        'Brûlure thermique',
        'Brûlure chimique',
        'Traumatisme crânien',
        'Lésion musculaire',
        'Irritation cutanée',
    ];

    protected static int $natureIndex = 0;

    public function definition(): array
    {
        $nature = self::$natures[self::$natureIndex % count(self::$natures)];
        self::$natureIndex++;
        
        return [
            'nom' => $nature,
        ];
    }
}
