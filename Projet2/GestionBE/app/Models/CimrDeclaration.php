<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CimrDeclaration extends Model
{
    use HasFactory;

    protected $table = 'cimr_declarations';

    protected $fillable = [
        'employe',
        'matricule',
        'departement_id',
        'mois',
        'annee',
        'montant_cimr_employeur',
        'statut',
    ];

    protected $casts = [
        'montant_cimr_employeur' => 'decimal:2',
        'mois' => 'integer',
        'annee' => 'integer',
    ];

    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }
}
