<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailsPeriodique extends Model
{
    protected $fillable = [
        'numero_jour',
        'libele',
        'horaire',
        'groupe_horaire_id'
    ];

    public function horaire()
    {
        return $this->belongsTo(GroupeHoraire::class,'horaire'); 
    }
    public function horairee()
    {
        return $this->belongsTo(HorairePeriodique::class, 'groupe_horaire_id');
    }
    
}
