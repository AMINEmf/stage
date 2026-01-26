<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractType extends Model
{
    protected $fillable = ['name'];

    // Optional: If you want to define a relationship with contracts
    public function contracts()
    {
        return $this->hasMany(Contrat::class, 'type_contrat', 'name');
    }
}