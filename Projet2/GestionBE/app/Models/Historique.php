<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Historique extends Model
{
    use HasFactory;

    protected $table = 'historique';
    protected $primaryKey = 'id_historique';

    protected $fillable = [
        'fullName_Emp',
        'statut_Emp',
        'poste_Emp',
        'type_contrat',
        'type_Credit',
        'statut_Credit',
        'montant_demande',
        'id_credit'
    ];

    public function credit(){
        return $this->belongsTo(Credit::class,'id_credit');
    }
}
