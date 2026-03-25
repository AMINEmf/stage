<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Credit extends Model
{
    use HasFactory;

    protected $table = 'credits';
    protected $primaryKey = 'id_credit';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'montant_credit','type_credit','date_credit','nbr_mois','taux_interet','mensualite','statut','montant_total','id_employe','id_typeCredit'
    ];

    public function employe(){
        return $this->belongsTo(Employe::class,'id_employe','id');
    }

    public function typeCredit(){
        return $this->belongsTo(TypeCredit::class, 'id_typeCredit','id_typeCredit');
    }

    public function remboursements(){
        return $this->hasMany(Remboursement::class,'id_credit','id_credit');
    }
    
}
