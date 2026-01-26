<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Calcul extends Model
{
    use HasFactory;

    protected $fillable = [
        'rubrique_id',
        'type_calcul',
        'gain',
        'formule',
        'formule_nombre',
        'formule_base',
        'formule_taux',
        'formule_montant',
        'report_nombre',
        'report_base',
        'report_taux',
        'report_montant',
        'impression_nombre',
        'impression_base',
        'impression_taux',
        'impression_montant',
        'saisie_nombre',
        'saisie_base',
        'saisie_taux',
        'saisie_montant'
    ];

    protected $casts = [
        'report_nombre' => 'boolean',
        'report_base' => 'boolean',
        'report_taux' => 'boolean',
        'report_montant' => 'boolean',
        'impression_nombre' => 'boolean',
        'impression_base' => 'boolean',
        'impression_taux' => 'boolean',
        'impression_montant' => 'boolean',
        'saisie_nombre' => 'boolean',
        'saisie_base' => 'boolean',
        'saisie_taux' => 'boolean',
        'saisie_montant' => 'boolean'
    ];

    /**
     * Relation avec le modèle Rubrique
     */
    public function rubrique()
    {
        return $this->belongsTo(Rubrique::class, 'rubrique_id');
    }
}