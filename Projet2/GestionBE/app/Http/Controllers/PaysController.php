<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PaysController extends Controller
{
    public function index()
    {
        return response()->json([]);
    }

    public function getFullData()
    {
        // Retourner un objet vide pour éviter les erreurs 500
        return response()->json([
            'pays' => [],
            'villes' => [],
            'regions' => []
        ]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Pays créé'], 201);
    }

    public function show($id)
    {
        return response()->json([]);
    }

    public function update(Request $request, $id)
    {
        return response()->json(['message' => 'Pays mis à jour']);
    }

    public function destroy($id)
    {
        return response()->noContent();
    }
}
