<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Credit;
use App\Models\Remboursement;
use Carbon\Carbon;

class GenererRemboursements extends Command
{
    protected $signature = 'remboursements:generer {id_credit?}';
    protected $description = 'Générer automatiquement les remboursements mensuels pour les crédits en cours';

    public function handle()
{
    $today = Carbon::today();
    $id_credit = $this->argument('id_credit');

    if($id_credit){
        $credits = Credit::where('id_credit', $id_credit)
                         ->where('statut','Validé (Finance)')->get();
    } else {
        $credits = Credit::where('statut','Validé (Finance)')->get();
    }

    if($credits->isEmpty()){
        $this->info("Aucun crédit trouvé pour id = {$id_credit}");
        return;
    }

    foreach($credits as $credit){

        $lastRemboursement = $credit->remboursements()->latest('date_remboursement')->first();

        $nextDate = $lastRemboursement
                    ? Carbon::parse($lastRemboursement->date_remboursement)->addMonth()
                    : Carbon::parse($credit->date_credit)->addMonth();

        $this->info("Credit {$credit->id_credit} - nextDate: {$nextDate->toDateString()} - today: {$today->toDateString()}");

        if($today->toDateString() == $nextDate->toDateString()){

            $totalPaye = $credit->remboursements()->sum('montant_paye');

            $montantPaye = $credit->mensualite;
            if($totalPaye + $montantPaye > $credit->montant_total){
                $montantPaye = $credit->montant_total - $totalPaye;
            }

            $reste = $credit->montant_total - ($totalPaye + $montantPaye);

            Remboursement::create([
                'date_remboursement' => $nextDate,
                'montant_paye' => $montantPaye,
                'reste_paye' => $reste < 0 ? 0 : $reste,
                'statut_remboursement' => $reste <= 0 ? 'Terminé' : 'En cours',
                'id_credit' => $credit->id_credit
            ]);

            $credit->update([
                'statut' => $reste <= 0 ? 'Terminé' : 'En cours'
            ]);

            $this->info("✅ Remboursement généré pour le crédit {$credit->id_credit} le {$nextDate->toDateString()}");
        } else {
            $this->info("⏳ Pas de remboursement aujourd'hui pour crédit {$credit->id_credit}");
        }
    }
}
}