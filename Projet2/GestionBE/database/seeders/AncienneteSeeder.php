<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AncienneteSeeder extends Seeder
{
    public function run(): void
    {
        $employes = DB::table('employes')->get();
        $today = Carbon::now();

        foreach ($employes as $employe) {
            if ($employe->date_embauche) {
                $anciennete = Carbon::parse($employe->date_embauche)->diffInMonths($today);
                DB::table('employes')
                    ->where('id', $employe->id)
                    ->update(['anciennete' => $anciennete]);
            }
        }
    }
}
