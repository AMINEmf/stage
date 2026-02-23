import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Dropdown, Form } from "react-bootstrap";
import { faEdit, faTrash, faFileExcel, faSliders, faCalendarAlt, faClipboardCheck, faFilter, faClose, faEye, faFile, faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaPlusCircle } from "react-icons/fa";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useOpen } from "../../Acceuil/OpenProvider";
import ExpandRTable from "../Shared/ExpandRTable";
import AddCimr from "./AddCimr";
import { motion, AnimatePresence } from 'framer-motion';
import Swal from "sweetalert2";
import "../Style.css";

const theme = createTheme();

const columns = [
    { key: "employe", label: "Employé" },
    { key: "matricule", label: "Matricule" },
    { key: "cin", label: "CIN" },
    { key: "poste", label: "Poste" },
    { key: "numeroCimr", label: "Numéro CIMR" },
    { key: "dateAffiliation", label: "Date Affiliation" },
    { key: "dateFinAffiliation", label: "Date Fin" },
    { key: "salaireCotisable", label: "Salaire Cotisable" },
    { key: "tauxEmployeur", label: "Taux Employeur" },
    { key: "montantCotisation", label: "Montant" },
    { key: "statut", label: "Statut" },
    { key: "ficheAffiliation", label: "Document" },
];

// Fonction pour formater les dates
const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateString;
    }
};

const mapApiToUi = (api) => ({
    id: api.id,
    employe: api.employe,
    matricule: api.matricule,
    cin: api.cin || "-",
    poste: api.poste || "-",
    dateEmbauche: api.date_embauche,
    numeroCimr: api.numero_cimr || "-",
    dateAffiliation: api.date_affiliation,
    dateFinAffiliation: api.date_fin_affiliation || "-",
    salaireCotisable: api.salaire_cotisable,
    tauxEmployeur: api.taux_employeur,
    montantCotisation: api.montant_cotisation,
    statut: api.statut,
    ficheAffiliation: api.fiche_affiliation,
    departement_id: api.departement_id
});

const mapUiToApi = (ui, deptId) => ({
    departement_id: deptId || ui.departement_id || null,
    employe: ui.employe,
    matricule: ui.matricule,
    cin: ui.cin || null,
    poste: ui.poste || null,
    date_embauche: ui.dateEmbauche || null,
    numero_cimr: ui.numeroCimr || null,
    date_affiliation: ui.dateAffiliation || null,
    date_fin_affiliation: ui.dateFinAffiliation || null,
    salaire_cotisable: ui.salaireCotisable !== "" ? ui.salaireCotisable : null,
    taux_employeur: ui.tauxEmployeur !== "" ? ui.tauxEmployeur : null,
    montant_cotisation: ui.montantCotisation !== "" ? ui.montantCotisation : null,
    statut: ui.statut,
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

const CimrTable = forwardRef((props, ref) => {
    const {
        departementId,
        includeSubDepartments,
        getSubDepartmentIds,
        departements,
        globalSearch = "",
        isAddingEmploye,
        setIsAddingEmploye,
        filtersVisible,
        handleFiltersToggle,
        departementName = "Tous",
        preloadedEmployees = [] // Employés préchargés par le parent
    } = props;

    const { dynamicStyles } = useOpen();

    const [affiliations, setAffiliations] = useState([]);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [error, setError] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    // Initialiser avec les employés préchargés (si disponibles)
    const [allEmployeesCache, setAllEmployeesCache] = useState(preloadedEmployees);
    const [employeesList, setEmployeesList] = useState([]);

    // States pour les filtres
    const [filterEmploye, setFilterEmploye] = useState("");
    const [filterMatricule, setFilterMatricule] = useState("");
    const [filterCin, setFilterCin] = useState("");
    const [filterPoste, setFilterPoste] = useState("");
    const [filterNumeroCimr, setFilterNumeroCimr] = useState("");
    const [filterDateAffiliation, setFilterDateAffiliation] = useState("");
    const [filterDateFin, setFilterDateFin] = useState("");
    const [filterSalaire, setFilterSalaire] = useState("");
    const [filterTaux, setFilterTaux] = useState("");
    const [filterMontant, setFilterMontant] = useState("");
    const [filterStatut, setFilterStatut] = useState("");

    const [columnVisibility, setColumnVisibility] = useState({
        employe: true,
        matricule: true,
        cin: true,
        poste: true,
        numeroCimr: true,
        dateAffiliation: true,
        dateFinAffiliation: true,
        salaireCotisable: true,
        tauxEmployeur: true,
        montantCotisation: true,
        statut: true,
        ficheAffiliation: true,
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

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [editingItem, setEditingItem] = useState(null);
    const [detailItem, setDetailItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRowExpansion = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filtered = useMemo(() => {
        if (!departementId) return [];
        const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
        const numericIds = ids.map(Number);
        return affiliations.filter((a) => numericIds.includes(Number(a.departement_id)));
    }, [affiliations, departementId, includeSubDepartments, getSubDepartmentIds, departements]);

    const searched = useMemo(() => {
        let result = filtered;

        // Filtre global
        if (globalSearch && typeof globalSearch === 'string' && globalSearch.trim()) {
            const term = globalSearch.toLowerCase().trim();

            result = result.filter((row) => {
                if (!row) return false;
                return columns.some((c) => {
                    try {
                        const val = row[c.key];
                        return val != null && String(val).toLowerCase().includes(term);
                    } catch (e) {
                        return false;
                    }
                });
            });
        }

        if (filterEmploye.trim()) {
            result = result.filter(row =>
                (row.employe || "").toLowerCase().includes(filterEmploye.toLowerCase())
            );
        }

        if (filterMatricule.trim()) {
            result = result.filter(row =>
                String(row.matricule || "").toLowerCase().includes(filterMatricule.toLowerCase())
            );
        }

        if (filterCin.trim()) {
            result = result.filter(row =>
                String(row.cin || "").toLowerCase().includes(filterCin.toLowerCase())
            );
        }

        if (filterPoste.trim()) {
            result = result.filter(row =>
                String(row.poste || "").toLowerCase().includes(filterPoste.toLowerCase())
            );
        }

        if (filterNumeroCimr.trim()) {
            result = result.filter(row =>
                String(row.numeroCimr || "").toLowerCase().includes(filterNumeroCimr.toLowerCase())
            );
        }

        if (filterDateAffiliation) {
            result = result.filter(row => row.dateAffiliation === filterDateAffiliation);
        }

        if (filterDateFin) {
            result = result.filter(row => row.dateFinAffiliation === filterDateFin);
        }

        if (filterSalaire) {
            result = result.filter(row => String(row.salaireCotisable) === filterSalaire);
        }

        if (filterTaux) {
            result = result.filter(row => String(row.tauxEmployeur) === filterTaux);
        }

        if (filterMontant) {
            result = result.filter(row => String(row.montantCotisation) === filterMontant);
        }

        if (filterStatut.trim()) {
            result = result.filter(row =>
                (row.statut || "").toLowerCase() === filterStatut.toLowerCase()
            );
        }

        return result;
    }, [filtered, globalSearch, filterEmploye, filterMatricule, filterCin, filterPoste, filterNumeroCimr, filterDateAffiliation, filterDateFin, filterSalaire, filterTaux, filterMontant, filterStatut]);

    const getUniqueValues = (key) => {
        if (!filtered) return [];
        return [...new Set(filtered.map(item => item[key]).filter(val => val !== null && val !== undefined && val !== ""))].sort((a, b) => {
            // Try numeric sort first
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            // Fallback to string sort
            return String(a).localeCompare(String(b));
        });
    };

    const uniqueEmployees = useMemo(() => getUniqueValues('employe'), [filtered]);
    const uniqueMatricules = useMemo(() => getUniqueValues('matricule'), [filtered]);
    const uniqueCins = useMemo(() => getUniqueValues('cin'), [filtered]);
    const uniquePostes = useMemo(() => getUniqueValues('poste'), [filtered]);
    const uniqueNumerosCimr = useMemo(() => getUniqueValues('numeroCimr'), [filtered]);
    const uniqueDatesAff = useMemo(() => getUniqueValues('dateAffiliation'), [filtered]);
    const uniqueDatesFin = useMemo(() => getUniqueValues('dateFinAffiliation'), [filtered]);
    const uniqueSalaires = useMemo(() => getUniqueValues('salaireCotisable'), [filtered]);
    const uniqueTaux = useMemo(() => getUniqueValues('tauxEmployeur'), [filtered]);
    const uniqueMontants = useMemo(() => getUniqueValues('montantCotisation'), [filtered]);
    const uniqueStatuts = useMemo(() => getUniqueValues('statut'), [filtered]);

    const highlightText = useCallback((text, searchTerm) => {
        if (!text || !searchTerm) return text;

        const textStr = String(text);
        const searchTermLower = searchTerm.toLowerCase();

        if (!textStr.toLowerCase().includes(searchTermLower)) return textStr;

        const parts = textStr.split(new RegExp(`(${searchTerm})`, 'gi'));

        return parts.map((part, i) =>
            part.toLowerCase() === searchTermLower
                ? <mark key={i} style={{ backgroundColor: 'yellow', padding: 0 }}>{part}</mark>
                : part
        );
    }, []);

    const onSave = (newData, isFormData = false) => {
        let request;

        if (isFormData) {
            // FormData is being sent (with file upload)
            newData.append('departement_id', departementId || '');

            const config = {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            request = editingItem
                ? axios.post(`http://127.0.0.1:8000/api/cimr-affiliations/${editingItem.id}?_method=PUT`, newData, config)
                : axios.post("http://127.0.0.1:8000/api/cimr-affiliations", newData, config);
        } else {
            // Regular object
            const payload = mapUiToApi(newData, departementId);
            console.log("Payload CIMR envoyé:", payload);

            request = editingItem
                ? axios.put(`http://127.0.0.1:8000/api/cimr-affiliations/${editingItem.id}`, payload, { withCredentials: true })
                : axios.post("http://127.0.0.1:8000/api/cimr-affiliations", payload, { withCredentials: true });
        }

        request
            .then((res) => {
                // Afficher le message de succès immédiatement
                Swal.fire({
                    icon: 'success',
                    title: 'Succès',
                    text: editingItem ? 'Affiliation modifiée avec succès' : 'Affiliation enregistrée avec succès',
                    timer: 1500,
                    showConfirmButton: false
                });
                handleClose();
                // Mise à jour optimiste
                const mapped = mapApiToUi(res.data);
                if (editingItem) {
                    setAffiliations(prev => prev.map(a => a.id === mapped.id ? mapped : a));
                } else {
                    setAffiliations(prev => [mapped, ...prev]);
                }
                // Invalider le cache (+ eligibles dérivés)
                localStorage.removeItem('cimrAffiliationsCache');
                localStorage.removeItem('eligibleEmployeesCache');
            })
            .catch((err) => {
                console.error(err);
                const errors = err.response?.data?.errors;
                const serverMsg = err.response?.data?.message;
                let messages = serverMsg || "Impossible d'enregistrer l'affiliation.";
                if (errors) {
                    messages = Object.values(errors).flat().join('\n');
                }
                Swal.fire({ icon: 'error', title: 'Erreur', text: messages });
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
                axios.delete(`http://127.0.0.1:8000/api/cimr-affiliations/${id}`, { withCredentials: true })
                    .then(() => {
                        setAffiliations(prev => prev.filter(a => a.id !== id));
                        Swal.fire('Supprimé!', 'L\'affiliation a été supprimée.', 'success');
                    })
                    .catch(err => {
                        console.error(err);
                        Swal.fire('Erreur', 'Impossible de supprimer.', 'error');
                    });
            }
        })
    };

    const handleDeleteSelected = useCallback(async () => {
        if (selectedItems.length === 0) return;

        const result = await Swal.fire({
            title: "Êtes-vous sûr?",
            text: `Vous allez supprimer ${selectedItems.length} affiliation(s)!`,
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
                    selectedItems.map(id => axios.delete(`http://127.0.0.1:8000/api/cimr-affiliations/${id}`, { withCredentials: true }))
                );

                setAffiliations(prev => prev.filter(a => !selectedItems.includes(a.id)));
                setSelectedItems([]);
                Swal.fire("Supprimés!", "Les affiliations ont été supprimées.", "success");
            } catch (error) {
                console.error("Error deleting selected affiliations:", error);
                Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
            }
        }
    }, [selectedItems]);

    const handleEdit = (row) => {
        setEditingItem(row);
        setIsAddingEmploye(true);
    };

    const handleDeleteItem = (row) => {
        handleDelete(row.id);
    };

    const columns_config = useMemo(() => [
        { key: 'employe', label: "Employé", visible: columnVisibility.employe },
        { key: 'matricule', label: "Matricule", visible: columnVisibility.matricule },
        { key: 'cin', label: "CIN", visible: columnVisibility.cin },
        { key: 'poste', label: "Poste", visible: columnVisibility.poste },
        { key: 'numeroCimr', label: "Numéro CIMR", visible: columnVisibility.numeroCimr },
        {
            key: 'dateAffiliation',
            label: "Date Affiliation",
            visible: columnVisibility.dateAffiliation,
            render: (row) => formatDate(row.dateAffiliation)
        },
        {
            key: 'dateFinAffiliation',
            label: "Date Fin",
            visible: columnVisibility.dateFinAffiliation,
            render: (row) => formatDate(row.dateFinAffiliation)
        },
        { key: 'salaireCotisable', label: "Salaire Cotisable", visible: columnVisibility.salaireCotisable },
        { key: 'tauxEmployeur', label: "Taux Employeur", visible: columnVisibility.tauxEmployeur },
        { key: 'montantCotisation', label: "Montant", visible: columnVisibility.montantCotisation },
        { key: 'statut', label: "Statut", visible: columnVisibility.statut },
        {
            key: 'ficheAffiliation',
            label: "Document",
            visible: columnVisibility.ficheAffiliation,
            render: (row) => {
                if (!row.ficheAffiliation) return '-';

                // Parse JSON si c'est un tableau
                let files = [];
                try {
                    files = JSON.parse(row.ficheAffiliation);
                    if (!Array.isArray(files)) files = [row.ficheAffiliation];
                } catch (e) {
                    // Si ce n'est pas du JSON, c'est un ancien format (simple string)
                    files = [row.ficheAffiliation];
                }

                if (files.length === 0) return '-';

                return (
                    <div className="d-flex align-items-center gap-1">
                        {files.length === 1 ? (
                            <a
                                href={`http://127.0.0.1:8000/storage/${files[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#2c767c' }}
                                title="Voir le document"
                            >
                                <FontAwesomeIcon icon={faFile} />
                            </a>
                        ) : (
                            <span
                                style={{
                                    backgroundColor: '#2c767c',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem'
                                }}
                                title={`${files.length} fichiers joints`}
                            >
                                <FontAwesomeIcon icon={faFile} className="me-1" />
                                {files.length}
                            </span>
                        )}
                    </div>
                );
            }
        },
    ], [columnVisibility]);

    const table_columns = columns_config.filter(col => col.visible);

    const handleViewDetail = (row) => {
        setDetailItem(row);
        setShowDetailModal(true);
    };

    const renderExpandedRow = (item) => {
        let files = [];
        try {
            files = JSON.parse(item.ficheAffiliation);
            if (!Array.isArray(files)) files = item.ficheAffiliation ? [item.ficheAffiliation] : [];
        } catch (e) {
            files = item.ficheAffiliation ? [item.ficheAffiliation] : [];
        }

        return (
            <div style={{ padding: '0 16px 16px 16px', backgroundColor: '#fff' }}>
                <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#fff',
                    }}>
                        <FontAwesomeIcon icon={faFile} style={{ color: '#6b7280', fontSize: '14px' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            DOCUMENTS DE L'AFFILIATION
                        </span>
                    </div>
                    {/* Table documents */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Fichier</th>
                                <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan={2} style={{ padding: '12px 16px', color: '#9ca3af', fontStyle: 'italic' }}>Aucun document joint</td>
                                </tr>
                            ) : (
                                files.map((file, idx) => {
                                    const fileName = file.split('/').pop();
                                    const fileUrl = `http://127.0.0.1:8000/storage/${file}`;
                                    return (
                                        <tr key={idx} style={{ borderBottom: idx < files.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                            <td style={{ padding: '10px 16px', color: '#111827' }}>{fileName}</td>
                                            <td style={{ padding: '10px 16px' }}>
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" title="Voir">
                                                    <FontAwesomeIcon icon={faEye} style={{ color: '#17a2b8', fontSize: '15px' }} />
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderCustomActions = (item) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion(item.id);
            }}
            aria-label="Voir documents"
            title="Voir documents"
            style={{
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
            }}
        >
            <FontAwesomeIcon icon={faEye} style={{ color: expandedRows[item.id] ? '#0e7490' : '#17a2b8', fontSize: '14px' }} />
        </button>
    );

    const handleSelectAllChange = (checked) => {
        if (checked) {
            setSelectedItems(searched.map(a => a.id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleCheckboxChange = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const loadData = useCallback(() => {
        // Charger depuis le cache d'abord pour affichage immédiat
        const cached = localStorage.getItem('cimrAffiliationsCache');
        if (cached) {
            try {
                setAffiliations(JSON.parse(cached));
                setLoading(false);
            } catch (e) { /* ignore parse error */ }
        }

        // Puis mettre à jour depuis l'API
        axios
            .get("http://127.0.0.1:8000/api/cimr-affiliations", { withCredentials: true })
            .then((res) => {
                const payload = Array.isArray(res.data) ? res.data : [];
                const mapped = payload.map(mapApiToUi);
                setAffiliations(mapped);
                localStorage.setItem('cimrAffiliationsCache', JSON.stringify(mapped));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Mettre à jour le cache si les employés préchargés changent
    useEffect(() => {
        if (preloadedEmployees && preloadedEmployees.length > 0) {
            setAllEmployeesCache(preloadedEmployees);
        }
    }, [preloadedEmployees]);

    // Charger les employés seulement si pas déjà préchargés
    useEffect(() => {
        if (allEmployeesCache.length > 0) return; // Déjà préchargés
        axios.get("http://127.0.0.1:8000/api/employes/light", { withCredentials: true })
            .then(res => {
                let emps = res.data;
                if (!Array.isArray(emps)) emps = [];
                setAllEmployeesCache(emps);
            })
            .catch(err => console.error("Error fetching employees:", err));
    }, [allEmployeesCache.length]);

    // Filtrer les employés localement quand le département change
    useEffect(() => {
        if (!departementId) {
            setEmployeesList(allEmployeesCache);
            return;
        }
        // Filtrage local instantané (pas de requête HTTP)
        const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
        const numericIds = ids.map(Number);
        const filtered = allEmployeesCache.filter(e => numericIds.includes(Number(e.departement_id)));
        setEmployeesList(filtered);
    }, [departementId, departements, includeSubDepartments, getSubDepartmentIds, allEmployeesCache]);

    const handleClose = () => {
        setIsAddingEmploye(false);
        setEditingItem(null);
    }

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF();
        const tableColumn = columns_config.filter(col => col.visible).map(col => col.label);
        const tableRows = searched.map(row =>
            columns_config.filter(col => col.visible).map(col => row[col.key])
        );
        doc.setFontSize(18);
        doc.text(`Affiliations CIMR - ${departementName}`, 14, 22);
        doc.setFontSize(11);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
        });
        doc.save(`affiliations_cimr_${props.departementName || "tous"}_${new Date().toISOString()}.pdf`);
    }, [columns_config, searched, props.departementName]);

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
        XLSX.utils.book_append_sheet(wb, ws, "Affiliations");
        XLSX.writeFile(wb, `affiliations_cimr_${departementName}_${new Date().toISOString()}.xlsx`);
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
                <h1>Affiliations CIMR - ${departementName}</h1>
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
            {/* Flex row wrapper: table area | form/detail panel */}
            <div style={{
                display: 'flex',
                flex: 1,
                minWidth: 0,
                height: '100%',
                gap: '10px',
            }}>
                {/* Table area */}
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'auto',
                    height: '100%',
                }} className="container_employee">
                    <div className="mt-4">
                        <div className="section-header mb-3">
                            <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '16px' }}>
                                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                                    <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                                        <i className="fas fa-users me-2"></i>
                                        Gestion Affiliations CIMR
                                    </span>
                                    <p className="section-description text-muted mb-0">
                                        {searched.length} affiliation{searched.length > 1 ? 's' : ''} affichée{searched.length > 1 ? 's' : ''}
                                    </p>
                                </div>

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
                                            width: '200px',
                                            backgroundColor: '#2c767c',
                                            color: '#ffffff',
                                            border: 'none',
                                            marginRight: '10px'
                                        }}
                                    >
                                        <FaPlusCircle className="me-2" />
                                        Ajouter affiliation
                                    </Button>

                                    <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                                        <Dropdown.Toggle as="button" style={iconButtonStyle} title="Visibilité Colonnes">
                                            <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: "#4b5563" }} />
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
                                    className="filters-container"
                                >
                                    {/* Icône et titre */}
                                    <div className="filters-icon-section">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#4a90a4"
                                            strokeWidth="2"
                                            className="filters-icon"
                                        >
                                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                        </svg>
                                        <span className="filters-title">Filtres</span>
                                    </div>

                                    {/* Tous les filtres alignés */}
                                    {/* Filtre Employé */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Employé</label>
                                        <select
                                            value={filterEmploye}
                                            onChange={(e) => setFilterEmploye(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Employé</option>
                                            {uniqueEmployees.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Matricule */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Matricule</label>
                                        <select
                                            value={filterMatricule}
                                            onChange={(e) => setFilterMatricule(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Matricule</option>
                                            {uniqueMatricules.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre CIN */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>CIN</label>
                                        <select
                                            value={filterCin}
                                            onChange={(e) => setFilterCin(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">CIN</option>
                                            {uniqueCins.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Poste */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Poste</label>
                                        <select
                                            value={filterPoste}
                                            onChange={(e) => setFilterPoste(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Poste</option>
                                            {uniquePostes.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre N° CIMR */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>N° CIMR</label>
                                        <select
                                            value={filterNumeroCimr}
                                            onChange={(e) => setFilterNumeroCimr(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">N° CIMR</option>
                                            {uniqueNumerosCimr.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Date Aff. */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Date Aff.</label>
                                        <select
                                            value={filterDateAffiliation}
                                            onChange={(e) => setFilterDateAffiliation(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Date Aff.</option>
                                            {uniqueDatesAff.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Date Fin */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Date Fin</label>
                                        <select
                                            value={filterDateFin}
                                            onChange={(e) => setFilterDateFin(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Date Fin</option>
                                            {uniqueDatesFin.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Salaire */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Salaire</label>
                                        <select
                                            value={filterSalaire}
                                            onChange={(e) => setFilterSalaire(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Salaire</option>
                                            {uniqueSalaires.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Taux */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Taux</label>
                                        <select
                                            value={filterTaux}
                                            onChange={(e) => setFilterTaux(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 80,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Taux</option>
                                            {uniqueTaux.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Montant */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Montant</label>
                                        <select
                                            value={filterMontant}
                                            onChange={(e) => setFilterMontant(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Montant</option>
                                            {uniqueMontants.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Statut */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Statut</label>
                                        <select
                                            value={filterStatut}
                                            onChange={(e) => setFilterStatut(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Statut</option>
                                            {uniqueStatuts.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <ExpandRTable
                            data={searched}
                            columns={table_columns}
                            renderCustomActions={renderCustomActions}
                            highlightText={highlightText}
                            searchTerm={globalSearch}
                            selectedItems={selectedItems}
                            handleSelectAllChange={handleSelectAllChange}
                            handleCheckboxChange={handleCheckboxChange}
                            selectAll={selectedItems.length === searched.length && searched.length > 0}
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
                            expandedRows={expandedRows}
                            toggleRowExpansion={toggleRowExpansion}
                            renderExpandedRow={renderExpandedRow}
                        />
                    </div>
                </div>
                {/* end table area */}

                {isAddingEmploye && (
                    <AddCimr
                        onClose={handleClose}
                        onSave={onSave}
                        departementId={departementId}
                        initialData={editingItem}
                        preloadedEmployees={allEmployeesCache}
                    />
                )}

                {/* Panneau latéral de détail */}
                {showDetailModal && detailItem && (
                    <div className="add-accident-container shadow-lg">
                        <div style={{
                            position: 'relative',
                            background: '#ffffff',
                            borderBottom: '1px solid #e5e7eb',
                            padding: '18px 48px 18px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#111827', textAlign: 'center' }}>
                                Détail Affiliation CIMR
                            </h5>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                aria-label="Fermer"
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    lineHeight: 1,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                }}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="form-body p-4 flex-grow-1 overflow-auto">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Employé</label>
                                    <p className="fw-bold mb-0">{detailItem.employe || '-'}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Matricule</label>
                                    <p className="fw-bold mb-0">{detailItem.matricule || '-'}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">CIN</label>
                                    <p className="fw-bold mb-0">{detailItem.cin || '-'}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Poste</label>
                                    <p className="fw-bold mb-0">{detailItem.poste || '-'}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Numéro CIMR</label>
                                    <p className="fw-bold mb-0">{detailItem.numeroCimr || '-'}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Statut</label>
                                    <p className="fw-bold mb-0">
                                        <span className={`badge ${detailItem.statut === 'actif' ? 'bg-success' : 'bg-warning'}`}>
                                            {detailItem.statut}
                                        </span>
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Date Affiliation</label>
                                    <p className="fw-bold mb-0">{formatDate(detailItem.dateAffiliation)}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Date Fin Affiliation</label>
                                    <p className="fw-bold mb-0">{formatDate(detailItem.dateFinAffiliation)}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Date Embauche</label>
                                    <p className="fw-bold mb-0">{formatDate(detailItem.dateEmbauche)}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Salaire Cotisable</label>
                                    <p className="fw-bold mb-0">{detailItem.salaireCotisable || '-'}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Taux Employeur</label>
                                    <p className="fw-bold mb-0">{detailItem.tauxEmployeur || '-'}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted small">Montant Cotisation</label>
                                    <p className="fw-bold mb-0">{detailItem.montantCotisation || '-'}</p>
                                </div>
                                <div className="col-12 mt-3">
                                    <label className="form-label text-muted small">Documents Joints</label>
                                    {(() => {
                                        if (!detailItem.ficheAffiliation) {
                                            return <p className="text-muted mb-0">Aucun document joint</p>;
                                        }

                                        let files = [];
                                        try {
                                            files = JSON.parse(detailItem.ficheAffiliation);
                                            if (!Array.isArray(files)) files = [detailItem.ficheAffiliation];
                                        } catch (e) {
                                            files = [detailItem.ficheAffiliation];
                                        }

                                        if (files.length === 0) {
                                            return <p className="text-muted mb-0">Aucun document joint</p>;
                                        }

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {files.map((file, index) => {
                                                    const fileName = file.split('/').pop();
                                                    return (
                                                        <div key={index} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '8px 12px',
                                                            backgroundColor: '#f8fafc',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e2e8f0'
                                                        }}>
                                                            <FontAwesomeIcon icon={faFile} style={{ color: '#2c767c', fontSize: '1.2rem' }} />
                                                            <span style={{ flex: 1, fontSize: '0.85rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {fileName}
                                                            </span>
                                                            <a
                                                                href={`http://127.0.0.1:8000/storage/${file}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm"
                                                                style={{ backgroundColor: '#2c767c', color: 'white', borderRadius: '6px', padding: '4px 12px', fontSize: '0.75rem' }}
                                                            >
                                                                Ouvrir
                                                            </a>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="form-footer p-3 border-top d-flex justify-content-end gap-2" style={{ backgroundColor: '#f8fafc' }}>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="btn btn-light px-4 fw-bold"
                            >
                                Fermer
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleEdit(detailItem);
                                }}
                                className="btn btn-primary px-4 fw-bold d-flex align-items-center gap-2"
                                style={{ backgroundColor: '#2c767c', border: 'none' }}
                            >
                                <FontAwesomeIcon icon={faEdit} />
                                Modifier
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </ThemeProvider>
    );
});

export default CimrTable;
