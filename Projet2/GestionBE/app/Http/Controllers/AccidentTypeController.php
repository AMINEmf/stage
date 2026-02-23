<?php

namespace App\Http\Controllers;

use App\Models\AccidentType;
use Illuminate\Http\Request;

class AccidentTypeController extends Controller
{
    public function index()
    {
        return AccidentType::orderBy('nom')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:accident_types,nom|max:255',
        ]);

        $type = AccidentType::create($validated);

        return response()->json($type, 201);
    }

    public function update(Request $request, AccidentType $accidentType)
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:accident_types,nom,' . $accidentType->id . '|max:255',
        ]);

        $accidentType->update($validated);
        return response()->json($accidentType);
    }

    public function destroy(AccidentType $accidentType)
    {
        $accidentType->delete();
        return response()->noContent();
    }
}
