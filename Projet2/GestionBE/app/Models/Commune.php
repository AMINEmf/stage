<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Commune extends Model
{
    use HasFactory;

    protected $table = 'gp_communes';

    protected $fillable = ['nom', 'ville_id'];

    public function ville()
    {
        return $this->belongsTo(Ville::class);
    }
}
