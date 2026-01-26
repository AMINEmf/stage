<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    use HasFactory;
    protected $guarded = [];

    public function devis()
    {
        return $this->belongsTo(Devis::class, 'id_devis');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function ligneFacture()
    {
        return $this->hasMany(LigneFacture::class, 'id_facture', 'id');
    }

    public function ligneEntrerCompte() {
        return $this->hasMany(Ligneentrercompte::class, 'id_facture', 'id');
    }

    protected static function boot()
    {
        parent::boot();

        // Define a deleting event to delete related records
        static::deleting(function ($facture) {
            $facture->ligneFacture()->delete();
            $facture->ligneEntrerCompte()->delete();
        });
    }

}
