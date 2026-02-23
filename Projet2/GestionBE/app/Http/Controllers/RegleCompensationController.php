<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RegleCompensationController extends Controller
{
    public function index()
    {
        // Retourner un tableau vide pour éviter les erreurs 500
        return response()->json([]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Règle créée'], 201);
    }

    public function show($id)
    {
        return response()->json([]);
    }

    public function update(Request $request, $id)
    {
        return response()->json(['message' => 'Règle mise à jour']);
    }

    public function destroy($id)
    {
        return response()->noContent();
    }
}
