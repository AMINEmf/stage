<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GpDemandeConge extends Model
{
    use HasFactory;

    protected $table = 'gp_demandes_conges';

    protected $fillable = [
        'employe_id',
        'type_conge',
        'date_debut',
        'date_fin',
        'nombre_jours',
        'motif',
        'piece_jointe',
        'statut',
    ];

    public function employe()
    {
        return $this->belongsTo(Employe::class);
    }
}
