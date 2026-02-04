import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Dropdown, Form } from "react-bootstrap";
import { faEdit, faTrash, faFileExcel, faSliders, faCalendarAlt, faClipboardCheck, faFilter, faClose } from "@fortawesome/free-solid-svg-icons";
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
    { key: "affilieCimr", label: "Affilié CIMR" },
    { key: "numeroCimr", label: "Numéro CIMR" },
    { key: "dateAffiliation", label: "Date Affiliation" },
    { key: "salaireCotisable", label: "Salaire Cotisable" },
    { key: "tauxEmployeur", label: "Taux Employeur" },
    { key: "statut", label: "Statut" },
];

const mapApiToUi = (api) => ({
    id: api.id,
    employe: api.employe,
    matricule: api.matricule,
    affilieCimr: api.affilie_cimr ? "oui" : "non",
    numeroCimr: api.numero_cimr || "-",
    dateAffiliation: api.date_affiliation,
    salaireCotisable: api.salaire_cotisable,
    tauxEmployeur: api.taux_employeur,
    statut: api.statut,
    departement_id: api.departement_id
});

const mapUiToApi = (ui, deptId) => ({
    departement_id: deptId || ui.departement_id || null,
    employe: ui.employe,
    matricule: ui.matricule,
    affilie_cimr: ui.affilieCimr === "oui",
    numero_cimr: ui.numeroCimr || null,
    date_affiliation: ui.dateAffiliation || null,
    salaire_cotisable: ui.salaireCotisable !== "" ? ui.salaireCotisable : null,
    taux_employeur: ui.tauxEmployeur !== "" ? ui.tauxEmployeur : null,
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
        departementName = "Tous"
    } = props;

    const { dynamicStyles } = useOpen();

    const [affiliations, setAffiliations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [columnVisibility, setColumnVisibility] = useState({
        employe: true,
        matricule: true,
        affilieCimr: true,
        numeroCimr: true,
        dateAffiliation: true,
        salaireCotisable: true,
        tauxEmployeur: true,
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

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [editingItem, setEditingItem] = useState(null);

    const filtered = useMemo(() => {
        if (!departementId) return affiliations;
        const ids = includeSubDepartments && getSubDepartmentIds ? getSubDepartmentIds(departements || [], departementId) : [departementId];
        const numericIds = ids.map(Number);
        return affiliations.filter((a) => numericIds.includes(Number(a.departement_id)));
    }, [affiliations, departementId, includeSubDepartments, getSubDepartmentIds, departements]);

    const searched = useMemo(() => {
        if (!globalSearch.trim()) return filtered;
        const term = globalSearch.toLowerCase();
        return filtered.filter((row) =>
            columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(term))
        );
    }, [filtered, globalSearch]);

    const onSave = (newData) => {
        const payload = mapUiToApi(newData, departementId);

        const request = editingItem
            ? axios.put(`http://127.0.0.1:8000/api/cimr-affiliations/${editingItem.id}`, payload, { withCredentials: true })
            : axios.post("http://127.0.0.1:8000/api/cimr-affiliations", payload, { withCredentials: true });

        request
            .then((res) => {
                loadData();
                handleClose();
                Swal.fire({
                    icon: 'success',
                    title: 'Succès',
                    text: editingItem ? 'Affiliation modifiée avec succès' : 'Affiliation enregistrée avec succès',
                });
            })
            .catch((err) => {
                console.error(err);
                setError("Impossible d'enregistrer l'affiliation.");
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

    const handleEdit = (row) => {
        setEditingItem(row);
        setIsAddingEmploye(true);
    };

    const columns_config = useMemo(() => [
        { key: 'employe', label: "Employé", visible: columnVisibility.employe },
        { key: 'matricule', label: "Matricule", visible: columnVisibility.matricule },
        { key: 'affilieCimr', label: "Affilié CIMR", visible: columnVisibility.affilieCimr },
        { key: 'numeroCimr', label: "Numéro CIMR", visible: columnVisibility.numeroCimr },
        { key: 'dateAffiliation', label: "Date Affiliation", visible: columnVisibility.dateAffiliation },
        { key: 'salaireCotisable', label: "Salaire Cotisable", visible: columnVisibility.salaireCotisable },
        { key: 'tauxEmployeur', label: "Taux Employeur", visible: columnVisibility.tauxEmployeur },
        { key: 'statut', label: "Statut", visible: columnVisibility.statut },
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
        setLoading(true);
        axios
            .get("http://127.0.0.1:8000/api/cimr-affiliations", { withCredentials: true })
            .then((res) => {
                const payload = Array.isArray(res.data) ? res.data : [];
                setAffiliations(payload.map(mapApiToUi));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

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
                                        <option value="actif">Actif</option>
                                        <option value="suspendu">Suspendu</option>
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
                    />
                </div>

                {isAddingEmploye && (
                    <AddCimr
                        onClose={handleClose}
                        onSave={onSave}
                        departementId={departementId}
                        initialData={editingItem}
                    />
                )}
            </div>
        </ThemeProvider>
    );
});

export default CimrTable;
