<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigneDevis extends Model
{
    use HasFactory;
    protected $guarded=[];
    protected $fillable = ['produit_id', 'prix_vente', 'quantite', 'id_devis'];

    public function devis()
    {
        return $this->belongsTo(Devis::class, 'id_devis', 'id');
    }
}
