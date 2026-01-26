<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Produit extends Model
{
    use HasFactory;
    protected $guarded=[]; 

    public function categorie()
    {
        return $this->belongsTo(categorie::class, 'categorie_id');
    }
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function calibre()
    {
        return $this->belongsTo(Calibre::class, 'calibre_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }
    
    public function lignesCommande()
    {
        return $this->hasMany(LigneCommande::class);
    }
}
