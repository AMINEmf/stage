<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vis extends Model
{
    use HasFactory;
    protected $fillable = [
        
        'date_visite',
        'commentaire',
        'vehicule_id',
    ];
}
