<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comptes extends Model
{
    use HasFactory;

    protected $fillable = [
        'designations',
        'type_compte',
        'devise',
        'rib',
        'swift',
        'adresse',
        'remarque',
    ];
}
