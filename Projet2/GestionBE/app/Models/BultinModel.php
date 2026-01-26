<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BultinModel extends Model
{
    use HasFactory;
    protected $table='gp_bultin_models';
    protected $fillable = ['designation','theme_bultin_model_id'];
/**
     * relation avec rubrique
     */
  public function rubriques()
{
    return $this->belongsToMany(Rubrique::class, 'gp_bultin_model_rubrique')
                ->withPivot('ordre')      
                ->orderBy('gp_bultin_model_rubrique.ordre', 'asc');
}


/**
     * relation avec constante
     */
    public function constantes()
    {
         return $this->belongsToMany(Constante::class, 'gp_bultin_model_constante')
                ->withPivot('ordre')      
                ->orderBy('gp_bultin_model_constante.ordre', 'asc');
    }
    public function theme()
{
    return $this->belongsTo(ThemeBultinModel::class,'theme_bultin_model_id');
}
}
