<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ligneentrercompte extends Model
{
    use HasFactory;
    protected $fillable =[
        'client_id',
        'entrer_comptes_id',
        'id_facture',
        'avance',
        'restee',
    ];
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }
    public function Banque() {
        return $this->belongsTo(EntrerBanque::class);
    }


}
