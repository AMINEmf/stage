<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChargementCommande extends Model
{
    use HasFactory;
    protected $guarded=[]; 

    public function vehicule()
    {
        return $this->belongsTo(Vehicule::class);
    }

    public function livreur()
    {
        return $this->belongsTo(Livreur::class);
    }

    public function commande()
    {
        return $this->belongsTo(Commande::class, 'commande_id');
    }
}
