<?php

namespace App\Http\Controllers;

use App\Models\AccidentNature;
use Illuminate\Http\Request;

class AccidentNatureController extends Controller
{
    public function index()
    {
        return AccidentNature::orderBy('nom')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:accident_natures,nom|max:255',
        ]);

        $nature = AccidentNature::create($validated);

        return response()->json($nature, 201);
    }

    public function update(Request $request, AccidentNature $accidentNature)
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:accident_natures,nom,' . $accidentNature->id . '|max:255',
        ]);

        $accidentNature->update($validated);
        return response()->json($accidentNature);
    }

    public function destroy(AccidentNature $accidentNature)
    {
        $accidentNature->delete();
        return response()->noContent();
    }
}
