import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Dropdown, Form, Badge } from "react-bootstrap";
import { faEdit, faTrash, faFileExcel, faSliders, faCalendarAlt, faClipboardCheck, faFilter, faClose, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
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

const getStatusBadge = (status) => {
    switch (status) {
        case 'paye': return <Badge bg="success">Payé</Badge>;
        case 'declare': return <Badge bg="info">Déclaré</Badge>;
        default: return <Badge bg="warning" text="dark">À Déclarer</Badge>;
    }
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [editingItem, setEditingItem] = useState(null);
    const [sideDetailRow, setSideDetailRow] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filtersVisibleLocal, setFiltersVisibleLocal] = useState(false);

    // States pour les filtres
    const [filterAnnee, setFilterAnnee] = useState("");
    const [filterNbEmploye, setFilterNbEmploye] = useState("");
    const [filterStatut, setFilterStatut] = useState("");

    const loadData = useCallback(() => {
        setLoading(true);
        axios.get("http://127.0.0.1:8000/api/cimr-declarations?summary=1", { withCredentials: true })
            .then((res) => {
                const mapped = (res.data || []).map(item => ({
                    ...item,
                    id: `${item.mois}-${item.annee}-${item.statut}`
                }));
                setData(mapped);
                setLoading(false);
            })
            .catch((err) => {
                setError("Erreur lors du chargement des données.");
                setLoading(false);
            });
    }, []);

    const fetchDetails = async (mois, annee) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/cimr-declarations?mois=${mois}&annee=${annee}`, { withCredentials: true });
            return res.data;
        } catch (err) {
            console.error(err);
            return [];
        }
    };


    const handleShowSideDetails = async (row) => {
        setEditingItem(null);
        setSideDetailRow(row);
        setIsAddingEmploye(false);
        const details = await fetchDetailsIfNeeded(row.id, row.mois, row.annee);
        if (details) {
            setSideDetailRow(prev => prev ? { ...prev, details } : null);
        }
    };

    const fetchDetailsIfNeeded = async (rowId, mois, annee) => {
        const row = data.find(r => r.id === rowId);
        if (row && row.details) return row.details;

        const details = await fetchDetails(mois, annee);
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
                        loadData();
                        Swal.fire('Supprimé!', 'Déclaration supprimée.', 'success');
                    })
                    .catch(err => Swal.fire('Erreur', 'Impossible de supprimer.', 'error'));
            }
        });
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

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const searchLower = (globalSearch || "").toLowerCase();
            const matchesGlobal =
                (item.annee && item.annee.toString().includes(searchLower)) ||
                (item.mois && item.mois.toString().includes(searchLower)) ||
                (item.statut && item.statut.toLowerCase().includes(searchLower));

            const matchesAnnee = filterAnnee ? item.annee.toString().includes(filterAnnee) : true;
            const matchesNbEmploye = filterNbEmploye ? (parseInt(item.employee_count || 0) >= parseInt(filterNbEmploye)) : true;
            const matchesStatut = filterStatut ? (item.statut === filterStatut) : true;

            return matchesGlobal && matchesAnnee && matchesNbEmploye && matchesStatut;
        });
    }, [data, globalSearch, filterAnnee, filterNbEmploye, filterStatut]);

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsAddingEmploye(true);
    };

    const columns_config = useMemo(() => [
        {
            key: "periode",
            label: "Période",
            render: (row) => `${row.mois}/${row.annee}`,
            visible: columnVisibility.periode
        },
        {
            key: "employee_count",
            label: "Nombre d'employés",
            align: "center",
            visible: columnVisibility.employee_count
        },
        {
            key: "total_montant",
            label: "Montant Total",
            render: (row) => `${parseFloat(row.total_montant || 0).toLocaleString()} DH`,
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
                <div className="d-flex gap-2 justify-content-center">
                    <button
                        className="btn btn-sm btn-outline-info"
                        onClick={(e) => { e.stopPropagation(); handleShowSideDetails(row); }}
                        title="Voir détails sur le côté"
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={(e) => { e.stopPropagation(); handleDeletePeriod(row); }}
                        title="Supprimer la période"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            ),
            visible: true
        }
    ], [columnVisibility]);

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
            const promises = newData.map(item => {
                const payload = mapUiToApi(item, null);
                return axios.post("http://127.0.0.1:8000/api/cimr-declarations", payload, { withCredentials: true });
            });

            Promise.all(promises)
                .then(() => {
                    loadData();
                    handleClose();
                    Swal.fire({ icon: 'success', title: 'Succès', text: 'Déclarations créées avec succès', timer: 1500, showConfirmButton: false });
                })
                .catch(err => Swal.fire('Erreur', 'Erreur lors de la création', 'error'));
        } else {
            const payload = mapUiToApi(newData, null);
            const request = editingItem
                ? axios.put(`http://127.0.0.1:8000/api/cimr-declarations/${editingItem.id}`, payload, { withCredentials: true })
                : axios.post("http://127.0.0.1:8000/api/cimr-declarations", payload, { withCredentials: true });

            request
                .then(() => {
                    loadData();
                    handleClose();
                    Swal.fire({ icon: 'success', title: 'Succès', text: editingItem ? 'Modifié' : 'Ajouté', timer: 1500, showConfirmButton: false });
                })
                .catch(err => Swal.fire('Erreur', 'Une erreur est survenue', 'error'));
        }
    };

    useEffect(() => { loadData(); }, [loadData]);

    const handleClose = () => {
        setIsAddingEmploye(false);
        setEditingItem(null);
        setSideDetailRow(null);
    }

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
                height: 'calc(100vh - 120px)',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#fff'
            }} className="with-split-view">
                {/* Partie Gauche : Tableau */}
                <div style={{
                    flex: (isAddingEmploye || sideDetailRow) ? '0 0 55%' : '1 1 100%',
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    borderRight: (isAddingEmploye || sideDetailRow) ? '2px solid #eef2f5' : 'none',
                    padding: '0 20px'
                }}>
                    <div className="mt-4">
                        <div className="section-header mb-3">
                            <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '16px' }}>
                                <div style={{ flex: '1 1 300px' }}>
                                    <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                                        <i className="fas fa-file-invoice-dollar me-2"></i>
                                        Déclarations CIMR
                                    </span>
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

                                    <Button
                                        onClick={() => {
                                            setEditingItem(null);
                                            setSideDetailRow(null);
                                            setIsAddingEmploye(true);
                                        }}
                                        className="btn d-flex align-items-center"
                                        size="sm"
                                        style={{ width: '200px', backgroundColor: '#2c767c', color: 'white', border: 'none', height: '38px', marginRight: '8px' }}
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
                                        <Form.Label className="mb-0 fw-bold text-muted small">Année:</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="text"
                                            placeholder="202X"
                                            style={{ width: '100px' }}
                                            value={filterAnnee}
                                            onChange={(e) => setFilterAnnee(e.target.value)}
                                        />
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Form.Label className="mb-0 fw-bold text-muted small">Nb Employés min:</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            placeholder="0"
                                            style={{ width: '100px' }}
                                            value={filterNbEmploye}
                                            onChange={(e) => setFilterNbEmploye(e.target.value)}
                                        />
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
                                            <option value="paye">Payé</option>
                                            <option value="declare">Déclaré</option>
                                            <option value="a_declarer">À Déclarer</option>
                                        </Form.Select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <ExpandRTable
                            columns={table_columns}
                            data={filteredData}
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
                    </div>
                </div>

                {/* Partie Droite : Formulaire ou Détails */}
                {(isAddingEmploye || sideDetailRow) && (
                    <div style={{
                        flex: '0 0 45%',
                        height: '100%',
                        overflowY: 'auto',
                        backgroundColor: '#fdfdfd',
                        boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
                        animation: 'fadeInRight 0.4s ease-out'
                    }}>
                        {isAddingEmploye ? (
                            <AddCimrDeclaration
                                onClose={handleClose}
                                onSave={onSave}
                                departementId={departementId}
                                initialData={editingItem}
                            />
                        ) : (
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="mb-0 fw-bold" style={{ color: '#2c767c' }}>
                                        Détails des Employés - {sideDetailRow.mois}/{sideDetailRow.annee}
                                    </h5>
                                    <button onClick={handleClose} className="btn-close"></button>
                                </div>
                                <div className="mb-3">
                                    <Badge bg="info" className="me-2">{sideDetailRow.statut === 'paye' ? 'Payé' : sideDetailRow.statut === 'declare' ? 'Déclaré' : 'À Déclarer'}</Badge>
                                    <span className="text-muted small">
                                        {sideDetailRow.employee_count} employé(s)
                                        {sideDetailRow.details && ` (Total récupéré: ${sideDetailRow.details.length})`}
                                    </span>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover border rounded">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Employé</th>
                                                <th>Matricule</th>
                                                <th className="text-end">Montant</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const rawDetails = sideDetailRow.details || [];
                                                const targetStatut = String(sideDetailRow.statut || "").trim().toLowerCase();

                                                const filteredDetails = rawDetails.filter(d =>
                                                    String(d.statut || "").trim().toLowerCase() === targetStatut
                                                );

                                                if (filteredDetails.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan="4" className="text-center py-4 text-muted small">
                                                                {rawDetails.length > 0
                                                                    ? `Filtrage échoué : ${rawDetails.length} records trouvés mais aucun avec le statut "${targetStatut}".`
                                                                    : "Aucun détail récupéré depuis le serveur."
                                                                }
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filteredDetails.map((detail, idx) => (
                                                    <tr key={idx}>
                                                        <td className="small">{detail.employe}</td>
                                                        <td className="small">{detail.matricule}</td>
                                                        <td className="text-end small">
                                                            {parseFloat(detail.montant_cimr_employeur || 0).toLocaleString()} DH
                                                        </td>
                                                        <td className="text-center">
                                                            <div className="d-flex gap-2 justify-content-center">
                                                                <button
                                                                    className="btn btn-sm btn-link p-0 text-primary"
                                                                    onClick={() => handleEdit(detail)}
                                                                    title="Modifier"
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} />
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-link p-0 text-danger"
                                                                    onClick={() => handleDeleteIndividual(detail.id)}
                                                                    title="Supprimer"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                            <tr className="table-info fw-bold">
                                                <td colSpan="2" className="small">TOTAL</td>
                                                <td className="text-end small">{parseFloat(sideDetailRow.total_montant || 0).toLocaleString()} DH</td>
                                                <td></td>
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
