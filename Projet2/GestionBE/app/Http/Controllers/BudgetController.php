<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(){
        $budget = Budget::select("budget_creditInterne","totalCredit_actif","montant_disponible","taux_endettement")
                        ->get();
        return response()->json($budget);
    }

    public function decrement(Request $request){
        $data = $request->validate([
            "montant" => "required|numeric"
        ]);

        $Budget = Budget::first();
        $Budget->montant_disponible -= $request->montant;
        $Budget->save();


        return response()->json($Budget);
    }
}
