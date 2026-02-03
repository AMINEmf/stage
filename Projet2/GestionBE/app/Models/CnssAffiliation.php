<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CnssAffiliation extends Model
{
    use HasFactory;

    protected $table = 'cnss_affiliations';

    protected $fillable = [
        'employe_id',
        'numero_cnss',
        'salaire',
        'date_debut',
        'date_fin',
        'statut',
        'departement_id',
    ];

    protected $casts = [
        'salaire' => 'decimal:2',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    /**
     * Relation avec l'employé
     */
    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }

    /**
     * Relation avec le département
     */
    public function departement()
    {
        return $this->belongsTo(Departement::class, 'departement_id');
    }
}
