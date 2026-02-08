<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CnssOperation extends Model
{
    use HasFactory;

    protected $table = 'cnss_operations';

    protected $fillable = [
        'employe_id',
        'type_operation',
        'date_operation',
        'reference',
        'montant',
        'statut',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date_operation' => 'date',
        'montant' => 'decimal:2',
    ];

    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function documents()
    {
        return $this->hasMany(CnssDocument::class, 'operation_id');
    }
}
