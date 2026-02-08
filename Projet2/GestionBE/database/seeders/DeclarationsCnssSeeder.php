<?php

namespace Database\Seeders;

use App\Models\CnssAffiliation;
use App\Models\CnssDeclaration;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DeclarationsCnssSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $activeAffiliationsCount = CnssAffiliation::query()
            ->whereIn('statut', ['Actif', 'ACTIF'])
            ->count();

        if ($activeAffiliationsCount === 0) {
            $this->command?->warn('Aucune affiliation CNSS active trouvée. Seeder declarations_cnss ignoré.');
            return;
        }

        $periods = collect(range(0, 2))->map(function ($monthOffset) {
            $date = Carbon::now()->startOfMonth()->subMonths($monthOffset);

            return [
                'mois' => (int) $date->month,
                'annee' => (int) $date->year,
            ];
        });

        foreach ($periods as $period) {
            CnssDeclaration::firstOrCreate(
                [
                    'mois' => $period['mois'],
                    'annee' => $period['annee'],
                ],
                [
                    'montant_total' => 0,
                    'statut' => 'EN_ATTENTE',
                ]
            );
        }
    }
}

