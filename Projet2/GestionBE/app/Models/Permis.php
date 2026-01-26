<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permis extends Model
{
    use HasFactory;
    protected $guarded = [];

    public function livreur()
    {
        return $this->belongsTo(Livreur::class);
    }
}
