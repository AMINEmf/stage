<?php

namespace App\Http\Controllers;

use App\Models\Remboursement;
use Illuminate\Http\Request;
use App\Models\Credit;


class CreditController extends Controller
{
    public function update(Request $request, $id)
{
    try {
        $data = $request->validate([
            'statut' => 'required|string'
        ]);

        // Récupère le crédit ou déclenche une exception
        $credit = Credit::where('id_credit', $id)->firstOrFail();

        $credit->update($data);

        return response()->json([
            'success' => true,
            'credit' => $credit,
            'message' => "Champ modifié"
        ]);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        // Si l'id n'existe pas
        return response()->json([
            'success' => false,
            'error' => "Crédit introuvable pour id $id"
        ], 404);

    } catch (\Exception $e) {
        // Toutes les autres erreurs : montre le message exact
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function Remboursement(Request $request){
        $rembourssement = Remboursement::create([
            'date_remboursement' => $request->date_remboursement,
            'id_credit' => $request->id_credit
        ]);

        $credit = $rembourssement->credit;
        
        $credit->update([
                'taux_interet' => $request->taux_interet,
                'statut' => $request->statut,
                'nbr_mois' => $request->nbr_mois,
                'mensualite' => $request->mensualite,
                'montant_total' => $request->montant_total
            ]);

        return response()->json($rembourssement);
    }

    public function typeCredit(){
        $credits = Credit::with('typeCredit')->get();
        return response()->json($credits);
    }


public function addCredit(Request $request){ $data = $request->validate([ 'montant_credit' => 'required|numeric', 'date_credit' => 'required|date', 'statut' => 'required|string', 'id_typeCredit' => 'required|numeric', 'id_employe' => 'required|numeric', 'type_credit' => 'required|string' ]); $credit = Credit::create($data); return response()->json([ 'success'=> true, 'data' => $credit, ]); } 

    public function delete($id){
        $credit = Credit::find($id);
        if($credit){
            $credit->delete();
        }

        return response()->json([
            'message' => 'demande supprimer'
        ],200);
    }
}