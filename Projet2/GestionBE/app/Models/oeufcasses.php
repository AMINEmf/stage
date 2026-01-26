<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class oeufcasses extends Model
{
    use HasFactory;
    protected $table = 'oeufcasses';

    // The attributes that are mass assignable.
    protected $fillable = [
        'date',
        'N_lot',
        'nbr_oeuf_cass',
        'Poid_moy_oeuf',
    ];

    // The attributes that should be cast to native types.
    protected $casts = [
        'date' => 'date',
    ];
}
