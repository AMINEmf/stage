<?php

namespace App\Http\Controllers;

use App\Models\AccidentLieu;
use Illuminate\Http\Request;

class AccidentLieuController extends Controller
{
    public function index()
    {
        return AccidentLieu::orderBy('nom')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|unique:accident_lieux,nom|max:255',
        ]);

        $lieu = AccidentLieu::create($validated);

        return response()->json($lieu, 201);
    }

    public function destroy(AccidentLieu $accidentLieu)
    {
        $accidentLieu->delete();
        return response()->noContent();
    }
}
