<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RegleCompensation extends Model
{
    use HasFactory;

    protected $fillable = [
        'description',
        'frequence_calcul',
        'plafond_hn'
    ];
    
    protected $table = 'regle_compensation'; // Specify the table name if it doesn't follow convention
    /**
     * Define the relationship with DetailsRegle.
     */
    public function detailsRegles()
    {
        return $this->hasMany(DetailsRegle::class);
    }

    public function gpReglesEmployes()
    {
        return $this->hasMany(GpRegleEmploye::class, 'regle_id');
    }

}