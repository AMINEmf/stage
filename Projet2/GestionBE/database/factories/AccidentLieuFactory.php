<?php

namespace Database\Factories;

use App\Models\AccidentLieu;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccidentLieuFactory extends Factory
{
    protected $model = AccidentLieu::class;

    protected static array $lieux = [
        'Atelier de production',
        'Entrepôt',
        'Bureau',
        'Parking',
        'Escalier',
        'Cantine',
        'Zone de chargement',
        'Salle de réunion',
        'Laboratoire',
        'Extérieur',
    ];

    protected static int $lieuIndex = 0;

    public function definition(): array
    {
        $lieu = self::$lieux[self::$lieuIndex % count(self::$lieux)];
        self::$lieuIndex++;
        
        return [
            'nom' => $lieu,
        ];
    }
}
