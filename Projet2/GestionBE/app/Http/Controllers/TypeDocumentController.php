<?php

namespace App\Http\Controllers;

use App\Models\TypeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TypeDocumentController extends Controller
{
    private function resolveInputLabel(Request $request): ?string
    {
        $label = $request->input('label', $request->input('name'));
        if ($label === null) {
            return null;
        }

        $label = trim((string) $label);
        return $label === '' ? null : $label;
    }

    private function findByIdOrLabel(string $identifier): ?TypeDocument
    {
        $normalized = trim($identifier);

        if ($normalized !== '' && ctype_digit($normalized)) {
            $byId = TypeDocument::find((int) $normalized);
            if ($byId) {
                return $byId;
            }
        }

        return TypeDocument::where('label', $normalized)->first();
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $types = TypeDocument::all();
        return response()->json($types);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $label = $this->resolveInputLabel($request);

        $validator = Validator::make($request->all(), [
            'label' => 'nullable|string|max:255|unique:type_documents,label',
            'name' => 'nullable|string|max:255|unique:type_documents,label',
        ]);

        if ($validator->fails() || !$label) {
            $errors = $validator->errors();
            if (!$label && !$errors->has('label') && !$errors->has('name')) {
                $errors->add('name', 'The name field is required.');
            }

            return response()->json(['errors' => $errors], 422);
        }

        $type = TypeDocument::create([
            'label' => $label,
        ]);

        return response()->json($type, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $type = $this->findByIdOrLabel($id);

        if (!$type) {
            return response()->json(['message' => 'Type document not found'], 404);
        }

        return response()->json($type);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $type = $this->findByIdOrLabel($id);

        if (!$type) {
            return response()->json(['message' => 'Type document not found'], 404);
        }

        $label = $this->resolveInputLabel($request);

        $validator = Validator::make($request->all(), [
            'label' => 'nullable|string|max:255|unique:type_documents,label,' . $type->id,
            'name' => 'nullable|string|max:255|unique:type_documents,label,' . $type->id,
        ]);

        if ($validator->fails() || !$label) {
            $errors = $validator->errors();
            if (!$label && !$errors->has('label') && !$errors->has('name')) {
                $errors->add('name', 'The name field is required.');
            }

            return response()->json(['errors' => $errors], 422);  
        }

        $type->update([
            'label' => $label,
        ]);

        return response()->json($type);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $type = $this->findByIdOrLabel($id);

        if (!$type) {
            return response()->json(['message' => 'Type document not found'], 404);
        }

        $type->delete();

        return response()->json(['message' => 'Type document deleted successfully']);
    }
}
