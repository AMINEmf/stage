<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ville extends Model
{
    use HasFactory;

    protected $table = 'gp_villes';

    protected $fillable = ['nom', 'pays_id'];

    public function pays()
    {
        return $this->belongsTo(Pays::class);
    }

    public function communes()
    {
        return $this->hasMany(Commune::class);
    }
}
