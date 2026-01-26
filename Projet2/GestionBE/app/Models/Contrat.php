<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contrat extends Model
{
    use HasFactory;

    protected $fillable = [
        'employe_id',
        'numero_contrat',
        'type_contrat',
        'arret_prevu',
        'duree_prevu',
        'design',
        'debut_le',
        'arret_effectif',
        'duree_effective',
        'motif_depart',
        'dernier_jour_travaille',
        'notification_rupture',
        'engagement_procedure',
        'signature_rupture_conventionnelle',
        'transaction_en_cours',
    ];
        public function employe()
    {
        return $this->belongsTo(Employe::class);
    }
}
