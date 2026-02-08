<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCnssOperationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type_operation' => 'required|string|max:255',
            'date_operation' => 'required|date',
            'statut' => 'required|in:EN_COURS,TERMINEE,ANNULEE',
            'reference' => 'nullable|string|max:255',
            'montant' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ];
    }
}
