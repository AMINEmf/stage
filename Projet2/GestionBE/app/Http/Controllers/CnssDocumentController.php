<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCnssDocumentRequest;
use App\Http\Resources\CnssDocumentResource;
use App\Models\CnssDocument;
use App\Models\CnssOperation;
use App\Models\Employe;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CnssDocumentController extends Controller
{
    public function store(StoreCnssDocumentRequest $request, $employeId)
    {
        Gate::authorize('update_employes');

        $employe = Employe::findOrFail($employeId);
        $request->validate([
            'operation_id' => 'required|exists:cnss_operations,id',
        ]);

        $operation = CnssOperation::findOrFail($request->input('operation_id'));
        if ((int) $operation->employe_id !== (int) $employe->id) {
            return response()->json([
                'message' => 'Operation invalide pour cet employe.',
            ], 422);
        }

        return $this->storeForOperation($request, $operation->id);
    }

    public function storeForOperation(StoreCnssDocumentRequest $request, $operationId)
    {
        Gate::authorize('update_employes');

        $operation = CnssOperation::findOrFail($operationId);
        $file = $request->file('document');

        $originalName = $file->getClientOriginalName();
        $storedFileName = Str::uuid()->toString() . '_' . $originalName;
        $storedPath = $file->storeAs('cnss-documents', $storedFileName);

        $document = CnssDocument::create([
            'employe_id' => $operation->employe_id,
            'operation_id' => $operation->id,
            'original_name' => $originalName,
            'stored_name' => $storedPath,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'document_type' => $request->input('document_type'),
            'uploaded_by' => $request->user()?->id,
        ]);

        return new CnssDocumentResource($document);
    }

    public function download($documentId)
    {
        Gate::authorize('view_all_employes');

        $document = CnssDocument::findOrFail($documentId);
        if (!Storage::exists($document->stored_name)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        return Storage::download($document->stored_name, $document->original_name, [
            'Content-Type' => $document->mime_type,
        ]);
    }

    public function destroy($documentId)
    {
        Gate::authorize('delete_employes');

        $document = CnssDocument::findOrFail($documentId);

        if (Storage::exists($document->stored_name)) {
            Storage::delete($document->stored_name);
        }

        $document->delete();

        return response()->json([
            'message' => 'Document CNSS supprimé avec succès',
        ], 200);
    }
}
