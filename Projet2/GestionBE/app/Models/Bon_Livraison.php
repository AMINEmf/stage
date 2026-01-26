<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bon_Livraison extends Model
{
    use HasFactory;
    protected $fillable = [
        'reference',
        'date',
        'validation_offer',
        'modePaiement',
        'status',
        'type',
        'client_id',
        'user_id',
    ];

    // Relation avec le modèle Client
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    // Relation avec le modèle User (utilisateur)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
