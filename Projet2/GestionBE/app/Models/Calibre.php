<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Calibre extends Model
{
    use HasFactory;
    protected $guarded=[]; 
    protected $table = 'calibre';
    public function produits()
    {
        return $this->hasMany(Produit::class);
    }
}