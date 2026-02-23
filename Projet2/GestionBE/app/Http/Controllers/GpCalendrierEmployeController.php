<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class GpCalendrierEmployeController extends Controller
{
    public function index()
    {
        return response()->json([]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Calendrier employé créé'], 201);
    }

    public function show($id)
    {
        return response()->json([]);
    }

    public function update(Request $request, $id)
    {
        return response()->json(['message' => 'Calendrier employé mis à jour']);
    }

    public function destroy($id)
    {
        return response()->noContent();
    }
}
