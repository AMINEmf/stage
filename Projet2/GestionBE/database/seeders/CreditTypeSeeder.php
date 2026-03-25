<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;


class CreditTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $TCredit = [
            "Avance de salaire",
            "Prêt personnel",
            "Prêt immobilier",
            "Crédit voiture"
        ];

        for($i=1; $i<=25;$i++){
            $type = $TCredit[($i - 1) % count($TCredit)];
            DB::table('credits')->where('id_credit',$i)->update(["type_credit" => $type]);
        };
    }
}
