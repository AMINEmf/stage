<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupMotifAbsence extends Model
{
    use HasFactory;

    protected $fillable = ['designation'];  // Utilisez "designation" ici
    
    public function detailMotifAbsences() {
        return $this->hasMany(DetailMotifAbsence::class);
    }
}

