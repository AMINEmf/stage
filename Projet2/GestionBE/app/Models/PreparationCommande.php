<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PreparationCommande extends Model
{
    use HasFactory;
    protected $guarded=[]; 
    public function commande()
    {
        return $this->belongsTo(Commande::class);
    }

    public function lignesPreparation()
{
    return $this->hasMany(LignePreparationCommande::class, 'preparation_id');
}

}
