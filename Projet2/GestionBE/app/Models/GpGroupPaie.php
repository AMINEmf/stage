<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GpGroupPaie extends Model
{
    use HasFactory;

    protected $table = 'gp_group_paie';

    protected $fillable = ['designation'];



public function rubriques()
{
    return $this->belongsToMany(Rubrique::class, 'gp_paie_rubrique', 'group_paie_id', 'rubrique_id')
                ->withPivot('ordre')
                ->withTimestamps();
}


}
