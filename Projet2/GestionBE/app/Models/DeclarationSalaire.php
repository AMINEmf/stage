<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeclarationSalaire extends Model
{
    use HasFactory;

    protected $table = 'declarations_salaire';

    protected $fillable = [
        'employe_id',
        'mois',
        'jours_travailles',
        'salaire_brut',
    ];  

    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }
}
