<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use App\Models\Historique;

class HistoriqueController extends Controller
{
    public function Store(Request $request){

        $data = $request->validate([
            'fullName_Emp' => 'required|string',
            'statut_Emp' => 'required|string',
            'poste_Emp' => 'required|string',
            'type_contrat' => 'required|string',
            'type_Credit' => 'required|string',
            'statut_Credit' => 'required|string',
            'montant_demande' => 'required|numeric',
            'id_credit' => 'required|exists:credits,id_credit',
        ]);

        $historique = Historique::create($data);

        return response()->json([
            'success' => true,
            'historique' => $historique
        ]);
    }

    public function Select(){
        return response()->json(Historique::all());
    }

    public function SelectAll(){
        $historique = Historique::with([
            'credit:id_credit,id_employe,type_Credit,montant_credit', 
            'credit.employe:id,nom,fonction,active,departement_id', 
            'credit.employe.departement:id,nom'
        ])->get();
        return response()->json($historique);
    }
    
}
