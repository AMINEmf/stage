<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HeureTravail extends Model
{
    use HasFactory;
    
    // Nom de la table
    protected $table = 'heures_travail';
    
    // Champs qu'on peut remplir en masse
    protected $fillable = [
        'employe_id',
        'date',
        'heures_normales',
        'ferie_paye',
        'absence_paye',
        'absence',
        'heures_sup_0',
        'heures_sup_25',
        'heures_sup_50',
        'heures_sup_100',  // Add this
        'commentaire'
    ];
    
    // Conversion des types de données
    protected $casts = [
        'heures_normales' => 'boolean',
        'ferie_paye' => 'boolean',
        'absence_paye' => 'boolean',
        'absence' => 'boolean',
        'heures_sup_0' => 'boolean',
        'heures_sup_25' => 'boolean',
        'heures_sup_50' => 'boolean',
        'heures_sup_100' => 'boolean', // Add this
        'date' => 'date'
    ];
    
    // Relations avec d'autres modèles
    public function employe()
    {
        return $this->belongsTo(Employe::class);
    }
}