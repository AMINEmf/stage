import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./DepartementManager.css";
import { MdOutlinePostAdd } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import EmployeTable from "./EmployeTable";
import { IoFolderOpenOutline } from "react-icons/io5";
import { FaMinus } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import Swal from 'sweetalert2';
// import PageHeader from "../../ComponentHistorique/PageHeader";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";

function DepartementManager() {
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

  // Référence vers le composant EmployeTable
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
    setTitle("Gestion des employés");
    setOnPrint(() => () => { if (employeTableRef.current) employeTableRef.current.handlePrint(); });
    setOnExportPDF(() => () => { if (employeTableRef.current) employeTableRef.current.exportToPDF(); });
    setOnExportExcel(() => () => { if (employeTableRef.current) employeTableRef.current.exportToExcel(); });
    return () => {
      clearActions();
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions]);


  const fetchDepartmentHierarchy = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/departements/hierarchy');
      setDepartements(response.data);
      localStorage.setItem('departmentHierarchy', JSON.stringify(response.data));
    } catch (error) {
      console.error("Error fetching department hierarchy:", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la hiérarchie des départements.",
        });
      }
    }
  };



  useEffect(() => {
    const departmentsFromStorage = localStorage.getItem('departmentHierarchy');

    if (departmentsFromStorage) {
      setDepartements(JSON.parse(departmentsFromStorage));
    }

    fetchDepartmentHierarchy();
  }, []);

  const fetchDepartements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/departements");
      const departmentsTree = buildDepartementTree(response.data);
      setDepartements(departmentsTree);
      localStorage.setItem('departements', JSON.stringify(departmentsTree));
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("An error occurred while fetching departments. Please try again.");
      setDepartements([]);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des départements.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const departementsFromStorage = localStorage.getItem('departements');

    if (departementsFromStorage) {
      setDepartements(JSON.parse(departementsFromStorage));
      setIsLoading(false);
    }

    fetchDepartements();

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [fetchDepartements]);

  const buildDepartementTree = (flatDepartements) => {
    const departementMap = {};
    const tree = [];

    flatDepartements.forEach((dept) => {
      dept.children = [];
      departementMap[dept.id] = dept;
    });

    flatDepartements.forEach((dept) => {
      if (dept.parent_id && departementMap[dept.parent_id]) {
        departementMap[dept.parent_id].children.push(dept);
      } else {
        tree.push(dept);
      }
    });

    return tree;
  };

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
        setError(
          "An error occurred while updating the department. Please try again."
        );
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
      const response = await axios.post(
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

      fetchDepartmentHierarchy();
    } catch (error) {
      console.error("Error adding sub-department:", error);

      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response
          ? error.response.data.message
          : "Une erreur s'est produite lors de l'ajout du sous-département. Veuillez réessayer.",
        confirmButtonText: 'OK',
      });
    }
  };

  const handleExportPDF = () => {
    if (employeTableRef.current) {
      employeTableRef.current.exportToPDF();
    }
  };

  const handleExportExcel = () => {
    if (employeTableRef.current) {
      employeTableRef.current.exportToExcel();
    }
  };

  const handlePrint = () => {
    if (employeTableRef.current) {
      employeTableRef.current.handlePrint();
    }
  };

  // const [globalSearch, setGlobalSearch] = useState("");
  // const handleGlobalSearchChange = (e) => { setGlobalSearch(e.target.value); };

  const handleAddSousDepartement = (parentId) => {
    setAddingSubDepartement(parentId);
    setContextMenu({ visible: false, x: 0, y: 0 });
    setExpandedDepartements((prev) => ({ ...prev, [parentId]: true }));
    setNewSubDepartementName("");
    setTimeout(() => {
      if (subDepartementInputRef.current) {
        subDepartementInputRef.current.focus();
      }
    }, 0);
  };

  const handleClickOutside = (e) => {
    if (clickOutsideTimeout) {
      clearTimeout(clickOutsideTimeout);
    }

    if (!e.target.closest(".context-menu") && !e.target.closest(".edit-form")) {
      setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
      setEditingDepartementId(null);
      setIsEditingDepartement(false);
    }

    if (
      addingSubDepartement &&
      subDepartementInputRef.current &&
      !subDepartementInputRef.current.contains(e.target)
    ) {
      const timeoutId = setTimeout(() => {
        handleAddSubDepartement(addingSubDepartement);
      }, 10);
      setClickOutsideTimeout(timeoutId);
    }
  };

  const handleSubDepartementInputBlur = () => {
    if (clickOutsideTimeout) {
      clearTimeout(clickOutsideTimeout);
    }
    if (addingSubDepartement) {
      handleAddSubDepartement(addingSubDepartement);
    }
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
    setExpandedDepartements((prev) => ({
      ...prev,
      [departementId]: !prev[departementId],
    }));
  };

  const renderDepartement = (departement) => (
    <li key={departement.id} style={{ listStyleType: "none" }}>
      <div
        className={`department-item ${departement.id === selectedDepartementId ? 'selected' : ''}`}
        ref={(el) => (departementRef.current[departement.id] = el)}
      >
        <div className="department-item-content">
          {departement.children && departement.children.length > 0 && (
            <button
              className="expand-button"
              onClick={() => toggleExpand(departement.id)}
            >
              {expandedDepartements[departement.id] ? (
                <FaMinus size={14} />
              ) : (
                <FaPlus size={14} />
              )}
            </button>
          )}
          {departement.children && departement.children.length === 0 && (
            <div style={{ width: "24px", marginRight: "8px" }}></div>
          )}

          {editingDepartement && editingDepartement.id === departement.id ? (
            <input
              ref={editInputRef}
              type="text"
              value={editingDepartement.name}
              onChange={(e) =>
                setEditingDepartement({
                  ...editingDepartement,
                  name: e.target.value,
                })
              }
              onBlur={handleFinishEditing}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleFinishEditing();
                }
              }}
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
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddSubDepartement(departement.id);
              }
            }}
            onBlur={handleSubDepartementInputBlur}
            placeholder="Nom du sous-département"
          />
        </div>
      )}

      {expandedDepartements[departement.id] &&
        departement.children &&
        departement.children.length > 0 && (
          <ul className="sub-departments">
            {departement.children.map((child) => renderDepartement(child))}
          </ul>
        )}
    </li>
  );

  const findDepartement = (departments, id) => {
    for (let dept of departments) {
      if (dept.id === id) {
        return dept;
      }
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
    setContextMenu({
      visible: true,
      x: rect.right,
      y: rect.top,
      departementId: departementId,
    });
  };

  const handleAddDepartement = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/departements",
        {
          nom: newDepartementName,
          parent_id: parentDepartementId,
        }
      );
      setDepartements((prevDepartements) => [
        ...prevDepartements,
        response.data,
      ]);
      setNewDepartementName("");
      setParentDepartementId(null);
      setIsFormVisible(false);
      fetchDepartements();
    } catch (error) {
      console.error("Error adding department:", error);
      setError(
        "An error occurred while adding the department. Please try again."
      );
    }
  };

  const handleAddEmploye = async (employeData) => {
    try {
      setIsAddingEmploye(false);
      if (selectedDepartementId) {
        setSelectedDepartementId(null);
        setTimeout(() => setSelectedDepartementId(selectedDepartementId), 0);
      }
      console.log("Employee added successfully");
    } catch (error) {
      console.error("Error updating UI after adding employee:", error);
      setError(
        "An error occurred while updating the UI. Please refresh the page."
      );
    }
  };

  const handleUpdateDepartement = async (newName) => {
    setError(null);
    setIsLoading(true);
    try {
      if (!editingDepartementId) {
        throw new Error("Département ID is null or undefined");
      }
      const response = await axios.put(
        `http://127.0.0.1:8000/api/departements/${editingDepartementId}`,
        { nom: newName }
      );
      if (response.data && response.data.id) {
        setDepartements((prevDepartements) =>
          prevDepartements.map((d) =>
            d.id === editingDepartementId ? response.data : d
          )
        );
        setIsEditingDepartement(false);
        setEditingDepartementId(null);
        fetchDepartements();
      } else {
        throw new Error(
          "La réponse de l'API ne contient pas les données attendues"
        );
      }
    } catch (error) {
      console.error(
        "Erreur détaillée lors de la mise à jour du département:",
        error
      );
      setError(
        "Une erreur s'est produite lors de la mise à jour du département."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteDepartement = async (departementId) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Cette action supprimera ce département et potentiellement ses sous-départements!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `http://127.0.0.1:8000/api/departements/${departementId}`
        );

        setDepartements((prevDepartements) => {
          const removeDepartement = (departments) => {
            return departments.filter(dept => {
              if (dept.id === departementId) {
                return false;
              }
              if (dept.children) {
                dept.children = removeDepartement(dept.children);
              }
              return true;
            });
          };
          return removeDepartement([...prevDepartements]);
        });

        setSelectedDepartementId(null);
        setSelectedDepartementName(null);

        Swal.fire(
          'Supprimé!',
          'Le département a été supprimé avec succès.',
          'success'
        );

        fetchDepartmentHierarchy();
      } catch (error) {
        console.error("Erreur lors de la suppression du département:", error);
        Swal.fire(
          'Erreur!',
          'Une erreur s\'est produite lors de la suppression du département.',
          'error'
        );
      }
    }
  };

  const getSubDepartmentIds = useCallback((departments, id) => {
    const ids = new Set([id]);

    const addIds = (dept) => {
      if (dept.children && dept.children.length > 0) {
        dept.children.forEach(child => {
          ids.add(child.id);
          addIds(child);
        });
      }
    };

    const findDepartment = (depts, targetId) => {
      for (let dept of depts) {
        if (dept.id === targetId) {
          return dept;
        }
        if (dept.children && dept.children.length > 0) {
          const found = findDepartment(dept.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const targetDept = findDepartment(departments, id);
    if (targetDept) {
      addIds(targetDept);
    }

    return Array.from(ids);
  }, []);
  console.log('isAddingEmploye', isAddingEmploye)

  const [filtersVisible, setFiltersVisible] = useState(false);

  const handleFiltersToggle = (isVisible) => {
    if (isVisible) {
      setFiltersVisible(true);
    } else {

      setTimeout(() => {
        setFiltersVisible(false);
      }, 300);
    }
  };


  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles }}>
        <Box component="main"
          sx={{ flexGrow: 1, p: 0, mt: 12 }}
        >
          <div className="departement_home1">
            <ul className="departement_list">
              <li style={{ listStyleType: "none" }}>
                <div className="checkbox-container" style={{ marginTop: '5%', width: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '5%' }}>
                  <input
                    type="checkbox"
                    checked={includeSubDepartments}
                    onChange={(e) => setIncludeSubDepartments(e.target.checked)}
                    id="include-sub-deps"
                  />
                  <label htmlFor="include-sub-deps">Inclure les sous-départements</label>
                </div>
              </li>
              <div className="separator" style={{ marginTop: '-1%' }}></div>
              {departements.map((departement) => renderDepartement(departement))}
            </ul>

            {contextMenu.visible && (
              <div
                className="context-menu"
                style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
              >
                <button onClick={() => handleAddEmployeClick(contextMenu.departementId)}>
                  Ajouter un employé
                </button>
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
                    if (dept) {
                      handleStartEditing(contextMenu.departementId, dept.nom);
                    }
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
              <div className="edit-form" style={{
                width: '90%',
                maxWidth: '300px',
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateDepartement(e.target.elements.newName.value);
                }}>
                  <input
                    name="newName"
                    defaultValue={departements.find((d) => d.id === editingDepartementId)?.nom}
                  />
                  <button type="submit">Enregistrer</button>
                </form>
              </div>
            )}

            <EmployeTable
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

export default DepartementManager;
