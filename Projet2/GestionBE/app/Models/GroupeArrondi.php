<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupeArrondi extends Model
{
    use HasFactory;

    protected $table = 'groupe_arrondi'; 

    protected $fillable = [
        'designation',
        'HT',
        'HN',
        'PR',
        'HS_0',
        'HS_25',
        'HS_50',
        'HS_100'
    ];
    
    protected $casts = [
        'HT' => 'boolean',
        'HN' => 'boolean',
        'PR' => 'boolean',
        'HS_0' => 'boolean',
        'HS_25' => 'boolean',
        'HS_50' => 'boolean',
        'HS_100' => 'boolean',
    ];

    public function arrondis()
    {
        return $this->hasMany(Arrondi::class);
    }
}