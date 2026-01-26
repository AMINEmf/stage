<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Devis extends Model
{
    use HasFactory;
    protected $guarded=[];

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function lignedevis()
    {
        return $this->hasMany(LigneDevis::class, 'id_devis', 'id');
    }

    public function facture()
    {
        return $this->belongsTo(Facture::class, 'id_facture');
    }

}
