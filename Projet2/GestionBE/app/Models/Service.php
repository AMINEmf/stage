<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $table = 'gp_services';

    protected $fillable = [
        'nom',
        'departement_id',
    ];

    public function departement()
    {
        return $this->belongsTo(Departement::class, 'departement_id');
    }

    public function unites()
    {
        return $this->hasMany(Unite::class, 'service_id');
    }
}
