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
import ExpandRTable from "../Shared/ExpandRTable";
import AddAccident from "./AddAccident";
import { motion, AnimatePresence } from 'framer-motion';
import Swal from "sweetalert2";
import "../Style.css";

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
  { key: "gravite", label: "Gravité" },
  { key: "arretTravail", label: "Arrêt travail" },
  { key: "dureeArret", label: "Durée arrêt (j)" },
  { key: "declarationCnss", label: "Déclaration CNSS" },
  { key: "statut", label: "Statut dossier" },
];

const mapApiToUi = (api) => ({
  id: api.id,
  employe: (typeof api.employe === 'string' ? api.employe : api.employe?.nom) || api.nom_complet || "N/A",
  matricule: (typeof api.matricule === 'string' ? api.matricule : api.employe?.matricule) || "N/A",
  dateAccident: api.date_accident,
  heure: api.heure,
  lieu: api.lieu ? api.lieu.nom : (api.lieu_nom || "N/A"), // Handle object or legacy string if needed
  accident_lieu_id: api.accident_lieu_id, // For edit mode
  gravite: api.gravite,
  arretTravail: api.arret_travail ? "oui" : "non",
  dureeArret: api.duree_arret || 0,
  declarationCnss: api.declaration_cnss ? "oui" : "non",
  statut: api.statut_dossier || api.statut,
  departement_id: api.departement_id
});

const mapUiToApi = (ui, deptId) => ({
  departement_id: deptId || ui.departement_id || null,
  nom_complet: ui.employe,
  matricule: ui.matricule,
  date_accident: ui.dateAccident,
  heure: ui.heure,
  accident_lieu_id: ui.accident_lieu_id,
  type_accident: "accident de travail",
  gravite: ui.gravite,
  arret_travail: ui.arretTravail === "oui",
  duree_arret: ui.dureeArret ? parseInt(ui.dureeArret) : 0,
  declaration_cnss: ui.declarationCnss === "oui",
  statut_dossier: ui.statut,
});

// Column visibility menu
const CustomMenu = forwardRef(({ children, style, className, 'aria-labelledby': labeledBy, columns_config, setColumnVisibility }, ref) => (
  <div ref={ref} style={{ ...style, padding: '10px', minWidth: '200px' }} className={className} aria-labelledby={labeledBy}>
    <h6 className='p-2 mb-0'>Colonnes visibles</h6>
    <hr className='my-2' />
    <Form className='p-2'>
      {(columns_config || []).map(col => (
        <Form.Check
          key={col.key}
          type="checkbox"
          label={col.label}
          checked={col.visible}
          onChange={() => setColumnVisibility(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
          className='mb-2'
        />
      ))}
    </Form>
  </div>
));
CustomMenu.displayName = 'CustomMenu';

const AccidentTable = forwardRef((props, ref) => {
  const {
    departementId,
    departementName = "Tous",
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

  // States pour les filtres
  const [filterEmploye, setFilterEmploye] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterLieu, setFilterLieu] = useState("");
  const [filterGravite, setFilterGravite] = useState("");
  const [filterArretTravail, setFilterArretTravail] = useState("");



  const [columnVisibility, setColumnVisibility] = useState({
    employe: true,
    matricule: true,
    dateAccident: true,
    heure: true,
    lieu: true,
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
    gravite: "léger",
    arretTravail: "non",
    dureeArret: 0,
    declarationCnss: "non",
    statut: "en cours",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    if (!departementId) return [];
    const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
    // Ensure both are numbers for comparison
    const numericIds = ids.map(Number);
    return accidents.filter((a) => numericIds.includes(Number(a.departement_id)));
  }, [accidents, departementId, includeSubDepartments, getSubDepartmentIds, departements]);

  const searched = useMemo(() => {
    let result = filtered;

    // Filtre global
    if (globalSearch.trim()) {
      const term = globalSearch.toLowerCase();
      // Colonnes à exclure de la recherche : Date accident, Lieu, Type accident, Gravité, Arrêt travail, Statut
      const excludedKeys = ['dateAccident', 'lieu', 'gravite', 'arretTravail', 'statut'];
      const searchableColumns = columns.filter(c => !excludedKeys.includes(c.key));

      result = result.filter((row) =>
        searchableColumns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(term))
      );
    }

    // Filtre par employé
    if (filterEmploye.trim()) {
      result = result.filter(row =>
        (row.employe || "").toLowerCase().includes(filterEmploye.toLowerCase())
      );
    }

    // Filtre par statut
    if (filterStatut.trim()) {
      result = result.filter(row =>
        (row.statut || "").toLowerCase() === filterStatut.toLowerCase()
      );
    }

    // Filtre par date
    if (filterDate.trim()) {
      result = result.filter(row =>
        (row.dateAccident || "").includes(filterDate)
      );
    }

    // Filtre par lieu
    if (filterLieu.trim()) {
      result = result.filter(row =>
        (row.lieu || "").toLowerCase().includes(filterLieu.toLowerCase())
      );
    }

    // Filtre par gravité
    if (filterGravite.trim()) {
      result = result.filter(row =>
        (row.gravite || "").toLowerCase() === filterGravite.toLowerCase()
      );
    }

    // Filtre par arrêt travail
    if (filterArretTravail.trim()) {
      result = result.filter(row =>
        (row.arretTravail || "").toLowerCase() === filterArretTravail.toLowerCase()
      );
    }

    return result;
  }, [filtered, globalSearch, filterEmploye, filterStatut, filterDate, filterLieu, filterGravite, filterArretTravail]);

  const [editingAccident, setEditingAccident] = useState(null);

  const resetForm = useCallback(() => {
    setForm({
      employe: "",
      matricule: "",
      dateAccident: "",
      heure: "",
      lieu: "",
      gravite: "léger",
      arretTravail: "non",
      dureeArret: 0,
      declarationCnss: "non",
      statut: "en cours",
    });
  }, []);

  const onSave = (newData) => {
    const payload = mapUiToApi(newData, departementId);
    console.log("Payload envoyé:", payload);

    const request = editingAccident
      ? axios.put(`http://127.0.0.1:8000/api/accidents/${editingAccident.id}`, payload, { withCredentials: true })
      : axios.post("http://127.0.0.1:8000/api/accidents", payload, { withCredentials: true });

    request
      .then((res) => {
        loadAccidents();
        handleClose();
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: editingAccident ? 'Accident modifié avec succès' : 'Accident enregistré avec succès',
        });
      })
      .catch((err) => {
        console.error("Erreur enregistrement:", err.response?.data);
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
          const messages = Object.values(validationErrors).flat().join('\n');
          Swal.fire({ icon: 'error', title: 'Erreur de validation', text: messages });
        } else {
          Swal.fire({ icon: 'error', title: 'Erreur', text: err.response?.data?.message || "Impossible d'enregistrer l'accident." });
        }
      });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas revenir en arrière!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`http://127.0.0.1:8000/api/accidents/${id}`, { withCredentials: true })
          .then(() => {
            setAccidents(prev => prev.filter(a => a.id !== id));
            Swal.fire('Supprimé!', 'Le dossier a été supprimé.', 'success');
          })
          .catch(err => {
            console.error(err);
            Swal.fire('Erreur', 'Impossible de supprimer.', 'error');
          });
      }
    })
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedAccidents.length === 0) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Vous allez supprimer ${selectedAccidents.length} accident(s)!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });
    if (result.isConfirmed) {
      try {
        await Promise.all(
          selectedAccidents.map(id => axios.delete(`http://127.0.0.1:8000/api/accidents/${id}`, { withCredentials: true }))
        );

        setAccidents(prev => prev.filter(a => !selectedAccidents.includes(a.id)));
        setSelectedAccidents([]);
        Swal.fire("Supprimés!", "Les accidents ont été supprimés.", "success");
      } catch (error) {
        console.error("Error deleting selected accidents:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, [selectedAccidents]);

  const handleEdit = (row) => {
    setEditingAccident(row);
    setIsAddingEmploye(true);
  };

  const columns_config = useMemo(() => [
    { key: 'employe', label: "Employé", visible: columnVisibility.employe },
    { key: 'matricule', label: "Matricule", visible: columnVisibility.matricule },
    { key: 'dateAccident', label: "Date accident", visible: columnVisibility.dateAccident },
    { key: 'heure', label: "Heure", visible: columnVisibility.heure },
    { key: 'lieu', label: "Lieu", visible: columnVisibility.lieu },
    { key: 'gravite', label: "Gravité", visible: columnVisibility.gravite },
    { key: 'arretTravail', label: "Arrêt travail", visible: columnVisibility.arretTravail },
    { key: 'dureeArret', label: "Durée arrêt (j)", visible: columnVisibility.dureeArret },
    { key: 'declarationCnss', label: "Déclaration CNSS", visible: columnVisibility.declarationCnss },
    { key: 'statut', label: "Statut dossier", visible: columnVisibility.statut },
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

  const handleClose = () => {
    setIsAddingEmploye(false);
    setEditingAccident(null);
  }

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumn = columns_config.filter(col => col.visible).map(col => col.label);
    const tableRows = searched.map(row =>
      columns_config.filter(col => col.visible).map(col => row[col.key])
    );
    doc.setFontSize(18);
    doc.text(`Accidents de travail - ${departementName || "Tous"}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });
    doc.save(`accidents_${departementName || "tous"}_${new Date().toISOString()}.pdf`);
  }, [columns_config, searched, departementName]);

  const exportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      searched.map(row => {
        const item = {};
        columns_config.forEach(col => {
          if (col.visible) {
            item[col.label] = row[col.key];
          }
        });
        return item;
      })
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accidents");
    XLSX.writeFile(wb, `accidents_${departementName || "tous"}_${new Date().toISOString()}.xlsx`);
  }, [columns_config, searched, departementName]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    const tableColumn = columns_config.filter(col => col.visible).map(col => col.label);
    const tableRows = searched.map(row =>
      columns_config.filter(col => col.visible).map(col => row[col.key])
    );

    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; color: #2c767c; }
            .header { margin-bottom: 20px; }
            @page { margin: 1cm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Accidents de travail - ${departementName || "Tous"}</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>${tableColumn.map(col => `<th>${col}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tableRows.map(row => `
                <tr>${row.map(cell => `<td>${cell || ""}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [columns_config, searched, departementName]);

  useImperativeHandle(ref, () => ({
    exportToPDF,
    exportToExcel,
    handlePrint
  }), [exportToPDF, exportToExcel, handlePrint]);

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
                    <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: '#4b5563' }} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu as={CustomMenu} columns_config={columns_config} setColumnVisibility={setColumnVisibility} />
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
                  gap: '16px',
                  padding: '12px 20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  flexWrap: 'wrap'
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Form.Label className="mb-0 fw-bold text-muted small">Date:</Form.Label>
                  <Form.Control
                    size="sm"
                    type="date"
                    style={{ width: '130px' }}
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Form.Label className="mb-0 fw-bold text-muted small">Lieu:</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Lieu..."
                    style={{ width: '150px' }}
                    value={filterLieu}
                    onChange={(e) => setFilterLieu(e.target.value)}
                  />
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Form.Label className="mb-0 fw-bold text-muted small">Gravité:</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: '120px' }}
                    value={filterGravite}
                    onChange={(e) => setFilterGravite(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="léger">Léger</option>
                    <option value="grave">Grave</option>
                    <option value="mortel">Mortel</option>
                  </Form.Select>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Form.Label className="mb-0 fw-bold text-muted small">Arrêt:</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: '100px' }}
                    value={filterArretTravail}
                    onChange={(e) => setFilterArretTravail(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </Form.Select>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Form.Label className="mb-0 fw-bold text-muted small">Statut:</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: '130px' }}
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="en cours">En cours</option>
                    <option value="déclaré">Déclaré</option>
                    <option value="clôturé">Clôturé</option>
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
            page={page}
            rowsPerPage={rowsPerPage}
            handleChangePage={setPage}
            handleChangeRowsPerPage={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleDeleteSelected={handleDeleteSelected}
          />
        </div>

        {isAddingEmploye && (
          <AddAccident
            onClose={handleClose}
            onSave={onSave}
            departementId={departementId}
            initialData={editingAccident}
          />
        )}
        {/* End of main container */}
      </div>
    </ThemeProvider>
  );
});

export default AccidentTable;

