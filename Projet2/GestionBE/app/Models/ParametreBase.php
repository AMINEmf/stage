<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParametreBase extends Model
{
    use HasFactory;
    protected $fillable = [
        'parametre',
        'valeur',
        'type',
        'description',
    ];
}