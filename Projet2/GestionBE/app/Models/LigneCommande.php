<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ligneCommande extends Model
{
    use HasFactory;
    protected $guarded=[];
    //protected $fillable = ['quantite', 'produit_id', 'commande_id', 'prix_unitaire'];
    public function commande() {
        return $this->belongsTo(Commande::class, 'commande_id', 'id');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class);
    }
}