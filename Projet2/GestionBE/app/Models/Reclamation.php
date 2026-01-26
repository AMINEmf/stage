<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reclamation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'sujet',
        'date_reclamation',
        'status_reclamation',
        'traitement_reclamation',
        'date_traitement',
        'remarque',

    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
