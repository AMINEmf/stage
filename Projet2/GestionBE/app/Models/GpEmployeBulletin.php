<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GpEmployeBulletin extends Model
{
    use HasFactory;

    protected $table = 'gp_employe_bulletins';

    protected $fillable = [
        'employe_id',
        'bulletin_modele_id',
        'date_debut',
        'date_fin',
    ];

    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }

    public function modele()
    {
        return $this->belongsTo(BultinModel::class, 'bulletin_modele_id');
    }
}
