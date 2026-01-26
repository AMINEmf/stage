<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Arrondi extends Model
{
    use HasFactory;

    protected $fillable = [
        'min',
        'max',
        'valeur_arrondi',
        'type_arrondi',
        'groupe_arrondi_id'
    ];

    protected $casts = [
        'min' => 'float',
        'max' => 'float',
        'valeur_arrondi' => 'float',
    ];

    public function groupeArrondi()
    {
        return $this->belongsTo(GroupeArrondi::class);
    }
}