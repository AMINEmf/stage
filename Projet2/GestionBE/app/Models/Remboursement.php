<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Remboursement extends Model
{
    use HasFactory;

    protected $table = "remboursements";

    protected $primaryKey = "id_remboursement";

    protected $fillable = [
        "date_remboursement","montant_paye","reste_paye","statut_remboursement","id_credit"
    ];

    public function credit(){
        return $this->belongsTo(Credit::class,"id_credit","id_credit");
    }
}
