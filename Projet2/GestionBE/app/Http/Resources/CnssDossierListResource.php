<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CnssDossierListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $lastDeclaration = null;
        if ($this->last_declaration_mois && $this->last_declaration_annee) {
            $lastDeclaration = [
                'mois' => (int) $this->last_declaration_mois,
                'annee' => (int) $this->last_declaration_annee,
                'statut' => $this->last_declaration_statut,
            ];
        }

        return [
            'id' => (int) $this->id,
            'matricule' => $this->matricule,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'numero_adherent' => $this->numero_adherent,
            'operations_count' => (int) ($this->operations_count ?? 0),
            'departement' => [
                'id' => $this->departement_id,
                'label' => $this->departement_label,
            ],
            'cnss_affiliation_status' => $this->cnss_affiliation_status ?? 'Aucun',
            'last_declaration' => $lastDeclaration,
        ];
    }
}
