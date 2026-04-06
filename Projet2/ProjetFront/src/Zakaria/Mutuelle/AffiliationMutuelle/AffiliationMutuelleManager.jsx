import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./AffiliationMutuelleManager.css";
import { MdOutlinePostAdd } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import AffiliationMutuelleTable from "./AffiliationMutuelleTable";
import { IoFolderOpenOutline } from "react-icons/io5";
import { FaMinus } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { showSuccessMessage, showErrorMessage, showConfirmDialog, showErrorFromResponse, STANDARD_MESSAGES } from '../../../utils/messageHelper';
// import PageHeader from "../../../ComponentHistorique/PageHeader";
import { useHeader } from "../../../Acceuil/HeaderContext";
import { useOpen } from "../../../Acceuil/OpenProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box } from "@mui/material";

function AffiliationMutuelleManager() {
  const [departements, setDepartements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingDepartement, setIsEditingDepartement] = useState(false);
  const [editingDepartementId, setEditingDepartementId] = useState(null);
  const [isAddingAffiliation, setIsAddingAffiliation] = useState(false);
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

  const canCreate = permissions.includes('create_affiliation_mutuelles') || permissions.includes('create_departements');
  const canUpdate = permissions.includes('update_affiliation_mutuelles') || permissions.includes('update_departements');
  const canDelete = permissions.includes('delete_affiliation_mutuelles') || permissions.includes('delete_departements');

  // Référence vers le composant AffiliationMutuelleTable
  const affiliationMutuelleTableRef = useRef(null);

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
  const [filtersVisible, setFiltersVisible] = useState(false);

  const handleFiltersToggle = (visible) => {
    setFiltersVisible(visible);
  };

  useEffect(() => {
    setTitle("Gestion de l'Affiliation Assurance");
    setOnPrint(() => () => { if (affiliationMutuelleTableRef.current) affiliationMutuelleTableRef.current.handlePrint(); });
    setOnExportPDF(() => () => { if (affiliationMutuelleTableRef.current) affiliationMutuelleTableRef.current.exportToPDF(); });
    setOnExportExcel(() => () => { if (affiliationMutuelleTableRef.current) affiliationMutuelleTableRef.current.exportToExcel(); });
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
        showErrorMessage(
          "Accès refusé",
          "Vous n'avez pas l'autorisation de voir la hiérarchie des départements."
        );
      }
    }
  };

  const buildDepartementTree = (departements) => {
    const departementMap = {};
    const tree = [];

    departements.forEach((dept) => {
      departementMap[dept.id] = { ...dept, children: [] };
    });

    departements.forEach((dept) => {
      if (dept.parent_id === null) {
        tree.push(departementMap[dept.id]);
      } else {
        const parent = departementMap[dept.parent_id];
        if (parent) {
          parent.children.push(departementMap[dept.id]);
        }
      }
    });

    return tree;
  };

  useEffect(() => {
    const departmentsFromStorage = localStorage.getItem('departmentHierarchy');

    if (departmentsFromStorage) {
      setDepartements(JSON.parse(departmentsFromStorage));
    }

    fetchDepartmentHierarchy();
  }, []);

  const fetchDepartements = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }
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
        showErrorMessage(
          "Accès refusé",
          "Vous n'avez pas l'autorisation de voir la liste des départements."
        );
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const departementsFromStorage = localStorage.getItem('departements');

    if (departementsFromStorage) {
      setDepartements(JSON.parse(departementsFromStorage));
      setIsLoading(false);
      fetchDepartements({ showLoading: false });
    } else {
      fetchDepartements();
    }

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [fetchDepartements]);

  const handleClickOutside = (event) => {
    const clickedOnDepartement = Object.values(departementRef.current).some((ref) =>
      ref && ref.contains(event.target)
    );

    if (!clickedOnDepartement) {
      setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
    }
  };

  const handleContextMenu = (event, departementId) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.pageX,
      y: event.pageY,
      departementId,
    });
  };

  const toggleExpansion = (departementId) => {
    setExpandedDepartements((prev) => ({
      ...prev,
      [departementId]: !prev[departementId],
    }));
  };

  const handleDepartementClick = (departementId, departementName) => {
    setSelectedDepartementId(departementId);
    setSelectedDepartementName(departementName);
    setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
  };

  const handleAddAffiliationClick = (departementId) => {
    setIsAddingAffiliation(true);
    setSelectedDepartementId(departementId);
    setContextMenu({ visible: false, x: 0, y: 0, departementId: null });
  };

  const handleAddSousDepartement = (parentId) => {
    if (!canCreate) return;

    setAddingSubDepartement(parentId);
    setParentDepartementId(parentId);
    setContextMenu({ visible: false, x: 0, y: 0, departementId: null });

    setTimeout(() => {
      if (subDepartementInputRef.current) {
        subDepartementInputRef.current.focus();
      }
    }, 100);
  };

  const handleSaveSubDepartement = async () => {
    if (newSubDepartementName.trim() && parentDepartementId) {
      try {
        const response = await axios.post("http://127.0.0.1:8000/api/departements", {
          nom: newSubDepartementName,
          parent_id: parentDepartementId,
        });

        const newSubDepartement = response.data.departement;

        setDepartements(prev => {
          const addSubDepartement = (departements) => {
            return departements.map(dept => {
              if (dept.id === parentDepartementId) {
                return {
                  ...dept,
                  children: [...(dept.children || []), { ...newSubDepartement, children: [] }]
                };
              } else if (dept.children && dept.children.length > 0) {
                return {
                  ...dept,
                  children: addSubDepartement(dept.children)
                };
              }
              return dept;
            });
          };

          const updated = addSubDepartement(prev);
          localStorage.setItem('departements', JSON.stringify(updated));
          return updated;
        });

        setExpandedDepartements(prev => ({
          ...prev,
          [parentDepartementId]: true
        }));

        setNewSubDepartementName("");
        setAddingSubDepartement(null);
        setParentDepartementId(null);

      } catch (error) {
        console.error("Erreur lors de la création du sous-département:", error);
        showErrorMessage(
          "Erreur",
          "Une erreur est survenue lors de la création du sous-département."
        );
      }
    }
  };

  const handleCancelSubDepartement = () => {
    setNewSubDepartementName("");
    setAddingSubDepartement(null);
    setParentDepartementId(null);
  };

  const handleStartEditing = (departementId, currentName) => {
    if (!canUpdate) return;

    setEditingDepartement({ id: departementId, name: currentName });
    setContextMenu({ visible: false, x: 0, y: 0, departementId: null });

    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 100);
  };

  const handleFinishEditing = async () => {
    if (editingDepartement && editingDepartement.name.trim()) {
      try {
        await axios.put(`http://127.0.0.1:8000/api/departements/${editingDepartement.id}`, {
          nom: editingDepartement.name.trim()
        });

        setDepartements(prev => {
          const updateDepartement = (departements) => {
            return departements.map(dept => {
              if (dept.id === editingDepartement.id) {
                return { ...dept, nom: editingDepartement.name.trim() };
              } else if (dept.children && dept.children.length > 0) {
                return { ...dept, children: updateDepartement(dept.children) };
              }
              return dept;
            });
          };

          const updated = updateDepartement(prev);
          localStorage.setItem('departements', JSON.stringify(updated));
          return updated;
        });

        if (selectedDepartementId === editingDepartement.id) {
          setSelectedDepartementName(editingDepartement.name.trim());
        }

        setEditingDepartement(null);

      } catch (error) {
        console.error("Erreur lors de la modification du département:", error);
        showErrorMessage(
          "Erreur",
          "Une erreur est survenue lors de la modification du département."
        );
      }
    } else {
      setEditingDepartement(null);
    }
  };

  const findDepartement = (departements, id) => {
    for (const dept of departements) {
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

  const confirmDeleteDepartement = async (departementId) => {
    if (!canDelete) return;

    const departement = findDepartement(departements, departementId);
    if (!departement) return;

    const result = await showConfirmDialog(
      'Êtes-vous sûr ?',
      `Vous allez supprimer le département "${departement.nom}" et tous ses sous-départements !`
    );
    
    if (result.isConfirmed) {
      deleteDepartement(departementId);
    }
  };

  const deleteDepartement = async (departementId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/departements/${departementId}`);

      setDepartements(prevDepartements => {
        const removeDepartement = (departements) => {
          return departements.filter(dept => {
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

      showSuccessMessage(
        'Supprimé',
        'Le département a été supprimé avec succès.'
      );

      fetchDepartmentHierarchy();
    } catch (error) {
      console.error("Erreur lors de la suppression du département:", error);
      showErrorMessage(
        'Erreur',
        'Une erreur s\'est produite lors de la suppression du département.'
      );
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

    const department = findDepartment(departments, id);
    if (department) {
      addIds(department);
    }

    return Array.from(ids);
  }, []);

  const renderDepartement = (departement, level = 0) => (
    <li
      key={departement.id}
      className="department-item"
      style={{ paddingLeft: `${level * 20}px` }}
      ref={(el) => (departementRef.current[departement.id] = el)}
    >
      <div className="department-item-content">
        <div className="department-content-wrapper">
          {departement.children && departement.children.length > 0 && (
            <button
              className="expand-button"
              onClick={() => toggleExpansion(departement.id)}
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
            placeholder="Nom du sous-département"
            value={newSubDepartementName}
            onChange={(e) => setNewSubDepartementName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSaveSubDepartement();
              } else if (e.key === "Escape") {
                handleCancelSubDepartement();
              }
            }}
            onBlur={handleSaveSubDepartement}
          />
        </div>
      )}

      {departement.children &&
        departement.children.length > 0 &&
        expandedDepartements[departement.id] && (
          <ul>
            {departement.children.map((child) => renderDepartement(child, level + 1))}
          </ul>
        )}
    </li>
  );

  const customTheme = createTheme({
    components: {
      MuiBox: {
        styleOverrides: {
          root: {
            margin: 0,
            padding: 0,
          },
        },
      },
    },
  });

  if (isLoading && departements.length === 0) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div style={{
      ...dynamicStyles,
      display: "flex",
      flexDirection: "row",
      gap: "15px",
      padding: "20px 20px 20px 5px",
      marginTop: "72px",
      height: "calc(100vh - 80px)",
      boxSizing: "border-box",
      backgroundColor: "#ffffff"
    }}>
      <div className="departement_home1" style={{ display: 'flex', width: '100%', gap: '15px' }}>
        <ul className="departement_list" style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(8, 179, 173, 0.08)',
          boxShadow: '0 6px 20px rgba(8, 179, 173, 0.08), 0 2px 6px rgba(8, 179, 173, 0.04)',
          padding: '15px',
          height: '100%',
          margin: 0,
          listStyle: 'none',
          overflowY: 'auto'
        }}>
          {departements.map((departement) => renderDepartement(departement))}
        </ul>

        {contextMenu.visible && (
          <div
            className="context-menu"
            style={{ top: "15%", left: "16%" }}
          >
            <button onClick={() => handleAddAffiliationClick(contextMenu.departementId)}>
              Ajouter une affiliation
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

        <AffiliationMutuelleTable
          departementId={selectedDepartementId}
          departementName={selectedDepartementName}
          onClose={() => setSelectedDepartementId(null)}
          contextMenu={contextMenu}
          handleAddAffiliationClick={handleAddAffiliationClick}
          fetchDepartements={fetchDepartements}
          isAddingAffiliation={isAddingAffiliation}
          setIsAddingAffiliation={setIsAddingAffiliation}
          includeSubDepartments={includeSubDepartments}
          getSubDepartmentIds={getSubDepartmentIds}
          departements={departements}
          ref={affiliationMutuelleTableRef}
          globalSearch={searchQuery}
          filtersVisible={filtersVisible}
          handleFiltersToggle={handleFiltersToggle}
        />
      </div>
    </div>
  );
}

export default AffiliationMutuelleManager;
