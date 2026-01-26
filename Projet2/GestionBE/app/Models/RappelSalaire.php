<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RappelSalaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'designation',
    ];
}
