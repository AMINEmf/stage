<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientGroupeClient extends Model
{
    use HasFactory;

    protected $table = 'client_groupe_client';

    protected $fillable = [
        'CodeClient',
        'Id_groupe'
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'CodeClient', 'CodeClient');
    }

    public function groupe()
    {
        return $this->belongsTo(GroupeClient::class, 'Id_groupe', 'Id_groupe');
    }
}
