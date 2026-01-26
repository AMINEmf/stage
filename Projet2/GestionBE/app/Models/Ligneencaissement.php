<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ligneencaissement extends Model
{
    use HasFactory;
    protected $fillable =[
        'entrer_comptes_id',
        'encaissements_id',

    ];
    public function Banque() {
        return $this->belongsTo(EntrerBanque::class);
    }
    public function Encaissement() {
        return $this->belongsTo(Encaissement::class);
    }
}
