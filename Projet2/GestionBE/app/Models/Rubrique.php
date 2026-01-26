<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rubrique extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'intitule',
        'type_rubrique',
        'memo',
        'group_rubrique_id',
        'formule',
        'is_complete'
    ];

    protected $casts = [
        'is_complete' => 'boolean'
    ];

    public function groupRubrique()
    {
        return $this->belongsTo(GroupRubrique::class, 'group_rubrique_id');
    }

    /**
     * Relation avec les calculs
     */
    public function calculs()
    {
        return $this->hasMany(Calcul::class, 'rubrique_id');
    }

    /**
     * Récupérer le calcul principal (le plus récent)
     */
    public function calculPrincipal()
    {
        return $this->hasOne(Calcul::class, 'rubrique_id')->latest();
    }

    /**
     * Marquer la rubrique comme complète (avec calculs)
     */
    public function markAsComplete()
    {
        $this->update(['is_complete' => true]);
    }

    /**
     * Vérifier si la rubrique est complète
     */
    public function isComplete()
    {
        return $this->is_complete;
    }

    /**
     * Scope pour récupérer seulement les rubriques complètes (à afficher)
     */
    public function scopeComplete($query)
    {
        return $query->where('is_complete', true);
    }

    /**
     * Scope pour récupérer seulement les rubriques incomplètes
     */
    public function scopeIncomplete($query)
    {
        return $query->where('is_complete', false);
    }



    public function bultinModels()
    {
        return $this->belongsToMany(
            BultinModel::class,
            'gp_bultin_model_rubrique', 
            'rubrique_id', 
            'bultin_model_id'
        )->withPivot('ordre')
         ->withTimestamps();
    }
        


}
