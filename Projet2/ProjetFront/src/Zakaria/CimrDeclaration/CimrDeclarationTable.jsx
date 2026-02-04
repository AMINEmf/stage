import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from "axios";
import { Button, Dropdown, Form, Badge } from "react-bootstrap";
import { faEdit, faTrash, faFileExcel, faSliders, faCalendarAlt, faClipboardCheck, faFilter, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaPlusCircle } from "react-icons/fa";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useOpen } from "../../Acceuil/OpenProvider";
import ExpandRTable from "../Shared/ExpandRTable";
import AddCimrDeclaration from "./AddCimrDeclaration";
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
    mois: parseInt(ui.mois),
    annee: parseInt(ui.annee),
    montant_cimr_employeur: ui.montant_cimr_employeur !== "" ? ui.montant_cimr_employeur : null,
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
    const [expandedRows, setExpandedRows] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [editingItem, setEditingItem] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filtersVisibleLocal, setFiltersVisibleLocal] = useState(false);

    const loadData = useCallback(() => {
        setLoading(true);
        axios.get("http://127.0.0.1:8000/api/cimr-declarations?summary=1", { withCredentials: true })
            .then((res) => {
                const mapped = (res.data || []).map(item => ({
                    ...item,
                    id: `${item.mois}-${item.annee}`
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

    const toggleRowExpansion = async (rowId) => {
        const row = data.find(r => r.id === rowId);
        if (!row) return;

        setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));

        if (!row.details && !expandedRows[rowId]) {
            const details = await fetchDetails(row.mois, row.annee);
            setData(prev => prev.map(r =>
                (r.id === rowId) ? { ...r, details } : r
            ));
        }
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

    const mapUiToApi = (ui, deptId) => ({
        employe: ui.employe,
        matricule: ui.matricule,
        departement_id: deptId || null,
        mois: ui.mois,
        annee: ui.annee,
        montant_cimr_employeur: ui.montant_cimr_employeur,
        statut: ui.statut
    });

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
                    flex: isAddingEmploye ? '0 0 55%' : '1 1 100%',
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    borderRight: isAddingEmploye ? '2px solid #eef2f5' : 'none',
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

                        <ExpandRTable
                            columns={table_columns}
                            data={data}
                            loading={loading}
                            error={error}
                            selectable={true}
                            selectedItems={selectedItems}
                            handleSelectAllChange={handleSelectAllChange}
                            handleCheckboxChange={handleCheckboxChange}
                            expandedRows={expandedRows}
                            toggleRowExpansion={toggleRowExpansion}
                            renderExpandedRow={(row) => (
                                <div className="p-3 bg-light rounded shadow-sm border m-2">
                                    <h6 className="fw-bold mb-3" style={{ color: '#2c767c' }}>
                                        Détails des Employés - {row.mois}/{row.annee}
                                    </h6>
                                    <table className="table table-sm table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>Employé</th>
                                                <th>Matricule</th>
                                                <th className="text-end">Montant</th>
                                                <th>Statut</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(row.details || []).map((detail, idx) => (
                                                <tr key={idx}>
                                                    <td>{detail.employe}</td>
                                                    <td>{detail.matricule}</td>
                                                    <td className="text-end">{parseFloat(detail.montant_cimr_employeur || 0).toLocaleString()} DH</td>
                                                    <td>{getStatusBadge(detail.statut)}</td>
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
                                            ))}
                                            <tr className="table-info fw-bold">
                                                <td colSpan="2">TOTAL</td>
                                                <td className="text-end">{parseFloat(row.total_montant || 0).toLocaleString()} DH</td>
                                                <td></td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
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

                {/* Partie Droite : Formulaire */}
                {isAddingEmploye && (
                    <div style={{
                        flex: '0 0 45%',
                        height: '100%',
                        overflowY: 'auto',
                        backgroundColor: '#fdfdfd',
                        boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
                        animation: 'fadeInRight 0.4s ease-out'
                    }}>
                        <AddCimrDeclaration
                            onClose={handleClose}
                            onSave={onSave}
                            departementId={departementId}
                            initialData={editingItem}
                        />
                    </div>
                )}
            </div>
        </ThemeProvider>
    );
});

export default CimrDeclarationTable;
