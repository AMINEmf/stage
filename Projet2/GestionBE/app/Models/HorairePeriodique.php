<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HorairePeriodique extends Model
{
    use HasFactory;
 
    protected $fillable = [
        'nom',
        'periode' 
    ];
    
}