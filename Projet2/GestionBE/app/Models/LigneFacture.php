<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigneFacture extends Model
{
    use HasFactory;

    // Specify the attributes that are mass assignable
    protected $fillable = ['produit_id', 'prix_vente', 'quantite', 'id_facture'];
    
    // Alternatively, use guarded to specify attributes that are not mass assignable
    // protected $guarded = [];

    public function facture()
    {
        return $this->belongsTo(Facture::class, 'id_facture', 'id');
    }
}

