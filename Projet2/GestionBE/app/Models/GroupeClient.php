<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupeClient extends Model
{
    use HasFactory;

    protected $primaryKey = 'Id_groupe';

    protected $fillable = ['Name', 'Designation'];

    public function clients()
    {
        return $this->belongsToMany(Client::class, 'client_groupe_client', 'Id_groupe', 'CodeClient');
    }

    public function offres()
{
    return $this->belongsToMany(Offre::class, 'offre_groupe_table', 'Id_groupe', 'Id_offre');
}
}

