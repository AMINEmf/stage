<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OffreGroupe extends Model
{
    use HasFactory;

    protected $table = 'offre_groupe_table';

    protected $fillable = [
        'Id_offre',
        'Id_groupe'
    ];

    public function offre()
    {
        return $this->belongsTo(Offre::class, 'Id_offre', 'id');
    }

    public function groupeClient()
    {
        return $this->belongsTo(GroupeClient::class, 'Id_groupe', 'Id_groupe');
    }
}