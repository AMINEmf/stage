<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CnssDocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employe_id' => $this->employe_id,
            'operation_id' => $this->operation_id,
            'original_name' => $this->original_name,
            'stored_name' => $this->stored_name,
            'mime_type' => $this->mime_type,
            'size' => (int) $this->size,
            'document_type' => $this->document_type,
            'uploaded_by' => $this->uploaded_by,
            'created_at' => optional($this->created_at)->toDateTimeString(),
        ];
    }
}
