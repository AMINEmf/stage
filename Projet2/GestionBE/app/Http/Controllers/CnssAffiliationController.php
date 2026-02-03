<?php

namespace App\Http\Controllers;

use App\Models\CnssAffiliation;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CnssAffiliationController extends Controller
{
    /**
     * Afficher toutes les affiliations CNSS
     */
    public function index()
    {
        try {
            $affiliations = CnssAffiliation::with(['employe.departements'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($affiliations, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des affiliations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une nouvelle affiliation CNSS
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employe_id' => 'required|exists:employes,id',
            'numero_cnss' => 'required|string|max:255',
            'salaire' => 'required|numeric|min:0',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after:date_debut',
            'statut' => 'required|in:Actif,Inactif,Suspendu',
            'departement_id' => 'nullable|exists:departements,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Vérifier si l'employé a déjà une affiliation active
            $existingAffiliation = CnssAffiliation::where('employe_id', $request->employe_id)
                ->where('statut', 'Actif')
                ->first();

            if ($existingAffiliation) {
                return response()->json([
                    'message' => 'Cet employé a déjà une affiliation CNSS active',
                ], 409);
            }

            $affiliation = CnssAffiliation::create($request->all());
            
            // Charger la relation employe pour la réponse
            $affiliation->load(['employe.departements']);

            return response()->json([
                'message' => 'Affiliation CNSS créée avec succès',
                'data' => $affiliation
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de l\'affiliation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher une affiliation spécifique
     */
    public function show($id)
    {
        try {
            $affiliation = CnssAffiliation::with(['employe.departements'])->findOrFail($id);
            return response()->json($affiliation, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Affiliation non trouvée',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour une affiliation CNSS
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'employe_id' => 'sometimes|exists:employes,id',
            'numero_cnss' => 'sometimes|string|max:255',
            'salaire' => 'sometimes|numeric|min:0',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'nullable|date|after:date_debut',
            'statut' => 'sometimes|in:Actif,Inactif,Suspendu',
            'departement_id' => 'nullable|exists:departements,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $affiliation = CnssAffiliation::findOrFail($id);
            $affiliation->update($request->all());
            $affiliation->load(['employe.departements']);

            return response()->json([
                'message' => 'Affiliation CNSS mise à jour avec succès',
                'data' => $affiliation
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une affiliation CNSS
     */
    public function destroy($id)
    {
        try {
            $affiliation = CnssAffiliation::findOrFail($id);
            $affiliation->delete();

            return response()->json([
                'message' => 'Affiliation CNSS supprimée avec succès'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les affiliations d'un employé spécifique
     */
    public function getByEmploye($employeId)
    {
        try {
            $affiliations = CnssAffiliation::where('employe_id', $employeId)
                ->with(['employe.departements'])
                ->orderBy('date_debut', 'desc')
                ->get();

            return response()->json($affiliations, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des affiliations',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
