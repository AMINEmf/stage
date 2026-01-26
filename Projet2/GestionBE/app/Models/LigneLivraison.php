<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigneLivraison extends Model
{
    use HasFactory;
    protected $fillable = ['produit_id', 'quantite', 'id_Bon_Livraison'];

    public function devis()
    {
        return $this->belongsTo(Bon_Livraison::class, 'id_Bon_Livraison', 'id');
    }
}
