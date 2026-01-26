<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class EmployeDepartement extends Pivot
{
    protected $table = 'employe_departement';

    protected $fillable = [
        'employe_id',
        'departement_id',
        'date_début',
        'date_fin'
    ];
    public $timestamps = true;

    public function employe()
    {
        return $this->belongsTo(employe::class, 'employe_id', 'id');
    }

    public function departement()
    {
        return $this->belongsTo(departement::class, 'departement_id', 'id');
    }
}