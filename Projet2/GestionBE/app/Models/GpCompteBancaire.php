<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GpCompteBancaire extends Model
{
    use HasFactory;

    protected $table = 'gp_comptes_bancaires';

    protected $fillable = [
        'employe_id',
        'agence_id',
        'numero_compte',
        'rib',
        'iban',
    ];

    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }
    
    public function agence()
    {
        return $this->belongsTo(GpAgence::class, 'agence_id');
    }

    
}
