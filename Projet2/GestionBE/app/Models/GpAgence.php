<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GpAgence extends Model
{
    use HasFactory;

    protected $table = 'gp_agences';

    protected $fillable = [
        'nom',
        'banque_id',
    ];

    public function banque()
    {
        return $this->belongsTo(GpBanque::class, 'banque_id');
    }

    public function comptesBancaires()
    {
        return $this->hasMany(GpCompteBancaire::class, 'agence_id');
    }
}
