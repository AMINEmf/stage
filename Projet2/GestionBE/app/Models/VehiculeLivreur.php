<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehiculeLivreur extends Model
{
    use HasFactory;
    protected $guarded=[];

    public function livreur()
    {
        return $this->belongsTo(Livreur::class);
    }

    public function vehicule()
    {
        return $this->belongsTo(Vehicule::class);
    }
}
