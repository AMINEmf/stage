<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Livreur extends Model
{
    use HasFactory;
    protected $guarded=[];

     public function permis()
    {
        return $this->hasMany(Permis::class);
    }

    public function chargementCommandes()
    {
        return $this->hasMany(ChargementCommande::class);
    }
}
