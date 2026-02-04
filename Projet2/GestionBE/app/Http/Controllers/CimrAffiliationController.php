<?php

namespace App\Http\Controllers;

use App\Models\CimrAffiliation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CimrAffiliationController extends Controller
{
    public function index()
    {
        return CimrAffiliation::orderByDesc('created_at')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employe' => ['required', 'string', 'max:255'],
            'matricule' => ['required', 'string', 'max:255'],
            'departement_id' => ['nullable', 'exists:departements,id'],
            'affilie_cimr' => ['boolean'],
            'numero_cimr' => ['nullable', 'string', 'max:255'],
            'date_affiliation' => ['nullable', 'date'],
            'salaire_cotisable' => ['nullable', 'numeric'],
            'taux_employeur' => ['nullable', 'numeric'],
            'statut' => ['required', Rule::in(['actif', 'suspendu'])],
        ]);

        $affiliation = CimrAffiliation::create($validated);

        return response()->json($affiliation, 201);
    }

    public function show(CimrAffiliation $cimrAffiliation)
    {
        return $cimrAffiliation;
    }

    public function update(Request $request, CimrAffiliation $cimrAffiliation)
    {
        $validated = $request->validate([
            'employe' => ['sometimes', 'required', 'string', 'max:255'],
            'matricule' => ['sometimes', 'required', 'string', 'max:255'],
            'departement_id' => ['sometimes', 'nullable', 'exists:departements,id'],
            'affilie_cimr' => ['sometimes', 'boolean'],
            'numero_cimr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_affiliation' => ['sometimes', 'nullable', 'date'],
            'salaire_cotisable' => ['sometimes', 'nullable', 'numeric'],
            'taux_employeur' => ['sometimes', 'nullable', 'numeric'],
            'statut' => ['sometimes', 'required', Rule::in(['actif', 'suspendu'])],
        ]);

        $cimrAffiliation->update($validated);

        return response()->json($cimrAffiliation);
    }

    public function destroy(CimrAffiliation $cimrAffiliation)
    {
        $cimrAffiliation->delete();

        return response()->noContent();
    }
}
