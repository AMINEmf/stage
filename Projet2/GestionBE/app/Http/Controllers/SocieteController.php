<?php

namespace App\Http\Controllers;

use App\Models\Societe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SocieteController extends Controller
{
    public function index()
    {
        if (!Gate::allows('view_all_societes')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $societes = Societe::orderBy('id', 'desc')->get();
        return response()->json($societes);
    }

    public function store(Request $request)
    {
        if (!Gate::allows('create_societes')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $request->validate([
            'RaisonSocial' => 'required|string|max:255',
            'ICE' => 'required|string|max:50',
            'NumeroCNSS' => 'required|string|max:50',
            'NumeroFiscale' => 'required|string|max:50',
            'RegistreCommercial' => 'required|string|max:50',
            'AdresseSociete' => 'required|string|max:255',
        ]);

        $societe = Societe::create($request->all());
        return response()->json($societe, 201);
    }

    public function show($id)
    {
        if (!Gate::allows('view_all_societes')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $societe = Societe::findOrFail($id);
        return response()->json($societe);
    }

    public function update(Request $request, $id)
    {
        if (!Gate::allows('update_societes')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $societe = Societe::findOrFail($id);
        $societe->update($request->all());
        return response()->json($societe);
    }

    public function destroy($id)
    {
        if (!Gate::allows('delete_societes')) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $societe = Societe::findOrFail($id);
        $societe->delete();
        return response()->json(['message' => 'Société supprimée avec succès']);
    }
}
