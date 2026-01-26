<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HoraireExceptionnel extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date_debut',
        'date_fin',
        'horaire_id',
        'horaire_periodique_id',
        'jour_debut'
    ];

    public function employee()
    {
        return $this->belongsTo(Employe::class, 'employee_id');
    }

    public function horaire()
    {
        return $this->belongsTo(GroupeHoraire::class, 'horaire_id');
    }

    public function horairePeriodique()
    {
        return $this->belongsTo(HorairePeriodique::class, 'horaire_periodique_id');
    }
}