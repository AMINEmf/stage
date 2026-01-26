<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GpBanque extends Model
{
    use HasFactory;

    protected $table = 'gp_banques';

    protected $fillable = [
        'nom',
    ];

    public function agences()
    {
        return $this->hasMany(GpAgence::class, 'banque_id');
    }
}
