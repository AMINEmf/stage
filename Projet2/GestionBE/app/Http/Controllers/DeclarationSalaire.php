<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DeclarationSalaire;
use App\Models\Employe;

class DeclarationSalaireController extends Controller
{
    /**
     * Récupérer toutes les déclarations avec les infos des employés
     */
    public function index()
    {
        $declarations = DeclarationSalaire::with('employe')->get();

        return response()->json($declarations);
    }

    /**
     * Ajouter une nouvelle déclaration
     */
    public function store(Request $request)
    {
        $request->validate([
            'matricule' => 'required|exists:employes,matricule',
            'jours_travailles' => 'required|integer|min:0',
            'salaire_brut' => 'required|numeric|min:0',
        ]);

        // récupérer l'employé correspondant au matricule
        $employe = Employe::where('matricule', $request->matricule)->first();

        // créer la déclaration
        $declaration = DeclarationSalaire::create([
            'employe_id' => $employe->id,
            'jours_travailles' => $request->jours_travailles,
            'salaire_brut' => $request->salaire_brut,
        ]);

        return response()->json([
            'message' => 'Déclaration ajoutée avec succès',
            'declaration' => $declaration
        ]);
    }

    /**
     * Récupérer les déclarations d'un employé par matricule
     */
    public function getByMatricule($matricule)
    {
        $employe = Employe::with('departements', 'declarationsSalaire')
                          ->where('matricule', $matricule)
                          ->first();

        if (!$employe) {
            return response()->json(['message' => 'Employé non trouvé'], 404);
        }

        return response();

        return response()->json([
            'matricule' => $employe->matricule,
            'nom' => $employe->nom,
            'prenom' => $employe->prenom,
            'cin' => $employe->cin,
            'departements' => $employe->departements->pluck('nom'),
            'jours_travailles' => $employe->declarationsSalaire->sum('jours_travailles'),
            'salaire_brut' => $employe->declarationsSalaire->sum('salaire_brut'),
            'salaire_base' => $employe->salaire_base,
        ]);
    }
}