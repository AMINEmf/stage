<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class JourFeries extends Model
{
    protected $fillable = [
        'date', 
        'designation', 
        'type', 
        'taux', 
        'categorie', 
        'duree',
        'fix',
        'fix_day',
        'fix_month'
    ];

    protected $casts = [
        'date' => 'date',
        'duree' => 'datetime:H:i',
        'fix' => 'boolean',
        'fix_day' => 'integer',
        'fix_month' => 'integer'
    ];

    public static function getTypeOptions()
    {
        return [
            'paye' => 'Férié Payé',
            'non_paye' => 'Férié Non Payé'
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            if ($model->fix && $model->fix_day && $model->fix_month) {
                $currentYear = Carbon::now()->year;
                $model->date = Carbon::create($currentYear, $model->fix_month, $model->fix_day)->format('Y-m-d');
            }
        });
    }
}