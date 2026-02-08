<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\CnssDocumentResource;

class CnssOperationResource extends JsonResource
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
            'type_operation' => $this->type_operation,
            'date_operation' => optional($this->date_operation)->toDateString(),
            'reference' => $this->reference,
            'montant' => $this->montant,
            'statut' => $this->statut,
            'notes' => $this->notes,
            'documents_count' => (int) ($this->documents_count ?? 0),
            'documents' => CnssDocumentResource::collection($this->whenLoaded('documents')),
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => optional($this->created_at)->toDateTimeString(),
            'updated_at' => optional($this->updated_at)->toDateTimeString(),
        ];
    }
}
