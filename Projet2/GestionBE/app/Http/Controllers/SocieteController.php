<?php

namespace App\Http\Controllers;

use App\Models\Societe;
use Illuminate\Http\Request;

class SocieteController extends Controller
{
    public function index()
    {
        return Societe::orderBy('id', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'RaisonSocial' => 'required|string|max:255',
            'ICE' => 'required|string|max:255',
            'NumeroCNSS' => 'required|string|max:255',
            'NumeroFiscale' => 'required|string|max:255',
            'RegistreCommercial' => 'required|string|max:255',
            'AdresseSociete' => 'required|string|max:255',
        ]);

        $societe = Societe::create($validated);

        return response()->json($societe, 201);
    }

    public function update(Request $request, Societe $societe)
    {
        $validated = $request->validate([
            'RaisonSocial' => 'sometimes|required|string|max:255',
            'ICE' => 'sometimes|required|string|max:255',
            'NumeroCNSS' => 'sometimes|required|string|max:255',
            'NumeroFiscale' => 'sometimes|required|string|max:255',
            'RegistreCommercial' => 'sometimes|required|string|max:255',
            'AdresseSociete' => 'sometimes|required|string|max:255',
        ]);

        $societe->update($validated);

        return response()->json($societe);
    }

    public function destroy(Societe $societe)
    {
        $societe->delete();

        return response()->json(['message' => 'Societe supprimée avec succès']);
    }
}