<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupConstante extends Model
{
    use HasFactory;

    protected $fillable = [
        'designation',
    ];

    // Relation avec les constantes
    public function constantes()
    {
        return $this->hasMany(Constante::class, 'group_constante_id');
    }

    // public function parent()
    // {
    //     return $this->belongsTo(GroupConstante::class, 'parent_id');
    // }

    // public function children()
    // {
    //     return $this->hasMany(GroupConstante::class, 'parent_id');
    // }
}
