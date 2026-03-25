<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    use HasFactory;
    protected $table = "budget";
    protected $primaryKey = "id";

    protected $fillable = [
        "budget_creditInterne","totalCredit_actif","montant_disponible","taux_endettement"
    ];
}
