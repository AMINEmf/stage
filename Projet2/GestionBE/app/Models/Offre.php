<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offre extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function offreDetails()
    {
        return $this->hasMany(OffreDetail::class, 'id_offre', 'id');
    }

    public function groupeClients()
{
    return $this->belongsToMany(GroupeClient::class, 'offre_groupe_table', 'Id_offre', 'Id_groupe');
}
}