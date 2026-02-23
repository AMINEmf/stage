<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DetailsCalendrieController extends Controller
{
    public function index()
    {
        return response()->json([]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Détails calendrier créé'], 201);
    }

    public function show($id)
    {
        return response()->json([]);
    }

    public function update(Request $request, $id)
    {
        return response()->json(['message' => 'Détails calendrier mis à jour']);
    }

    public function destroy($id)
    {
        return response()->noContent();
    }
}
