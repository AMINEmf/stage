<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntrerBanque extends Model
{
    protected $table = "entrer_comptes";
    use HasFactory;
    protected $fillable =[
        'client_id',
        'numero_cheque',
        'datee',
        'mode_de_paiement',
        'Status',
        'remarque',
        ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    public function ligneEntrerCompte() {
        return $this->hasMany(Ligneentrercompte::class, 'entrer_comptes_id', 'id');
    }
    public function ligneEncaissement() {
        return $this->hasMany(ligneEncaissement::class, 'entrer_comptes_id', 'id');
    }
    protected static function boot()
    {
        parent::boot();

        // Define a deleting event to delete related records
        static::deleting(function ($banque) {
            $banque->ligneEntrerCompte()->delete();
            $banque->ligneEncaissement()->delete();

        });
    }


}
