import React, { useEffect, useState } from "react";
import apiClient from "../../../services/apiClient";
import { useRef } from "react";
import Select from "react-select";
import { Form } from "react-bootstrap";
import { Box, Typography, IconButton, Button as MuiButton } from "@mui/material";
import { X, Calendar, MessageSquare, FileText, DollarSign, User, Plus, Info, CreditCard } from "lucide-react";
import { 
  showSuccessMessage, 
  showErrorMessage, 
  showErrorFromResponse, 
  showConfirmDialog, 
  showSuccessToast,
  STANDARD_MESSAGES 
} from "../../../utils/messageHelper";
import "../AffiliationMutuelle/AddAffiliationMutuelle.css";
import ManageResourceModal from "./ManageResourceModal";

const api = apiClient;

const DEFAULT_DOCUMENT_TYPE = "AUTRE";

const statutOptions = [
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Validée" },
  { value: "REMBOURSEE", label: "Remboursée" },
  { value: "ANNULEE", label: "Refusée" },
];

const beneficiaireTypeOptions = [
  { value: "EMPLOYE", label: "Employé" },
  { value: "CONJOINT", label: "Conjoint" },
  { value: "ENFANT", label: "Enfant" },
];

// Liste de secours si l'API ne retourne aucun type
const FALLBACK_OPERATION_TYPES = [
  { id: 'f1', label: 'Dépôt Dossier', necessite_montant: false },
  { id: 'f2', label: 'Remboursement', necessite_montant: true },
  { id: 'f3', label: 'Prise en Charge', necessite_montant: true },
  { id: 'f4', label: 'Réclamation', necessite_montant: false },
  { id: 'f5', label: 'Attestation', necessite_montant: false },
  { id: 'f6', label: 'Régularisation', necessite_montant: true },
  { id: 'f7', label: 'Autre', necessite_montant: false },
];

function AddMutuelleOperation({ employe, operation, dossierFixed, affiliationIdProposed, onClose, onSaved, isSidebar = false }) {
  const [formData, setFormData] = useState({
    affiliation_id: affiliationIdProposed || null,
    numero_dossier: dossierFixed || "",
    beneficiaire_type: "",
    beneficiaire_nom: "",
    date_operation: "",
    date_remboursement: "",
    type_operation: "",
    statut: "",
    montant_total: "",
    montant_rembourse: "",
    reste_a_charge: "",
    commentaire: "",
    lien_parente: "",
  });

  // State pour les documents existants (déjà sur le serveur)
  const [existingDocs, setExistingDocs] = useState([]);

  const [affiliationsList, setAffiliationsList] = useState([]);
  const [selectedAffiliation, setSelectedAffiliation] = useState(null);
  const [beneficiaireOptions, setBeneficiaireOptions] = useState(beneficiaireTypeOptions);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Documents liés
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentError, setDocumentError] = useState(null);
  const fileInputRef = useRef(null);
  const isInitialLoad = useRef(true);

  // ── Types d'opération dynamiques ──────────────────────────────────────
  const [operationTypes, setOperationTypes] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // requiresAmount : lu depuis le type sélectionné
  const requiresAmount = (() => {
    const found = operationTypes.find(t => t.label === formData.type_operation);
    return found ? Boolean(found.necessite_montant) : false;
  })();

  // Chargement initial des types depuis l'API
  const fetchOperationTypes = async (autoSelectLabel = null) => {
    try {
      const res = await api.get('/mutuelles/parametrage/types-operations');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      // Si l'API renvoie une liste vide, utiliser le fallback
      const list = rawList.length > 0 ? rawList : FALLBACK_OPERATION_TYPES;
      setOperationTypes(list);

      if (autoSelectLabel) {
        const found = list.find(t => t.label === autoSelectLabel);
        if (found) {
          setFormData(prev => ({ ...prev, type_operation: found.label }));
        }
      }
    } catch (err) {
      console.error('Erreur chargement types opération:', err);
      // En cas d’erreur réseau : utiliser le fallback
      setOperationTypes(FALLBACK_OPERATION_TYPES);
      if (autoSelectLabel) {
        // ne rien faire si erreur mais label demandé
      }
    }
  };

  useEffect(() => { fetchOperationTypes(); }, []);

  // Fonctions CRUD pour le ManageResourceModal
  const broadcastTypesUpdate = () => {
    window.dispatchEvent(new CustomEvent('operationTypesUpdated'));
  };

  const getTypesForModal = async () => {
    try {
      const res = await api.get('/mutuelles/parametrage/types-operations');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const list = rawList.length > 0 ? rawList : FALLBACK_OPERATION_TYPES;
      return list.map(t => ({
        id: t.id,
        label: t.label,
        nom: t.label,
        necessite_montant: t.necessite_montant
      }));
    } catch (err) {
      console.error('Erreur modal types:', err);
      return FALLBACK_OPERATION_TYPES.map(t => ({
        id: t.id,
        label: t.label,
        nom: t.label,
        necessite_montant: t.necessite_montant
      }));
    }
  };

  const addTypeOperation = async (data) => {
    // data peut être une string (mode simple) ou un objet (mode multi-field)
    const label = typeof data === 'string' ? data : (data.label || data.nom || '');
    const necessite_montant = typeof data === 'object' ? Boolean(data.necessite_montant) : false;
    const res = await api.post('/mutuelles/parametrage/types-operations', { label, necessite_montant });
    await fetchOperationTypes(res.data?.label || label);
    broadcastTypesUpdate();
  };

  const editTypeOperation = async (id, data) => {
    const label = typeof data === 'string' ? data : (data.label || data.nom || '');
    const necessite_montant = typeof data === 'object' ? Boolean(data.necessite_montant) : false;
    await api.put(`/mutuelles/parametrage/types-operations/${id}`, { label, necessite_montant });
    await fetchOperationTypes();
    broadcastTypesUpdate();
  };

  const deleteTypeOperation = async (id) => {
    await api.delete(`/mutuelles/parametrage/types-operations/${id}`);
    await fetchOperationTypes();
    broadcastTypesUpdate();
  };

  const handleDeleteExistingDoc = async (docId) => {
    try {
      const result = await showConfirmDialog(
        'Confirmer la suppression',
        'Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.'
      );

      if (result.isConfirmed) {
        await api.delete(`/mutuelles/documents/${docId}`);
        setExistingDocs(prev => prev.filter(d => d.id !== docId));
        showSuccessToast(STANDARD_MESSAGES.DELETE_SUCCESS);
      }
    } catch (err) {
      console.error("Erreur suppression document:", err);
      showErrorFromResponse(err, 'Erreur de suppression');
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  // New State for Employee Selection
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeDetails, setEmployeDetails] = useState(null);

  const activeEmploye = employe || selectedEmploye;

  // Fetch employees if 'employe' prop is missing
  useEffect(() => {
    if (!employe) {
      api.get('/employes/affilies-mutuelle')
        .then((res) => {
          const data = res.data.data || res.data;
          if (Array.isArray(data)) {
            setEmployeeOptions(data.map((e) => ({
              value: e,
              label: `${e.nom} ${e.prenom} (${e.matricule})`
            })));
          }
        })
        .catch((err) => console.error("Erreur chargement Employés:", err));
    }
  }, [employe]);

  // Charger les détails de l'employé actif pour l'affichage readonly
  useEffect(() => {
    if (activeEmploye?.id) {
      api.get(`/employes/${activeEmploye.id}`)
        .then((res) => setEmployeDetails(res.data?.data || res.data || null))
        .catch((err) => console.error("Erreur chargement détails employé:", err));
    } else {
      setEmployeDetails(null);
    }
  }, [activeEmploye?.id]);


  // Charger les affiliations de l'Employé
  useEffect(() => {
    if (activeEmploye?.id) {
      api.get(`/employes/${activeEmploye.id}/affiliations-mutuelle`)
        .then((res) => {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : (Array.isArray(res.data) ? res.data : []);
          const mapped = list.map((aff) => ({
            value: aff.id,
            label: `${aff.mutuelle?.nom || 'Mutuelle inconnue'} - ${aff.regime?.libelle || aff.regime?.nom || ''} (${aff.statut})`,
            affiliation: aff,
          }));
          setAffiliationsList(mapped);

          // Synchronisation de l'affiliation sélectionnée
          const idToFind = operation?.affiliation_id || formData.affiliation_id;
          if (idToFind) {
            const found = mapped.find(a => a.value === idToFind);
            if (found) setSelectedAffiliation(found);
          } else {
            // Auto-sélection si une seule affiliation active (mode création)
            const activeAffiliations = mapped.filter(a => a.affiliation.statut === "ACTIVE");
            if (activeAffiliations.length === 1) {
              setSelectedAffiliation(activeAffiliations[0]);
              setFormData(prev => ({ ...prev, affiliation_id: activeAffiliations[0].value }));
            }
          }
        })
        .catch((err) => console.error("Erreur chargement affiliations:", err));
    } else {
      setAffiliationsList([]);
      setSelectedAffiliation(null);
    }
  }, [activeEmploye?.id, operation?.affiliation_id]);

  // Charger l'opération existante (mode édition)
  useEffect(() => {
    if (operation) {
      isInitialLoad.current = true; // Signaler qu'on charge
      const fullName = activeEmploye ? `${activeEmploye.nom || ''} ${activeEmploye.prenom || ''}`.trim() : "";

      setFormData({
        affiliation_id: operation.affiliation_id || null,
        numero_dossier: operation.numero_dossier || "",
        beneficiaire_type: operation.beneficiaire_type || "EMPLOYE",
        beneficiaire_nom: operation.beneficiaire_nom || "",
        date_operation: operation.date_operation ? operation.date_operation.split("T")[0] : "",
        date_remboursement: operation.date_remboursement ? operation.date_remboursement.split("T")[0] : "",
        type_operation: operation.type_operation || "",
        statut: operation.statut || "EN_COURS",
        montant_total: operation.montant_total !== null && operation.montant_total !== undefined ? operation.montant_total : "",
        montant_rembourse: operation.montant_rembourse !== null && operation.montant_rembourse !== undefined ? operation.montant_rembourse : "",
        reste_a_charge: operation.reste_a_charge !== null && operation.reste_a_charge !== undefined ? operation.reste_a_charge : "",
        commentaire: operation.commentaire || "",
        lien_parente: operation.lien_parente || (operation.beneficiaire_type === "EMPLOYE" ? "Employé" : ""),
      });

      if (operation.documents) {
        setExistingDocs(operation.documents);
      }

      // Laisser le temps aux autres effets de s'initialiser
      setTimeout(() => { isInitialLoad.current = false; }, 500);
    } else {
      isInitialLoad.current = false;
    }
  }, [operation, activeEmploye]);

  // Remettre type_operation à la valeur API si elle correspond (compatibilité codes normalisés ↔ labels)
  useEffect(() => {
    if (operationTypes.length === 0 || !formData.type_operation) return;
    // Si la valeur actuelle ne correspond à aucun label (ex: vieux code "DEPOT_DOSSIER")
    const matchByLabel = operationTypes.find(t => t.label === formData.type_operation);
    if (!matchByLabel) {
      // Essayer de trouver par correspondance partielle normalisée
      const normalize = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      const found = operationTypes.find(t => normalize(t.label) === normalize(formData.type_operation));
      if (found) {
        setFormData(prev => ({ ...prev, type_operation: found.label }));
      } else {
        // Garder vide pour afficher le placeholder par défaut
        setFormData(prev => ({ ...prev, type_operation: "" }));
      }
    }
  }, [operationTypes]);

  // Réinitialiser les montants et date uniquement lors d'un changement manuel
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (operation && operationTypes.length === 0) return; // Attendre le chargement des types

    if (!requiresAmount) {
      setFormData(prev => ({
        ...prev,
        montant_total: "",
        montant_rembourse: "",
        reste_a_charge: "",
        date_remboursement: ""
      }));
    }
  }, [requiresAmount, operationTypes.length]);

  // Mettre à jour les options bénéficiaire selon l'affiliation
  useEffect(() => {
    if (!selectedAffiliation) {
      setBeneficiaireOptions([{ value: "EMPLOYE", label: "Employé" }]);
      return;
    }

    const aff = selectedAffiliation.affiliation;
    const options = [{ value: "EMPLOYE", label: "Employé" }];

    if (aff.conjoint_ayant_droit) {
      options.push({ value: "CONJOINT", label: "Conjoint" });
    }
    if (aff.ayant_droit) {
      options.push({ value: "ENFANT", label: "Enfant" });
    }

    setBeneficiaireOptions(options);

    // Suppression de l'auto-sélection forcée de "EMPLOYE" pour laisser les champs vides au départ
  }, [selectedAffiliation, activeEmploye]);

  // Synchroniser le nom de l'employé si type === EMPLOYE
  useEffect(() => {
    // Ne pas écraser pendant le chargement initial
    if (isInitialLoad.current) return;

    if (formData.beneficiaire_type === "EMPLOYE" && activeEmploye && !formData.beneficiaire_nom) {
      setFormData(prev => ({
        ...prev,
        beneficiaire_nom: `${activeEmploye.nom} ${activeEmploye.prenom}`,
        lien_parente: "Employé"
      }));
    }
  }, [formData.beneficiaire_type, activeEmploye]);

  // Calculer reste_a_charge
  useEffect(() => {
    if (!requiresAmount) return;
    const total = parseFloat(formData.montant_total) || 0;
    const rembourse = parseFloat(formData.montant_rembourse) || 0;
    const reste = Math.max(total - rembourse, 0).toFixed(2);
    setFormData((prev) => ({ ...prev, reste_a_charge: reste }));
  }, [formData.montant_total, formData.montant_rembourse, requiresAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "beneficiaire_type") {
      if (value === "EMPLOYE" && activeEmploye) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          beneficiaire_nom: `${activeEmploye.nom} ${activeEmploye.prenom}`,
          lien_parente: ""
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          beneficiaire_nom: operation?.beneficiaire_type === value ? (operation.beneficiaire_nom || "") : "",
          lien_parente: operation?.beneficiaire_type === value ? (operation.lien_parente || "") : ""
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAffiliationChange = (selected) => {
    setSelectedAffiliation(selected);
    setFormData((prev) => ({ ...prev, affiliation_id: selected ? selected.value : null }));
    if (errors.affiliation_id) {
      setErrors((prev) => ({ ...prev, affiliation_id: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.affiliation_id) newErrors.affiliation_id = "L'affiliation est requise";
    // if (!formData.numero_dossier) newErrors.numero_dossier = "Le numéro de dossier est requis";
    if (!formData.date_operation) newErrors.date_operation = "La date d'opération est requise";
    if (!formData.type_operation) newErrors.type_operation = "Le type est requis";
    // Montant requis uniquement si le type le demande
    if (requiresAmount && (!formData.montant_total || parseFloat(formData.montant_total) <= 0)) {
      newErrors.montant_total = "Le montant total doit être supérieur à 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      setDocumentError(null);
      const payload = {
        affiliation_id: formData.affiliation_id,
        numero_dossier: formData.numero_dossier,
        beneficiaire_type: formData.beneficiaire_type,
        beneficiaire_nom: formData.beneficiaire_nom || null,
        date_operation: formData.date_operation,
        date_remboursement: formData.date_remboursement || null,
        type_operation: formData.type_operation,
        statut: formData.statut,
        montant_total: requiresAmount ? (parseFloat(formData.montant_total) || 0) : 0,
        montant_rembourse: requiresAmount ? (parseFloat(formData.montant_rembourse) || 0) : 0,
        commentaire: formData.commentaire || null,
        lien_parente: formData.beneficiaire_type === "EMPLOYE" ? null : (formData.lien_parente || null),
      };

      if (operation) {
        await api.put(`/mutuelles/operations/${operation.id}`, payload);
      } else {
        if (!activeEmploye?.id) {
          showErrorMessage('Erreur de validation', 'Veuillez sélectionner un employé.');
          setSubmitting(false);
          return;
        }
        await api.post(`/mutuelles/dossiers/${activeEmploye.id}/operations`, payload);
      }

      let operationId = operation?.id || null;
      if (!operationId) {
        try {
          const listResp = await api.get(`/mutuelles/dossiers/${activeEmploye?.id}/operations`);
          const ops = listResp.data || [];
          const found = Array.isArray(ops)
            ? ops.find((op) => op.numero_dossier === formData.numero_dossier)
            : null;
          operationId = found?.id || (Array.isArray(ops) && ops[0]?.id ? ops[0].id : null);
        } catch (fetchErr) {
          console.error("Impossible de récupérer l'opération créée", fetchErr);
        }
      }

      if (documentFiles.length > 0 && operationId) {
        for (const file of documentFiles) {
          try {
            const fd = new FormData();
            fd.append("operation_id", operationId);
            fd.append("fichier", file);
            fd.append("nom", file.name || "Document lié");
            fd.append("type_document", DEFAULT_DOCUMENT_TYPE);
            await api.post("/mutuelles/documents", fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (uploadErr) {
            console.error(`Upload document ${file.name} échoué:`, uploadErr);
          }
        }
      }

      onSaved();
      setDocumentFiles([]);
      setDocumentError(null);
      showSuccessToast(operation ? STANDARD_MESSAGES.UPDATE_SUCCESS : STANDARD_MESSAGES.CREATE_SUCCESS);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
      showErrorFromResponse(err, 'Erreur d\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────
  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb'
  };

  const sectionTitleStyle = {
    fontWeight: 700,
    color: '#4b5563',
    fontSize: '0.85rem',
    letterSpacing: '0.02em',
    textTransform: 'none'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  };

  const inputStyle = {
    fontSize: '0.875rem',
    height: '40px',
    borderRadius: '6px',
    borderColor: '#d1d5db'
  };

  // ── Styles react-select pour Type d'opération ─────────────────────────
  const typeSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '40px',
      height: '40px',
      fontSize: '0.875rem',
      borderRadius: '6px',
      borderColor: errors.type_operation ? '#dc2626' : state.isFocused ? '#9ca3af' : '#d1d5db',
      boxShadow: 'none',
      '&:hover': { borderColor: '#9ca3af' },
    }),
    valueContainer: (base) => ({ ...base, padding: '0 10px', overflow: 'hidden' }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: '#d1d5db' }),
    dropdownIndicator: (base) => ({ ...base, color: '#9ca3af', padding: '0 8px' }),
    singleValue: (base) => ({ ...base, color: '#374151', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
    placeholder: (base) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
    menu: (base) => ({ ...base, zIndex: 9999, fontSize: '0.875rem', borderRadius: '6px' }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#007580' : state.isFocused ? '#f0fdfe' : '#fff',
      color: state.isSelected ? '#fff' : '#374151',
    }),
  };

  // ── Bouton "+" standalone (style image 2) ────────────────────────────
  const plusBtnStyle = {
    height: '40px',
    width: '42px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#4b5563',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
  };
  // ────────────────────────────────────────────────────────────────────────

  const content = (
    <div className="panel-container">
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', minHeight: 0 }}>
        {/* Header */}
        <Box className="panel-header" sx={{
          p: 2,
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          flexShrink: 0,
          position: 'relative'
        }}>
          <Typography variant="h6" sx={{
            fontWeight: 700,
            color: '#4b5563',
            fontSize: '1.1rem',
            textAlign: 'center',
            width: '100%'
          }}>
            {operation ? "Modifier Opération" : "Nouvelle Opération"}
            {activeEmploye && (
              <Typography component="span" sx={{ color: '#6b7280', fontSize: '0.8rem', ml: 1, fontWeight: 400 }}>
                — {activeEmploye.nom} {activeEmploye.prenom}
              </Typography>
            )}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: '#64748b',
              position: 'absolute',
              right: 16,
              '&:hover': { backgroundColor: '#f1f5f9' }
            }}
            aria-label="Fermer"
          >
            <X size={20} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box className="panel-body" sx={{ flex: 1, overflowY: 'auto', p: 3, minHeight: 0 }}>
          <Form onSubmit={handleSubmit}>
            {/* Section: INFORMATIONS EMPLOYÉ */}
            <Box sx={{ mb: 3 }}>
              <Box sx={sectionHeaderStyle}>
                <User size={16} color="#64748b" />
                <Typography variant="subtitle2" sx={sectionTitleStyle}>Informations Employé</Typography>
              </Box>
              <Box sx={{ px: 0 }}>
                {/* Recherche Employé (si pas de prop employe) */}
                {!employe && (
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>Employé *</Form.Label>
                    <Select
                      options={employeeOptions}
                      value={selectedEmploye ? { value: selectedEmploye, label: `${selectedEmploye.nom} ${selectedEmploye.prenom} (${selectedEmploye.matricule})` } : null}
                      onChange={(opt) => {
                        setSelectedEmploye(opt ? opt.value : null);
                        setSelectedAffiliation(null);
                        setFormData(prev => ({ ...prev, affiliation_id: null }));
                      }}
                      placeholder="Rechercher un Employé..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderColor: state.isFocused ? '#9ca3af' : '#d1d5db',
                          minHeight: '40px',
                          fontSize: '0.875rem',
                          borderRadius: '6px'
                        }),
                      }}
                    />
                  </Form.Group>
                )}

                <Typography variant="caption" sx={{
                  fontWeight: 600,
                  color: '#9ca3af',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.05em',
                  textTransform: 'none',
                  display: 'block',
                  mb: 1.5
                }}>
                  Informations Employé (lecture seule)
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Form.Group>
                    <Form.Label style={labelStyle}>NOM ET PRÉNOM</Form.Label>
                    <Form.Control
                      type="text"
                      value={activeEmploye ? `${activeEmploye.nom || ""} ${activeEmploye.prenom || ""}` : ""}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#fdfdfd', color: '#374151', fontWeight: 600 }}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label style={labelStyle}>MATRICULE</Form.Label>
                    <Form.Control
                      type="text"
                      value={activeEmploye?.matricule || ""}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#fdfdfd', color: '#374151', fontWeight: 600 }}
                    />
                  </Form.Group>
                </Box>


                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Form.Group>
                    <Form.Label style={labelStyle}>CIN</Form.Label>
                    <Form.Control
                      type="text"
                      value={employeDetails?.cin || ""}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label style={labelStyle}>DATE DE NAISSANCE</Form.Label>
                    <Form.Control
                      type="date"
                      value={employeDetails?.date_naiss || ""}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                    />
                  </Form.Group>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Form.Group>
                    <Form.Label style={labelStyle}>SITUATION FAMILIALE</Form.Label>
                    <Form.Control
                      type="text"
                      value={employeDetails?.situation_fm || ""}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label style={labelStyle}>DATE D'EMBAUCHE</Form.Label>
                    <Form.Control
                      type="date"
                      value={employeDetails?.date_embauche || ""}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                    />
                  </Form.Group>
                </Box>
                <Form.Group sx={{ mb: 2 }}>
                  <Form.Label style={labelStyle}>ADRESSE</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={employeDetails?.adresse || ""}
                    readOnly
                    style={{ fontSize: '0.875rem', borderColor: '#d1d5db', borderRadius: '6px', backgroundColor: '#f9fafb', color: '#6b7280' }}
                  />
                </Form.Group>
              </Box>
            </Box>

            {/* Section: AFFILIATION ASSURANCE */}
            <Box sx={{ mb: 3 }}>
              <Box sx={sectionHeaderStyle}>
                <CreditCard size={16} color="#64748b" />
                <Typography variant="subtitle2" sx={sectionTitleStyle}>Affiliation Assurance</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Affiliation Assurance *</Form.Label>
                  <Select
                    options={affiliationsList}
                    value={selectedAffiliation}
                    onChange={handleAffiliationChange}
                    placeholder="Sélectionner..."
                    isDisabled={!!operation || (!!affiliationIdProposed)}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: errors.affiliation_id ? '#dc2626' : state.isFocused ? '#9ca3af' : '#d1d5db',
                        minHeight: '40px',
                        fontSize: '0.875rem',
                        borderRadius: '6px',
                        '&:hover': { borderColor: '#9ca3af' }
                      }),
                    }}
                  />
                  {errors.affiliation_id && <small className="text-danger">{errors.affiliation_id}</small>}
                </Form.Group>

                <Form.Group>
                  <Form.Label style={labelStyle}>Numéro d'adhérent</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedAffiliation?.affiliation?.numero_adherent || ""}
                    readOnly
                    style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                  />
                </Form.Group>
              </Box>
            </Box>


            {/* Section: BÉNÉFICIAIRE */}
            <Box sx={{ mb: 3 }}>
              <Box sx={sectionHeaderStyle}>
                <User size={16} color="#64748b" />
                <Typography variant="subtitle2" sx={sectionTitleStyle}>Bénéficiaire</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Form.Group>
                  <Form.Label style={labelStyle}>TYPE *</Form.Label>
                  <Form.Select
                    name="beneficiaire_type"
                    value={formData.beneficiaire_type}
                    onChange={handleChange}
                    disabled={!selectedAffiliation}
                    style={inputStyle}
                  >
                    <option value="">-- Choisir le bénéficiaire --</option>
                    {beneficiaireOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {formData.beneficiaire_type === "EMPLOYE" ? (
                  <Form.Group>
                    <Form.Label style={labelStyle}>NOM DU BÉNÉFICIAIRE</Form.Label>
                    <Form.Control
                      type="text"
                      name="beneficiaire_nom"
                      value={formData.beneficiaire_nom}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                    />
                  </Form.Group>
                ) : (
                  <>
                    <Form.Group>
                      <Form.Label style={labelStyle}>NOM DU BÉNÉFICIAIRE *</Form.Label>
                      <Form.Control
                        type="text"
                        name="beneficiaire_nom"
                        value={formData.beneficiaire_nom}
                        onChange={handleChange}
                        placeholder="Nom & Prénom"
                        style={inputStyle}
                        required
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label style={labelStyle}>LIEN DE PARENTÉ *</Form.Label>
                      <Form.Control
                        type="text"
                        name="lien_parente"
                        value={formData.lien_parente}
                        onChange={handleChange}
                        placeholder={
                          formData.beneficiaire_type === "CONJOINT"
                            ? "Époux / Épouse..."
                            : formData.beneficiaire_type === "ENFANT"
                              ? "Fils / Fille..."
                              : "Ex: Conjoint, Enfant..."
                        }
                        style={inputStyle}
                        required
                      />
                    </Form.Group>
                  </>
                )}
              </Box>
            </Box>

            {/* Section: DATES & WORKFLOW */}
            <Box sx={{ mb: 3 }}>
              <Box sx={sectionHeaderStyle}>
                <Calendar size={16} color="#64748b" />
                <Typography variant="subtitle2" sx={sectionTitleStyle}>Dates & Workflow</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Date Opération *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_operation"
                    value={formData.date_operation}
                    onChange={handleChange}
                    isInvalid={!!errors.date_operation}
                    style={inputStyle}
                  />
                </Form.Group>

                {/* Type d'opération avec bouton "+" — style identique image 2 */}
                <Form.Group>
                  <Form.Label style={labelStyle}>Type d'opération *</Form.Label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <Select
                        options={operationTypes.map(t => ({ value: t.label, label: t.label, type: t }))}
                        value={formData.type_operation
                          ? { value: formData.type_operation, label: formData.type_operation }
                          : null
                        }
                        onChange={(opt) => {
                          setFormData(prev => ({ ...prev, type_operation: opt ? opt.value : '' }));
                          if (errors.type_operation) setErrors(prev => ({ ...prev, type_operation: null }));
                        }}
                        placeholder="-- Sélectionner un type --"
                        styles={typeSelectStyles}
                        noOptionsMessage={() => 'Aucun type disponible'}
                        isClearable={false}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTypeModal(true)}
                      style={plusBtnStyle}
                      title="Gérer les types d'opération"
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {errors.type_operation && <small className="text-danger" style={{ marginTop: '4px', display: 'block' }}>{errors.type_operation}</small>}
                </Form.Group>



                <Form.Group>
                  <Form.Label style={labelStyle}>Statut *</Form.Label>
                  <Form.Select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">-- État d'opération --</option>
                    {statutOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Form.Select>
                </Form.Group>
              </Box>
            </Box>

            {/* Section: MONTANTS — conditionnelle selon requiresAmount */}
            {requiresAmount && (
              <Box sx={{ mb: 3 }}>
                <Box sx={sectionHeaderStyle}>
                  <DollarSign size={16} color="#64748b" />
                  <Typography variant="subtitle2" sx={sectionTitleStyle}>Montants (MAD)</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Form.Group>
                    <Form.Label style={labelStyle}>Montant Total *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="montant_total"
                      value={formData.montant_total}
                      onChange={handleChange}
                      isInvalid={!!errors.montant_total}
                      style={inputStyle}
                      placeholder="Ex: 500.00"
                    />
                    {errors.montant_total && <small className="text-danger">{errors.montant_total}</small>}
                  </Form.Group>

                  <Form.Group>
                    <Form.Label style={labelStyle}>Remboursé</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="montant_rembourse"
                      value={formData.montant_rembourse}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="Ex: 350.00"
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label style={labelStyle}>Reste à charge</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={formData.reste_a_charge}
                      readOnly
                      style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label style={labelStyle}>Date Remboursement</Form.Label>
                    <Form.Control
                      type="date"
                      name="date_remboursement"
                      value={formData.date_remboursement}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </Form.Group>
                </Box>
              </Box>
            )}

            {/* Section: COMMENTAIRE */}
            <Box sx={{ mb: 3 }}>
              <Box sx={sectionHeaderStyle}>
                <MessageSquare size={16} color="#64748b" />
                <Typography variant="subtitle2" sx={sectionTitleStyle}>Commentaire</Typography>
              </Box>
              <Box sx={{ px: 0 }}>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleChange}
                  placeholder="Saisissez ici toute information complémentaire utile (référence, description de l'acte médical, etc.)"
                  style={{ fontSize: '0.875rem', borderColor: '#d1d5db', borderRadius: '6px' }}
                />
              </Box>
            </Box>

            {/* Section: DOCUMENTS LIÉS */}
            <Box sx={{ mb: 3 }}>
              <Box sx={sectionHeaderStyle}>
                <FileText size={16} color="#64748b" />
                <Typography variant="subtitle2" sx={sectionTitleStyle}>Documents liés</Typography>
              </Box>
              <Box sx={{ px: 0 }}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Fichiers</Form.Label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files || []);
                      const oversized = selectedFiles.some(f => f.size > 5 * 1024 * 1024);

                      if (oversized) {
                        setDocumentError("Un ou plusieurs fichiers dépassent la taille max de 5 Mo");
                        return;
                      }

                      setDocumentFiles(prev => [...prev, ...selectedFiles]);
                      setDocumentError(null);
                      e.target.value = '';
                    }}
                  />

                  <Box sx={{
                    border: '1px dashed #d1d5db',
                    borderRadius: '8px',
                    p: 2,
                    bgcolor: '#f9fafb',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#2c767c', bgcolor: '#f0fdfa' }
                  }}>
                    <MuiButton
                      size="small"
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        color: '#2c767c',
                        borderColor: '#2c767c',
                        borderWidth: '1.5px',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': { borderColor: '#235e63', borderWidth: '1.5px', bgcolor: 'rgba(44, 118, 124, 0.05)' }
                      }}
                    >
                      Ajouter des fichiers
                    </MuiButton>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      PDF, JPG, PNG (Max. 5 Mo par fichier)
                    </Typography>
                  </Box>

                  {/* Documents enregistrés (gris clair) */}
                  {existingDocs.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                        DOCUMENTS DÉJÀ ENREGISTRÉS
                      </Typography>
                      {existingDocs.map((doc) => (
                        <Box key={doc.id} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: '10px 12px',
                          bgcolor: '#f5f5f5', // Gris clair comme read-only
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                            <Box sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '6px',
                              bgcolor: '#e9ecef',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <FileText size={18} color="#6c757d" />
                            </Box>
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography variant="body2" sx={{
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#495057',
                              }}>
                                {doc.nom || doc.file_name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: '#007580', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => window.open(`http://localhost:8000/storage/${doc.file_path}`, '_blank')}
                              >
                                Visualiser
                              </Typography>
                            </Box>
                          </Box>
                          <MuiButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteExistingDoc(doc.id)}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            <X size={18} />
                          </MuiButton>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {documentFiles.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                        NOUVEAUX DOCUMENTS À AJOUTER
                      </Typography>
                      {documentFiles.map((file, idx) => (
                        <Box key={idx} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: '10px 12px',
                          bgcolor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                            <Box sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '6px',
                              bgcolor: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <FileText size={18} color="#2c767c" />
                            </Box>
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography variant="body2" sx={{
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#1f2937',
                                display: 'block'
                              }}>
                                {file.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                {(file.size / 1024).toFixed(0)} KB
                              </Typography>
                            </Box>
                          </Box>
                          <MuiButton
                            size="small"
                            color="error"
                            onClick={() => setDocumentFiles(prev => prev.filter((_, i) => i !== idx))}
                            sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto' }}
                          >
                            Retirer
                          </MuiButton>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {documentError && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 500 }}>
                      ⚠️ {documentError}
                    </Typography>
                  )}
                </Form.Group>
              </Box>
            </Box>
          </Form>
        </Box>

        {/* Footer */}
        <Box className="panel-footer" sx={{
          position: 'sticky',
          bottom: 0,
          p: 2.5,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
          zIndex: 10
        }}>
          <MuiButton
            onClick={onClose}
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: '#2c767c',
              color: '#ffffff',
              px: 4,
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRadius: '6px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#2c767c',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(44, 118, 124, 0.3)'
              },
              '&:active': { transform: 'translateY(0)' },
              '&:disabled': { backgroundColor: '#9ca3af' }
            }}
          >
            Annuler
          </MuiButton>
          <MuiButton
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: '#2c767c',
              color: '#ffffff',
              px: 4,
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRadius: '6px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#2c767c',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(44, 118, 124, 0.3)'
              },
              '&:active': { transform: 'translateY(0)' },
              '&:disabled': { backgroundColor: '#9ca3af' }
            }}
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </MuiButton>
        </Box>
      </Box>
    </div>
  );

  const typeModal = (
    <ManageResourceModal
      show={showTypeModal}
      onHide={() => setShowTypeModal(false)}
      title="Gérer les types d'opération"
      resourceName="Type"
      fetchItems={getTypesForModal}
      onAdd={addTypeOperation}
      onEdit={editTypeOperation}
      onDelete={deleteTypeOperation}
      fields={[
        { name: 'label', label: 'Libellé', type: 'text', required: true, placeholder: 'Ex: Remboursement' },
        { name: 'necessite_montant', label: 'Nécessite un montant ?', type: 'checkbox' },
      ]}
    />
  );

  if (isSidebar) {
    return (
      <>
        <div className="add-affiliation-panel" style={{ width: '100%', height: '100%', boxShadow: 'none', animation: 'slideInRight 0.3s ease-out' }}>
          {content}
        </div>
        {typeModal}
      </>
    );
  }

  return (
    <>
      <div className="add-affiliation-overlay">
        <div className="add-affiliation-panel">
          {content}
        </div>
      </div>
      {typeModal}
    </>
  );
}

export default AddMutuelleOperation;
