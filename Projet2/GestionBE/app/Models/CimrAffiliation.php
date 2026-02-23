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
        'cin',
        'poste',
        'date_embauche',
        'departement_id',
        'numero_cimr',
        'date_affiliation',
        'date_fin_affiliation',
        'salaire_cotisable',
        'taux_employeur',
        'montant_cotisation',
        'statut',
        'fiche_affiliation',
    ];

    protected $casts = [
        'date_affiliation' => 'date',
        'date_fin_affiliation' => 'date',
        'date_embauche' => 'date',
        'salaire_cotisable' => 'decimal:2',
        'taux_employeur' => 'decimal:2',
        'montant_cotisation' => 'decimal:2',
    ];

    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }
}
