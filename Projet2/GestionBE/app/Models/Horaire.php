<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Horaire extends Model
{
    protected $fillable = [

        'typePlageHoraire',
        'tauxPlageHoraire',
        'tauxType',
        'entreeDe',
        'entreeA',
        'penaliteEntree',
        'reposDe',
        'reposA',
        'deduireRepos',
        'dureeRepos',
        'sortieDe',
        'sortieA',
        'pointageAutomatique',
        'penaliteSortie',
        'cumul',
        'jourTravaille',
        'couleur',
        'groupe_horaire_id' ,
        'heureDebut', 
    'heureFin',
    'horaireJournalier',
    'typeHoraire',
    'veille',
    'jourPlus1',

    ];

    protected $casts = [
        'veille' => 'boolean',
        'jourPlus1' => 'boolean',
        'pointageAutomatique' => 'boolean',
        'entreeDe' => 'datetime',
        'entreeA' => 'datetime',
        'reposDe' => 'datetime',
        'reposA' => 'datetime',
        'sortieDe' => 'datetime',
        'sortieA' => 'datetime',
        'dureeRepos' => 'datetime'
    ];
    public function groupeHoraire() {
        return $this->belongsTo(GroupeHoraire::class);
    }
    public function detail() {
        return $this->belongsTo(GroupeHoraire::class,'typeHoraire','id');
    }
    
}