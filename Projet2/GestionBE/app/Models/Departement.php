<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Departement extends Model
{
    protected $fillable = ['nom', 'parent_id'];

    public function employes()

{
    return $this->belongsToMany(Employe::class, 'employe_departement', 'departement_id', 'employe_id');
}
    public function parent()

{
        return $this->belongsTo(Departement::class, 'parent_id');
}

    public function children()
    
{
        return $this->hasMany(Departement::class, 'parent_id');
}
public function services()
{
    return $this->hasMany(Service::class);
}

}