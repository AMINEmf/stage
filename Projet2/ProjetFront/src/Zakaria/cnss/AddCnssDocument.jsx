import React, { useState, useCallback } from "react";
import axios from "axios";
import { Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { Activity, Save, X, FileText, Upload } from "lucide-react";
import "../Employe/AddEmp.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

function AddCnssDocument({ employeId, onClose, onSaved }) {
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      Swal.fire("Erreur", "Veuillez sélectionner un fichier.", "warning");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("document", file);
    if (documentType) {
      formData.append("document_type", documentType);
    }

    try {
      await axios.post(`${API_BASE}/api/cnss/dossiers/${employeId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire("Succès", "Document ajouté avec succès.", "success");
      if (onSaved) onSaved();
    } catch (error) {
      console.error("Erreur lors de l'ajout du document:", error);
      Swal.fire("Erreur", "Impossible d'ajouter le document.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  return (
    <>
      <style>
        {`
          .side-panel-container {
            position: fixed !important;
            top: 9.4%; 
            left: 60%; 
            width: 41%;
            height: calc(100vh - 160px) !important;
            animation: slideInAccident 0.3s ease-out;
            background: white;
            z-index: 1100;
            display: flex;
            flex-direction: column;
            box-shadow: -5px 0 15px rgba(0,0,0,0.1);
            border-radius: 8px 0 0 8px;
          }
          @keyframes slideInAccident {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .form-header {
            padding: 16px 24px;
            background-color: #f9fafb;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
          }
          .form-header h3 {
            margin: 0;
            font-size: 1.15rem;
            color: #4b5563;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
          }
          .form-body {
            flex-grow: 1;
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
          .form-control {
             font-size: 14px;
             color: #334155;
             border-color: #cbd5e1;
          }
          .form-control:focus {
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
        {/* HEADER */}
        <div className="form-header">
          <h3>
            <Activity size={20} />
            Ajouter un document
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              position: "absolute",
              right: "16px",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="form-body">
          <Form onSubmit={handleSubmit} id="documentForm">

            {/* SECTION: FICHIER */}
            <div className="section-title">
              <Upload size={16} />
              <span>Sélection du fichier</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Fichier <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    required
                    style={{ padding: "8px" }}
                  />
                  <Form.Text className="text-muted">Format PDF ou Image recommandé.</Form.Text>
                </Form.Group>
              </div>
            </div>

            {/* SECTION: DETAILS */}
            <div className="section-title">
              <FileText size={16} />
              <span>Détails du document</span>
            </div>

            <div className="row g-3">
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Type de document</Form.Label>
                  <Form.Control
                    type="text"
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    placeholder="Ex: Attestation, Reçu..."
                  />
                </Form.Group>
              </div>
            </div>

          </Form>
        </div>

        {/* FOOTER */}
        <div className="form-footer">
          <Button
            variant="outline-secondary"
            onClick={handleClose}
            className="px-4"
            style={{ borderColor: "#cbd5e1" }}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="documentForm"
            disabled={loading}
            className="px-4 d-flex align-items-center"
            style={{ backgroundColor: "#2c767c", borderColor: "#2c767c" }}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </>
  );
}

export default AddCnssDocument;
