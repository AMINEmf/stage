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

    public function eligibleEmployees()
    {
        return \App\Models\CimrAffiliation::where('statut', 'actif')
            ->get(['id', 'employe', 'matricule', 'departement_id', 'salaire_cotisable', 'taux_employeur']);
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

        CimrDeclaration::where('mois', $request->mois)
            ->where('annee', $request->annee)
            ->delete();

        return response()->json(['message' => 'Période supprimée avec succès'], 200);
    }
}
