<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Accident extends Model
{
    use HasFactory;

    protected $fillable = [
        'employe',
        'matricule',
        'date_accident',
        'heure',
        'accident_lieu_id',
        'type_accident',
        'gravite',
        'arret_travail',
        'duree_arret',
        'declaration_cnss',
        'statut',
        'departement_id',
    ];

    public function lieu()
    {
        return $this->belongsTo(AccidentLieu::class, 'accident_lieu_id');
    }
}
