<?php

namespace Database\Factories;

use App\Models\AccidentType;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccidentTypeFactory extends Factory
{
    protected $model = AccidentType::class;

    protected static array $types = [
        'Chute de plain-pied',
        'Chute de hauteur',
        'Manipulation de charges',
        'Accident de circulation',
        'Contact avec machine',
        'Projection de particules',
        'Coupure',
        'Brûlure',
        'Électrocution',
        'Intoxication',
    ];

    protected static int $typeIndex = 0;

    public function definition(): array
    {
        $type = self::$types[self::$typeIndex % count(self::$types)];
        self::$typeIndex++;
        
        return [
            'nom' => $type,
        ];
    }
}
