<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commande extends Model
{
    use HasFactory;
    protected $guarded = [];
    public function ligneCommandes()
    {
        return $this->hasMany(LigneCommande::class, 'commande_id', 'id');
    }
    public function bonsLivraison()
    {
        return $this->hasMany(Bon_Livraison::class, 'commande_id');
    }

    public function statusCommandes()
    {
        return $this->hasMany(StatusCommande::class, 'commande_id', 'id');
    }
    public function preparations()
    {
        return $this->hasMany(PreparationCommande::class);
    }
    public function chargementCommandes()
    {
        return $this->hasMany(ChargementCommande::class);
    }
    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    // public function siteclient()
    // {
    //     return $this->belongsTo(SiteClient::class);
    // }

    protected static function boot()
    {
        parent::boot();

        // Define a deleting event to delete related records
        static::deleting(function ($commande) {
            $commande->ligneCommandes()->delete();
            $commande->statusCommandes()->delete(); 
            $commande->preparations()->delete();
            $commande->chargementCommandes()->delete();
        });
    }
}
