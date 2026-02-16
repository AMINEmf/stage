<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CimrAffiliation extends Model
{
    use HasFactory;

    protected $table = 'cimr_affiliations';

    protected $fillable = [
        'employe',
        'matricule',
        'departement_id',
        'affilie_cimr',
        'numero_cimr',
        'date_affiliation',
        'salaire_cotisable',
        'taux_employeur',
        'montant_cotisation',
        'statut',
    ];

    protected $casts = [
        'affilie_cimr' => 'boolean',
        'date_affiliation' => 'date',
        'salaire_cotisable' => 'decimal:2',
        'taux_employeur' => 'decimal:2',
        'montant_cotisation' => 'decimal:2',
    ];

    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }
}
