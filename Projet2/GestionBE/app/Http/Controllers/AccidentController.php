<?php

namespace App\Http\Controllers;

use App\Models\Accident;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AccidentController extends Controller
{
    public function index()
    {
        return Accident::with(['lieu', 'type', 'nature'])->orderByDesc('date_accident')->get();
    }

    public function store(Request $request)
    {
        // Support legacy frontend field names
        if ($request->has('nom_complet')) {
            $request->merge(['employe' => $request->nom_complet]);
        }
        if ($request->has('statut_dossier')) {
            $request->merge(['statut' => $request->statut_dossier]);
        }

        $validated = $request->validate([
            'employe' => ['required', 'string', 'max:255'],
            'matricule' => ['required', 'string', 'max:255'],
            'date_accident' => ['required', 'date'],
            'heure' => ['required'],
            'accident_lieu_id' => ['required', 'exists:accident_lieux,id'],
            'accident_type_id' => ['nullable', 'exists:accident_types,id'],
            'accident_nature_id' => ['nullable', 'exists:accident_natures,id'],
            'arret_travail' => ['boolean'],
            'duree_arret' => ['integer', 'min:0'],
            'statut' => ['required', Rule::in(['en cours', 'déclaré', 'clôturé'])],
            'commentaire' => ['nullable', 'string'],
            'departement_id' => ['nullable', 'exists:departements,id'],
        ]);

        $accident = Accident::create($validated);

        return response()->json($accident->load(['lieu', 'type', 'nature']), 201);
    }

    public function show(Accident $accident)
    {
        return $accident->load(['lieu', 'type', 'nature']);
    }

    public function update(Request $request, Accident $accident)
    {
        // Support legacy frontend field names
        if ($request->has('nom_complet')) {
            $request->merge(['employe' => $request->nom_complet]);
        }
        if ($request->has('statut_dossier')) {
            $request->merge(['statut' => $request->statut_dossier]);
        }

        $validated = $request->validate([
            'employe' => ['sometimes', 'required', 'string', 'max:255'],
            'matricule' => ['sometimes', 'required', 'string', 'max:255'],
            'date_accident' => ['sometimes', 'required', 'date'],
            'heure' => ['sometimes', 'required'],
            'accident_lieu_id' => ['sometimes', 'required', 'exists:accident_lieux,id'],
            'accident_type_id' => ['sometimes', 'nullable', 'exists:accident_types,id'],
            'accident_nature_id' => ['sometimes', 'nullable', 'exists:accident_natures,id'],
            'arret_travail' => ['sometimes', 'boolean'],
            'duree_arret' => ['sometimes', 'integer', 'min:0'],
            'statut' => ['sometimes', 'required', Rule::in(['en cours', 'déclaré', 'clôturé'])],
            'commentaire' => ['sometimes', 'nullable', 'string'],
            'departement_id' => ['sometimes', 'nullable', 'exists:departements,id'],
        ]);

        $accident->update($validated);

        return response()->json($accident->load(['lieu', 'type', 'nature']));
    }

    public function destroy(Accident $accident)
    {
        $accident->delete();

        return response()->noContent();
    }

    public function dashboardStats()
    {
        $currentMonth = now()->month;
        $currentYear = now()->year;

        // Total accidents
        $totalAccidents = Accident::count();

        // Accidents this month
        $accidentsThisMonth = Accident::whereMonth('date_accident', $currentMonth)
            ->whereYear('date_accident', $currentYear)
            ->count();

        // Accidents by status
        $statusBreakdown = Accident::selectRaw('statut, COUNT(*) as count')
            ->groupBy('statut')
            ->get();

        // Accidents by department
        $byDepartment = Accident::selectRaw('departement_id, COUNT(*) as count')
            ->whereNotNull('departement_id')
            ->groupBy('departement_id')
            ->with('departement:id,nom')
            ->get()
            ->map(function ($item) {
                $dept = \App\Models\Departement::find($item->departement_id);
                return [
                    'departement_id' => $item->departement_id,
                    'departement' => $dept ? $dept->nom : 'Non assigné',
                    'count' => $item->count
                ];
            });

        // Accidents by type
        $byType = Accident::selectRaw('accident_type_id, COUNT(*) as count')
            ->whereNotNull('accident_type_id')
            ->groupBy('accident_type_id')
            ->get()
            ->map(function ($item) {
                $type = \App\Models\AccidentType::find($item->accident_type_id);
                return [
                    'type_id' => $item->accident_type_id,
                    'type' => $type ? $type->nom : 'Non défini',
                    'count' => $item->count
                ];
            });

        // Accidents by lieu
        $byLieu = Accident::selectRaw('accident_lieu_id, COUNT(*) as count')
            ->whereNotNull('accident_lieu_id')
            ->groupBy('accident_lieu_id')
            ->get()
            ->map(function ($item) {
                $lieu = \App\Models\AccidentLieu::find($item->accident_lieu_id);
                return [
                    'lieu_id' => $item->accident_lieu_id,
                    'lieu' => $lieu ? $lieu->nom : 'Non défini',
                    'count' => $item->count
                ];
            });

        // Monthly evolution (last 12 months)
        $monthlyEvolution = Accident::selectRaw('MONTH(date_accident) as mois, YEAR(date_accident) as annee, COUNT(*) as count')
            ->where('date_accident', '>=', now()->subMonths(12))
            ->groupBy('mois', 'annee')
            ->orderBy('annee')
            ->orderBy('mois')
            ->get();

        // Total days of work stoppage
        $totalJoursArret = Accident::where('arret_travail', true)->sum('duree_arret');

        // Accidents with work stoppage
        $accidentsAvecArret = Accident::where('arret_travail', true)->count();

        // Recent accidents
        $recentAccidents = Accident::with(['lieu', 'type', 'nature'])
            ->orderByDesc('date_accident')
            ->limit(5)
            ->get();

        return response()->json([
            'totalAccidents' => $totalAccidents,
            'accidentsThisMonth' => $accidentsThisMonth,
            'statusBreakdown' => $statusBreakdown,
            'byDepartment' => $byDepartment,
            'byType' => $byType,
            'byLieu' => $byLieu,
            'monthlyEvolution' => $monthlyEvolution,
            'totalJoursArret' => $totalJoursArret,
            'accidentsAvecArret' => $accidentsAvecArret,
            'recentAccidents' => $recentAccidents,
        ]);
    }
}
