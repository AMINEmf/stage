<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Autorisation extends Model
{
    use HasFactory;
    protected $fillable = [
        'autorisation_onas',
        'date_autorisation',
        'date_expiration',
        'date_alerte',
        'vehicule_id',
    ];
    
    public function vehicule()
    {
        return $this->belongsTo(Vehicule::class);
    }
}
