<?php

namespace Database\Seeders;

use App\Models\TypeCredit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TypeCreditSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            ["nom_typeCredit" => 'Avance de salaire', "taux_typeCredit" => 0.00],
            ["nom_typeCredit" => 'Prêt personnel', "taux_typeCredit" => 5.00],
            ["nom_typeCredit" => 'Prêt immobilier', "taux_typeCredit" => 3.50],
            ["nom_typeCredit" => 'Crédit voiture', "taux_typeCredit" => 4.00]
        ];

        foreach ($types as $type) {
            TypeCredit::create($type);
        }
    }
}
