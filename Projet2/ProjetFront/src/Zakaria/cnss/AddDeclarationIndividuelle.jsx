import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { ClipboardList, Save, X, User } from "lucide-react";
import "../Employe/AddEmp.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const MOIS_LABELS = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function calculerCotisations(salaire) {
  const s = parseFloat(salaire) || 0;
  const plafond = 6000;
  const basePlafonnee = Math.min(s, plafond);
  const cotisationSalarie = (basePlafonnee * 0.0429) + (s * 0.0226);
  const cotisationPatronale = (basePlafonnee * 0.0898) + (s * 0.1211);
  return {
    basePlafonnee: basePlafonnee.toFixed(2),
    cotisationSalarie: cotisationSalarie.toFixed(2),
    cotisationPatronale: cotisationPatronale.toFixed(2),
  };
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

function AddDeclarationIndividuelle({ employe, declaration, mode = "add", onClose, onSaved }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(currentYear);
  const [joursTravailles, setJoursTravailles] = useState(26);
  const [salaireBrut, setSalaireBrut] = useState("");
  const [statut, setStatut] = useState("non_declare");
  const [loading, setLoading] = useState(false);
  const [calc, setCalc] = useState({ basePlafonnee: "0.00", cotisationSalarie: "0.00", cotisationPatronale: "0.00" });

  useEffect(() => {
    if (declaration && (isEdit || isView)) {
      setMois(declaration.mois);
      setAnnee(declaration.annee);
      setJoursTravailles(declaration.jours_travailles ?? 26);
      setSalaireBrut(String(declaration.salaire_brut_imposable ?? ""));
      setStatut(declaration.statut ?? "non_declare");
    } else if (employe) {
      setSalaireBrut(String(employe.salaire_base ?? ""));
    }
  }, [declaration, employe, isEdit, isView]);

  useEffect(() => {
    setCalc(calculerCotisations(salaireBrut));
  }, [salaireBrut]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      employe_id: employe.id,
      mois: parseInt(mois),
      annee: parseInt(annee),
      jours_travailles: parseInt(joursTravailles),
      salaire_brut_imposable: parseFloat(salaireBrut) || 0,
      statut,
    };

    try {
      if (isEdit && declaration) {
        await axios.put(`${API_BASE}/api/cnss/declarations-individuelles/${declaration.id}`, payload);
        Swal.fire("Succès", "Déclaration mise à jour avec succès.", "success");
      } else {
        await axios.post(`${API_BASE}/api/cnss/declarations-individuelles`, payload);
        Swal.fire("Succès", "Déclaration ajoutée avec succès.", "success");
      }
      if (onSaved) onSaved();
    } catch (error) {
      const msg = error.response?.data?.message || "Impossible d'enregistrer la déclaration.";
      Swal.fire("Erreur", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => { if (onClose) onClose(); }, [onClose]);

  return (
    <>
      <style>{`
        .side-panel-container {
          position: absolute !important;
          top: 0; left: 0;
          width: 100%; height: 100% !important;
          animation: fadeIn 0.3s ease-out;
          background: white;
          z-index: 1000;
          display: flex; flex-direction: column;
          box-shadow: none; border-radius: 0;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .form-header {
          padding: 16px 24px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e9ecef;
          display: flex; justify-content: center; align-items: center;
          position: relative;
        }
        .form-header h3 {
          margin: 0; font-size: 1.15rem;
          color: #4b5563; font-weight: 600;
          display: flex; align-items: center; gap: 10px; justify-content: center;
        }
        .form-body { flex: 1; overflow-y: auto; padding: 24px; }
        .form-body::-webkit-scrollbar { width: 6px; }
        .form-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .form-footer {
          padding: 16px 24px;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex; justify-content: center; gap: 12px;
        }
        .form-control, .form-select {
          font-size: 14px; color: #334155; border-color: #cbd5e1;
        }
        .form-control:focus, .form-select:focus {
          border-color: #2c767c;
          box-shadow: 0 0 0 0.2rem rgba(44,118,124,0.25);
        }
        .form-label { font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px; }
        .section-title {
          color: #64748b; font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 20px; margin-top: 10px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;
        }
        .readonly-field {
          background-color: #f8fafc !important;
          color: #64748b !important; font-weight: 600;
        }
        .calc-card {
          background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
          border: 1px solid #a7f3d0;
          border-radius: 8px; padding: 16px; margin-top: 8px;
        }
        .calc-card .calc-row {
          display: flex; justify-content: space-between;
          align-items: center; padding: 6px 0;
          border-bottom: 1px solid #d1fae5;
        }
        .calc-card .calc-row:last-child { border-bottom: none; }
        .calc-card .calc-label { font-size: 13px; color: #374151; }
        .calc-card .calc-value { font-size: 14px; font-weight: 700; color: #065f46; }
      `}</style>

      <div className="side-panel-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="form-header">
          <h3>
            <ClipboardList size={20} />
            {isView ? "Détails déclaration" : isEdit ? "Modifier déclaration" : "Nouvelle déclaration CNSS"}
          </h3>
          <button onClick={handleClose} style={{ position: "absolute", right: "16px", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="form-body">
          <Form onSubmit={handleSubmit} id="decl-form">

            {/* Bloc employé (readonly) */}
            <div className="section-title">
              <User size={16} />
              <span>Informations employé</span>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Matricule</Form.Label>
                  <Form.Control className="readonly-field" readOnly value={employe?.matricule ?? "-"} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>CIN</Form.Label>
                  <Form.Control className="readonly-field" readOnly value={employe?.cin ?? "-"} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Nom</Form.Label>
                  <Form.Control className="readonly-field" readOnly value={employe?.nom ?? "-"} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control className="readonly-field" readOnly value={employe?.prenom ?? "-"} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Département</Form.Label>
                  <Form.Control className="readonly-field" readOnly value={employe?.departement_nom ?? "-"} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Salaire base</Form.Label>
                  <Form.Control className="readonly-field" readOnly value={employe?.salaire_base != null ? `${Number(employe.salaire_base).toFixed(2)} MAD` : "-"} />
                </Form.Group>
              </div>
            </div>

            {/* Bloc saisie RH */}
            <div className="section-title">
              <ClipboardList size={16} />
              <span>Saisie déclaration</span>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Mois <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={mois} onChange={(e) => setMois(e.target.value)} required disabled={isView}>
                    {MOIS_LABELS.slice(1).map((label, i) => (
                      <option key={i + 1} value={i + 1}>{label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Année <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={annee} onChange={(e) => setAnnee(e.target.value)} required disabled={isView}>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Jours travaillés <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number" min={0} max={31} value={joursTravailles}
                    onChange={(e) => setJoursTravailles(e.target.value)}
                    required disabled={isView}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Statut</Form.Label>
                  <Form.Select value={statut} onChange={(e) => setStatut(e.target.value)} disabled={isView}>
                    <option value="non_declare">Non déclaré</option>
                    <option value="declare">Déclaré</option>
                    <option value="valide">Validé</option>
                    <option value="paye">Payé</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Salaire brut imposable <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number" min={0} step="0.01"
                    value={salaireBrut}
                    onChange={(e) => setSalaireBrut(e.target.value)}
                    required disabled={isView}
                    placeholder="Valeur pré-remplie depuis salaire base, modifiable"
                  />
                  <Form.Text className="text-muted">
                    Pré-rempli depuis le salaire de base. Modifiable pour absences, primes, retenues, etc.
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            {/* Calcul CNSS (readonly) */}
            <div className="section-title">
              <ClipboardList size={16} />
              <span>Calcul CNSS automatique</span>
            </div>
            <div className="calc-card">
              <div className="calc-row">
                <span className="calc-label">Base plafonnée CNSS (max 6 000 MAD)</span>
                <span className="calc-value">{calc.basePlafonnee} MAD</span>
              </div>
              <div className="calc-row">
                <span className="calc-label">Cotisation salarié (4.29% plafonné + 2.26% brut)</span>
                <span className="calc-value">{calc.cotisationSalarie} MAD</span>
              </div>
              <div className="calc-row">
                <span className="calc-label">Cotisation patronale (8.98% plafonné + 12.11% brut)</span>
                <span className="calc-value">{calc.cotisationPatronale} MAD</span>
              </div>
            </div>
          </Form>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <Button variant="outline-secondary" onClick={handleClose} className="px-4" style={{ backgroundColor: "#2c767c", borderColor: "#2c767c", color: "#fff" }}>
            {isView ? "Fermer" : "Annuler"}
          </Button>
          {!isView && (
            <Button
              type="submit" form="decl-form"
              disabled={loading}
              className="px-4 d-flex align-items-center"
              style={{ backgroundColor: "#2c767c", borderColor: "#2c767c" }}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export default AddDeclarationIndividuelle;
