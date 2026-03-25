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
import { motion, AnimatePresence } from 'framer-motion';
import Swal from "sweetalert2";
import "../Style.css";
import FinanceValider from "./FinanceValider";

const theme = createTheme();

const columns = [
    { key: "employe", label: "Employé" },
    { key: "type_contrat", label: "Type Contrat" },
    { key: "anciennete", label: "Ancienneté" },
    { key: "fonction", label: "Poste" },
    { key: "salaire_base", label: "salaire" },
    { key: "type_credit", label: "Type Crédit" },
    { key: "montant_credit", label: "Montant demandé" },
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
            {columns_config && columns_config.map(col => (
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

const FinanceTable = forwardRef((props, ref) => {
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
        fetchFinance,
        preloadedCredits = [] // Employés préchargés par le parent
    } = props;

    console.log("table :",preloadedCredits);
    const { dynamicStyles } = useOpen();

    const [affiliations,setAffiliations] = useState([]);
    const [credit, setCredit] = useState([]);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [error, setError] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    // Initialiser avec les employés préchargés (si disponibles)
    const [allEmployeesCache, setAllEmployeesCache] = useState(preloadedCredits);
    const [employeesList, setEmployeesList] = useState([]);

    console.log(allEmployeesCache)
    // States pour les filtres
    const [filterEmploye, setFilterEmploye] = useState("");
    const [filterTypeContrat, setFilterTypeContrat] = useState("");
    const [filterAncienne, setFilterAncienne] = useState("");
    const [filterFonction, setFilterFonction] = useState("");
    const [filterStatutEmploye, setFilterStatutEmploye] = useState("");
    const [filterTypeCredit, setFilterTypeCredit] = useState("");
    const [filterSalaire, setFilterSalaire] = useState("");
    const [filterMontantCredit, setFilterMontantCredit] = useState("");
    const [filterStatut, setFilterStatut] = useState("");

    const [columnVisibility, setColumnVisibility] = useState({
        employe: true,
        statut_Emp:true,
        type_contrat: true,
        anciennete: true,
        fonction: true,
        salaire: true,
        type_credit: true,
        montant_credit: true,
        date_credit: true,
        duree_demande:true,
        statut: true,
    });

    useEffect(() => {
        console.log("Type de contrat filtre ",filterTypeContrat)
    },[filterTypeContrat])

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
    const [AncienneEmployeCredit,setAncienneEmployeCredit] = useState(false);
    const [AncienneCredits,setAncienneCredits] = useState(null);

    console.log("The editing Item is ",editingItem)

    const toggleRowExpansion = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filtered = useMemo(() => {
        if (!departementId) return [];
        const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
        const numericIds = ids.map(Number);
        return preloadedCredits.filter((a) => numericIds.includes(Number(a.departement_id)));
    }, [preloadedCredits, departementId, includeSubDepartments, getSubDepartmentIds, departements]);  

    console.log('filtred search :',filtered)
    console.log('global search :',globalSearch)

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
                (row.employe).toLowerCase().includes(filterEmploye.toLowerCase())
            );
        }

        if (filterTypeContrat.trim()) {
            result = result.filter(row =>
                String(row.type_contrat || "").toLowerCase().includes(filterTypeContrat.toLowerCase())
            );
        }

        /*if (filterAncienne.trim()) {
            result = result.filter(row =>
                String(row.ancienne || "").toLowerCase().includes(filterAncienne.toLowerCase())
            );
        }*/

        if (filterFonction.trim()) {
            result = result.filter(row =>
                String(row.fonction || "").toLowerCase().includes(filterFonction.toLowerCase())
            );
        }

        if (filterStatutEmploye.trim()) {
            result = result.filter(row =>
                (row.statut_emp).toLowerCase().includes(filterStatutEmploye.toLowerCase())
            );
        }

        if (filterTypeCredit) {
            result = result.filter(row => row.type_credit === filterTypeCredit);
        }

        if (filterSalaire) {
            result = result.filter(row => String(row.salaire_base) === filterSalaire);
        }

        if (filterMontantCredit) {
            result = result.filter(row => String(row.montant_credit) === filterMontantCredit);
        }

        if (filterStatut.trim()) {
            result = result.filter(row =>
                (row.credits[0]?.statut || "").toLowerCase() === filterStatut.toLowerCase()
            );
        }

        
        return result;
    }, [filtered, globalSearch, filterEmploye, filterTypeContrat, filterAncienne, filterFonction, filterStatutEmploye, filterTypeCredit, filterSalaire, filterMontantCredit, filterStatut]);
    console.log("result :",searched)

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

    const uniqueEmployees = useMemo(() => {return [...new Set(filtered.map(row => row.employe))]; }, [filtered]);
    const uniqueContrat = useMemo(() => {return [... new Set(filtered.map(row => row.type_contrat))]}, [filtered]);
    const uniqueAncienne = useMemo(() => {return [...new Set(filtered.map(row => row.anciennete))]}, [filtered]);
    const uniquePostes = useMemo(() => {return [... new Set(filtered.map(row => row.fonction))]}, [filtered]);
    const uniqueSalaires = useMemo(() => {return [... new Set(filtered.map(row => row.salaire_base))]}, [filtered]);
    const uniqueDatesAff = useMemo(() => {return [... new Set(filtered.map(row => row.type_credit))]}, [filtered]);
    const uniqueStatutEmploye = useMemo(() => {return [... new Set(filtered.map(row => row.active ? "actif" : "Suspendu"))]}, [filtered]);
    const uniqueMontants = useMemo(() => {return [...new Set(filtered.map(row => row.montant_credit))]}, [filtered]);
    const uniqueStatuts = useMemo(() => {return [...new Set(filtered.map(row => row.statut))]}, [filtered]);

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
        if(!newData) return;

        if (isFormData) {
            const config = {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if(editingItem){
                console.log(newData)
                axios.post('http://127.0.0.1:8000/api/valide-finance',newData,config)
                .then(res => {
                    fetchFinance();
                    console.log("operation success", res.data);
                    Swal.fire({
                    title: "Bien reçu",
                    icon: 'success'
                    });
                })
                .catch(err => {
                    fetchFinance();
                    console.error("Erreur lors de l'opération :", err);
                    Swal.fire({
                    title: "Erreur",
                    text: err.response?.data?.message || err.message,
                    icon: 'error'
                });
                })
            }
        }
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
        console.log("the row:",row)
    };

    const handleAff = (row) => {
        setAncienneCredits(row);
        setAncienneEmployeCredit(true)
        console.log("Ancienne Credits :",row)
    }

    const handleDeleteItem = (row) => {
        handleDelete(row.id);
    };

    const columns_config = useMemo(() => [
        { 
            key: 'employe',
            label: "Employé", 
            visible: columnVisibility.employe,
            //render: (row) => `${row.nom} ${row.prenom}`
        },

        { 
            key: 'anciennete',
            label: "Ancienneté (Mois)", 
            visible: columnVisibility.anciennete,
            render: (row) => row.anciennete
        },
        
        {   key: 'statut_emp', 
            label: "Statut Employé", 
            visible: columnVisibility.statut_Emp,
            //render: (row) => row.active ? "actif" : "Suspendu"
        },
        
        { key: 'type_contrat', label: "Type Contrat", visible: columnVisibility.type_contrat ,render: (row) => row.contrats?.[0]?.type_contrat || "-"},
    
        {   key: 'fonction', 
            label: "Poste", 
            visible: columnVisibility.fonction,
            render: (row) => row.fonction
        },
        { 
            key: 'salaire', 
            label: "salaire", 
            visible: columnVisibility.salaire
        },
        {
            key: 'type_credit',
            label: "Type Crédit",
            visible: columnVisibility.type_credit,
            render: (row) => row.type_credit?.nom_typeCredit || "-"
        },

        {   key: 'date_credit', 
            label: "Date Demandé", 
            visible: columnVisibility.date_credit 
        },

        {
            key: 'montant_credit',
            label: "Montant demandé",
            visible: columnVisibility.montant_credit,
            render: (row) => formatDate(row.dateFinAffiliation)
        },

        {
            key: 'duree_demande',
            label: "Durée demandé",
            visible: columnVisibility.duree_demande,
            //render: (row) => formatDate(row.dateFinAffiliation)
        },
    
        {   key: 'statut_credit', 
            label: "Statut", 
            visible: columnVisibility.statut,
            render: (row) => row.statut_credit
        },

        {
            key: "actions",
            label: "Actions",
            render: (row) => (
                <div className="d-flex gap-1 justify-content-center">
                    <button
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 6px' }}
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        title="Valider les crédits"
                    >
                        <FontAwesomeIcon icon={faEdit} style={{ color: '#007bff', fontSize: '14px' }} />
                    </button>
                    {/* <button
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 6px' }}
                        //onClick={(e) => { e.stopPropagation(); handleDeletePeriod(row); }}
                        title="Supprimer la période"
                    >
                        <FontAwesomeIcon icon={faTrash} style={{ color: '#ff0000', fontSize: '14px' }} />
                    </button>*/}
                    <button
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 6px' }}
                        onClick={(e) => { e.stopPropagation(); handleAff(row);console.log("the row's",row) }}
                        title="Voir Remboursement"
                    >
                        <FontAwesomeIcon icon={faEye} style={{ color: '#17a2b8', fontSize: '14px' }} />
                    </button>
                </div>
            ),
            visible: true
        }
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

                </div>
            </div>
        );
    };

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

    // Mettre à jour le cache si les employés préchargés changent
    useEffect(() => {
        if (preloadedCredits && preloadedCredits.length > 0) {
            setAllEmployeesCache(preloadedCredits);
        }
    }, [preloadedCredits]);

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
        setAncienneEmployeCredit(false);
        setAncienneCredits(null)
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
                                        Validation de crédit
                                    </span>
                                    <p className="section-description text-muted mb-0">
                                        {searched.length} crédit {searched.length > 1 ? 's' : ''} affichée{searched.length > 1 ? 's' : ''}
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

                                    {/* Filtre Type Contrat */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Type Contrat</label>
                                        <select
                                            value={filterTypeContrat}
                                            onChange={(e) => setFilterTypeContrat(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Contrat</option>
                                            {uniqueContrat.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Anciennete */}
                                    {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Anciennete</label>
                                        <select
                                            value={filterAncienne}
                                            onChange={(e) => setFilterAncienne(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Anncienneté</option>
                                            {uniqueAncienne.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div> */}

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
                                            value={filterFonction}
                                            onChange={(e) => setFilterFonction(e.target.value)}
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

                                    {/* Filtre Statut Employé */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Statut Emp</label>
                                        <select
                                            value={filterStatutEmploye}
                                            onChange={(e) => setFilterStatutEmploye(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Statut Employé</option>
                                            {uniqueStatutEmploye.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Type Credit */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Type Crédit</label>
                                        <select
                                            value={filterTypeCredit}
                                            onChange={(e) => setFilterTypeCredit(e.target.value)}
                                            className="filter-input"
                                            style={{
                                                minWidth: 100,
                                                height: 30,
                                                fontSize: '0.9rem',
                                                padding: '2px 6px',
                                                borderRadius: 6
                                            }}
                                        >
                                            <option value="">Type crédit</option>
                                            {uniqueDatesAff.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Salaire */}
                                    {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
                                    </div> */}


                                    {/* Filtre Montant */}
                                    {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{
                                            fontSize: '0.9rem',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            fontWeight: 600,
                                            color: '#2c3e50'
                                        }}>Montant</label>
                                        <select
                                            value={filterMontantCredit}
                                            onChange={(e) => setFilterMontantCredit(e.target.value)}
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
                                    </div> */}

                                    {/* Filtre Statut */}
                                    {/*<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
                                    </div>*/}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <ExpandRTable
                            data={searched}
                            columns={table_columns}
                            //renderCustomActions={renderCustomActions}
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
                            handleDeleteSelected={handleDeleteSelected}
                            expandedRows={expandedRows}
                            renderExpandedRow={renderExpandedRow}
                            
                        />
                    </div>
                </div>
                {/* end table area */}

                {isAddingEmploye && (
                    <FinanceValider
                        onClose={handleClose}
                        onSave={onSave}
                        departementId={departementId}
                        initialData={editingItem}
                        preloadedEmployees={allEmployeesCache}
                        mode={true}
                    />
                )}

                {/* Panneau latéral de détail */}
                {AncienneEmployeCredit && (
                    <FinanceValider
                        onClose={handleClose}
                        onSave={onSave}
                        departementId={departementId}
                        initialData={AncienneCredits}
                        preloadedEmployees={allEmployeesCache}
                        mode={false}
                    />
                )}
                
            </div>
        </ThemeProvider>
    );
});

export default FinanceTable;
