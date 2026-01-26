<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Calendrie extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
    ];



    public function employesCalendriers()
    {
        return $this->hasMany(GpCalendrierEmploye::class, 'calendrier_id');
    }

}
