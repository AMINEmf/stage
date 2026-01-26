<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GpCalendrierEmploye extends Model
{
    use HasFactory;
    protected $table = 'gp_calendriers_employes';


    protected $fillable = [
        'employe_id',
        'calendrier_id',
        'date_debut',
        'date_fin',
    ];



    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }

    public function calendrier()
    {
        return $this->belongsTo(Calendrie::class, 'calendrie_id');
    }

}

