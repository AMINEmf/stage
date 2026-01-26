<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EtatRecouvrement extends Model
{
    use HasFactory;

    protected $fillable = ['client_id', 'id_facture', 'reste'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

}
