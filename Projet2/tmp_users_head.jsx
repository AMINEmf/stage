import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Navigation from "../../Acceuil/Navigation";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { Toolbar } from "@mui/material";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Link, useNavigate } from "react-router-dom";
import { Modal } from "react-bootstrap";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import "../../style1.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useOpen } from "../../Acceuil/OpenProvider.jsx";
import { useHeader } from "../../Acceuil/HeaderContext";
import ExpandRTable from "../Shared/ExpandRTable";
import { FaPlusCircle } from "react-icons/fa";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useQuery } from '@tanstack/react-query';
import UsersForm from './UsersForm';

const Users = () => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const token = localStorage.getItem("API_TOKEN");
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const navigate = useNavigate();
  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, setSearchQuery, clearActions } = useHeader();
  const [selectAll, setSelectAll] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({
    id: null,
    name: "",
    email: "",
    role: "",
    photo: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    role: "",
    photo: "",
    password: "",
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);

  const tableContainerStyle = {
    width: showForm ? '74.5%' : '99%'
  };
  const tableHeaderStyle = {
    background: "#e0e0e0",
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    borderRight: "1px solid #ddd",
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setTitle("Liste des utilisateurs");
    setOnPrint(() => handlePrint);
    setOnExportPDF(() => exportToPDF);
    setOnExportExcel(() => exportToExcel);
    return () => {
      clearActions();
      setTitle('');
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions]);

  useEffect(() => {
    setGlobalSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    if (users) {
      const filtered = users.filter((user) => {
        return Object.entries(user).some(([key, value]) => {
          if (
            key === "name" ||
            key === "email" ||
            key === "password"
          ) {
            if (typeof value === "string") {
              return value.toLowerCase().includes(globalSearch.toLowerCase());
            }
          }
          if (key === "roles" && Array.isArray(value) && value.length > 0) {
            return value[0].name.toLowerCase().includes(globalSearch.toLowerCase());
          }
          return false;
        });
      });
      setFilteredUsers(filtered);
    }
  }, [users, globalSearch]);

  useEffect(() => {
    const savedRowsPerPage = localStorage.getItem('rowsPerPageUsers');
    if (savedRowsPerPage) {
      setRowsPerPage(parseInt(savedRowsPerPage, 10));
    }
  }, []);

  const [filteredUsers, setFilteredUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/users", {
        withCredentials: true,
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des utilisateurs.",
        });
      }
    }
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const selectedRows = parseInt(event.target.value, 10);
    setRowsPerPage(selectedRows);
    localStorage.setItem('rowsPerPageUsers', selectedRows);
    setPage(0);
  };

  const handleCheckboxChange = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll);
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(users.map((user) => user.id));
    }
  };

  const handleDeleteSelected = () => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ?",
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: "Oui",
      denyButtonText: "Non",
      customClass: {
        actions: "my-actions",
        cancelButton: "order-1 right-gap",
        confirmButton: "order-2",
        denyButton: "order-3",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        selectedItems.forEach((id) => {
          axios
            .delete(`http://localhost:8000/api/users/${id}`)
            .then((response) => {
              fetchUsers();
            })
            .catch((error) => {
              console.error("Error deleting user:", error);
            });
        });
      }
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Utilisateurs supprimés avec succès.",
      });
    });
    setSelectedItems([]);
  };

  const handlePermissionsModalOpen = () => {
    setShowPermissionsModal(true);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredUsers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");
    XLSX.writeFile(wb, "utilisateurs.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['ID', 'Nom', 'Email', 'Rôle', 'Photo'];
    const tableRows = filteredUsers.map(user => [
      user.id,
      user.name,
      user.email,
      user.roles.length > 0 ? user.roles[0].name : "No Role",
      user.photo || ""
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save('utilisateurs.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectAllPermissions = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedPermissions([
        "view_all_products",
        "create_product",
        "edit_product",
        "delete_product",
        "view_all_fournisseurs",
        "create_fournisseurs",
        "update_fournisseurs",
        "delete_fournisseurs",
        "view_all_livreurs",
        "create_livreurs",
        "update_livreurs",
        "delete_livreurs",
        "view_all_vehicules",
        "create_vehicules",
        "update_vehicules",
        "delete_vehicules",
        "view_all_objectifs",
        "create_objectifs",
        "update_objectifs",
        "delete_objectifs",
        "view_all_clients",
        "create_clients",
        "update_clients",
        "delete_clients",

        "view_all_commandes",
        "create_commandes",
        "update_commandes",
        "delete_commandes",
        "view_all_users",
        "create_user",
        "edit_user",
        "delete_user",
        // Employés and related
        "view_all_employes",
        "create_employes",
        "update_employes",
        "delete_employes",
        // Absences
        "view_all_absences",
        "create_absences",
        "update_absences",
        "delete_absences",
        // Jours fériés
        "view_all_jour_feries",
        "create_jour_feries",
        "update_jour_feries",
        "delete_jour_feries",
        // Rubriques
        "view_all_rubriques",
        "create_rubriques",
        "update_rubriques",
        "delete_rubriques",
        // Constantes
        "view_all_constantes",
        "create_constantes",
        "update_constantes",
        "delete_constantes",
        // Groupes Paie
        "view_all_groupes_paie",
        "create_groupes_paie",
        "update_groupes_paie",
        "delete_groupes_paie",
        // Bulletins modèles
        "view_all_bultin_models",
        "create_bultin_models",
        "update_bultin_models",
        "delete_bultin_models",
        // Thèmes bulletin modèles
        "view_all_theme_bultin_models",
        "create_theme_bultin_models",
        "update_theme_bultin_models",
        "delete_theme_bultin_models",
        // Absence prévisionnel
        "view_all_absence_previsionnels",
        "create_absence_previsionnels",
        "update_absence_previsionnels",
        "delete_absence_previsionnels",
        // Gestion congé
        "view_all_conges",
        "create_conges",
        "update_conges",
        "delete_conges",
        // Demandes de congé
        "view_all_demandes_conges",
        "create_demandes_conges",
        "update_demandes_conges",
        "delete_demandes_conges",
        // Pages
        "view_bulletin_paie",
        "view_valeur_base",
                    // Calendries
          'view_all_calendries',
                    'create_calendries',
                    'update_calendries',
                    'delete_calendries',
         
      ]);
    } else {
      setSelectedPermissions([]);
    }
  };

  const handlePermissionsModalClose = () => {
    setShowPermissionsModal(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // const handleDelete = async (id) => {

  //   try {
  //     await axios.delete(`http://localhost:8000/api/users/${id}`, {
  //       withCredentials: true,
  //     });
  //     setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
  //   } catch (error) {
  //     console.error("Error deleting user:", error);
  //     if (error.response && error.response.status === 403) {
  //       Swal.fire({
  //         icon: "error",
  //         title: "Accès refusé",
  //         text: "Vous n'avez pas l'autorisation de supprimer cet utilisateur.",
  //       });
  //     }
  //   }
  // };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer cet user ?",
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: "Oui",
      denyButtonText: "Non",
      customClass: {
        actions: "my-actions",
        cancelButton: "order-1 right-gap",
        confirmButton: "order-2",
        denyButton: "order-3",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`http://localhost:8000/api/users/${id}`)
          .then((response) => {
            fetchUsers();
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Utilisateur supprimé avec succès.",
            });
          })
          .catch((error) => {
            console.error("Error deleting user:", error);
            if (error.response && error.response.status === 403) {
              Swal.fire({
                icon: "error",
                title: "Accès refusé",
                text: "Vous n'avez pas l'autorisation de supprimer cet utlisateur.",
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression du user.",
              });
            }
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]:
        e.target.type === "file" ? e.target.files[0] : e.target.value,
    });
  };

  const handlePermissionChange = (e) => {
    const permission = e.target.value;
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(
        selectedPermissions.filter((p) => p !== permission)
      );
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const apiUrl = editingProduit
        ? `http://localhost:8000/api/users/${editingProduit.id}`
        : `http://localhost:8000/api/register`;

      if (editingProduit) {
        const userData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
          permissions: selectedPermissions,
        };

        await axios.put(apiUrl, userData, {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else {
        const submitFormData = new FormData();
        submitFormData.append("name", formData.name);
        submitFormData.append("email", formData.email);
        submitFormData.append("role", formData.role);
        submitFormData.append("password", formData.password);
        selectedPermissions.forEach((permission) => {
          submitFormData.append("permissions[]", permission);
        });

        if (formData.photo) {
          submitFormData.append("photo", formData.photo);
        }

        await axios.post(apiUrl, submitFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        });
      }

      const successMessage = editingProduit ? "Utilisateur modifié avec succès!" : "Utilisateur ajouté avec succès!";
      
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: successMessage,
        showConfirmButton: false,
        timer: 1500,
      });

      fetchUsers();
      setSelectedPermissions([]);
      closeForm();
    } catch (error) {
      console.error("Erreur lors de la soumission des données :", error);
      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation d'effectuer cette action.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Échec de l'opération",
          text: "L'opération n'a pas pu être complétée. Veuillez réessayer plus tard.",
        });
      }
    }
  };



  
  const handleShowFormButtonClick = () => {
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduit(null);
    setUser({
      id: null,
      name: "",
      email: "",
      role: "",
      photo: null,
      password: "",
    });
    setErrors({
      name: "",
      email: "",
      role: "",
      photo: "",
      password: "",
      permission: "",
    });
    setSelectedPermissions([]);
    setIsEditing(false);
  };

  const handleEdit = (userData) => {
    setEditingProduit(userData);
    setShowForm(true);
    setIsEditing(true);
    if (userData.roles && userData.roles[0] && userData.roles[0].permissions) {
      setSelectedPermissions(
        userData.roles[0].permissions.map((permission) => permission.name)
      );
    }
  };

  // const renderPermissionsCheckbox = (value, label) => (
  //   <Form.Check
  //     type="checkbox"
  //     label={label}
  //     value={value}
  //     checked={selectedPermissions.includes(value)}
  //     onChange={handlePermissionChange}
  //   />
  // );
  const renderPermissionsCheckbox = (value, label, disabled) => (
    <Form.Check
      type="checkbox"
      label={label}
      value={value}
      checked={selectedPermissions.includes(value)}
      onChange={handlePermissionChange}
      disabled={disabled}
    />
  );

  const columns = [
    { key: 'id', label: 'ID', render: (item) => item.id },
    { key: 'name', label: 'Nom', render: (item) => item.name },
    { key: 'email', label: 'Email', render: (item) => item.email },
    { key: 'role', label: 'Rôle', render: (item) => item.roles.length > 0 ? item.roles[0].name : "No Role" },
    { key: 'photo', label: 'Photo' },
  ];

  return (
    <>
      <ThemeProvider theme={createTheme()}>
        <Box className="postionPage" sx={{ ...dynamicStyles}}>
          <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12 }}>
            <div style={{ 
              display: "flex", 
              flex: 1, 
              position: "relative",
              margin: 0,
              padding: 0,
              height: "calc(100vh - 80px)"}}
            >
              {showForm && (
                <div
                  style={{
                    position: 'fixed',
                    right: '0',
                    zIndex: 1000,
                    overflowY: 'auto',
                    top: '-8.2%',
                    width: '20%',
                    height: '84%',
                    marginTop: '8.7%',
                    marginRight: '1%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff',
                  }}
                >
                  <UsersForm
                    onSubmit={handleFormSubmit}
                    onCancel={closeForm}
                    initialData={editingProduit}
                    onOpenPermissionsModal={handlePermissionsModalOpen}
                  />
                </div>
              )}

              <div className="container3" style={{ 
                width: showForm ? '74.5%' : '99%' }}>

                <div className="mt-4">
                  <div className="section-header mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="section-title mb-1">
                          <i className="fas fa-calendar-times me-2"></i>
                          Gestion des utilisateurs
                        </span>
                        <p className="section-description text-muted mb-0">
                          {users.length} utilisateur{users.length > 1 ? 's' : ''} actuellement enregistré{users.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        onClick={handleShowFormButtonClick}
                        className="btn btn-outline-primary d-flex align-items-center"
                        size="sm"
                        style={{ height: '45px' }}
                      >
                        <FaPlusCircle className="me-2" />
                        Ajouter un utilisateur
                      </Button>
                    </div>
                  </div>
                </div>

                <ExpandRTable
                  columns={columns}
                  data={users}
                  filteredData={filteredUsers}
                  searchTerm={globalSearch}
                  selectAll={selectAll}
                  selectedItems={selectedItems}
                  handleSelectAllChange={handleSelectAllChange}
                  handleCheckboxChange={handleCheckboxChange}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handleDeleteSelected={handleDeleteSelected}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  handleChangePage={handleChangePage}
                  handleChangeRowsPerPage={handleChangeRowsPerPage}
                />

              </div>
            </div>
          </Box>
        </Box>
      </ThemeProvider>

      <Modal
            show={showPermissionsModal}
            onHide={handlePermissionsModalClose}
  dialogClassName="modal"
  size="lg"
  centered
>
  <Modal.Body className="d-flex flex-column align-items-center justify-content-center pt-0">
    <div className="position-relative w-100" style={{ marginTop: '30px' }}>
      <div
            style={{
          position: 'absolute',
          top: '-12px',
          left: '20px',
          backgroundColor: 'white',
          padding: '0 12px',
          color: '#00afaa',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          zIndex: 1,
        }}
      >
        Gestion des Permissions
      </div>
      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '30px 25px 20px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          backgroundColor: 'white',
          maxHeight: '500px',
          overflowY: 'auto',
        }}
      >
        <div className="mb-3 d-flex align-items-center">
          <label className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllPermissions}
              className="form-check-input me-2"
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#00afaa'
              }}
            />
            <span style={{ fontWeight: '500', color: '#4b5563' }}>Sélectionner tout</span>
              </label>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)', 
          gap: '15px',
          marginTop: '20px'
        }}>
          {/* Produits */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Produits
            </div>
            {renderPermissionsCheckbox("view_all_products", "Voir")}
            {renderPermissionsCheckbox("create_product", "Ajouter", !selectedPermissions.includes("view_all_products"))}
            {renderPermissionsCheckbox("edit_product", "Éditer", !selectedPermissions.includes("view_all_products"))}
            {renderPermissionsCheckbox("delete_product", "Supprimer", !selectedPermissions.includes("view_all_products"))}
          </div>

          {/* Employés */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Employés
            </div>
            {renderPermissionsCheckbox("view_all_employes", "Voir")}
            {renderPermissionsCheckbox("create_employes", "Ajouter", !selectedPermissions.includes("view_all_employes"))}
            {renderPermissionsCheckbox("update_employes", "Éditer", !selectedPermissions.includes("view_all_employes"))}
            {renderPermissionsCheckbox("delete_employes", "Supprimer", !selectedPermissions.includes("view_all_employes"))}
          </div>

          {/* Départements */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Départements
            </div>
            {renderPermissionsCheckbox("view_all_departements", "Voir")}
            {renderPermissionsCheckbox("create_departements", "Ajouter", !selectedPermissions.includes("view_all_departements"))}
            {renderPermissionsCheckbox("update_departements", "Éditer", !selectedPermissions.includes("view_all_departements"))}
            {renderPermissionsCheckbox("delete_departements", "Supprimer", !selectedPermissions.includes("view_all_departements"))}
          </div>

          {/* Contrats */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Contrats
            </div>
            {renderPermissionsCheckbox("view_all_contrats", "Voir")}
            {renderPermissionsCheckbox("update_contrats", "Éditer", !selectedPermissions.includes("view_all_contrats"))}
            {renderPermissionsCheckbox("delete_contrats", "Supprimer", !selectedPermissions.includes("view_all_contrats"))}
          </div>

          {/* Historiques */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Historiques
            </div>
            {renderPermissionsCheckbox("view_all_employee_histories", "Voir")}
            {renderPermissionsCheckbox("create_employee_histories", "Ajouter", !selectedPermissions.includes("view_all_employee_histories"))}
            {renderPermissionsCheckbox("update_employee_histories", "Éditer", !selectedPermissions.includes("view_all_employee_histories"))}
            {renderPermissionsCheckbox("delete_employee_histories", "Supprimer", !selectedPermissions.includes("view_all_employee_histories"))}
          </div>

          {/* Absences */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Absences
            </div>
            {renderPermissionsCheckbox("view_all_absences", "Voir")}
            {renderPermissionsCheckbox("create_absences", "Ajouter", !selectedPermissions.includes("view_all_absences"))}
            {renderPermissionsCheckbox("update_absences", "Éditer", !selectedPermissions.includes("view_all_absences"))}
            {renderPermissionsCheckbox("delete_absences", "Supprimer", !selectedPermissions.includes("view_all_absences"))}
          </div>
          {/* Groupe Motif Absence */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Groupe Absence
            </div>
            {renderPermissionsCheckbox("view_all_group_motifs", "Voir")}
            {renderPermissionsCheckbox("create_group_motifs", "Ajouter", !selectedPermissions.includes("view_all_group_motifs"))}
            {renderPermissionsCheckbox("update_group_motifs", "Éditer", !selectedPermissions.includes("view_all_group_motifs"))}
            {renderPermissionsCheckbox("delete_group_motifs", "Supprimer", !selectedPermissions.includes("view_all_group_motifs"))}
          </div>

          {/* Rubriques */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Rubriques
            </div>
            {renderPermissionsCheckbox("view_all_rubriques", "Voir")}
            {renderPermissionsCheckbox("create_rubriques", "Ajouter", !selectedPermissions.includes("view_all_rubriques"))}
            {renderPermissionsCheckbox("update_rubriques", "Éditer", !selectedPermissions.includes("view_all_rubriques"))}
            {renderPermissionsCheckbox("delete_rubriques", "Supprimer", !selectedPermissions.includes("view_all_rubriques"))}
          </div>
          {/* Groupe Rubriques */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Groupe Rubriques
            </div>
            {renderPermissionsCheckbox("view_all_group_rubriques", "Voir")}
            {renderPermissionsCheckbox("create_group_rubriques", "Ajouter", !selectedPermissions.includes("view_all_group_rubriques"))}
            {renderPermissionsCheckbox("update_group_rubriques", "Éditer", !selectedPermissions.includes("view_all_group_rubriques"))}
            {renderPermissionsCheckbox("delete_group_rubriques", "Supprimer", !selectedPermissions.includes("view_all_group_rubriques"))}
          </div>

          {/* Constantes */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Constantes
            </div>
            {renderPermissionsCheckbox("view_all_constantes", "Voir")}
            {renderPermissionsCheckbox("create_constantes", "Ajouter", !selectedPermissions.includes("view_all_constantes"))}
            {renderPermissionsCheckbox("update_constantes", "Éditer", !selectedPermissions.includes("view_all_constantes"))}
            {renderPermissionsCheckbox("delete_constantes", "Supprimer", !selectedPermissions.includes("view_all_constantes"))}
          </div>
          {/* Groupe Constantes */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Groupe Constantes
            </div>
            {renderPermissionsCheckbox("view_all_group_constantes", "Voir")}
            {renderPermissionsCheckbox("create_group_constantes", "Ajouter", !selectedPermissions.includes("view_all_group_constantes"))}
            {renderPermissionsCheckbox("update_group_constantes", "Éditer", !selectedPermissions.includes("view_all_group_constantes"))}
            {renderPermissionsCheckbox("delete_group_constantes", "Supprimer", !selectedPermissions.includes("view_all_group_constantes"))}
          </div>

          {/* Groupes Paie */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Groupes Paie
            </div>
            {renderPermissionsCheckbox("view_all_groupes_paie", "Voir")}
            {renderPermissionsCheckbox("create_groupes_paie", "Ajouter", !selectedPermissions.includes("view_all_groupes_paie"))}
            {renderPermissionsCheckbox("update_groupes_paie", "Éditer", !selectedPermissions.includes("view_all_groupes_paie"))}
            {renderPermissionsCheckbox("delete_groupes_paie", "Supprimer", !selectedPermissions.includes("view_all_groupes_paie"))}
          </div>
          {/* Groupes Paie - Détails */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Groupes Paie - Détails
            </div>
            {renderPermissionsCheckbox("view_groupes_paie_details", "Voir")}
            {renderPermissionsCheckbox("create_groupes_paie_details", "Ajouter", !selectedPermissions.includes("view_groupes_paie_details"))}
            {renderPermissionsCheckbox("update_groupes_paie_details", "Éditer", !selectedPermissions.includes("view_groupes_paie_details"))}
            {renderPermissionsCheckbox("delete_groupes_paie_details", "Supprimer", !selectedPermissions.includes("view_groupes_paie_details"))}
          </div>

          {/* Bulletin Modèle */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Bulletin Modèle
            </div>
            {renderPermissionsCheckbox("view_all_bultin_models", "Voir")}
            {renderPermissionsCheckbox("create_bultin_models", "Ajouter", !selectedPermissions.includes("view_all_bultin_models"))}
            {renderPermissionsCheckbox("update_bultin_models", "Éditer", !selectedPermissions.includes("view_all_bultin_models"))}
            {renderPermissionsCheckbox("delete_bultin_models", "Supprimer", !selectedPermissions.includes("view_all_bultin_models"))}
          </div>
          {/* Bulletin Modèle - Détails */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Bulletin Modèle - Détails
            </div>
            {renderPermissionsCheckbox("view_bultin_models_details", "Voir")}
            {renderPermissionsCheckbox("create_bultin_models_details", "Ajouter", !selectedPermissions.includes("view_bultin_models_details"))}
            {renderPermissionsCheckbox("update_bultin_models_details", "Éditer", !selectedPermissions.includes("view_bultin_models_details"))}
            {renderPermissionsCheckbox("delete_bultin_models_details", "Supprimer", !selectedPermissions.includes("view_bultin_models_details"))}
          </div>

          {/* Thème Bulletin */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Thème Bulletin
            </div>
            {renderPermissionsCheckbox("view_all_theme_bultin_models", "Voir")}
            {renderPermissionsCheckbox("create_theme_bultin_models", "Ajouter", !selectedPermissions.includes("view_all_theme_bultin_models"))}
            {renderPermissionsCheckbox("update_theme_bultin_models", "Éditer", !selectedPermissions.includes("view_all_theme_bultin_models"))}
            {renderPermissionsCheckbox("delete_theme_bultin_models", "Supprimer", !selectedPermissions.includes("view_all_theme_bultin_models"))}
          </div>

          {/* Absence Prévisionnel */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Abs. Prévisionnel
            </div>
            {renderPermissionsCheckbox("view_all_absence_previsionnels", "Voir")}
            {renderPermissionsCheckbox("create_absence_previsionnels", "Ajouter", !selectedPermissions.includes("view_all_absence_previsionnels"))}
            {renderPermissionsCheckbox("update_absence_previsionnels", "Éditer", !selectedPermissions.includes("view_all_absence_previsionnels"))}
            {renderPermissionsCheckbox("delete_absence_previsionnels", "Supprimer", !selectedPermissions.includes("view_all_absence_previsionnels"))}
          </div>

          {/* Gestion Congé */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Gestion Congé
            </div>
            {renderPermissionsCheckbox("view_all_conges", "Voir")}
            {renderPermissionsCheckbox("create_conges", "Ajouter", !selectedPermissions.includes("view_all_conges"))}
            {renderPermissionsCheckbox("update_conges", "Éditer", !selectedPermissions.includes("view_all_conges"))}
            {renderPermissionsCheckbox("delete_conges", "Supprimer", !selectedPermissions.includes("view_all_conges"))}
          </div>

          {/* Demandes Congé */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Demandes Congé
            </div>
            {renderPermissionsCheckbox("view_all_demandes_conges", "Voir")}
            {renderPermissionsCheckbox("create_demandes_conges", "Ajouter", !selectedPermissions.includes("view_all_demandes_conges"))}
            {renderPermissionsCheckbox("update_demandes_conges", "Éditer", !selectedPermissions.includes("view_all_demandes_conges"))}
            {renderPermissionsCheckbox("delete_demandes_conges", "Supprimer", !selectedPermissions.includes("view_all_demandes_conges"))}
          </div>

          {/* Jours Fériés */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Jours Fériés
            </div>
            {renderPermissionsCheckbox("view_all_jour_feries", "Voir")}
            {renderPermissionsCheckbox("create_jour_feries", "Ajouter", !selectedPermissions.includes("view_all_jour_feries"))}
            {renderPermissionsCheckbox("update_jour_feries", "Éditer", !selectedPermissions.includes("view_all_jour_feries"))}
            {renderPermissionsCheckbox("delete_jour_feries", "Supprimer", !selectedPermissions.includes("view_all_jour_feries"))}
          </div>

          {/* Calendriers */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Calendriers
            </div>
            {renderPermissionsCheckbox("view_all_calendries", "Voir")}
            {renderPermissionsCheckbox("create_calendries", "Ajouter", !selectedPermissions.includes("view_all_calendries"))}
            {renderPermissionsCheckbox("update_calendries", "Éditer", !selectedPermissions.includes("view_all_calendries"))}
            {renderPermissionsCheckbox("delete_calendries", "Supprimer", !selectedPermissions.includes("view_all_calendries"))}
          </div>

          {/* Horaires */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Horaires
            </div>
            {renderPermissionsCheckbox("view_all_horaires", "Voir")}
            {renderPermissionsCheckbox("create_horaires", "Ajouter", !selectedPermissions.includes("view_all_horaires"))}
            {renderPermissionsCheckbox("update_horaires", "Éditer", !selectedPermissions.includes("view_all_horaires"))}
            {renderPermissionsCheckbox("delete_horaires", "Supprimer", !selectedPermissions.includes("view_all_horaires"))}
          </div>
          {/* Groupe Horaires */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', backgroundColor: '#f9fafb' }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Groupe Horaires
            </div>
            {renderPermissionsCheckbox("view_all_groupe_horaires", "Voir")}
            {renderPermissionsCheckbox("create_groupe_horaires", "Ajouter", !selectedPermissions.includes("view_all_groupe_horaires"))}
            {renderPermissionsCheckbox("update_groupe_horaires", "Éditer", !selectedPermissions.includes("view_all_groupe_horaires"))}
            {renderPermissionsCheckbox("delete_groupe_horaires", "Supprimer", !selectedPermissions.includes("view_all_groupe_horaires"))}
          </div>

          {/* Horaires Périodiques */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Hor. Périodiques
            </div>
            {renderPermissionsCheckbox("view_all_horaire_periodiques", "Voir")}
            {renderPermissionsCheckbox("create_horaire_periodiques", "Ajouter", !selectedPermissions.includes("view_all_horaire_periodiques"))}
            {renderPermissionsCheckbox("update_horaire_periodiques", "Éditer", !selectedPermissions.includes("view_all_horaire_periodiques"))}
            {renderPermissionsCheckbox("delete_horaire_periodiques", "Supprimer", !selectedPermissions.includes("view_all_horaire_periodiques"))}
          </div>

          {/* Utilisateurs */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Utilisateurs
            </div>
            {renderPermissionsCheckbox("view_all_users", "Voir")}
            {renderPermissionsCheckbox("create_user", "Ajouter", !selectedPermissions.includes("view_all_users"))}
            {renderPermissionsCheckbox("edit_user", "Éditer", !selectedPermissions.includes("view_all_users"))}
            {renderPermissionsCheckbox("delete_user", "Supprimer", !selectedPermissions.includes("view_all_users"))}
          </div>

          {/* Sociétés */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Sociétés
            </div>
            {renderPermissionsCheckbox("view_all_societes", "Voir")}
            {renderPermissionsCheckbox("create_societes", "Ajouter", !selectedPermissions.includes("view_all_societes"))}
            {renderPermissionsCheckbox("update_societes", "Éditer", !selectedPermissions.includes("view_all_societes"))}
            {renderPermissionsCheckbox("delete_societes", "Supprimer", !selectedPermissions.includes("view_all_societes"))}
          </div>

          {/* Bons de Sortie */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Bons de Sortie
            </div>
            {renderPermissionsCheckbox("view_all_bon_de_sortie", "Voir")}
            {renderPermissionsCheckbox("create_bon_de_sortie", "Ajouter", !selectedPermissions.includes("view_all_bon_de_sortie"))}
            {renderPermissionsCheckbox("update_bon_de_sortie", "Éditer", !selectedPermissions.includes("view_all_bon_de_sortie"))}
            {renderPermissionsCheckbox("delete_bon_de_sortie", "Supprimer", !selectedPermissions.includes("view_all_bon_de_sortie"))}
          </div>

          {/* Règles Compensation */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Règles Compens.
            </div>
            {renderPermissionsCheckbox("view_all_regle_compensation", "Voir")}
            {renderPermissionsCheckbox("create_regle_compensation", "Ajouter", !selectedPermissions.includes("view_all_regle_compensation"))}
            {renderPermissionsCheckbox("update_regle_compensation", "Éditer", !selectedPermissions.includes("view_all_regle_compensation"))}
            {renderPermissionsCheckbox("delete_regle_compensation", "Supprimer", !selectedPermissions.includes("view_all_regle_compensation"))}
          </div>

          {/* Pénalités */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Pénalités
            </div>
            {renderPermissionsCheckbox("view_all_penalites", "Voir")}
            {renderPermissionsCheckbox("create_penalites", "Ajouter", !selectedPermissions.includes("view_all_penalites"))}
            {renderPermissionsCheckbox("update_penalites", "Éditer", !selectedPermissions.includes("view_all_penalites"))}
            {renderPermissionsCheckbox("delete_penalites", "Supprimer", !selectedPermissions.includes("view_all_penalites"))}
          </div>

          {/* Arrondis */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Arrondis
            </div>
            {renderPermissionsCheckbox("view_all_arrondis", "Voir")}
            {renderPermissionsCheckbox("create_arrondis", "Ajouter", !selectedPermissions.includes("view_all_arrondis"))}
            {renderPermissionsCheckbox("update_arrondis", "Éditer", !selectedPermissions.includes("view_all_arrondis"))}
            {renderPermissionsCheckbox("delete_arrondis", "Supprimer", !selectedPermissions.includes("view_all_arrondis"))}
          </div>

          {/* Paramètres Base */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Paramètres Base
            </div>
            {renderPermissionsCheckbox("view_all_parametre_base", "Voir")}
            {renderPermissionsCheckbox("create_parametre_base", "Ajouter", !selectedPermissions.includes("view_all_parametre_base"))}
            {renderPermissionsCheckbox("update_parametre_base", "Éditer", !selectedPermissions.includes("view_all_parametre_base"))}
            {renderPermissionsCheckbox("delete_parametre_base", "Supprimer", !selectedPermissions.includes("view_all_parametre_base"))}
          </div>

          {/* Heures Travail */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Heures Travail
            </div>
            {renderPermissionsCheckbox("view_all_heure_travail", "Voir")}
            {renderPermissionsCheckbox("create_heure_travail", "Ajouter", !selectedPermissions.includes("view_all_heure_travail"))}
            {renderPermissionsCheckbox("update_heure_travail", "Éditer", !selectedPermissions.includes("view_all_heure_travail"))}
            {renderPermissionsCheckbox("delete_heure_travail", "Supprimer", !selectedPermissions.includes("view_all_heure_travail"))}
          </div>

          {/* Horaires Exceptionnels */}
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
              Hor. Except.
            </div>
            {renderPermissionsCheckbox("view_all_horaire_exceptionnel", "Voir")}
            {renderPermissionsCheckbox("create_horaire_exceptionnel", "Ajouter", !selectedPermissions.includes("view_all_horaire_exceptionnel"))}
            {renderPermissionsCheckbox("update_horaire_exceptionnel", "Éditer", !selectedPermissions.includes("view_all_horaire_exceptionnel"))}
            {renderPermissionsCheckbox("delete_horaire_exceptionnel", "Supprimer", !selectedPermissions.includes("view_all_horaire_exceptionnel"))}
          </div>
        </div>
      </div>
    </div>
            </Modal.Body>

  <Modal.Footer className="border-0 pt-0 d-flex justify-content-center">
    <button
      className="btn px-4 py-2"
      style={{
        backgroundColor: '#00afaa',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      onClick={handlePermissionsModalClose}
    >
      <i className="fas fa-check me-2"></i>
      Valider
    </button>
    <button
      className="btn px-4 py-2 me-3"
      style={{
        backgroundColor: 'white',
        color: '#00afaa',
        border: '1px solid #00afaa',
        borderRadius: '8px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
      onClick={handlePermissionsModalClose}
    >
      Annuler
    </button>
            </Modal.Footer>
          </Modal>


      <style jsx>{`     
            
            /* Styles de section header */
            .section-header {
                border-bottom: none;
                padding-bottom: 15px;
margin: 0.5% 1% 1%;

            }

            .section-title {
                color: #2c3e50;
                font-weight: 600;
                margin-bottom: 5px;
                display: flex;
                align-items: center;
                font-size: 19px;
            }

            .section-title i {
                color: rgba(8, 179, 173, 0.02);
                background: #3a8a90;
                padding: 6px;
                border-radius: 60%;
                margin-right: 10px;
            }

            .section-description {
                color: #6c757d;
                font-size: 16px;
                margin-bottom: 0;
            }

                .btn-primary {
    background-color: #3a8a90;
    border-color: #3a8a90;
    color: white;
    border-radius: 0.375rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    transition: background-color 0.15s ease-in-out;
}

            .content-title {
font-size: 1.2rem;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 5px;   
 }

.modal-xl {
  max-width: 95vw !important;
  width: 95vw !important;
}

.modal-xl .modal-content {
  width: 100%;
}    
    }
    

`}</style>

    </>
  );
};

export default Users;
