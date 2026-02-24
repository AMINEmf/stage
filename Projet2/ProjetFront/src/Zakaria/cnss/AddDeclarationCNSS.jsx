import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Button, Form, Tabs, Tab } from "react-bootstrap";
import Swal from "sweetalert2";
import { Activity, User, Calendar, Save, X } from "lucide-react";
import EmployeeSelector from "./EmployeeSelector";
import "../Employe/AddEmp.css";

const CNSS_RATE = 0.25;

const getCurrentYear = () => new Date().getFullYear();

const formatCurrency = (value) => {
  const parsedValue = Number(value ?? 0);
  if (!Number.isFinite(parsedValue)) return "-";
  return `${parsedValue.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`;
};

function AddDeclarationCNSS({ toggleDeclarationForm, onDeclarationSaved = () => { }, selectedDeclaration = null }) {
  const [mois, setMois] = useState("");
  const [annee, setAnnee] = useState(String(getCurrentYear()));
  const [statut, setStatut] = useState("EN_ATTENTE");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingDeclaration, setLoadingDeclaration] = useState(false);
  const [editingDeclarationData, setEditingDeclarationData] = useState(null);
  const [saving, setSaving] = useState(false);

  const isEditMode = Boolean(selectedDeclaration?.id);
  const declarationSource = editingDeclarationData || selectedDeclaration;

  const resetForm = useCallback(() => {
    setMois("");
    setAnnee(String(getCurrentYear()));
    setStatut("EN_ATTENTE");
    setSelectedEmployees([]);
    setEligibleEmployees([]);
    setLoadingDeclaration(false);
    setEditingDeclarationData(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    toggleDeclarationForm();
  }, [resetForm, toggleDeclarationForm]);

  const fetchEligibleEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const params = {};
      if (mois) params.mois = Number(mois);
      if (annee) params.annee = Number(annee);
      const response = await axios.get("http://127.0.0.1:8000/api/cnss/declarations/eligible-employees", { params });
      const employeesData = Array.isArray(response.data) ? response.data : [];
      setEligibleEmployees(employeesData);
    } catch (error) {
      console.error("Erreur lors du chargement des employes eligibles:", error);
      Swal.fire("Erreur", "Impossible de charger les employes affilies CNSS.", "error");
      setEligibleEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [mois, annee]);

  useEffect(() => {
    fetchEligibleEmployees();
  }, [fetchEligibleEmployees]);

  useEffect(() => {
    let cancelled = false;

    if (!isEditMode) {
      setLoadingDeclaration(false);
      setEditingDeclarationData(null);
      return () => {
        cancelled = true;
      };
    }

    if (Array.isArray(selectedDeclaration?.details)) {
      setEditingDeclarationData(selectedDeclaration);
      return () => {
        cancelled = true;
      };
    }

    const fetchDeclarationForEdit = async () => {
      setLoadingDeclaration(true);
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/cnss/declarations/${selectedDeclaration.id}`
        );
        if (!cancelled) {
          setEditingDeclarationData(response.data || selectedDeclaration);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la declaration pour edition:", error);
        if (!cancelled) {
          Swal.fire("Erreur", "Impossible de charger les details de la declaration.", "error");
          setEditingDeclarationData(selectedDeclaration);
        }
      } finally {
        if (!cancelled) {
          setLoadingDeclaration(false);
        }
      }
    };

    fetchDeclarationForEdit();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, selectedDeclaration]);

  useEffect(() => {
    if (!isEditMode) {
      setMois("");
      setAnnee(String(getCurrentYear()));
      setStatut("EN_ATTENTE");
      setSelectedEmployees([]);
      return;
    }

    setMois(String(declarationSource?.mois ?? ""));
    setAnnee(String(declarationSource?.annee ?? getCurrentYear()));
    setStatut(declarationSource?.statut || "EN_ATTENTE");
  }, [isEditMode, declarationSource]);

  useEffect(() => {
    if (!isEditMode || !Array.isArray(declarationSource?.details)) {
      return;
    }

    const selectedIds = new Set(declarationSource.details.map((detail) => String(detail.employe_id)));
    const initialSelected = eligibleEmployees.filter((emp) => selectedIds.has(String(emp.id)));
    setSelectedEmployees(initialSelected);
  }, [isEditMode, declarationSource, eligibleEmployees]);

  const masseSalariale = useMemo(
    () =>
      selectedEmployees.reduce((sum, employee) => {
        return sum + Number(employee.salaire || 0);
      }, 0),
    [selectedEmployees]
  );

  const montantTotal = useMemo(() => masseSalariale * CNSS_RATE, [masseSalariale]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!mois || !annee || !statut || selectedEmployees.length === 0) {
      Swal.fire("Attention", "Veuillez choisir le mois, l'annee, le statut et au moins un employe.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        mois: Number(mois),
        annee: Number(annee),
        statut,
        employe_ids: selectedEmployees.map((employee) => employee.id),
      };

      if (isEditMode) {
        await axios.put(`http://127.0.0.1:8000/api/cnss/declarations/${selectedDeclaration.id}`, payload);
        Swal.fire("Succes", "Declaration CNSS mise a jour avec succes.", "success");
      } else {
        await axios.post("http://127.0.0.1:8000/api/cnss/declarations", payload);
        Swal.fire("Succes", "Declaration CNSS ajoutee avec succes.", "success");
      }

      await onDeclarationSaved();
      handleClose();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la declaration CNSS:", error);

      if (error.response?.status === 409) {
        Swal.fire("Attention", "Une declaration existe deja pour ce mois et cette annee.", "warning");
      } else {
        Swal.fire("Erreur", error.response?.data?.message || "Une erreur est survenue.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>
        {`
          .side-panel-container {
            background: white;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          
          .with-split-view .side-panel-container {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
            animation: none !important;
            border-radius: 0 !important;
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
            justify-content: center;
            gap: 12px;
          }
          /* Custom Input Styles */
          .form-control, .form-select {
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
          /* Section Titles */
          .form-section-title {
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

      {/* Overlay removed to keep table visible */}

      <div className="side-panel-container" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="form-header">
          <h3>
            
            {isEditMode ? "Modifier Déclaration" : "Nouvelle Déclaration"}
          </h3>
          <button
            onClick={handleClose}
            style={{
              position: "absolute",
              right: "16px",
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

        {/* BODY */}
        <div className="form-body">
          <Form onSubmit={handleSubmit} id="declarationForm">

            {/* SECTION 1: INFORMATIONS GENERALES */}
            <div className="form-section-title">
              <Calendar size={16} />
              <span>Informations Générales</span>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Mois <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={mois} onChange={(e) => setMois(e.target.value)} required>
                    <option value="">Sélectionner</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Année <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min={2000}
                    max={2100}
                    value={annee}
                    onChange={(e) => setAnnee(e.target.value)}
                    required
                  />
                </Form.Group>
              </div>

              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Statut <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={statut} onChange={(e) => setStatut(e.target.value)} required>
                    <option value="EN_ATTENTE">EN_ATTENTE</option>
                    <option value="DECLARE">DECLARE</option>
                    <option value="PAYE">PAYE</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            {/* SECTION 2: EMPLOYES */}
            <div className="form-section-title">
              <User size={16} />
              <span>Employés & Cotisations</span>
            </div>

            <div className="row g-3">
              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Employés affiliés (Actifs) <span className="text-danger">*</span></Form.Label>
                  <EmployeeSelector
                    employees={eligibleEmployees}
                    selectedEmployees={selectedEmployees}
                    onChange={setSelectedEmployees}
                    isLoading={loadingEmployees || loadingDeclaration}
                  />
                  {eligibleEmployees.length === 0 && !loadingEmployees && (
                    <Form.Text className="text-muted d-block mt-1">
                      Aucun employé éligible trouvé.
                    </Form.Text>
                  )}
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Masse salariale</Form.Label>
                  <Form.Control type="text" value={formatCurrency(masseSalariale)} readOnly style={{ backgroundColor: "#f1f5f9" }} />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Montant CNSS</Form.Label>
                  <Form.Control
                    type="text"
                    value={formatCurrency(montantTotal)}
                    readOnly
                    style={{ backgroundColor: "#f1f5f9", color: "#2c767c", fontWeight: "bold" }}
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
            style={{ backgroundColor: "#2c767c", borderColor: "#2c767c", color: "#fff" }}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="declarationForm"
            disabled={saving || loadingEmployees || loadingDeclaration || eligibleEmployees.length === 0}
            className="px-4 d-flex align-items-center"
            style={{ backgroundColor: "#2c767c", borderColor: "#2c767c" }}
          >
            {saving ? "Enregistrement..." : isEditMode ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </>
  );
}

export default AddDeclarationCNSS;
