<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GpRegleEmploye extends Model
{
    use HasFactory;

    protected $table = 'gp_regle_employe';

    protected $fillable = [
        'employe_id',
        'regle_id',
        'date_debut',
        'date_fin',
    ];

    // Relation avec l'employé
    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }

    // Relation avec la règle
    public function regle()
    {
        return $this->belongsTo(RegleCompensation::class, 'regle_id');
    }
}
