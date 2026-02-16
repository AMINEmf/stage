import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Button, Form, Table } from "react-bootstrap";
import Select from "react-dropdown-select";
import Swal from "sweetalert2";
import { Activity, Calendar, Save, X, ClipboardList, FileText, Upload } from "lucide-react";
import "../Employe/AddEmp.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const DEFAULT_TYPE_OPTIONS = [
  { label: "DEPOT_DOSSIER", value: "DEPOT_DOSSIER" },
  { label: "DECLARATION", value: "DECLARATION" },
  { label: "PAIEMENT", value: "PAIEMENT" },
  { label: "REGULARISATION", value: "REGULARISATION" },
  { label: "ATTESTATION", value: "ATTESTATION" },
  { label: "AUTRE", value: "AUTRE" },
];

function AddCnssOperation({ employeId, operation, mode = "add", typeOptions = [], onClose, onSaved }) {
  const [typeValue, setTypeValue] = useState([]);
  const [dateOperation, setDateOperation] = useState("");
  const [statut, setStatut] = useState("EN_COURS");
  const [reference, setReference] = useState("");
  const [montant, setMontant] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [localTypeOptions, setLocalTypeOptions] = useState([]);
  const [documentType, setDocumentType] = useState("");
  const [documentFiles, setDocumentFiles] = useState([]);
  const [operationDocuments, setOperationDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  useEffect(() => {
    const baseOptions = Array.isArray(typeOptions) ? typeOptions : [];
    setLocalTypeOptions(baseOptions);
  }, [typeOptions]);

  useEffect(() => {
    if (operation) {
      const option = operation.type_operation
        ? { label: operation.type_operation, value: operation.type_operation }
        : null;
      setTypeValue(option ? [option] : []);
      setDateOperation(operation.date_operation || "");
      setStatut(operation.statut || "EN_COURS");
      setReference(operation.reference || "");
      setMontant(operation.montant ?? "");
      setNotes(operation.notes || "");
      setDocumentType("");
      setDocumentFiles([]);
      return;
    }

    setTypeValue([]);
    setDateOperation("");
    setStatut("EN_COURS");
    setReference("");
    setMontant("");
    setNotes("");
    setDocumentType("");
    setDocumentFiles([]);
  }, [operation]);

  const typeOptionsWithCurrent = useMemo(() => {
    const baseOptions = localTypeOptions.length > 0 ? localTypeOptions : DEFAULT_TYPE_OPTIONS;
    const options = [...baseOptions];
    if (typeValue.length > 0) {
      const existing = options.find((opt) => opt.value === typeValue[0].value);
      if (!existing) {
        options.unshift(typeValue[0]);
      }
    }
    return options;
  }, [localTypeOptions, typeValue]);

  const fetchOperationDocuments = useCallback(async (operationId) => {
    if (!operationId) {
      setOperationDocuments([]);
      return;
    }

    setDocumentsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/cnss/operations/${operationId}`);
      const payload = response.data?.data ?? response.data;
      const docsPayload = payload?.documents?.data ?? payload?.documents ?? [];
      setOperationDocuments(Array.isArray(docsPayload) ? docsPayload : []);
    } catch (error) {
      console.error("Erreur lors du chargement des documents de l'operation:", error);
      setOperationDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (operation?.id) {
      fetchOperationDocuments(operation.id);
      return;
    }
    setOperationDocuments([]);
  }, [fetchOperationDocuments, operation]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (typeValue.length === 0) {
      Swal.fire("Erreur", "Veuillez sélectionner un type d'opération.", "warning");
      return;
    }

    setLoading(true);
    const payload = {
      type_operation: typeValue[0].value,
      date_operation: dateOperation,
      statut,
      reference: reference || null,
      montant: montant === "" ? null : Number(montant),
      notes: notes || null,
    };

    try {
      let savedOperationId = operation?.id || null;

      if (isEditMode && operation) {
        const response = await axios.put(`${API_BASE}/api/cnss/operations/${operation.id}`, payload);
        const payloadData = response.data?.data ?? response.data;
        savedOperationId = payloadData?.id ?? operation.id;
        Swal.fire("Succès", "Opération CNSS mise à jour.", "success");
      } else {
        const response = await axios.post(`${API_BASE}/api/cnss/dossiers/${employeId}/operations`, payload);
        const payloadData = response.data?.data ?? response.data;
        savedOperationId = payloadData?.id ?? savedOperationId;
        Swal.fire("Succès", "Opération CNSS ajoutée.", "success");
      }

      if (savedOperationId && documentFiles.length > 0) {
        await Promise.all(
          documentFiles.map((file) => {
            const formData = new FormData();
            formData.append("document", file);
            if (documentType) {
              formData.append("document_type", documentType);
            }
            return axios.post(`${API_BASE}/api/cnss/operations/${savedOperationId}/documents`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          })
        );
        await fetchOperationDocuments(savedOperationId);
      }

      if (onSaved) onSaved();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'opération:", error);
      Swal.fire("Erreur", "Impossible d'enregistrer l'opération.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(async (doc) => {
    try {
      const response = await axios.get(`${API_BASE}/api/cnss/documents/${doc.id}/download`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: doc.mime_type }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", doc.original_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      Swal.fire("Erreur", "Impossible de télécharger le document.", "error");
    }
  }, []);

  const handleDeleteDocument = useCallback(
    async (doc) => {
      const result = await Swal.fire({
        title: "Êtes-vous sûr ?",
        text: "Ce document sera supprimé.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, supprimer",
        cancelButtonText: "Annuler",
      });

      if (!result.isConfirmed) return;

      try {
        await axios.delete(`${API_BASE}/api/cnss/documents/${doc.id}`);
        Swal.fire("Supprimé", "Le document a été supprimé.", "success");
        if (operation?.id) {
          await fetchOperationDocuments(operation.id);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du document:", error);
        Swal.fire("Erreur", "Impossible de supprimer le document.", "error");
      }
    },
    [fetchOperationDocuments, operation]
  );

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  return (
    <>
      <style>
        {`
          .side-panel-container {
            position: absolute !important;
            top: 0; 
            left: 0; 
            width: 100%;
            height: 100% !important;
            animation: fadeIn 0.3s ease-out;
            background: white;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            box-shadow: none;
            border-radius: 0;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .form-header {
            padding: 16px 24px;
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .form-header h3 {
            margin: 0;
            font-size: 18px;
            color: #2c767c;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .form-body {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
          }
          .form-body::-webkit-scrollbar { width: 6px; }
          .form-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          .form-footer {
            padding: 16px 24px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }
          .form-control, .form-select, .form-control-select {
             font-size: 14px;
             color: #334155;
             border-color: #cbd5e1;
          }
          .form-control:focus, .form-select:focus {
            border-color: #2c767c;
            box-shadow: 0 0 0 0.2rem rgba(44, 118, 124, 0.25);
          }
          .form-label {
            font-size: 13px;
            font-weight: 700;
            color: #475569;
            margin-bottom: 6px;
          }
          .section-title {
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 20px;
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 8px;
          }
        `}
      </style>

      <div className="side-panel-container" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h3>
            <Activity size={20} />
            {isViewMode ? "Détails de l'opération" : isEditMode ? "Modifier opération" : "Nouvelle opération"}
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div className="form-body">
          <Form onSubmit={handleSubmit} id="operationForm">
            <div className="section-title">
              <ClipboardList size={16} />
              <span>Détails de l'opération</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Type d'opération <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={typeOptionsWithCurrent}
                    values={typeValue}
                    onChange={(values) => {
                      setTypeValue(values.length > 0 ? [values[0]] : []);
                    }}
                    placeholder="Choisir ou saisir un type…"
                    searchable={true}
                    clearable={false}
                    create={true}
                    onCreateNew={(item) => {
                      const newOption = { label: item, value: item };
                      setLocalTypeOptions((prev) => [newOption, ...prev]);
                      setTypeValue([newOption]);
                    }}
                    disabled={isViewMode}
                    dropdownPosition="bottom"
                    className="form-control-select"
                    style={{
                      padding: "6px 10px",
                      borderRadius: "0.375rem",
                      border: "1px solid #dee2e6",
                      minHeight: "38px",
                      fontSize: "14px",
                    }}
                  />
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ opacity: 0, height: 0, position: "absolute" }}
                    value={typeValue.length > 0 ? typeValue[0].value : ""}
                    onChange={() => { }}
                    required
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Date d'opération <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={dateOperation}
                    onChange={(event) => setDateOperation(event.target.value)}
                    required
                    disabled={isViewMode}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Statut <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={statut}
                    onChange={(event) => setStatut(event.target.value)}
                    required
                    disabled={isViewMode}
                  >
                    <option value="EN_COURS">EN_COURS</option>
                    <option value="TERMINEE">TERMINEE</option>
                    <option value="ANNULEE">ANNULEE</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="section-title">
              <Calendar size={16} />
              <span>Référence & Montant</span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Référence</Form.Label>
                  <Form.Control
                    type="text"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    disabled={isViewMode}
                    placeholder="Ex: REF-2024"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Montant</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={montant}
                    onChange={(event) => setMontant(event.target.value)}
                    disabled={isViewMode}
                    placeholder="0.00 MAD"
                  />
                </Form.Group>
              </div>

              <div className="col-md-12 mt-2">
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    disabled={isViewMode}
                    placeholder="Observations éventuelles..."
                  />
                </Form.Group>
              </div>
            </div>

            <div className="section-title">
              <Upload size={16} />
              <span>Documents liés</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Choisir des fichiers</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={(event) => setDocumentFiles(Array.from(event.target.files || []))}
                    disabled={isViewMode}
                    style={{ padding: "8px" }}
                  />
                  {!documentFiles.length && (
                    <Form.Text className="text-muted">Aucun fichier n’a été sélectionné</Form.Text>
                  )}
                  <Form.Text className="text-muted">Format PDF ou image recommandé.</Form.Text>
                </Form.Group>
              </div>
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Type de document</Form.Label>
                  <Form.Control
                    type="text"
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    disabled={isViewMode}
                    placeholder="Ex: Attestation, Reçu..."
                  />
                </Form.Group>
              </div>
            </div>

            {operation?.id && (
              <div className="mb-3">
                <div className="section-title">
                  <FileText size={16} />
                  <span>Documents de l'opération</span>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead style={{ backgroundColor: "#f8fafc" }}>
                      <tr>
                        <th style={{ color: "#2c767c", fontWeight: 700 }}>Fichier</th>
                        <th style={{ color: "#2c767c", fontWeight: 700 }}>Type</th>
                        <th style={{ color: "#2c767c", fontWeight: 700 }}>Date</th>
                        <th style={{ color: "#2c767c", fontWeight: 700 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentsLoading ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            Chargement des documents...
                          </td>
                        </tr>
                      ) : operationDocuments.length > 0 ? (
                        operationDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td>{doc.original_name || "-"}</td>
                            <td>{doc.document_type || "-"}</td>
                            <td>{doc.created_at || "-"}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button variant="outline-secondary" size="sm" onClick={() => handleDownload(doc)}>
                                  Télécharger
                                </Button>
                                {!isViewMode && (
                                  <Button variant="outline-danger" size="sm" onClick={() => handleDeleteDocument(doc)}>
                                    Supprimer
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            Aucun document pour cette opération.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </Form>
        </div>

        <div className="form-footer">
          <Button
            variant="outline-secondary"
            onClick={handleClose}
            className="px-4"
            style={{ borderColor: "#cbd5e1" }}
          >
            {isViewMode ? "Fermer" : "Annuler"}
          </Button>
          {!isViewMode && (
            <Button
              variant="primary"
              type="submit"
              form="operationForm"
              disabled={loading}
              className="px-4 d-flex align-items-center"
              style={{ backgroundColor: "#2c767c", borderColor: "#2c767c" }}
            >
              <Save size={16} className="me-2" />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export default AddCnssOperation;