import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Dropdown, Form } from "react-bootstrap";
import { faEdit, faTrash, faSliders, faFilter, faClose, faEye, faFileInvoiceDollar, faUsers, faMoneyBillWave, faChartLine, faSpinner, faChartBar } from "@fortawesome/free-solid-svg-icons";
import { BarChart2 } from 'lucide-react';
import { BarChart } from "@mui/x-charts/BarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaPlusCircle } from "react-icons/fa";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useOpen } from "../../Acceuil/OpenProvider";
import ExpandRTable from "../Shared/ExpandRTable";
import AddCimrDeclaration from "./AddCimrDeclaration";
import { motion, AnimatePresence } from 'framer-motion';
import Swal from "sweetalert2";
import "../Style.css";

const theme = createTheme();

// Couleurs modernes pour les statuts (Style Image 2)
const statusStyles = {
    paye: {
        bg: '#e6f4ea',
        color: '#1e7e34',
        label: 'PAYE',
    },
    declare: {
        bg: '#e1f5fe',
        color: '#0288d1',
        label: 'DECLARE',
    },
    a_declarer: {
        bg: '#fff7ed',
        color: '#c2410c',
        label: 'A_DECLARER',
    }
};

const getStatusBadge = (status) => {
    const style = statusStyles[status] || statusStyles.a_declarer;
    return (
        <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        }}>
            {style.label}
        </span>
    );
}

const mapApiToUi = (api) => ({
    id: api.id,
    employe: api.employe,
    matricule: api.matricule,
    mois: api.mois,
    annee: api.annee,
    montant: api.montant_cimr_employeur,
    statut: api.statut,
    departement_id: api.departement_id
});

const mapUiToApi = (ui, deptId) => ({
    departement_id: deptId || ui.departement_id || null,
    employe: ui.employe,
    matricule: ui.matricule,
    mois: ui.mois ? parseInt(ui.mois) : null,
    annee: ui.annee ? parseInt(ui.annee) : null,
    montant_cimr_employeur: (ui.montant_cimr_employeur !== undefined && ui.montant_cimr_employeur !== "" && ui.montant_cimr_employeur !== null)
        ? parseFloat(ui.montant_cimr_employeur)
        : null,
    statut: ui.statut,
});

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

const CimrDeclarationTable = forwardRef((props, ref) => {
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
        departementName = "Tous"
    } = props;

    const { dynamicStyles } = useOpen();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [editingItem, setEditingItem] = useState(null);
    const [sideDetailRow, setSideDetailRow] = useState(null);
    const [isManagingEmployees, setIsManagingEmployees] = useState(false);
    const [addEmpSearch, setAddEmpSearch] = useState('');
    const [addEmpSelectedIds, setAddEmpSelectedIds] = useState([]);
    const [manageStatut, setManageStatut] = useState('');
    const [manageStatutLoading, setManageStatutLoading] = useState(false);
    const [showCharts, setShowCharts] = useState(false);
    const [addingEmpLoading, setAddingEmpLoading] = useState(false);
    const [manageEligibleEmps, setManageEligibleEmps] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filtersVisibleLocal, setFiltersVisibleLocal] = useState(false);
    const detailAbortRef = useRef(null);
    const fetchingDetailRef = useRef(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // States pour les filtres
    const [filterAnnee, setFilterAnnee] = useState("");
    const [filterMois, setFilterMois] = useState("");
    const [filterNbEmploye, setFilterNbEmploye] = useState("");
    const [filterStatut, setFilterStatut] = useState("");

    const CACHE_KEY = 'cimrDeclarationsCache';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const loadData = useCallback((silent = false) => {
        // Lire le cache — vérifier que le format est bien { data, timestamp }
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Vérifier que c'est le bon format (pas un vieux tableau plat)
                if (parsed && parsed.data && Array.isArray(parsed.data)) {
                    setData(parsed.data);
                    setLoading(false);
                    // Cache encore frais et appel silencieux → pas besoin de refetch
                    if (silent && Date.now() - parsed.timestamp < CACHE_TTL) return;
                } else {
                    // Mauvais format → effacer
                    localStorage.removeItem(CACHE_KEY);
                }
            }
        } catch (e) {
            localStorage.removeItem(CACHE_KEY);
        }

        setLoading(true);
        axios.get("http://127.0.0.1:8000/api/cimr-declarations?summary=1", { withCredentials: true })
            .then((res) => {
                const mapped = (res.data || []).map(item => ({
                    ...item,
                    id: `${item.mois}-${item.annee}-${item.statut}`
                }));
                setData(mapped);
                setLoading(false);
                setError("");
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: mapped, timestamp: Date.now() }));
                } catch (e) { /* ignore */ }
            })
            .catch((err) => {
                console.error("Erreur chargement déclarations:", err);
                setError("Erreur lors du chargement des données.");
                setLoading(false);
            });
    }, []);

    const fetchDetails = async (mois, annee, signal) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/cimr-declarations?mois=${mois}&annee=${annee}`, { withCredentials: true, signal });
            return res.data;
        } catch (err) {
            if (axios.isCancel(err)) return null;
            console.error(err);
            return [];
        }
    };

    const handleShowSideDetails = async (row) => {
        // Annuler requête précédente
        if (detailAbortRef.current) detailAbortRef.current.abort();
        const controller = new AbortController();
        detailAbortRef.current = controller;

        setEditingItem(null);
        setSideDetailRow(row);
        setIsAddingEmploye(false);
        setIsManagingEmployees(false);

        // Si déjà en cache, pas besoin de spinner
        const cached = data.find(r => r.id === row.id);
        if (cached && cached.details) return;

        setDetailLoading(true);
        const details = await fetchDetailsIfNeeded(row.id, row.mois, row.annee, controller.signal);

        // Ne mettre à jour que si cette requête est encore la plus récente
        if (detailAbortRef.current !== controller) return;
        setDetailLoading(false);
        if (details) {
            setSideDetailRow(prev => prev ? { ...prev, details } : null);
        }
    };

    const handleManageEmployees = async (row) => {
        if (detailAbortRef.current) detailAbortRef.current.abort();
        const controller = new AbortController();
        detailAbortRef.current = controller;

        setEditingItem(null);
        setSideDetailRow(row);
        setIsAddingEmploye(false);
        setIsManagingEmployees(true);
        setAddEmpSearch('');
        setAddEmpSelectedIds([]);
        setManageStatut(row.statut || 'a_declarer');

        // Charger la liste des employés éligibles depuis le cache
        try {
            const cached = localStorage.getItem('employeesLightCache');
            if (cached) {
                setManageEligibleEmps(JSON.parse(cached));
            } else {
                axios.get('http://127.0.0.1:8000/api/employes/light', { withCredentials: true })
                    .then(r => {
                        const emps = Array.isArray(r.data) ? r.data : [];
                        setManageEligibleEmps(emps);
                        localStorage.setItem('employeesLightCache', JSON.stringify(emps));
                    }).catch(() => { });
            }
        } catch (e) { }

        const cachedRow = data.find(r => r.id === row.id);
        if (cachedRow && cachedRow.details) return;

        setDetailLoading(true);
        const details = await fetchDetailsIfNeeded(row.id, row.mois, row.annee, controller.signal);
        if (detailAbortRef.current !== controller) return;
        setDetailLoading(false);
        if (details) {
            setSideDetailRow(prev => prev ? { ...prev, details } : null);
        }
    };

    const handleDeleteFromManage = (id) => {
        Swal.fire({
            title: 'Retirer cet employé?',
            text: 'Cette déclaration sera supprimée pour cette période.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Oui, retirer',
            cancelButtonText: 'Annuler',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                await axios.delete(`http://127.0.0.1:8000/api/cimr-declarations/${id}`, { withCredentials: true });
                localStorage.removeItem('cimrDeclarationsCache');
                // Refresh details dans le panel
                setSideDetailRow(prev => {
                    if (!prev) return prev;
                    const newDetails = (prev.details || []).filter(d => d.id !== id);
                    return { ...prev, details: newDetails, employee_count: newDetails.length };
                });
                setData(prev => prev.map(r => {
                    if (r.id !== sideDetailRow?.id) return r;
                    const removedDetail = (r.details || []).find(d => d.id === id);
                    const removedMontant = parseFloat(removedDetail?.montant_cimr_employeur || 0);
                    return {
                        ...r,
                        details: (r.details || []).filter(d => d.id !== id),
                        employee_count: ((r.employee_count || 1) - 1),
                        total_montant: Math.max(0, parseFloat(r.total_montant || 0) - removedMontant)
                    };
                }));
                Swal.fire({ icon: 'success', title: 'Retiré!', timer: 1000, showConfirmButton: false });
            } catch (err) {
                Swal.fire('Erreur', 'Impossible de retirer cet employé.', 'error');
            }
        });
    };

    const handleAddEmployee = async () => {
        if (!addEmpSelectedIds.length || !sideDetailRow) return;
        setAddingEmpLoading(true);
        try {
            const affs = JSON.parse(localStorage.getItem('cimrAffiliationsCache') || '[]');
            const toAdd = manageEligibleEmps.filter(e => addEmpSelectedIds.includes(String(e.id)));
            const payloads = toAdd.map(emp => {
                const nom = `${emp.prenom || ''} ${emp.nom || ''}`.trim();
                const aff = affs.find(a => String(a.employe_id) === String(emp.id));
                const montant = (aff && emp.salaire_brut)
                    ? Math.round(parseFloat(emp.salaire_brut) * parseFloat(aff.taux_patronal || 0) / 100)
                    : 0;
                return {
                    employe: nom,
                    matricule: emp.matricule,
                    departement_id: emp.departement_id || departementId,
                    mois: sideDetailRow.mois,
                    annee: sideDetailRow.annee,
                    montant_cimr_employeur: montant,
                    statut: sideDetailRow.statut,
                };
            });

            const results = await Promise.all(
                payloads.map(p => axios.post('http://127.0.0.1:8000/api/cimr-declarations', p, { withCredentials: true }))
            );
            const newDetails = results.map(r => r.data);

            setSideDetailRow(prev => {
                if (!prev) return prev;
                const merged = [...(prev.details || []), ...newDetails];
                return { ...prev, details: merged, employee_count: merged.length };
            });
            setData(prev => prev.map(r =>
                r.id === sideDetailRow.id
                    ? {
                        ...r,
                        details: [...(r.details || []), ...newDetails],
                        employee_count: (parseInt(r.employee_count || 0) + newDetails.length),
                        total_montant: parseFloat(r.total_montant || 0) + newDetails.reduce((s, d) => s + parseFloat(d.montant_cimr_employeur || 0), 0)
                    }
                    : r
            ));
            localStorage.removeItem('cimrDeclarationsCache');
            setAddEmpSelectedIds([]);
            Swal.fire({ icon: 'success', title: `${newDetails.length} employé(s) ajouté(s)!`, timer: 1200, showConfirmButton: false });
        } catch (err) {
            Swal.fire('Erreur', "Impossible d'ajouter les employés.", 'error');
        } finally {
            setAddingEmpLoading(false);
        }
    };

    const fetchDetailsIfNeeded = async (rowId, mois, annee, signal) => {
        const row = data.find(r => r.id === rowId);
        if (row && row.details) return row.details;

        const details = await fetchDetails(mois, annee, signal);
        if (details === null) return null; // aborted
        if (rowId) {
            setData(prev => prev.map(r =>
                (r.id === rowId) ? { ...r, details } : r
            ));
        }
        return details;
    };

    const [columnVisibility, setColumnVisibility] = useState({
        periode: true,
        employee_count: true,
        total_montant: true,
        statut: true,
    });

    const highlightText = useCallback((text, searchTerm) => {
        if (!text) return "";
        const textStr = String(text);
        if (!searchTerm) {
            return textStr;
        }

        try {
            const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const parts = textStr.split(new RegExp(`(${escapedSearchTerm})`, 'gi'));

            return (
                <span>
                    {parts.map((part, i) =>
                        part.toLowerCase() === searchTerm.toLowerCase()
                            ? <span key={i} style={{ backgroundColor: 'yellow', fontWeight: 'bold' }}>{part}</span>
                            : part
                    )}
                </span>
            );
        } catch (e) {
            return textStr;
        }
    }, []);

    const handleDeleteIndividual = (id) => {
        Swal.fire({
            title: 'Êtes-vous sûr?',
            text: "Cette action supprimera cette déclaration spécifique.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2c767c',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer !'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`http://127.0.0.1:8000/api/cimr-declarations/${id}`, { withCredentials: true })
                    .then(() => {
                        localStorage.removeItem('cimrDeclarationsCache');
                        loadData();
                        Swal.fire('Supprimé!', 'Déclaration supprimée.', 'success');
                    })
                    .catch(err => Swal.fire('Erreur', 'Impossible de supprimer.', 'error'));
            }
        });
    };

    const handleEditPeriod = async (row) => {
        const { value: newStatut } = await Swal.fire({
            title: `Modifier la période ${row.mois}/${row.annee}`,
            text: `Changer le statut de ${row.employee_count} déclaration(s)`,
            input: 'select',
            inputOptions: {
                'a_declarer': 'À Déclarer',
                'declare': 'Déclaré',
                'paye': 'Payé'
            },
            inputValue: row.statut,
            showCancelButton: true,
            confirmButtonColor: '#2c767c',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Modifier',
            cancelButtonText: 'Annuler',
            inputValidator: (value) => {
                if (!value) {
                    return 'Veuillez sélectionner un statut';
                }
            }
        });

        if (newStatut) {
            // Mise à jour optimiste immédiate de l'UI
            setData(prev => prev.map(r =>
                r.mois === row.mois && r.annee === row.annee && r.statut === row.statut
                    ? { ...r, statut: newStatut }
                    : r
            ));

            try {
                // 1 seul appel API (UPDATE WHERE mois=X AND annee=Y AND statut=old)
                const res = await axios.post(
                    'http://127.0.0.1:8000/api/cimr-declarations/update-by-period',
                    { mois: row.mois, annee: row.annee, statut: newStatut, old_statut: row.statut },
                    { withCredentials: true }
                );
                // Invalider le cache des détails pour cette période
                setData(prev => prev.map(r =>
                    r.mois === row.mois && r.annee === row.annee
                        ? { ...r, details: undefined }
                        : r
                ));
                Swal.fire({
                    icon: 'success',
                    title: 'Modifié!',
                    text: `${res.data?.updated ?? ''} déclaration(s) mise(s) à jour.`,
                    timer: 1200,
                    showConfirmButton: false
                });
            } catch (err) {
                // Rollback optimiste
                setData(prev => prev.map(r =>
                    r.mois === row.mois && r.annee === row.annee && r.statut === newStatut
                        ? { ...r, statut: row.statut }
                        : r
                ));
                console.error('Erreur modification période:', err);
                Swal.fire('Erreur', 'Impossible de modifier la période.', 'error');
            }
        }
    };

    const handleDeletePeriod = (row) => {
        Swal.fire({
            title: 'Supprimer toute la période?',
            text: `Toutes les déclarations de ${row.mois}/${row.annee} seront supprimées.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, tout supprimer !'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post("http://127.0.0.1:8000/api/cimr-declarations/delete-by-period", {
                    mois: row.mois,
                    annee: row.annee
                }, { withCredentials: true })
                    .then(() => {
                        localStorage.removeItem('cimrDeclarationsCache');
                        loadData();
                        Swal.fire('Supprimé!', 'La période a été supprimée.', 'success');
                    })
                    .catch(err => Swal.fire('Erreur', 'Échec de la suppression groupée.', 'error'));
            }
        });
    };

    const handleDeleteSelected = useCallback(async () => {
        if (selectedItems.length === 0) return;

        const result = await Swal.fire({
            title: "Êtes-vous sûr?",
            text: `Vous allez supprimer ${selectedItems.length} période(s) de déclaration!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Oui, tout supprimer!",
            cancelButtonText: "Annuler",
        });
        if (result.isConfirmed) {
            try {
                // Since selectedItems contains 'mois-annee' strings (e.g. '1-2024')
                const promises = selectedItems.map(item => {
                    const [mois, annee, statut] = item.split('-');
                    return axios.post("http://127.0.0.1:8000/api/cimr-declarations/delete-by-period", {
                        mois: parseInt(mois),
                        annee: parseInt(annee),
                        statut: statut
                    }, { withCredentials: true });
                });

                await Promise.all(promises);

                setData(prev => prev.filter(a => !selectedItems.includes(a.id)));
                setSelectedItems([]);
                Swal.fire("Supprimés!", "Les périodes sélectionnées ont été supprimées.", "success");
            } catch (error) {
                console.error("Error deleting selected declarations:", error);
                Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
            }
        }
    }, [selectedItems]);

    const columns_config = useMemo(() => [
        {
            key: "periode",
            label: "Période",
            render: (row, searchTerm) => {
                const text = `${row.mois}/${row.annee}`;
                // Use the searchTerm passed from ExpandRTable if available, otherwise fallback to globalSearch
                // But ExpandRTable passes searchTerm.
                // However, render signature in ExpandRTable is (item, searchTerm, toggleRowExpansion)
                // So the second arg IS searchTerm.
                return highlightText(text, searchTerm || globalSearch);
            },
            visible: columnVisibility.periode
        },
        {
            key: "employee_count",
            label: "Nombre d'employés",
            align: "center",
            render: (row, searchTerm) => highlightText(String(row.employee_count), searchTerm || globalSearch),
            visible: columnVisibility.employee_count
        },
        {
            key: "total_montant",
            label: "Montant Total",
            render: (row, searchTerm) => {
                const text = `${parseFloat(row.total_montant || 0).toLocaleString()} DH`;
                return highlightText(text, searchTerm || globalSearch);
            },
            align: "right",
            visible: columnVisibility.total_montant
        },
        {
            key: "statut",
            label: "Statut",
            render: (row) => getStatusBadge(row.statut),
            visible: columnVisibility.statut
        },
        {
            key: "actions",
            label: "Actions",
            render: (row) => (
                <div className="d-flex gap-1 justify-content-center">
                    <button
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 6px' }}
                        onClick={(e) => { e.stopPropagation(); handleManageEmployees(row); }}
                        title="Gérer les employés"
                    >
                        <FontAwesomeIcon icon={faEdit} style={{ color: '#007bff', fontSize: '14px' }} />
                    </button>
                    <button
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 6px' }}
                        onClick={(e) => { e.stopPropagation(); handleDeletePeriod(row); }}
                        title="Supprimer la période"
                    >
                        <FontAwesomeIcon icon={faTrash} style={{ color: '#ff0000', fontSize: '14px' }} />
                    </button>
                    <button
                        style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 6px' }}
                        onClick={(e) => { e.stopPropagation(); handleShowSideDetails(row); }}
                        title="Voir détails"
                    >
                        <FontAwesomeIcon icon={faEye} style={{ color: '#17a2b8', fontSize: '14px' }} />
                    </button>
                </div>
            ),
            visible: true
        }
    ], [columnVisibility, globalSearch, highlightText]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (!item) return false;

            const searchLower = (globalSearch || "").toLowerCase();
            let matchesGlobal = true;

            if (searchLower) {
                // Recherche dynamique sur toutes les colonnes visibles/configurées
                matchesGlobal = (columns_config || []).some(col => {
                    try {
                        // Ignorer la colonne Actions
                        if (col.key === 'actions') return false;

                        // Cas particuliers pour periode (mois/annee)
                        if (col.key === 'periode') {
                            const periodeStr = `${item.mois}/${item.annee}`;
                            // Force strict string conversion
                            return String(periodeStr).toLowerCase().includes(searchLower);
                        }

                        // Cas particulier pour le montant formaté
                        if (col.key === 'total_montant') {
                            const montantRaw = item.total_montant || 0;
                            const montantFormatted = `${parseFloat(montantRaw).toLocaleString()} DH`;
                            // On cherche dans le brut OU le formaté
                            // Clean spaces (some locales use non-breaking spaces)
                            const cleanFormatted = montantFormatted.replace(/\s/g, ' ');
                            return String(montantRaw).toLowerCase().includes(searchLower) ||
                                cleanFormatted.toLowerCase().includes(searchLower);
                        }

                        // Si la colonne a une valeur directe dans item
                        if (Object.prototype.hasOwnProperty.call(item, col.key)) {
                            const val = item[col.key];
                            if (val == null) return false;
                            return String(val).toLowerCase().includes(searchLower);
                        }

                        return false;
                    } catch (e) {
                        return false;
                    }
                });
            }

            const matchesAnnee = filterAnnee ? item.annee.toString().includes(filterAnnee) : true;
            const matchesMois = filterMois ? item.mois.toString() === filterMois : true;
            const matchesNbEmploye = filterNbEmploye ? (parseInt(item.employee_count || 0) >= parseInt(filterNbEmploye)) : true;
            const matchesStatut = filterStatut ? (item.statut === filterStatut) : true;

            return matchesGlobal && matchesAnnee && matchesMois && matchesNbEmploye && matchesStatut;
        });
    }, [data, globalSearch, filterAnnee, filterMois, filterNbEmploye, filterStatut, columns_config]);

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsManagingEmployees(false);
        setIsAddingEmploye(true);
    };

    const handleSelectAllChange = (checked) => {
        if (checked) {
            setSelectedItems(data.map(d => d.id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleCheckboxChange = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const onSave = (newData) => {
        if (Array.isArray(newData)) {
            const payloads = newData.map(item => mapUiToApi(item, null));
            axios.post("http://127.0.0.1:8000/api/cimr-declarations", payloads, { withCredentials: true })
                .then(() => {
                    Swal.fire({ icon: 'success', title: 'Succès', text: 'Déclarations créées avec succès', timer: 1500, showConfirmButton: false });
                    handleClose();
                    localStorage.removeItem('cimrDeclarationsCache');
                    loadData();
                })
                .catch(err => Swal.fire('Erreur', 'Erreur lors de la création', 'error'));
        } else {
            const payload = mapUiToApi(newData, null);
            const request = editingItem
                ? axios.put(`http://127.0.0.1:8000/api/cimr-declarations/${editingItem.id}`, payload, { withCredentials: true })
                : axios.post("http://127.0.0.1:8000/api/cimr-declarations", payload, { withCredentials: true });

            request
                .then(() => {
                    // Afficher le message immédiatement
                    Swal.fire({ icon: 'success', title: 'Succès', text: editingItem ? 'Modifié' : 'Ajouté', timer: 1500, showConfirmButton: false });
                    handleClose();
                    // Recharger en arrière-plan
                    localStorage.removeItem('cimrDeclarationsCache');
                    loadData();
                })
                .catch(err => Swal.fire('Erreur', 'Une erreur est survenue', 'error'));
        }
    };

    useEffect(() => { loadData(); }, [loadData]);

    const handleClose = () => {
        setIsAddingEmploye(false);
        setEditingItem(null);
        setSideDetailRow(null);
        setIsManagingEmployees(false);
        setAddEmpSearch('');
        setAddEmpSelectedIds([]);
        setManageStatut('');
    };

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF();
        const tableColumn = columns_config.filter(col => col.visible && col.key !== 'actions').map(col => col.label);
        const tableRows = data.map(row =>
            columns_config.filter(col => col.visible && col.key !== 'actions').map(col => {
                if (col.key === 'periode') return `${row.mois}/${row.annee}`;
                if (col.key === 'total_montant') return `${parseFloat(row.total_montant || 0).toLocaleString()} DH`;
                return row[col.key];
            })
        );
        doc.setFontSize(18);
        doc.text(`Déclarations CIMR`, 14, 22);
        doc.setFontSize(11);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
        });
        doc.save(`declarations_cimr_${new Date().toISOString()}.pdf`);
    }, [columns_config, data]);

    const exportToExcel = useCallback(() => {
        const ws = XLSX.utils.json_to_sheet(
            data.map(row => {
                const item = {};
                columns_config.forEach(col => {
                    if (col.visible && col.key !== 'actions') {
                        if (col.key === 'periode') item[col.label] = `${row.mois}/${row.annee}`;
                        else if (col.key === 'total_montant') item[col.label] = row.total_montant;
                        else item[col.label] = row[col.key];
                    }
                });
                return item;
            })
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Déclarations");
        XLSX.writeFile(wb, `declarations_cimr_${new Date().toISOString()}.xlsx`);
    }, [columns_config, data]);

    const handlePrint = useCallback(() => {
        const printWindow = window.open("", "_blank");
        const tableColumn = columns_config.filter(col => col.visible && col.key !== 'actions').map(col => col.label);
        const tableRows = data.map(row =>
            columns_config.filter(col => col.visible && col.key !== 'actions').map(col => {
                if (col.key === 'periode') return `${row.mois}/${row.annee}`;
                if (col.key === 'total_montant') return `${parseFloat(row.total_montant || 0).toLocaleString()} DH`;
                return row[col.key];
            })
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
                <h1>Déclarations CIMR</h1>
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
    }, [columns_config, data]);

    useImperativeHandle(ref, () => ({
        exportToPDF,
        exportToExcel,
        handlePrint
    }), [exportToPDF, exportToExcel, handlePrint]);

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

    const table_columns = useMemo(() => columns_config.filter(col => col.visible), [columns_config]);

    return (
        <ThemeProvider theme={theme}>
            <style>
                {`
                    .with-split-view .add-accident-container {
                        position: relative !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        box-shadow: none !important;
                        animation: none !important;
                    }
                `}
            </style>
            <div style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                gap: '10px',
            }} className="with-split-view">
                {/* Partie Gauche : Tableau */}
                <div style={{
                    flex: 1,
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                }} className="container_employee">
                    <div className="mt-4">
                        <div className="section-header mb-3">
                            <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '16px' }}>
                                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                                    <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                                        <i className="fas fa-file-invoice-dollar me-2"></i>
                                        Gestion Déclarations CIMR
                                    </span>
                                    <p className="section-description text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                        {filteredData.length} période{filteredData.length > 1 ? 's' : ''} •
                                        {filteredData.reduce((sum, d) => sum + (d.employee_count || 0), 0)} déclaration{filteredData.reduce((sum, d) => sum + (d.employee_count || 0), 0) > 1 ? 's' : ''} •
                                        {filteredData.reduce((sum, d) => sum + parseFloat(d.total_montant || 0), 0).toLocaleString()} DH
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "10px", alignItems: 'center', flexWrap: 'wrap' }}>
                                    <FontAwesomeIcon
                                        onClick={() => handleFiltersToggle ? handleFiltersToggle(!filtersVisible) : setFiltersVisibleLocal(!filtersVisibleLocal)}
                                        icon={(handleFiltersToggle ? filtersVisible : filtersVisibleLocal) ? faClose : faFilter}
                                        style={{
                                            cursor: "pointer",
                                            fontSize: "1.9rem",
                                            color: "#2c767c",
                                            transition: 'all 0.2s ease',
                                            marginTop: "1.3%",
                                            marginRight: "8px",
                                        }}
                                        title="Filtrer"
                                    />

                                    <button
                                        onClick={() => setShowCharts(v => !v)}
                                        title="Graphes déclarations"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '34px', height: '34px',
                                            backgroundColor: showCharts ? '#245f64' : '#2c767c',
                                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                                            boxShadow: '0 2px 6px rgba(44,118,124,0.35)',
                                            transition: 'all 0.2s ease', marginRight: '8px', flexShrink: 0,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#245f64'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = showCharts ? '#245f64' : '#2c767c'; }}
                                    >
                                        <BarChart2 size={18} color="#ffffff" strokeWidth={2} />
                                    </button>

                                    <Button
                                        onClick={() => {
                                            setEditingItem(null);
                                            setSideDetailRow(null);
                                            setIsManagingEmployees(false);
                                            setIsAddingEmploye(true);
                                        }}
                                        className="btn d-flex align-items-center"
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
                                        Nouvelle Déclaration
                                    </Button>

                                    <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                                        <Dropdown.Toggle as="div" bsPrefix="custom-dropdown-toggle">
                                            <div style={iconButtonStyle} title="Colonnes">
                                                <FontAwesomeIcon icon={faSliders} style={{ fontSize: "1.2rem", color: "#2c767c" }} />
                                            </div>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu as={CustomMenu} columns_config={columns_config} setColumnVisibility={setColumnVisibility} />
                                    </Dropdown>

                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {(handleFiltersToggle ? filtersVisible : filtersVisibleLocal) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="filters-container mb-3"
                                    style={{}}
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

                                    {/* Filtre Mois */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{ fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', fontWeight: 600, color: '#2c3e50' }}>Mois</label>
                                        <select
                                            value={filterMois}
                                            onChange={(e) => setFilterMois(e.target.value)}
                                            className="filter-input"
                                            style={{ minWidth: 100, height: 30, fontSize: '0.9rem', padding: '2px 6px', borderRadius: 6 }}
                                        >
                                            <option value="">Tous</option>
                                            <option value="1">Janvier</option>
                                            <option value="2">Février</option>
                                            <option value="3">Mars</option>
                                            <option value="4">Avril</option>
                                            <option value="5">Mai</option>
                                            <option value="6">Juin</option>
                                            <option value="7">Juillet</option>
                                            <option value="8">Août</option>
                                            <option value="9">Septembre</option>
                                            <option value="10">Octobre</option>
                                            <option value="11">Novembre</option>
                                            <option value="12">Décembre</option>
                                        </select>
                                    </div>

                                    {/* Filtre Annee */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{ fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', fontWeight: 600, color: '#2c3e50' }}>Annee</label>
                                        <select
                                            value={filterAnnee}
                                            onChange={(e) => setFilterAnnee(e.target.value)}
                                            className="filter-input"
                                            style={{ minWidth: 100, height: 30, fontSize: '0.9rem', padding: '2px 6px', borderRadius: 6 }}
                                        >
                                            <option value="">Toutes</option>
                                            {[...new Set(data.map(d => d.annee))].sort((a, b) => b - a).map(annee => (
                                                <option key={annee} value={annee}>{annee}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtre Statut */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <label className="filter-label" style={{ fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', fontWeight: 600, color: '#2c3e50' }}>Statut</label>
                                        <select
                                            value={filterStatut}
                                            onChange={(e) => setFilterStatut(e.target.value)}
                                            className="filter-input"
                                            style={{ minWidth: 100, height: 30, fontSize: '0.9rem', padding: '2px 6px', borderRadius: 6 }}
                                        >
                                            <option value="">Tous</option>
                                            <option value="paye">Payé</option>
                                            <option value="declare">Déclaré</option>
                                            <option value="a_declarer">À Déclarer</option>
                                        </select>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error ? (
                            <div className="alert alert-danger" role="alert">
                                <strong>Erreur:</strong> {error}
                            </div>
                        ) : (
                            <ExpandRTable
                                columns={table_columns}
                                data={filteredData}
                                highlightText={highlightText}
                                searchTerm={globalSearch}
                                disableFilter={true}
                                loading={loading}
                                error={error}
                                selectable={true}
                                selectedItems={selectedItems}
                                handleSelectAllChange={handleSelectAllChange}
                                handleCheckboxChange={handleCheckboxChange}
                                handleDeleteSelected={handleDeleteSelected}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                handleChangePage={setPage}
                                handleChangeRowsPerPage={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Partie Droite : Formulaire ou Détails */}
                {(isAddingEmploye || sideDetailRow || showCharts) && (
                    <div style={{
                        flex: '0 0 40%',
                        height: '100%',
                        overflowY: 'auto',
                        backgroundColor: '#fdfdfd',
                        boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
                        animation: 'fadeInRight 0.4s ease-out'
                    }}>
                        {showCharts && !isAddingEmploye && !sideDetailRow ? (
                            /* ─── Panel Graphes Déclarations ─── */
                            (() => {
                                const MOIS_NOM = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                                // Group by mois+annee, sum total_montant & employee_count
                                const byPeriod = {};
                                data.forEach(r => {
                                    const key = `${MOIS_NOM[(r.mois || 1) - 1]} ${r.annee}`;
                                    if (!byPeriod[key]) byPeriod[key] = { montant: 0, employes: 0 };
                                    byPeriod[key].montant += parseFloat(r.total_montant || 0);
                                    byPeriod[key].employes += parseInt(r.employee_count || 0);
                                });
                                const labels = Object.keys(byPeriod).slice(-12);
                                const montants = labels.map(k => Math.round(byPeriod[k].montant));
                                const employes = labels.map(k => byPeriod[k].employes);
                                const totalMontant = data.reduce((s, r) => s + parseFloat(r.total_montant || 0), 0);
                                const totalEmps = data.reduce((s, r) => s + parseInt(r.employee_count || 0), 0);

                                return (
                                    <>
                                        <style>{`@keyframes slideInChart { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
                                        <div className="add-accident-container shadow-lg" style={{ animation: 'slideInChart 0.3s cubic-bezier(0.4,0,0.2,1) both' }}>
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
                                                    Graphes Déclarations CIMR
                                                </h5>
                                                <button onClick={() => setShowCharts(false)} style={{
                                                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                                    background: 'transparent', border: 'none', fontSize: '1.5rem',
                                                    color: '#6b7280', cursor: 'pointer', lineHeight: 1,
                                                    padding: '4px 8px', borderRadius: '6px',
                                                }}>&times;</button>
                                            </div>
                                            <div className="form-body p-3 flex-grow-1 overflow-auto" style={{ backgroundColor: '#f8fafc' }}>
                                                {labels.length === 0 ? (
                                                    <div className="text-center py-5 text-muted">Aucune donnée disponible.</div>
                                                ) : (
                                                    <>
                                                        <div className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>{data.length} période(s) analysée(s)</div>

                                                        {/* Montant par période */}
                                                        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                                            <h6 style={{ marginBottom: '12px', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Montant CIMR par période (DH)</h6>
                                                            <BarChart
                                                                xAxis={[{ scaleType: 'band', data: labels }]}
                                                                series={[{ data: montants, label: 'Montant DH', color: '#2c767c' }]}
                                                                height={280}
                                                                margin={{ bottom: 80 }}
                                                                slotProps={{ legend: { position: { vertical: 'bottom', horizontal: 'middle' }, padding: { top: 20 } } }}
                                                            />
                                                        </div>

                                                        {/* Employés par période */}
                                                        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                                            <h6 style={{ marginBottom: '12px', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Employés déclarés par période</h6>
                                                            <BarChart
                                                                xAxis={[{ scaleType: 'band', data: labels }]}
                                                                series={[{ data: employes, label: 'Employés', color: '#6366f1' }]}
                                                                height={250}
                                                                margin={{ bottom: 80 }}
                                                                slotProps={{ legend: { position: { vertical: 'bottom', horizontal: 'middle' }, padding: { top: 20 } } }}
                                                            />
                                                        </div>

                                                        {/* Répartition par statut */}
                                                        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                                            <h6 style={{ marginBottom: '12px', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Répartition par statut</h6>
                                                            <BarChart
                                                                xAxis={[{ scaleType: 'band', data: ['À Déclarer', 'Déclaré', 'Payé'] }]}
                                                                series={[{
                                                                    data: [
                                                                        data.filter(r => r.statut === 'a_declarer').length,
                                                                        data.filter(r => r.statut === 'declare').length,
                                                                        data.filter(r => r.statut === 'paye').length,
                                                                    ], label: 'Périodes', color: '#f59e0b'
                                                                }]}
                                                                height={220}
                                                                margin={{ bottom: 70 }}
                                                                slotProps={{ legend: { position: { vertical: 'bottom', horizontal: 'middle' } } }}
                                                            />
                                                        </div>

                                                        {/* Cards */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                                            {[
                                                                { label: 'Total Montant', value: totalMontant.toLocaleString() + ' DH', color: '#2c767c' },
                                                                { label: 'Total Employés', value: totalEmps, color: '#6366f1' },
                                                                { label: 'Périodes Payées', value: data.filter(r => r.statut === 'paye').length, color: '#10b981' },
                                                                { label: 'Périodes Totales', value: data.length, color: '#f59e0b' },
                                                            ].map((c, i) => (
                                                                <div key={i} style={{ background: '#f8fafc', border: `1px solid ${c.color}33`, borderRadius: '10px', padding: '14px 18px', borderLeft: `4px solid ${c.color}` }}>
                                                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: c.color }}>{c.value}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.label}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()
                        ) : isAddingEmploye ? (
                            <AddCimrDeclaration
                                onClose={handleClose}
                                onSave={onSave}
                                departementId={departementId}
                                initialData={editingItem}
                                declarationRows={data}
                            />
                        ) : isManagingEmployees ? (
                            /* ─── Panel Gérer les employés ─── */
                            <div className="p-4" style={{ backgroundColor: '#fdfdfd' }}>
                                <div style={{
                                    position: 'relative',
                                    background: '#ffffff',
                                    borderBottom: '1px solid #e5e7eb',
                                    padding: '18px 48px 18px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                    marginLeft: '-24px',
                                    marginRight: '-24px',
                                    marginTop: '-24px',
                                }}>
                                    <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#111827', textAlign: 'center' }}>
                                        Gérer employés — {sideDetailRow.mois}/{sideDetailRow.annee}
                                    </h5>
                                    <button onClick={handleClose} style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none', fontSize: '1.5rem',
                                        color: '#6b7280', cursor: 'pointer', lineHeight: 1,
                                        padding: '4px 8px', borderRadius: '6px',
                                    }}>&times;</button>
                                </div>

                                {/* Changer le statut de la période */}
                                <div className="mb-3 p-3" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px' }}>
                                    <div className="fw-semibold mb-2" style={{ color: '#9a3412', fontSize: '0.85rem' }}>Statut de la période</div>
                                    <div className="d-flex gap-2 align-items-center">
                                        <select
                                            className="form-select form-select-sm"
                                            style={{ borderRadius: '8px', flex: 1 }}
                                            value={manageStatut}
                                            onChange={e => setManageStatut(e.target.value)}
                                        >
                                            <option value="a_declarer">À Déclarer</option>
                                            <option value="declare">Déclaré</option>
                                            <option value="paye">Payé</option>
                                        </select>
                                        <button
                                            className="btn btn-sm"
                                            style={{ backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', whiteSpace: 'nowrap', opacity: (manageStatut === sideDetailRow.statut || manageStatutLoading) ? 0.5 : 1 }}
                                            disabled={manageStatut === sideDetailRow.statut || manageStatutLoading}
                                            onClick={async () => {
                                                setManageStatutLoading(true);
                                                const oldStatut = sideDetailRow.statut;
                                                // Mise à jour optimiste
                                                setSideDetailRow(prev => prev ? { ...prev, statut: manageStatut } : prev);
                                                setData(prev => prev.map(r =>
                                                    r.mois === sideDetailRow.mois && r.annee === sideDetailRow.annee && r.statut === oldStatut
                                                        ? { ...r, statut: manageStatut, details: undefined }
                                                        : r
                                                ));
                                                try {
                                                    await axios.post(
                                                        'http://127.0.0.1:8000/api/cimr-declarations/update-by-period',
                                                        { mois: sideDetailRow.mois, annee: sideDetailRow.annee, statut: manageStatut, old_statut: oldStatut },
                                                        { withCredentials: true }
                                                    );
                                                    localStorage.removeItem('cimrDeclarationsCache');
                                                    Swal.fire({ icon: 'success', title: 'Statut mis à jour!', timer: 1000, showConfirmButton: false });
                                                } catch (err) {
                                                    // Rollback
                                                    setSideDetailRow(prev => prev ? { ...prev, statut: oldStatut } : prev);
                                                    setData(prev => prev.map(r =>
                                                        r.mois === sideDetailRow.mois && r.annee === sideDetailRow.annee && r.statut === manageStatut
                                                            ? { ...r, statut: oldStatut }
                                                            : r
                                                    ));
                                                    setManageStatut(oldStatut);
                                                    Swal.fire('Erreur', 'Impossible de modifier le statut.', 'error');
                                                } finally {
                                                    setManageStatutLoading(false);
                                                }
                                            }}
                                        >
                                            {manageStatutLoading
                                                ? <span className="spinner-border spinner-border-sm" role="status" />
                                                : 'Enregistrer'}
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-4 p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="fw-semibold" style={{ color: '#065f46', fontSize: '0.85rem' }}>
                                            Ajouter des employés à cette période
                                        </span>
                                        {addEmpSelectedIds.length > 0 && (
                                            <span className="badge" style={{ backgroundColor: '#2c767c', color: '#fff', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                {addEmpSelectedIds.length} sélectionné(s)
                                            </span>
                                        )}
                                    </div>
                                    {(() => {
                                        const alreadyIn = new Set((sideDetailRow.details || []).map(d => d.matricule));
                                        const available = manageEligibleEmps.filter(e => !alreadyIn.has(e.matricule));
                                        const filtered = addEmpSearch
                                            ? available.filter(e => {
                                                const label = `${e.prenom || ''} ${e.nom || ''}`.trim();
                                                return label.toLowerCase().includes(addEmpSearch.toLowerCase()) ||
                                                    (e.matricule || '').toLowerCase().includes(addEmpSearch.toLowerCase());
                                            })
                                            : available;
                                        const allFilteredSelected = filtered.length > 0 && filtered.every(e => addEmpSelectedIds.includes(String(e.id)));
                                        return (
                                            <div className="d-flex flex-column gap-2">
                                                {/* Recherche */}
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Filtrer par nom ou matricule..."
                                                    value={addEmpSearch}
                                                    onChange={e => setAddEmpSearch(e.target.value)}
                                                    style={{ borderRadius: '8px' }}
                                                />
                                                {/* Liste avec checkboxes */}
                                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1fae5', borderRadius: '8px', backgroundColor: '#fff' }}>
                                                    {filtered.length === 0 ? (
                                                        <div className="text-center py-3 text-muted small">Aucun employé disponible</div>
                                                    ) : (
                                                        <>
                                                            {/* Tout sélectionner */}
                                                            <div
                                                                style={{ padding: '7px 12px', borderBottom: '1px solid #d1fae5', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                                                onClick={() => {
                                                                    if (allFilteredSelected) {
                                                                        setAddEmpSelectedIds(prev => prev.filter(id => !filtered.map(e => String(e.id)).includes(id)));
                                                                    } else {
                                                                        setAddEmpSelectedIds(prev => [...new Set([...prev, ...filtered.map(e => String(e.id))])]);
                                                                    }
                                                                }}
                                                            >
                                                                <input type="checkbox" readOnly checked={allFilteredSelected} style={{ accentColor: '#2c767c', cursor: 'pointer' }} />
                                                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#065f46' }}>Tout sélectionner ({filtered.length})</span>
                                                            </div>
                                                            {filtered.map((emp, idx) => {
                                                                const label = `${emp.prenom || ''} ${emp.nom || ''}`.trim();
                                                                const isChecked = addEmpSelectedIds.includes(String(emp.id));
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        style={{ padding: '7px 12px', borderBottom: idx < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: isChecked ? '#f0fdf4' : '' }}
                                                                        onClick={() => {
                                                                            const sid = String(emp.id);
                                                                            setAddEmpSelectedIds(prev => isChecked ? prev.filter(x => x !== sid) : [...prev, sid]);
                                                                        }}
                                                                    >
                                                                        <input type="checkbox" readOnly checked={isChecked} style={{ accentColor: '#2c767c', cursor: 'pointer' }} />
                                                                        <span style={{ fontSize: '0.85rem', flex: 1 }}>{label}</span>
                                                                        <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: '500', fontSize: '0.75rem' }}>{emp.matricule}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </div>
                                                {/* Bouton Ajouter */}
                                                <button
                                                    className="btn btn-sm w-100"
                                                    style={{ backgroundColor: '#2c767c', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px', opacity: (!addEmpSelectedIds.length || addingEmpLoading) ? 0.6 : 1 }}
                                                    onClick={handleAddEmployee}
                                                    disabled={!addEmpSelectedIds.length || addingEmpLoading}
                                                >
                                                    {addingEmpLoading
                                                        ? <span className="spinner-border spinner-border-sm" role="status" />
                                                        : `+ Ajouter${addEmpSelectedIds.length > 0 ? ` (${addEmpSelectedIds.length})` : ''}`}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Tableau employés */}
                                <div className="table-responsive" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                    <table className="table table-sm table-hover mb-0">
                                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            <tr>
                                                <th style={{ color: '#2c767c', fontWeight: '600', padding: '12px' }}>Employé</th>
                                                <th style={{ color: '#2c767c', fontWeight: '600', padding: '12px' }}>Matricule</th>
                                                <th className="text-end" style={{ color: '#2c767c', fontWeight: '600', padding: '12px' }}>Montant</th>
                                                <th className="text-center" style={{ color: '#2c767c', fontWeight: '600', padding: '12px' }}>Retirer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailLoading ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4">
                                                        <div className="d-flex justify-content-center align-items-center gap-2" style={{ color: '#2c767c' }}>
                                                            <div className="spinner-border spinner-border-sm" role="status" />
                                                            <span className="small">Chargement...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (sideDetailRow.details || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4 text-muted small">
                                                        Aucun employé dans cette période.
                                                    </td>
                                                </tr>
                                            ) : (sideDetailRow.details || []).map((detail, idx) => (
                                                <tr key={idx} style={{ transition: 'background-color 0.2s' }}>
                                                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.7rem', fontWeight: '600' }}>
                                                                {(detail.employe || 'N')[0].toUpperCase()}
                                                            </div>
                                                            <span className="small fw-medium">{detail.employe}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                                        <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: '500' }}>
                                                            {detail.matricule}
                                                        </span>
                                                    </td>
                                                    <td className="text-end" style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                                        <span className="fw-bold" style={{ color: '#059669' }}>
                                                            {parseFloat(detail.montant_cimr_employeur || 0).toLocaleString()} DH
                                                        </span>
                                                    </td>
                                                    <td className="text-center" style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                                        <button
                                                            style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 6px' }}
                                                            onClick={() => handleDeleteFromManage(detail.id)}
                                                            title="Retirer de la période"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} style={{ color: '#ff0000', fontSize: '14px' }} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4" style={{ backgroundColor: '#fdfdfd' }}>
                                <div style={{
                                    position: 'relative',
                                    background: '#ffffff',
                                    borderBottom: '1px solid #e5e7eb',
                                    padding: '18px 48px 18px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                    marginLeft: '-24px',
                                    marginRight: '-24px',
                                    marginTop: '-24px',
                                }}>
                                    <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#111827', textAlign: 'center' }}>
                                        Détails Période {sideDetailRow.mois}/{sideDetailRow.annee}
                                    </h5>
                                    <button onClick={handleClose} style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none', fontSize: '1.5rem',
                                        color: '#6b7280', cursor: 'pointer', lineHeight: 1,
                                        padding: '4px 8px', borderRadius: '6px',
                                    }}>&times;</button>
                                </div>

                                {/* Stats Cards */}
                                <div className="row g-3 mb-4">
                                    <div className="col-4">
                                        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b' }}>
                                            <div className="d-flex align-items-center mb-2">
                                                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#eff6ff', marginRight: '12px' }}>
                                                    <FontAwesomeIcon icon={faUsers} style={{ fontSize: '1.2rem', color: '#3b82f6' }} />
                                                </div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>EMPLOYÉS</div>
                                            </div>
                                            <div className="fw-bold" style={{ fontSize: '1.4rem' }}>{sideDetailRow.employee_count || 0}</div>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b' }}>
                                            <div className="d-flex align-items-center mb-2">
                                                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#ecfdf5', marginRight: '12px' }}>
                                                    <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '1.2rem', color: '#10b981' }} />
                                                </div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>MONTANT DH</div>
                                            </div>
                                            <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{parseFloat(sideDetailRow.total_montant || 0).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        {(() => {
                                            const stStyle = statusStyles[sideDetailRow.statut] || statusStyles.a_declarer;
                                            return (
                                                <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', color: '#1e293b' }}>
                                                    <div className="d-flex align-items-center mb-2">
                                                        <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: stStyle.bg, marginRight: '12px' }}>
                                                            <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '1.2rem', color: stStyle.color }} />
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>STATUT</div>
                                                    </div>
                                                    <div className="fw-bold" style={{ fontSize: '0.9rem', color: stStyle.color }}>{stStyle.label || 'À Déclarer'}</div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="table-responsive" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                    <table className="table table-sm table-hover mb-0">
                                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                            <tr>
                                                <th style={{ color: '#2c767c', fontWeight: '600', padding: '12px' }}>Employé</th>
                                                <th style={{ color: '#2c767c', fontWeight: '600', padding: '12px' }}>Matricule</th>
                                                <th className="text-end" style={{ color: '#2c767c', fontWeight: '600', padding: '12px' }}>Montant</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detailLoading ? (
                                                <tr>
                                                    <td colSpan="3" className="text-center py-4">
                                                        <div className="d-flex justify-content-center align-items-center gap-2" style={{ color: '#2c767c' }}>
                                                            <div className="spinner-border spinner-border-sm" role="status" />
                                                            <span className="small">Chargement des employés...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (() => {
                                                const rawDetails = sideDetailRow.details || [];
                                                const targetStatut = String(sideDetailRow.statut || "").trim().toLowerCase();

                                                const filteredDetails = rawDetails.filter(d =>
                                                    String(d.statut || "").trim().toLowerCase() === targetStatut
                                                );

                                                if (filteredDetails.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan="3" className="text-center py-4 text-muted small">
                                                                Aucun détail récupéré depuis le serveur.
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filteredDetails.map((detail, idx) => (
                                                    <tr key={idx} style={{ transition: 'background-color 0.2s' }}>
                                                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: '#f1f5f9',
                                                                    border: '1px solid #cbd5e1',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: '#475569',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    {(detail.employe || 'N')[0].toUpperCase()}
                                                                </div>
                                                                <span className="small fw-medium">{detail.employe}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                            <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: '500' }}>
                                                                {detail.matricule}
                                                            </span>
                                                        </td>
                                                        <td className="text-end" style={{ padding: '12px', verticalAlign: 'middle' }}>
                                                            <span className="fw-bold" style={{ color: '#059669' }}>
                                                                {parseFloat(detail.montant_cimr_employeur || 0).toLocaleString()} DH
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                            <tr style={{ backgroundColor: '#f0fdf4' }}>
                                                <td colSpan="2" style={{ padding: '14px 12px', fontWeight: '700', color: '#065f46' }}>
                                                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                                                    TOTAL
                                                </td>
                                                <td className="text-end" style={{ padding: '14px 12px', fontWeight: '700', color: '#059669', fontSize: '1.1rem' }}>
                                                    {parseFloat(sideDetailRow.total_montant || 0).toLocaleString()} DH
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ThemeProvider>
    );
});

export default CimrDeclarationTable;
