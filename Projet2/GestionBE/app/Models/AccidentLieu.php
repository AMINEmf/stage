<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccidentLieu extends Model
{
    use HasFactory;

    protected $table = 'accident_lieux';

    protected $fillable = [
        'nom',
    ];
}
