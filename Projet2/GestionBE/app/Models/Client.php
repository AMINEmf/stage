<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;
    protected $guarded=[]; 

    
    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function zone() {
        return $this->belongsTo(Zone::class, 'zone_id');
    }
    public function region() {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function siteclients() {
        return $this->hasMany(SiteClient::class, 'client_id');
    }
    public function bonlivraison() {
        return $this->hasMany(Bon_Livraison::class, 'client_id');
    }

    public function commandes()
    {
        return $this->hasMany(Commande::class);
    }
    public function groupes()
    {
        return $this->belongsToMany(GroupeClient::class, 'client_groupe_client', 'CodeClient', 'Id_groupe');
    }

}