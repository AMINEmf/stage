<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailsCalendrie extends Model
{
    protected $fillable = [
        'debut',
        'fin',
        'groupe_id', 
        'groupe_horaire_id',
        'jourDebut'
    ];

    public function horaire()
    {
        return $this->belongsTo(GroupeHoraire::class, 'groupe_id');
    }
    public function horairePeriodique()
    {
        return $this->belongsTo(horairePeriodique::class, 'groupe_horaire_id');
    }
    
} 