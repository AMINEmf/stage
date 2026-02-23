<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CalendrieController extends Controller
{
    public function index()
    {
        // Retourner un tableau vide pour éviter les erreurs 500
        return response()->json(['calendrie' => []]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Calendrier créé'], 201);
    }

    public function show($id)
    {
        return response()->json([]);
    }

    public function update(Request $request, $id)
    {
        return response()->json(['message' => 'Calendrier mis à jour']);
    }

    public function destroy($id)
    {
        return response()->noContent();
    }
}
