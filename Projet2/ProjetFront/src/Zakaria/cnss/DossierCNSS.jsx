import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";
import { IoFolderOpenOutline } from "react-icons/io5";
import { FaMinus } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import Swal from "sweetalert2";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import DossierCNSSTable from "./DossierCNSSTable";
import "../Employe/DepartementManager.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

function DossierCNSS() {
  const dossiersTableRef = useRef(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [departements, setDepartements] = useState([]);
  const [expandedDepartements, setExpandedDepartements] = useState({});
  const [selectedDepartementId, setSelectedDepartementId] = useState(null);
  const [selectedDepartementName, setSelectedDepartementName] = useState(null);
  const [includeSubDepartments, setIncludeSubDepartments] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    departementId: null,
  });
  const [editingDepartement, setEditingDepartement] = useState(null);
  const [addingSubDepartement, setAddingSubDepartement] = useState(null);
  const [newSubDepartementName, setNewSubDepartementName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const departementRef = useRef({});
  const subDepartementInputRef = useRef(null);
  const editInputRef = useRef(null);
  const [clickOutsideTimeout, setClickOutsideTimeout] = useState(null);

  const { dynamicStyles } = useOpen();
  const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, clearActions } = useHeader();

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const resp = await axios.get(`${API_BASE}/api/user`, { withCredentials: true });
        const roles = Array.isArray(resp.data) ? resp.data[0]?.roles : resp.data?.roles;
        const perms = roles && roles[0]?.permissions ? roles[0].permissions.map((p) => p.name) : [];
        setPermissions(perms);
      } catch (e) {
        setPermissions([]);
      }
    };
    fetchPerms();
  }, []);

  const canCreate = permissions.includes("create_departements");
  const canUpdate = permissions.includes("update_departements");
  const canDelete = permissions.includes("delete_departements");

  useEffect(() => {
    setTitle("Dossier CNSS");
    setOnPrint(() => () => {
      if (dossiersTableRef.current) dossiersTableRef.current.handlePrint();
    });
    setOnExportPDF(() => () => {
      if (dossiersTableRef.current) dossiersTableRef.current.exportToPDF();
    });
    setOnExportExcel(() => () => {
      if (dossiersTableRef.current) dossiersTableRef.current.exportToExcel();
    });

    return () => {
      clearActions();
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions]);

  const handleFiltersToggle = useCallback((isVisible) => {
    if (isVisible) {
      setFiltersVisible(true);
      return;
    }
    setTimeout(() => setFiltersVisible(false), 300);
  }, []);

  const fetchDepartmentHierarchy = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/departements/hierarchy`);
      setDepartements(response.data);
      localStorage.setItem("departmentHierarchy", JSON.stringify(response.data));
    } catch (error) {
      console.error("CNSS Dossier: Error fetching department hierarchy:", error);
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
    const departmentsFromStorage = localStorage.getItem("departmentHierarchy");

    if (departmentsFromStorage) {
      setDepartements(JSON.parse(departmentsFromStorage));
    }

    fetchDepartmentHierarchy();

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleClickOutside = (e) => {
    if (clickOutsideTimeout) {
      clearTimeout(clickOutsideTimeout);
    }

    if (!e.target.closest(".context-menu") && !e.target.closest(".edit-form")) {
      setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
    }

    if (addingSubDepartement && subDepartementInputRef.current && !subDepartementInputRef.current.contains(e.target)) {
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
      if (String(selectedDepartementId) === String(departementId)) {
        setSelectedDepartementId(null);
        setSelectedDepartementName(null);
      } else {
        setSelectedDepartementId(departementId);
        setSelectedDepartementName(departementName);
      }
    }
  };

  const toggleExpand = (departementId) => {
    setExpandedDepartements((prev) => ({
      ...prev,
      [departementId]: !prev[departementId],
    }));
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
        await axios.put(`${API_BASE}/api/departements/${editingDepartement.id}`, {
          nom: editingDepartement.name,
        });
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
        console.error("CNSS Dossier: Error updating department:", error);
      }
    }
    setEditingDepartement(null);
  };

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

  const handleAddSubDepartement = async (parentId) => {
    if (!newSubDepartementName.trim()) {
      setAddingSubDepartement(null);
      return;
    }

    const departmentNameToAdd = newSubDepartementName;
    setNewSubDepartementName("");
    setAddingSubDepartement(null);

    try {
      await axios.post(`${API_BASE}/api/departements`, {
        nom: departmentNameToAdd,
        parent_id: parentId,
      });

      setExpandedDepartements((prev) => ({ ...prev, [parentId]: true }));
      Swal.fire({
        icon: "success",
        title: "Succès",
        text: "Sous-département ajouté avec succès",
        confirmButtonText: "OK",
      });

      fetchDepartmentHierarchy();
    } catch (error) {
      console.error("CNSS Dossier: Error adding sub-department:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.response ? error.response.data.message : "Une erreur s'est produite.",
        confirmButtonText: "OK",
      });
    }
  };

  const confirmDeleteDepartement = async (departementId) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: "Cette action supprimera ce département et potentiellement ses sous-départements!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/api/departements/${departementId}`);

        setDepartements((prevDepartements) => {
          const removeDepartement = (departments) => {
            return departments.filter((dept) => {
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

        Swal.fire("Supprimé!", "Le département a été supprimé avec succès.", "success");
        fetchDepartmentHierarchy();
      } catch (error) {
        console.error("CNSS Dossier: Error deleting department:", error);
        Swal.fire("Erreur!", "Une erreur s'est produite lors de la suppression.", "error");
      }
    }
  };

  const renderDepartement = (departement) => (
    <li key={departement.id} style={{ listStyleType: "none" }}>
      <div
        className={`department-item ${departement.id === selectedDepartementId ? "selected" : ""}`}
        ref={(el) => (departementRef.current[departement.id] = el)}
      >
        <div className="department-item-content">
          {departement.children && departement.children.length > 0 && (
            <button className="expand-button" onClick={() => toggleExpand(departement.id)}>
              {expandedDepartements[departement.id] ? <FaMinus size={14} /> : <FaPlus size={14} />}
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
              className={`common-text ${selectedDepartementId === departement.id ? "selected" : ""}`}
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

      {expandedDepartements[departement.id] && departement.children && departement.children.length > 0 && (
        <ul className="sub-departments">{departement.children.map((child) => renderDepartement(child))}</ul>
      )}
    </li>
  );

  const getSubDepartmentIds = useCallback((departments, id) => {
    const ids = new Set([id]);

    const addIds = (dept) => {
      if (dept.children && dept.children.length > 0) {
        dept.children.forEach((child) => {
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

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles, minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12, minHeight: "calc(100vh - 160px)" }}>
          <div className="departement_home1">
            <ul className="departement_list">
              <li style={{ listStyleType: "none" }}>
                <div
                  className="checkbox-container"
                  style={{ marginTop: "5%", width: "90%", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "5%" }}
                >
                  <input
                    type="checkbox"
                    checked={includeSubDepartments}
                    onChange={(e) => setIncludeSubDepartments(e.target.checked)}
                    id="include-sub-deps"
                  />
                  <label htmlFor="include-sub-deps">Inclure les sous-départements</label>
                </div>
              </li>
              <div className="separator" style={{ marginTop: "-1%" }}></div>
              {departements.length === 0 && (
                <li style={{ listStyleType: "none", padding: "1rem", color: "#666" }}>Aucun département trouvé</li>
              )}
              {departements.map((departement) => renderDepartement(departement))}
            </ul>

            {contextMenu.visible && (
              <div className="context-menu" style={{ top: "15%", left: "16%" }}>
                <button
                  onClick={() => {
                    if (!canCreate) return;
                    handleAddSousDepartement(contextMenu.departementId);
                  }}
                  className={!canCreate ? "disabled-btn" : ""}
                  style={{ cursor: canCreate ? "pointer" : "not-allowed", opacity: canCreate ? 1 : 0.5 }}
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
                  className={!canUpdate ? "disabled-btn" : ""}
                  style={{ cursor: canUpdate ? "pointer" : "not-allowed", opacity: canUpdate ? 1 : 0.5 }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    if (!canDelete) return;
                    confirmDeleteDepartement(contextMenu.departementId);
                    setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
                  }}
                  className={!canDelete ? "disabled-btn" : ""}
                  style={{ cursor: canDelete ? "pointer" : "not-allowed", opacity: canDelete ? 1 : 0.5 }}
                >
                  Supprimer
                </button>
              </div>
            )}

            <DossierCNSSTable
              ref={dossiersTableRef}
              globalSearch={searchQuery}
              filtersVisible={filtersVisible}
              handleFiltersToggle={handleFiltersToggle}
              departementId={selectedDepartementId}
              departementName={selectedDepartementName}
              includeSubDepartments={includeSubDepartments}
              getSubDepartmentIds={getSubDepartmentIds}
              departements={departements}
              onClose={() => setSelectedDepartementId(null)}
            />
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default DossierCNSS;
