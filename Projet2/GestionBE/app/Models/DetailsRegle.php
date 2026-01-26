<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailsRegle extends Model
{
    use HasFactory;

    protected $fillable = [
        'heures_supplementaires',
        'supplement',
        'autre_supplement',
        'plafond',
        'numero_ordre',
        'regle_compensation_id'
    ];

    public function regleCompensation()
    {
        return $this->belongsTo(RegleCompensation::class);
    }
}