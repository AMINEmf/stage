<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CnssDashboardController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('view_all_employes');

        $mois = (int) $request->query('mois');
        $annee = (int) $request->query('annee');
        $now = Carbon::now();

        if ($mois < 1 || $mois > 12) {
            $mois = (int) $now->month;
        }
        if ($annee < 1900) {
            $annee = (int) $now->year;
        }

        $cnssRate = (float) config('cnss.declaration_rate', 0.25);

        $actifAffiliations = DB::table('cnss_affiliations')
            ->whereRaw('LOWER(statut) = ?', ['actif'])
            ->distinct('employe_id')
            ->count('employe_id');

        $declarationsPeriodExists = DB::table('declarations_cnss')
            ->where('mois', $mois)
            ->where('annee', $annee)
            ->exists();

        if (!$declarationsPeriodExists) {
            $latestPeriod = DB::table('declarations_cnss')
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc')
                ->first(['mois', 'annee']);

            if ($latestPeriod) {
                $mois = (int) $latestPeriod->mois;
                $annee = (int) $latestPeriod->annee;
            }
        }

        $declarationsBase = DB::table('declarations_cnss')
            ->where('mois', $mois)
            ->where('annee', $annee);

        $declarationsEnAttente = (clone $declarationsBase)
            ->whereRaw('UPPER(statut) = ?', ['EN_ATTENTE'])
            ->count();

        $declarationsDeclare = (clone $declarationsBase)
            ->whereRaw('UPPER(statut) = ?', ['DECLARE'])
            ->count();

        $declarationsPaye = (clone $declarationsBase)
            ->whereRaw('UPPER(statut) = ?', ['PAYE'])
            ->count();

        $montantCnss = (float) (clone $declarationsBase)->sum('montant_total');
        $masseSalariale = $cnssRate > 0 ? round($montantCnss / $cnssRate, 2) : 0.0;

        $dernieresDeclarations = DB::table('declarations_cnss')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get(['id', 'mois', 'annee', 'statut', 'montant_total'])
            ->map(function ($row) use ($cnssRate) {
                $montantTotal = (float) $row->montant_total;
                $masseSalarialeRow = $cnssRate > 0 ? round($montantTotal / $cnssRate, 2) : 0.0;

                return [
                    'id' => $row->id,
                    'mois' => (int) $row->mois,
                    'annee' => (int) $row->annee,
                    'statut' => $row->statut,
                    'masse_salariale' => $masseSalarialeRow,
                    'montant_cnss' => round($montantTotal, 2),
                ];
            });

        $dernieresOperations = DB::table('cnss_operations as o')
            ->leftJoin('employes as e', 'e.id', '=', 'o.employe_id')
            ->orderBy('o.created_at', 'desc')
            ->orderBy('o.id', 'desc')
            ->limit(5)
            ->get([
                'o.id',
                'o.date_operation',
                'o.type_operation',
                'o.statut',
                'e.nom',
                'e.prenom',
                'e.matricule',
            ])
            ->map(function ($row) {
                $nomComplet = trim(($row->nom ?? '') . ' ' . ($row->prenom ?? ''));

                return [
                    'id' => $row->id,
                    'date_operation' => $row->date_operation,
                    'type_operation' => $row->type_operation,
                    'statut' => $row->statut,
                    'employe' => [
                        'nom' => $nomComplet !== '' ? $nomComplet : null,
                        'matricule' => $row->matricule ?? null,
                    ],
                ];
            });

        return response()->json([
            'period' => [
                'mois' => $mois,
                'annee' => $annee,
            ],
            'kpis' => [
                'affiliations_actif' => $actifAffiliations,
                'declarations_en_attente' => $declarationsEnAttente,
                'masse_salariale' => $masseSalariale,
                'montant_cnss' => round($montantCnss, 2),
            ],
            'status_breakdown' => [
                'en_attente' => $declarationsEnAttente,
                'declare' => $declarationsDeclare,
                'paye' => $declarationsPaye,
            ],
            'tables' => [
                'declarations' => $dernieresDeclarations,
                'operations' => $dernieresOperations,
            ],
        ]);
    }
}
