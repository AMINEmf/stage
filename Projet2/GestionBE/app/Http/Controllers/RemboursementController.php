<?php

namespace App\Http\Controllers;

use App\Models\Remboursement;
use Illuminate\Http\Request;

class RemboursementController extends Controller
{
    public function getRembourseByEmploye($id_employe){
        $remboursement = Remboursement::with(['credit' => function($query) {
            $query->select('id_credit', 'montant_credit', 'date_credit','id_employe'); 
        }])
        ->whereHas('credit', function($q) use ($id_employe) {
            $q->where('id_employe', $id_employe);
        })
        ->get();
        return response()->json($remboursement);
    }
}
