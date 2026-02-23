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
        'accident_type_id',
        'accident_nature_id',
        'arret_travail',
        'duree_arret',
        'statut',
        'commentaire',
        'departement_id',
    ];

    public function lieu()
    {
        return $this->belongsTo(AccidentLieu::class, 'accident_lieu_id');
    }

    public function type()
    {
        return $this->belongsTo(AccidentType::class, 'accident_type_id');
    }

    public function nature()
    {
        return $this->belongsTo(AccidentNature::class, 'accident_nature_id');
    }
}
