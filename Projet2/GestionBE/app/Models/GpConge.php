<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GpConge extends Model
{
    use HasFactory;

    protected $table = 'gp_conges';

    protected $fillable = [
        'employe_id',
        'jours_cumules',
        'jours_consomes',
        'solde_actuel',
        'last_update',
    ];

    /**
     * Relation avec Employe
     */
    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }
}
