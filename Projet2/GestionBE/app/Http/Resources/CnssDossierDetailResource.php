<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CnssDossierDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'employe' => $this['employe'],
            'departement' => $this['departement'],
            'affiliation_cnss' => $this['affiliation_cnss'],
            'declarations' => $this['declarations'],
            'documents' => CnssDocumentResource::collection($this['documents'] ?? []),
            'operations' => $this['operations'] ?? [],
        ];
    }
}
