<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThemeBultinModel extends Model
{
    use HasFactory;
    protected $table="gp_theme_bultin_model";
    protected $fillable=['designation','photo','theme_par_defaut'];

     public function bultinModels()
{
    return $this->hasMany(BultinModel::class,'theme_bultin_model_id');
}
}
