<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CnssDocument extends Model
{
    use HasFactory;

    protected $table = 'cnss_documents';

    protected $fillable = [
        'employe_id',
        'operation_id',
        'original_name',
        'stored_name',
        'mime_type',
        'size',
        'document_type',
        'uploaded_by',
    ];

    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }

    public function operation()
    {
        return $this->belongsTo(CnssOperation::class, 'operation_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
