<?php

// app/Models/EmployeeHistory.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\EmployeeHistory;
use App\Models\Departement;

class EmployeeHistory extends Model
{
    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'departement_id',
        'departement_nom',
        'employe_id',
        'date_début',
        'date_fin',
        'action', 
        
    ];

    public function employe()
    {
        return $this->belongsTo(Employe::class);
    }

    public function departement()
    {
        return $this->belongsTo(Departement::class, 'departement_id');
    }
}