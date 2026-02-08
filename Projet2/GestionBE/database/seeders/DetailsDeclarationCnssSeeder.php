<?php

namespace Database\Seeders;

use App\Models\CnssAffiliation;
use App\Models\CnssDeclaration;
use App\Models\CnssDeclarationDetail;
use Illuminate\Database\Seeder;

class DetailsDeclarationCnssSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rate = (float) config('cnss.declaration_rate', 0.25);

        $activeAffiliations = CnssAffiliation::query()
            ->with('employe')
            ->whereIn('statut', ['Actif', 'ACTIF'])
            ->get()
            ->filter(fn (CnssAffiliation $affiliation) => $affiliation->employe !== null)
            ->values();

        if ($activeAffiliations->isEmpty()) {
            $this->command?->warn('Aucune affiliation CNSS active avec employé. Seeder details_declaration_cnss ignoré.');
            return;
        }

        CnssDeclaration::query()
            ->orderByDesc('annee')
            ->orderByDesc('mois')
            ->get()
            ->each(function (CnssDeclaration $declaration) use ($activeAffiliations, $rate) {
                $employeesPool = $activeAffiliations->shuffle();
                $targetCount = min(max(3, (int) floor($activeAffiliations->count() / 2)), $activeAffiliations->count());
                $selectedAffiliations = $employeesPool->take($targetCount)->values();

                CnssDeclarationDetail::query()
                    ->where('declaration_cnss_id', $declaration->id)
                    ->delete();

                $detailsRows = $selectedAffiliations->map(function (CnssAffiliation $affiliation) use ($declaration) {
                    return [
                        'declaration_cnss_id' => $declaration->id,
                        'employe_id' => $affiliation->employe_id,
                        'affiliation_cnss_id' => $affiliation->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                })->all();

                CnssDeclarationDetail::insert($detailsRows);

                $masseSalariale = $selectedAffiliations->sum(function (CnssAffiliation $affiliation) {
                    $employee = $affiliation->employe;
                    return (float) ($employee?->salaire_base
                        ?? $employee?->salaire_moyen
                        ?? $employee?->salaire_reference_annuel
                        ?? 0);
                });

                $declaration->update([
                    'montant_total' => round($masseSalariale * $rate, 2),
                ]);
            });
    }
}

