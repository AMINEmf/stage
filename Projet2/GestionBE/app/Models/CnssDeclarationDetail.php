<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CnssDeclarationDetail extends Model
{
    use HasFactory;

    protected $table = 'details_declaration_cnss';

    protected $fillable = [
        'declaration_cnss_id',
        'employe_id',
        'affiliation_cnss_id',
    ];

    public function declaration()
    {
        return $this->belongsTo(CnssDeclaration::class, 'declaration_cnss_id');
    }

    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }

    public function affiliation()
    {
        return $this->belongsTo(CnssAffiliation::class, 'affiliation_cnss_id');
    }
}
