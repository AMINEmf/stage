<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pays extends Model
{
    use HasFactory;

    protected $table = 'gp_pays';

    protected $fillable = ['nom', 'code_pays'];

    public function villes()
    {
        return $this->hasMany(Ville::class);
    }
}
