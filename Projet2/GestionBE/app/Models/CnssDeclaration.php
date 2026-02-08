<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CnssDeclaration extends Model
{
    use HasFactory;

    protected $table = 'declarations_cnss';

    protected $fillable = [
        'mois',
        'annee',
        'montant_total',
        'statut',
    ];

    protected $casts = [
        'mois' => 'integer',
        'annee' => 'integer',
        'montant_total' => 'decimal:2',
    ];

    public function details()
    {
        return $this->hasMany(CnssDeclarationDetail::class, 'declaration_cnss_id');
    }
}
