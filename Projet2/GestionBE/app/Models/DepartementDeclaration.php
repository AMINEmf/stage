<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartementDeclaration extends Model
{
    use HasFactory;

    protected $table = 'departements';

    protected $fillable = ['nom'];

    public function employes()
    {
        return $this->hasMany(Employe::class,'departement_id');
    }
}
 
?>