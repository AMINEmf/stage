import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import { Button, Card, Table, Modal, Form, Dropdown, Spinner, Alert } from "react-bootstrap";
import { faEdit, faTrash, faFilePdf, faFileExcel, faPrint, faSliders, faChevronDown, faChevronUp, faSearch, faCalendarAlt, faClipboardCheck, faIdCard, faFilter, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaPlus, FaPlusCircle } from "react-icons/fa";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useOpen } from "../../Acceuil/OpenProvider";
import ExpandRTable from "./ExpandRTable";
import AddAccident from "./AddAccident";
import { motion, AnimatePresence } from 'framer-motion';
import Swal from "sweetalert2";

const theme = createTheme();

const initialAccidents = [
  {
    id: 1,
    employe: "Ahmed Ben Salah",
    matricule: "EMP-001",
    dateAccident: "2026-01-15",
    heure: "09:20",
    lieu: "Atelier A",
    typeAccident: "Chute",
    gravite: "léger",
    arretTravail: "oui",
    dureeArret: 3,
    declarationCnss: "oui",
    statut: "en cours",
    departement_id: 1,
  },
  {
    id: 2,
    employe: "Sara El Idrissi",
    matricule: "EMP-002",
    dateAccident: "2026-01-20",
    heure: "14:05",
    lieu: "Chantier B",
    typeAccident: "Coupure",
    gravite: "grave",
    arretTravail: "oui",
    dureeArret: 14,
    declarationCnss: "oui",
    statut: "déclaré",
    departement_id: 2,
  },
];

const columns = [
  { key: "employe", label: "Employé" },
  { key: "matricule", label: "Matricule" },
  { key: "dateAccident", label: "Date accident" },
  { key: "heure", label: "Heure" },
  { key: "lieu", label: "Lieu" },
  { key: "typeAccident", label: "Type accident" },
  { key: "gravite", label: "Gravité" },
  { key: "arretTravail", label: "Arrêt travail" },
  { key: "dureeArret", label: "Durée arrêt (j)" },
  { key: "declarationCnss", label: "Déclaration CNSS" },
  { key: "statut", label: "Statut dossier" },
];

const mapApiToUi = (api) => ({
  id: api.id,
  employe: api.employe?.nom || api.nom_complet || "N/A",
  matricule: api.employe?.matricule || api.matricule || "N/A",
  dateAccident: api.date_accident,
  heure: api.heure,
  lieu: api.lieu,
  typeAccident: api.type_accident,
  gravite: api.gravite,
  arretTravail: api.arret_travail ? "oui" : "non",
  dureeArret: api.duree_arret || 0,
  declarationCnss: api.declaration_cnss ? "oui" : "non",
  statut: api.statut_dossier || api.statut,
});

const mapUiToApi = (ui, deptId) => ({
  departement_id: deptId,
  nom_complet: ui.employe,
  matricule: ui.matricule,
  date_accident: ui.dateAccident,
  heure: ui.heure,
  lieu: ui.lieu,
  type_accident: ui.typeAccident,
  gravite: ui.gravite,
  arret_travail: ui.arretTravail === "oui",
  duree_arret: parseInt(ui.dureeArret),
  declaration_cnss: ui.declarationCnss === "oui",
  statut_dossier: ui.statut,
});

const AccidentTable = forwardRef((props, ref) => {
  const {
    departementId,
    departementName = "",
    includeSubDepartments,
    getSubDepartmentIds,
    departements,
    globalSearch = "",
    isAddingEmploye,
    setIsAddingEmploye,
    filtersVisible,
    handleFiltersToggle
  } = props;

  const { dynamicStyles } = useOpen();

  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAccidents, setSelectedAccidents] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    employe: true,
    matricule: true,
    dateAccident: true,
    heure: true,
    lieu: true,
    typeAccident: true,
    gravite: true,
    arretTravail: true,
    dureeArret: true,
    declarationCnss: true,
    statut: true,
  });

  const iconButtonStyle = {
    backgroundColor: "#f9fafb",
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "13px 16px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: '38px',
    width: '42px',
    marginLeft: '8px'
  };
  const [form, setForm] = useState({
    employe: "",
    matricule: "",
    dateAccident: "",
    heure: "",
    lieu: "",
    typeAccident: "",
    gravite: "léger",
    arretTravail: "non",
    dureeArret: 0,
    declarationCnss: "non",
    statut: "en cours",
  });

  const filtered = useMemo(() => {
    if (!departementId) return accidents;
    const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
    return accidents.filter((a) => ids.includes(a.departement_id));
  }, [accidents, departementId, includeSubDepartments, getSubDepartmentIds, departements]);

  const searched = useMemo(() => {
    if (!globalSearch.trim()) return filtered;
    const term = globalSearch.toLowerCase();
    return filtered.filter((row) =>
      columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(term))
    );
  }, [filtered, globalSearch]);

  const resetForm = useCallback(() => {
    setForm({
      employe: "",
      matricule: "",
      dateAccident: "",
      heure: "",
      lieu: "",
      typeAccident: "",
      gravite: "léger",
      arretTravail: "non",
      dureeArret: 0,
      declarationCnss: "non",
      statut: "en cours",
    });
  }, []);

  const onSave = (newData) => {
    const payload = mapUiToApi(newData, departementId);
    axios
      .post("http://127.0.0.1:8000/api/accidents", payload, { withCredentials: true })
      .then((res) => {
        const created = mapApiToUi(res.data);
        setAccidents((prev) => [...prev, created]);
        handleClose();
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Accident enregistré avec succès',
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Impossible d'enregistrer l'accident.");
      });
  };

  const columns_config = useMemo(() => [
    { id: 'employe', label: "Employé", visible: columnVisibility.employe },
    { id: 'matricule', label: "Matricule", visible: columnVisibility.matricule },
    { id: 'dateAccident', label: "Date accident", visible: columnVisibility.dateAccident },
    { id: 'heure', label: "Heure", visible: columnVisibility.heure },
    { id: 'lieu', label: "Lieu", visible: columnVisibility.lieu },
    { id: 'typeAccident', label: "Type accident", visible: columnVisibility.typeAccident },
    { id: 'gravite', label: "Gravité", visible: columnVisibility.gravite },
    { id: 'arretTravail', label: "Arrêt travail", visible: columnVisibility.arretTravail },
    { id: 'dureeArret', label: "Durée arrêt (j)", visible: columnVisibility.dureeArret },
    { id: 'declarationCnss', label: "Déclaration CNSS", visible: columnVisibility.declarationCnss },
    { id: 'statut', label: "Statut dossier", visible: columnVisibility.statut },
  ], [columnVisibility]);

  const table_columns = columns_config.filter(col => col.visible);

  const actions = [
    {
      label: 'Modifier',
      icon: <FontAwesomeIcon icon={faEdit} />,
      onClick: (row) => console.log('Edit', row),
      color: 'primary'
    },
    {
      label: 'Supprimer',
      icon: <FontAwesomeIcon icon={faTrash} />,
      onClick: (row) => console.log('Delete', row),
      color: 'error'
    }
  ];

  const handleSelectAllChange = (checked) => {
    if (checked) {
      setSelectedAccidents(searched.map(a => a.id));
    } else {
      setSelectedAccidents([]);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedAccidents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const loadAccidents = useCallback(() => {
    setLoading(true);
    axios
      .get("http://127.0.0.1:8000/api/accidents", { withCredentials: true })
      .then((res) => {
        const payload = Array.isArray(res.data) ? res.data : [];
        setAccidents(payload.map(mapApiToUi));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAccidents(); }, [loadAccidents]);

  const handleClose = () => setIsAddingEmploye(false);

  // Column visibility menu
  const CustomMenu = forwardRef(({ children, style, className, 'aria-labelledby': labeledBy }, ref) => (
    <div ref={ref} style={{ ...style, padding: '10px', minWidth: '200px' }} className={className} aria-labelledby={labeledBy}>
      <h6 className='p-2 mb-0'>Colonnes visibles</h6>
      <hr className='my-2' />
      <Form className='p-2'>
        {columns_config.map(col => (
          <Form.Check
            key={col.id}
            type="checkbox"
            label={col.label}
            checked={col.visible}
            onChange={() => setColumnVisibility(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
            className='mb-2'
          />
        ))}
      </Form>
    </div>
  ));
  CustomMenu.displayName = 'CustomMenu';

  return (
    <ThemeProvider theme={theme}>
      <div style={{
        position: 'relative',
        top: "0",
        height: 'calc(100vh - 120px)',
        flex: 1,
        minWidth: 0,
        overflow: 'auto',
        width: isAddingEmploye ? '30% !important' : 'auto'
      }} className={`${isAddingEmploye ? "with-form" : "container_employee"}`}>
        <div className="mt-4">
          <div className="section-header mb-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '16px' }}>
              {/* Bloc titre */}
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                  <i className="fas fa-users me-2"></i>
                  Détails Accident
                </span>
                <p className="section-description text-muted mb-0">
                  {searched.length} accident
                  {searched.length > 1 ? 's' : ''} actuellement affiché
                  {searched.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* Bloc Dropdowns */}
              <div style={{ display: "flex", gap: "10px", alignItems: 'center', flexWrap: 'wrap' }}>
                <FontAwesomeIcon
                  onClick={() => handleFiltersToggle && handleFiltersToggle(!filtersVisible)}
                  icon={filtersVisible ? faClose : faFilter}
                  style={{
                    cursor: "pointer",
                    fontSize: "1.9rem",
                    color: "#2c767c",
                    transition: 'all 0.2s ease',
                    marginTop: "1.3%",
                    marginRight: "8px",
                  }}
                />

                <Button
                  onClick={() => {
                    if (!departementId) return;
                    setIsAddingEmploye(true);
                  }}
                  className={`btn d-flex align-items-center ${!departementId ? "disabled-btn" : ""}`}
                  size="sm"
                  style={{
                    width: '180px',
                    backgroundColor: '#2c767c',
                    color: '#ffffff',
                    border: 'none',
                    marginRight: '10px'
                  }}
                >
                  <FaPlusCircle className="me-2" />
                  Ajouter un accident
                </Button>

                <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                  <Dropdown.Toggle as="button" style={iconButtonStyle} title="Visibilité Colonnes">
                    <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: "#4b5563" }} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu as={CustomMenu} />
                </Dropdown>

                <button style={iconButtonStyle} title="Planning">
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ width: 18, height: 18, color: '#4b5563' }} />
                </button>
                <button style={iconButtonStyle} title="Règles">
                  <FontAwesomeIcon icon={faClipboardCheck} style={{ width: 18, height: 18, color: '#4b5563' }} />
                </button>

                <Dropdown>
                  <Dropdown.Toggle as="button" style={iconButtonStyle} title="Export">
                    <FontAwesomeIcon icon={faFileExcel} style={{ width: 18, height: 18, color: '#4b5563' }} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item>Excel</Dropdown.Item>
                    <Dropdown.Item>PDF</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {filtersVisible && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="filters-container mb-3"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  padding: '12px 20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Form.Label className="mb-0 fw-bold text-muted small">Employé:</Form.Label>
                  <Form.Control size="sm" type="text" placeholder="Rechercher..." style={{ width: '150px' }} />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Form.Label className="mb-0 fw-bold text-muted small">Statut:</Form.Label>
                  <Form.Select size="sm" style={{ width: '120px' }}>
                    <option value="">Tous</option>
                    <option value="en cours">En cours</option>
                    <option value="déclaré">Déclaré</option>
                  </Form.Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRTable
            data={searched}
            columns={table_columns}
            actions={actions}
            highlightText={globalSearch}
            selectedItems={selectedAccidents}
            handleSelectAllChange={handleSelectAllChange}
            handleCheckboxChange={handleCheckboxChange}
            selectAll={selectedAccidents.length === searched.length && searched.length > 0}
            onRowClick={(row) => console.log('Row clicked', row)}
          />
        </div>

        {isAddingEmploye && (
          <AddAccident
            onClose={handleClose}
            onSave={onSave}
            departementId={departementId}
          />
        )}
        {/* End of main container */}
      </div>
    </ThemeProvider>
  );
});

export default AccidentTable;
