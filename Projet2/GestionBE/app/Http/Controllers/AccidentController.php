<?php

namespace App\Http\Controllers;

use App\Models\Accident;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AccidentController extends Controller
{
    public function index()
    {
        return Accident::orderByDesc('date_accident')->get();
    }

    public function store(Request $request)
    {
        // Support legacy frontend field names
        if ($request->has('nom_complet')) {
            $request->merge(['employe' => $request->nom_complet]);
        }
        if ($request->has('statut_dossier')) {
            $request->merge(['statut' => $request->statut_dossier]);
        }

        $validated = $request->validate([
            'employe' => ['required', 'string', 'max:255'],
            'matricule' => ['required', 'string', 'max:255'],
            'date_accident' => ['required', 'date'],
            'heure' => ['required'],
            'lieu' => ['required', 'string', 'max:255'],
            'type_accident' => ['required', 'string', 'max:255'],
            'gravite' => ['required', Rule::in(['léger', 'moyen', 'grave'])],
            'arret_travail' => ['boolean'],
            'duree_arret' => ['integer', 'min:0'],
            'declaration_cnss' => ['boolean'],
            'statut' => ['required', Rule::in(['en cours', 'déclaré', 'clôturé'])],
            'departement_id' => ['nullable', 'exists:departements,id'],
        ]);

        $accident = Accident::create($validated);

        return response()->json($accident, 201);
    }

    public function show(Accident $accident)
    {
        return $accident;
    }

    public function update(Request $request, Accident $accident)
    {
        // Support legacy frontend field names
        if ($request->has('nom_complet')) {
            $request->merge(['employe' => $request->nom_complet]);
        }
        if ($request->has('statut_dossier')) {
            $request->merge(['statut' => $request->statut_dossier]);
        }

        $validated = $request->validate([
            'employe' => ['sometimes', 'required', 'string', 'max:255'],
            'matricule' => ['sometimes', 'required', 'string', 'max:255'],
            'date_accident' => ['sometimes', 'required', 'date'],
            'heure' => ['sometimes', 'required'],
            'lieu' => ['sometimes', 'required', 'string', 'max:255'],
            'type_accident' => ['sometimes', 'required', 'string', 'max:255'],
            'gravite' => ['sometimes', 'required', Rule::in(['léger', 'moyen', 'grave'])],
            'arret_travail' => ['sometimes', 'boolean'],
            'duree_arret' => ['sometimes', 'integer', 'min:0'],
            'declaration_cnss' => ['sometimes', 'boolean'],
            'statut' => ['sometimes', 'required', Rule::in(['en cours', 'déclaré', 'clôturé'])],
            'departement_id' => ['sometimes', 'nullable', 'exists:departements,id'],
        ]);

        $accident->update($validated);

        return response()->json($accident);
    }

    public function destroy(Accident $accident)
    {
        $accident->delete();

        return response()->noContent();
    }
}
