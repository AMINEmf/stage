<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Constante extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'designation',
        'type_constante',
        'memo',
        'valeur',
        'date',
        'visibilite',
        'group_constante_id'
    ];

    public function groupConstante()
    {
        return $this->belongsTo(GroupConstante::class, 'group_constante_id');
    }
}
