<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AbsencePrevisionnel extends Model
{
    use HasFactory;

    protected $table = 'absence_previsionnels';

    protected $fillable = [
        'absence',
        'date_depart',
        'heure_depart',
        'date_reprise',
        'heure_reprise',
        'employee_id'
    ];
    public function employe()
{
    return $this->belongsTo(Employe::class, 'employee_id');
}

}

