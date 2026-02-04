import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "../Employe/DepartementManager.css";
import "bootstrap/dist/css/bootstrap.min.css";
import CimrTable from "./CimrTable";
import { IoFolderOpenOutline } from "react-icons/io5";
import { FaMinus } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import Swal from 'sweetalert2';
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";

function CimrManager() {
    const [departements, setDepartements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditingDepartement, setIsEditingDepartement] = useState(false);
    const [editingDepartementId, setEditingDepartementId] = useState(null);
    const [isAddingEmploye, setIsAddingEmploye] = useState(false);
    const [selectedDepartementId, setSelectedDepartementId] = useState(null);
    const [selectedDepartementName, setSelectedDepartementName] = useState(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [newDepartementName, setNewDepartementName] = useState("");
    const [newSubDepartementName, setNewSubDepartementName] = useState("");
    const [addingSubDepartement, setAddingSubDepartement] = useState(null);
    const [includeSubDepartments, setIncludeSubDepartments] = useState(false);

    const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, setSearchQuery, clearActions } = useHeader();
    const { dynamicStyles } = useOpen();
    const [permissions, setPermissions] = useState([]);

    useEffect(() => {
        const fetchPerms = async () => {
            try {
                const resp = await axios.get("http://localhost:8000/api/user", { withCredentials: true });
                const roles = Array.isArray(resp.data) ? resp.data[0]?.roles : resp.data?.roles;
                const perms = roles && roles[0]?.permissions ? roles[0].permissions.map(p => p.name) : [];
                setPermissions(perms);
            } catch (e) {
                setPermissions([]);
            }
        };
        fetchPerms();
    }, []);

    const canCreate = permissions.includes('create_departements');
    const canUpdate = permissions.includes('update_departements');
    const canDelete = permissions.includes('delete_departements');

    const employeTableRef = useRef(null);

    const [expandedDepartements, setExpandedDepartements] = useState({});
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        departementId: null,
    });
    const departementRef = useRef({});
    const subDepartementInputRef = useRef(null);
    const [clickOutsideTimeout, setClickOutsideTimeout] = useState(null);
    const [parentDepartementId, setParentDepartementId] = useState(null);
    const [editingDepartement, setEditingDepartement] = useState(null);
    const editInputRef = useRef(null);

    useEffect(() => {
        setTitle("Affiliation CIMR");
        setOnPrint(() => () => { if (employeTableRef.current) employeTableRef.current.handlePrint(); });
        setOnExportPDF(() => () => { if (employeTableRef.current) employeTableRef.current.exportToPDF(); });
        setOnExportExcel(() => () => { if (employeTableRef.current) employeTableRef.current.exportToExcel(); });
        return () => {
            clearActions();
        };
    }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions]);


    const fetchDepartements = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/departements/hierarchy');
            if (response.data && Array.isArray(response.data)) {
                setDepartements(response.data);
                localStorage.setItem('departmentHierarchy', JSON.stringify(response.data));
            }
        } catch (error) {
            console.error("Error fetching department hierarchy:", error);
            if (error.response && error.response.status === 403) {
                Swal.fire({
                    icon: "error",
                    title: "Accès refusé",
                    text: "Vous n'avez pas l'autorisation de voir la hiérarchie des départements.",
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const departmentsFromStorage = localStorage.getItem('departmentHierarchy');
        if (departmentsFromStorage) {
            try {
                setDepartements(JSON.parse(departmentsFromStorage));
                setIsLoading(false);
            } catch (e) {
                console.error("Error parsing departments from storage", e);
            }
        }
        fetchDepartements();
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [fetchDepartements]);

    const handleStartEditing = (departementId, departementName) => {
        setEditingDepartement({ id: departementId, name: departementName });
        setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
        setTimeout(() => {
            if (editInputRef.current) {
                editInputRef.current.focus();
            }
        }, 0);
    };

    const handleFinishEditing = async () => {
        if (editingDepartement) {
            try {
                const response = await axios.put(
                    `http://127.0.0.1:8000/api/departements/${editingDepartement.id}`,
                    { nom: editingDepartement.name }
                );
                setDepartements((prevDepartements) => {
                    const updateDepartement = (departments) => {
                        return departments.map((dept) => {
                            if (dept.id === editingDepartement.id) {
                                return { ...dept, nom: editingDepartement.name };
                            } else if (dept.children) {
                                return { ...dept, children: updateDepartement(dept.children) };
                            }
                            return dept;
                        });
                    };
                    return updateDepartement(prevDepartements);
                });
            } catch (error) {
                console.error("Error updating department:", error);
                setError("An error occurred while updating the department. Please try again.");
            }
        }
        setEditingDepartement(null);
    };

    const handleAddSubDepartement = async (parentId) => {
        if (!newSubDepartementName.trim()) {
            setAddingSubDepartement(null);
            return;
        }

        const departmentNameToAdd = newSubDepartementName;
        setNewSubDepartementName("");
        setAddingSubDepartement(null);
        setError(null);

        try {
            await axios.post(
                "http://127.0.0.1:8000/api/departements",
                {
                    nom: departmentNameToAdd,
                    parent_id: parentId,
                }
            );

            setExpandedDepartements((prev) => ({ ...prev, [parentId]: true }));
            Swal.fire({
                icon: 'success',
                title: 'Succès',
                text: 'Sous-département ajouté avec succès',
                confirmButtonText: 'OK',
            });
            fetchDepartements();
        } catch (error) {
            console.error("Error adding sub-department:", error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: error.response ? error.response.data.message : "Erreur ajout sous-département.",
                confirmButtonText: 'OK',
            });
        }
    };

    const handleAddSousDepartement = (parentId) => {
        setAddingSubDepartement(parentId);
        setContextMenu({ visible: false, x: 0, y: 0 });
        setExpandedDepartements((prev) => ({ ...prev, [parentId]: true }));
        setNewSubDepartementName("");
        setTimeout(() => {
            if (subDepartementInputRef.current) subDepartementInputRef.current.focus();
        }, 0);
    };

    const handleClickOutside = (e) => {
        if (clickOutsideTimeout) clearTimeout(clickOutsideTimeout);

        if (!e.target.closest(".context-menu") && !e.target.closest(".edit-form")) {
            setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
            setEditingDepartementId(null);
            setIsEditingDepartement(false);
        }
        if (addingSubDepartement && subDepartementInputRef.current && !subDepartementInputRef.current.contains(e.target)) {
            const timeoutId = setTimeout(() => handleAddSubDepartement(addingSubDepartement), 10);
            setClickOutsideTimeout(timeoutId);
        }
    };

    const handleSubDepartementInputBlur = () => {
        if (clickOutsideTimeout) clearTimeout(clickOutsideTimeout);
        if (addingSubDepartement) handleAddSubDepartement(addingSubDepartement);
    };

    const handleDepartementClick = (departementId, departementName) => {
        if (departementId) {
            setSelectedDepartementId(departementId);
            setSelectedDepartementName(departementName);
        }
    };

    const handleAddEmployeClick = (id) => {
        setIsAddingEmploye(true);
        setSelectedDepartementId(id);
        setContextMenu({ visible: false, x: 0, y: 0 });
    };

    const toggleExpand = (departementId) => {
        setExpandedDepartements((prev) => ({ ...prev, [departementId]: !prev[departementId] }));
    };

    const findDepartement = (departments, id) => {
        for (let dept of departments) {
            if (dept.id === id) return dept;
            if (dept.children && dept.children.length > 0) {
                const found = findDepartement(dept.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const handleContextMenu = (e, departementId) => {
        e.preventDefault();
        const rect = departementRef.current[departementId].getBoundingClientRect();
        setContextMenu({ visible: true, x: rect.right, y: rect.top, departementId: departementId });
    };

    const handleUpdateDepartement = async (newName) => {
        // ... same loop as above for quick inline edit ...
        // Note: this function is used in `edit-form` conditional render
        // For brevity, using similar logic (or you can reuse handleFinishEditing if connected properly)
        setError(null);
        setIsLoading(true);
        try {
            if (!editingDepartementId) throw new Error("ID null");
            await axios.put(`http://127.0.0.1:8000/api/departements/${editingDepartementId}`, { nom: newName });
            fetchDepartements();
            setIsEditingDepartement(false);
            setEditingDepartementId(null);
        } catch (error) {
            console.error(error);
            setError("Erreur mise à jour");
        } finally {
            setIsLoading(false);
        }
    };


    const confirmDeleteDepartement = async (departementId) => {
        const result = await Swal.fire({
            title: 'Êtes-vous sûr?',
            text: "Action irréversible!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui, supprimer!',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/departements/${departementId}`);
                Swal.fire('Supprimé!', 'Département supprimé.', 'success');
                fetchDepartements();
            } catch (error) {
                console.error(error);
                Swal.fire('Erreur!', 'Erreur suppression.', 'error');
            }
        }
    };

    const getSubDepartmentIds = useCallback((departments, id) => {
        const ids = new Set([id]);
        const addIds = (dept) => {
            if (dept.children) dept.children.forEach(child => { ids.add(child.id); addIds(child); });
        };
        const targetDept = findDepartement(departments, id);
        if (targetDept) addIds(targetDept);
        return Array.from(ids);
    }, []);

    const [filtersVisible, setFiltersVisible] = useState(false);
    const handleFiltersToggle = (isVisible) => isVisible ? setFiltersVisible(true) : setTimeout(() => setFiltersVisible(false), 300);

    const renderDepartement = (departement) => (
        <li key={departement.id} style={{ listStyleType: "none" }}>
            <div
                className={`department-item ${departement.id === selectedDepartementId ? 'selected' : ''}`}
                ref={(el) => (departementRef.current[departement.id] = el)}
            >
                <div className="department-item-content">
                    {departement.children && departement.children.length > 0 && (
                        <button className="expand-button" onClick={() => toggleExpand(departement.id)}>
                            {expandedDepartements[departement.id] ? <FaMinus size={14} /> : <FaPlus size={14} />}
                        </button>
                    )}
                    {(!departement.children || departement.children.length === 0) && <div style={{ width: "24px", marginRight: "8px" }}></div>}

                    {editingDepartement && editingDepartement.id === departement.id ? (
                        <input
                            ref={editInputRef}
                            type="text"
                            value={editingDepartement.name}
                            onChange={(e) => setEditingDepartement({ ...editingDepartement, name: e.target.value })}
                            onBlur={handleFinishEditing}
                            onKeyPress={(e) => { if (e.key === "Enter") handleFinishEditing(); }}
                            className="form-control"
                            style={{ fontSize: "14px" }}
                        />
                    ) : (
                        <span
                            onContextMenu={(e) => handleContextMenu(e, departement.id)}
                            onClick={() => handleDepartementClick(departement.id, departement.nom)}
                            className={`common-text ${selectedDepartementId === departement.id ? 'selected' : ''}`}
                        >
                            <IoFolderOpenOutline size={18} />
                            {departement.nom}
                        </span>
                    )}
                </div>
            </div>
            {addingSubDepartement === departement.id && (
                <div className="sub-departement-input">
                    <input
                        ref={subDepartementInputRef}
                        className="form-control"
                        type="text"
                        value={newSubDepartementName}
                        onChange={(e) => setNewSubDepartementName(e.target.value)}
                        onKeyPress={(e) => { if (e.key === "Enter") handleAddSubDepartement(departement.id); }}
                        onBlur={handleSubDepartementInputBlur}
                        placeholder="Nom du sous-département"
                    />
                </div>
            )}
            {expandedDepartements[departement.id] && departement.children && departement.children.length > 0 && (
                <ul className="sub-departments">
                    {departement.children.map((child) => renderDepartement(child))}
                </ul>
            )}
        </li>
    );

    return (
        <ThemeProvider theme={createTheme()}>
            <Box sx={{ ...dynamicStyles }}>
                <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12 }}>
                    <div className="departement_home1">
                        <ul className="departement_list">
                            <li style={{ listStyleType: "none" }}>
                                <div className="checkbox-container" style={{ marginTop: '20px', width: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '5%' }}>
                                    <input
                                        type="checkbox"
                                        checked={includeSubDepartments}
                                        onChange={(e) => setIncludeSubDepartments(e.target.checked)}
                                        id="include-sub-deps"
                                    />
                                    <label htmlFor="include-sub-deps">Inclure les sous-départements</label>
                                </div>
                            </li>
                            <div className="separator" style={{ marginTop: '0px' }}></div>
                            {departements.map((departement) => renderDepartement(departement))}
                        </ul>

                        {contextMenu.visible && (
                            <div className="context-menu" style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}>
                                <button onClick={() => handleAddEmployeClick(contextMenu.departementId)}>Ajouter un employé</button>
                                <button
                                    onClick={() => { if (!canCreate) return; handleAddSousDepartement(contextMenu.departementId); }}
                                    className={!canCreate ? 'disabled-btn' : ''}
                                    style={{ cursor: canCreate ? 'pointer' : 'not-allowed', opacity: canCreate ? 1 : 0.5 }}
                                >
                                    Ajouter sous département
                                </button>
                                <button
                                    onClick={() => {
                                        if (!canUpdate) return;
                                        const dept = findDepartement(departements, contextMenu.departementId);
                                        if (dept) handleStartEditing(contextMenu.departementId, dept.nom);
                                    }}
                                    className={!canUpdate ? 'disabled-btn' : ''}
                                    style={{ cursor: canUpdate ? 'pointer' : 'not-allowed', opacity: canUpdate ? 1 : 0.5 }}
                                >
                                    Modifier
                                </button>
                                <button
                                    onClick={() => {
                                        if (!canDelete) return;
                                        confirmDeleteDepartement(contextMenu.departementId);
                                        setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
                                    }}
                                    className={!canDelete ? 'disabled-btn' : ''}
                                    style={{ cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.5 }}
                                >
                                    Supprimer
                                </button>
                            </div>
                        )}

                        {isEditingDepartement && (
                            <div className="edit-form" style={{ width: '90%', maxWidth: '300px', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                <form onSubmit={(e) => { e.preventDefault(); handleUpdateDepartement(e.target.elements.newName.value); }}>
                                    <input name="newName" defaultValue={departements.find((d) => d.id === editingDepartementId)?.nom} />
                                    <button type="submit">Enregistrer</button>
                                </form>
                            </div>
                        )}

                        <CimrTable
                            departementId={selectedDepartementId}
                            departementName={selectedDepartementName}
                            onClose={() => setSelectedDepartementId(null)}
                            contextMenu={contextMenu}
                            handleAddEmployeClick={handleAddEmployeClick}
                            fetchDepartements={fetchDepartements}
                            isAddingEmploye={isAddingEmploye}
                            setIsAddingEmploye={setIsAddingEmploye}
                            includeSubDepartments={includeSubDepartments}
                            getSubDepartmentIds={getSubDepartmentIds}
                            departements={departements}
                            ref={employeTableRef}
                            globalSearch={searchQuery}
                            filtersVisible={filtersVisible}
                            handleFiltersToggle={handleFiltersToggle}
                        />
                    </div>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default CimrManager;
