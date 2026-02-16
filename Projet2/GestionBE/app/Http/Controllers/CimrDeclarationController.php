<?php

namespace App\Http\Controllers;

use App\Models\CimrDeclaration;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CimrDeclarationController extends Controller
{
    public function index(Request $request)
    {
        if ($request->has('summary')) {
            return $this->summary();
        }
        
        $query = CimrDeclaration::query();
        
        if ($request->has('mois')) $query->where('mois', $request->mois);
        if ($request->has('annee')) $query->where('annee', $request->annee);
        
        return $query->orderByDesc('created_at')->get();
    }

    public function summary()
    {
        return CimrDeclaration::selectRaw('mois, annee, statut, COUNT(*) as employee_count, SUM(montant_cimr_employeur) as total_montant')
            ->groupBy('mois', 'annee', 'statut')
            ->orderByDesc('annee')
            ->orderByDesc('mois')
            ->get();
    }

    public function dashboardStats()
    {
        $currentMonth = now()->month;
        $currentYear = now()->year;

        // Total active affiliations
        $totalAffiliations = \App\Models\CimrAffiliation::where('statut', 'actif')->count();

        // Declarations this month
        $declarationsThisMonth = CimrDeclaration::where('mois', $currentMonth)
            ->where('annee', $currentYear)
            ->count();

        // Total amount this month
        $totalAmountThisMonth = CimrDeclaration::where('mois', $currentMonth)
            ->where('annee', $currentYear)
            ->sum('montant_cimr_employeur');

        // Monthly evolution (last 6 months)
        $monthlyEvolution = CimrDeclaration::selectRaw('mois, annee, SUM(montant_cimr_employeur) as total')
            ->where('annee', '>=', now()->subMonths(6)->year)
            ->groupBy('mois', 'annee')
            ->orderBy('annee')
            ->orderBy('mois')
            ->limit(6)
            ->get();

        // Recent affiliations
        $recentAffiliations = \App\Models\CimrAffiliation::orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'employe', 'matricule', 'date_affiliation', 'montant_cotisation', 'statut']);

        // Recent declarations
        $recentDeclarations = CimrDeclaration::orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'employe', 'matricule', 'mois', 'annee', 'montant_cimr_employeur', 'statut']);

        // Status breakdown
        $statusBreakdown = CimrDeclaration::selectRaw('statut, COUNT(*) as count')
            ->where('mois', $currentMonth)
            ->where('annee', $currentYear)
            ->groupBy('statut')
            ->get();

        return response()->json([
            'totalAffiliations' => $totalAffiliations,
            'declarationsThisMonth' => $declarationsThisMonth,
            'totalAmountThisMonth' => $totalAmountThisMonth,
            'monthlyEvolution' => $monthlyEvolution,
            'recentAffiliations' => $recentAffiliations,
            'recentDeclarations' => $recentDeclarations,
            'statusBreakdown' => $statusBreakdown,
        ]);
    }

    public function eligibleEmployees()
    {
        // Retourner tous les employés pour permettre la déclaration
        return \App\Models\Employe::select('id', 'nom', 'prenom', 'matricule', 'departement_id')
            ->get()
            ->map(function ($emp) {
                $affiliation = \App\Models\CimrAffiliation::where('matricule', $emp->matricule)
                    ->where('statut', 'actif')
                    ->first();
                return [
                    'id' => $emp->id,
                    'employe' => $emp->nom . ' ' . $emp->prenom,
                    'nom' => $emp->nom,
                    'prenom' => $emp->prenom,
                    'matricule' => $emp->matricule,
                    'departement_id' => $emp->departement_id,
                    'salaire_cotisable' => $affiliation->salaire_cotisable ?? 0,
                    'taux_employeur' => $affiliation->taux_employeur ?? 0,
                    'montant_cotisation' => $affiliation->montant_cotisation ?? 0,
                ];
            });
    }

    public function store(Request $request)
    {
        // Handle both single and bulk store
        $data = $request->all();
        
        if (isset($data[0]) && is_array($data[0])) {
            $validated = $request->validate([
                '*.employe' => ['required', 'string', 'max:255'],
                '*.matricule' => ['required', 'string', 'max:255'],
                '*.departement_id' => ['nullable', 'exists:departements,id'],
                '*.mois' => ['required', 'integer', 'min:1', 'max:12'],
                '*.annee' => ['required', 'integer', 'min:2000', 'max:2100'],
                '*.montant_cimr_employeur' => ['nullable', 'numeric'],
                '*.statut' => ['required', Rule::in(['a_declarer', 'declare', 'paye'])],
            ]);
            
            $declarations = [];
            foreach ($validated as $item) {
                $declarations[] = CimrDeclaration::create($item);
            }
            return response()->json($declarations, 201);
        }

        $validated = $request->validate([
            'employe' => ['required', 'string', 'max:255'],
            'matricule' => ['required', 'string', 'max:255'],
            'departement_id' => ['nullable', 'exists:departements,id'],
            'mois' => ['required', 'integer', 'min:1', 'max:12'],
            'annee' => ['required', 'integer', 'min:2000', 'max:2100'],
            'montant_cimr_employeur' => ['nullable', 'numeric'],
            'statut' => ['required', Rule::in(['a_declarer', 'declare', 'paye'])],
        ]);

        $declaration = CimrDeclaration::create($validated);

        return response()->json($declaration, 201);
    }

    public function show(CimrDeclaration $cimrDeclaration)
    {
        return $cimrDeclaration;
    }

    public function update(Request $request, CimrDeclaration $cimrDeclaration)
    {
        $validated = $request->validate([
            'employe' => ['sometimes', 'required', 'string', 'max:255'],
            'matricule' => ['sometimes', 'required', 'string', 'max:255'],
            'departement_id' => ['sometimes', 'nullable', 'exists:departements,id'],
            'mois' => ['sometimes', 'required', 'integer', 'min:1', 'max:12'],
            'annee' => ['sometimes', 'required', 'integer', 'min:2000', 'max:2100'],
            'montant_cimr_employeur' => ['sometimes', 'nullable', 'numeric'],
            'statut' => ['sometimes', 'required', Rule::in(['a_declarer', 'declare', 'paye'])],
        ]);

        $cimrDeclaration->update($validated);

        return response()->json($cimrDeclaration);
    }

    public function destroy(CimrDeclaration $cimrDeclaration)
    {
        $cimrDeclaration->delete();
        return response()->json(null, 204);
    }

    public function destroyByPeriod(Request $request)
    {
        $request->validate([
            'mois' => 'required|integer',
            'annee' => 'required|integer',
        ]);

        $query = CimrDeclaration::where('mois', $request->mois)
            ->where('annee', $request->annee);

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $query->delete();

        return response()->json(['message' => 'Période supprimée avec succès'], 200);
    }
}
