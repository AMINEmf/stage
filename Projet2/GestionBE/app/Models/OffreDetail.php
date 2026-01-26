<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OffreDetail extends Model
{
    use HasFactory;
    protected $guarded = [];

    public function offre()
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id');
    }

    public function produit()
    {
        return $this->belongsTo(Produit::class, 'produit_id', 'id');
    }
}
// namespace App\Models;

// use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Illuminate\Database\Eloquent\Model;

// class OffreDetail extends Model
// {
//     use HasFactory;
//     protected $guarded = [];

//     public function offre()
//     {
//         return $this->belongsTo(Offre::class, 'id_offre', 'id');
//     }
// }
