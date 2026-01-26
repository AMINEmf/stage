<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Propriete extends Model
{
    use HasFactory;

    protected $fillable = [
        'imprimable_id',
        'mois_cloture_id',
        'rappel_salaire_id',
        'en_activite',
        'regularisation',
        'visible',
        'exclue_net_payer',
    ];

    public function imprimable() {
        return $this->belongsTo(Imprimable::class);
    }
    public function moisCloture() {
        return $this->belongsTo(MoisCloture::class);
    }
    public function rappelSalaire() {
        return $this->belongsTo(RappelSalaire::class);
    }
}
