<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GpBonSortie extends Model
{
    use HasFactory;

    protected $table = 'gp_bon_sortie';

    protected $fillable = [
        'date_sortie',
        'heure_sortie',
        'duree_estimee',
        'motif_sortie',
        'responsable_nom',
        'responsable_poste',
        'date_autorisation',
        'heure_retour',
        'date_retour',
        'employee_id',
    ];

    public function employee()
    {
        return $this->belongsTo(Employe::class);
    }
}
