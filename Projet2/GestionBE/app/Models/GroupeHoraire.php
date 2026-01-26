<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupeHoraire extends Model
{
    use HasFactory;

    protected $table = 'groupe_horaires'; // Explicitly define the table name
    protected $fillable = ['designation', 'type', 'abreviation', 'couleur'];  
     
    public function detail() {
        return $this->hasMany(Horaire::class);
    }
}