<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeCredit extends Model
{
    use HasFactory;

    protected $table = "type_credit";
    protected $primaryKey = "id_typeCredit";

    protected $fillable = [
        "nom_typeCredit","taux_typeCredit"
    ];

    protected function credit(){
        return $this->hasMany(Credit::class,'id_typeCredit');
    }
}
