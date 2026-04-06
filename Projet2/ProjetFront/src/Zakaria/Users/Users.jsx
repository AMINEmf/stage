import React, { useState, useEffect, useRef } from "react";
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
import "../Style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useOpen } from "../../Acceuil/OpenProvider.jsx";
import { useHeader } from "../../Acceuil/HeaderContext";
import ExpandRTable from "../Shared/ExpandRTable";
import { FaPlusCircle } from "react-icons/fa";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import UsersForm from './UsersForm';

const USERS_CACHE_KEY = "users_list_cache_v1";
const USERS_CACHE_TTL_MS = 60 * 1000;
let usersMemoryCache = { data: null, updatedAt: 0 };

const readUsersCache = () => {
  try {
    if (Array.isArray(usersMemoryCache.data)) {
      return {
        data: usersMemoryCache.data,
        updatedAt: Number(usersMemoryCache.updatedAt) || 0,
      };
    }

    const raw = localStorage.getItem(USERS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data)) return null;

    return {
      data: parsed.data,
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch (error) {
    console.warn("[Users] Failed to read users cache", error);
    return null;
  }
};

const writeUsersCache = (nextUsers) => {
  const payload = {
    data: Array.isArray(nextUsers) ? nextUsers : [],
    updatedAt: Date.now(),
  };

  usersMemoryCache = payload;

  try {
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[Users] Failed to persist users cache", error);
  }
};

const isUsersCacheFresh = (updatedAt) => {
  if (!updatedAt) return false;
  return Date.now() - updatedAt < USERS_CACHE_TTL_MS;
};

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
  const [usersLoading, setUsersLoading] = useState(false);
  const [hasWarmUsersCache, setHasWarmUsersCache] = useState(false);
  const usersRef = useRef([]);

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
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    const cache = readUsersCache();
    if (cache && Array.isArray(cache.data) && cache.data.length > 0) {
      setUsers(cache.data);
      setHasWarmUsersCache(true);
    }

    fetchUsers({
      forceRefresh: !isUsersCacheFresh(cache?.updatedAt),
      silent: !!(cache && Array.isArray(cache.data) && cache.data.length > 0),
    });
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

  const fetchUsers = async ({ forceRefresh = false, silent = false } = {}) => {
    const cache = readUsersCache();
    const cacheHasData = !!(cache && Array.isArray(cache.data) && cache.data.length > 0);

    if (!forceRefresh && cacheHasData && isUsersCacheFresh(cache.updatedAt)) {
      setUsers(cache.data);
      setHasWarmUsersCache(true);
      setUsersLoading(false);
      return cache.data;
    }

    const hasVisibleData = Array.isArray(usersRef.current) && usersRef.current.length > 0;
    if (!silent && !hasVisibleData && !cacheHasData) {
      setUsersLoading(true);
    }

    try {
      const response = await axios.get("http://localhost:8000/api/users", {
        withCredentials: true,
      });

      const nextUsers = Array.isArray(response.data) ? response.data : [];
      setUsers(nextUsers);
      writeUsersCache(nextUsers);
      if (nextUsers.length > 0) {
        setHasWarmUsersCache(true);
      }

      return nextUsers;
    } catch (error) {
      console.error("Error fetching users:", error);
      if (cacheHasData) {
        setUsers(cache.data);
        setHasWarmUsersCache(true);
      }

      if (error.response && error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la liste des utilisateurs.",
        });
      }
      return cacheHasData ? cache.data : [];
    } finally {
      setUsersLoading(false);
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
              fetchUsers({ forceRefresh: true, silent: hasWarmUsersCache });
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
      setSelectedPermissions(
        navigationPermissionGroups.flatMap((group) =>
          group.permissions.map((permission) => permission.value)
        )
      );
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
            fetchUsers({ forceRefresh: true, silent: hasWarmUsersCache });
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
        const submitFormData = new FormData();
        submitFormData.append("name", formData.name || "");
        submitFormData.append("email", formData.email || "");
        submitFormData.append("role", formData.role || "");

        selectedPermissions.forEach((permission) => {
          submitFormData.append("permissions[]", permission);
        });

        const nextPassword = String(formData.password ?? "").trim();
        if (nextPassword.length > 0) {
          submitFormData.append("password", nextPassword);
        }

        if (formData.photo instanceof File) {
          submitFormData.append("photo", formData.photo);
        }

        submitFormData.append("_method", "PUT");

        await axios.post(apiUrl, submitFormData, {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
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

      window.dispatchEvent(new Event("permissions-updated"));

      fetchUsers({ forceRefresh: true, silent: true });
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
          text:
            error.response?.status === 422
              ? Object.values(error.response?.data?.errors || {})
                  .flat()
                  .filter(Boolean)
                  .join(" ") ||
                error.response?.data?.message ||
                "Les données soumises sont invalides."
              : "L'opération n'a pas pu être complétée. Veuillez réessayer plus tard.",
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

  const navigationPermissionGroups = [
    {
      title: "Employes",
      permissions: [
        { value: "view_all_employes", label: "Voir" },
        { value: "create_employes", label: "Ajouter", dependsOn: "view_all_employes" },
        { value: "update_employes", label: "Editer", dependsOn: "view_all_employes" },
        { value: "delete_employes", label: "Supprimer", dependsOn: "view_all_employes" },
      ],
    },
    {
      title: "Historiques",
      permissions: [
        { value: "view_all_employee_histories", label: "Voir" },
        { value: "create_employee_histories", label: "Ajouter", dependsOn: "view_all_employee_histories" },
        { value: "update_employee_histories", label: "Editer", dependsOn: "view_all_employee_histories" },
        { value: "delete_employee_histories", label: "Supprimer", dependsOn: "view_all_employee_histories" },
      ],
    },
    {
      title: "Departements",
      permissions: [
        { value: "view_all_departements", label: "Voir" },
        { value: "create_departements", label: "Ajouter", dependsOn: "view_all_departements" },
        { value: "update_departements", label: "Editer", dependsOn: "view_all_departements" },
        { value: "delete_departements", label: "Supprimer", dependsOn: "view_all_departements" },
      ],
    },
    {
      title: "Accidents de travail",
      permissions: [
        { value: "view_all_accidents", label: "Voir" },
        { value: "create_accidents", label: "Ajouter", dependsOn: "view_all_accidents" },
        { value: "update_accidents", label: "Editer", dependsOn: "view_all_accidents" },
        { value: "delete_accidents", label: "Supprimer", dependsOn: "view_all_accidents" },
      ],
    },
    {
      title: "Gestion CIMR",
      permissions: [
        { value: "view_all_cimr", label: "Voir" },
        { value: "create_cimr", label: "Ajouter", dependsOn: "view_all_cimr" },
        { value: "update_cimr", label: "Editer", dependsOn: "view_all_cimr" },
        { value: "delete_cimr", label: "Supprimer", dependsOn: "view_all_cimr" },
      ],
    },
    {
      title: "Mutuelle",
      permissions: [
        { value: "view_all_mutuelle", label: "Voir" },
        { value: "create_mutuelle", label: "Ajouter", dependsOn: "view_all_mutuelle" },
        { value: "update_mutuelle", label: "Editer", dependsOn: "view_all_mutuelle" },
        { value: "delete_mutuelle", label: "Supprimer", dependsOn: "view_all_mutuelle" },
      ],
    },
    {
      title: "CNSS",
      permissions: [
        { value: "view_all_cnss", label: "Voir" },
        { value: "create_cnss", label: "Ajouter", dependsOn: "view_all_cnss" },
        { value: "update_cnss", label: "Editer", dependsOn: "view_all_cnss" },
        { value: "delete_cnss", label: "Supprimer", dependsOn: "view_all_cnss" },
      ],
    },
    {
      title: "Carrieres & Formations",
      permissions: [
        { value: "view_all_carrieres_formations", label: "Voir" },
        { value: "create_carrieres_formations", label: "Ajouter", dependsOn: "view_all_carrieres_formations" },
        { value: "update_carrieres_formations", label: "Editer", dependsOn: "view_all_carrieres_formations" },
        { value: "delete_carrieres_formations", label: "Supprimer", dependsOn: "view_all_carrieres_formations" },
      ],
    },
    {
      title: "Conflits",
      permissions: [
        { value: "view_all_conflits", label: "Voir" },
        { value: "create_conflits", label: "Ajouter", dependsOn: "view_all_conflits" },
        { value: "update_conflits", label: "Editer", dependsOn: "view_all_conflits" },
        { value: "delete_conflits", label: "Supprimer", dependsOn: "view_all_conflits" },
      ],
    },
    {
      title: "Sanctions",
      permissions: [
        { value: "view_all_sanctions", label: "Voir" },
        { value: "create_sanctions", label: "Ajouter", dependsOn: "view_all_sanctions" },
        { value: "update_sanctions", label: "Editer", dependsOn: "view_all_sanctions" },
        { value: "delete_sanctions", label: "Supprimer", dependsOn: "view_all_sanctions" },
      ],
    },
    {
      title: "Societe",
      permissions: [
        { value: "view_all_societes", label: "Voir" },
        { value: "create_societes", label: "Ajouter", dependsOn: "view_all_societes" },
        { value: "update_societes", label: "Editer", dependsOn: "view_all_societes" },
        { value: "delete_societes", label: "Supprimer", dependsOn: "view_all_societes" },
      ],
    },
    {
      title: "Utilisateurs",
      permissions: [
        { value: "view_all_users", label: "Voir" },
        { value: "create_user", label: "Ajouter", dependsOn: "view_all_users" },
        { value: "edit_user", label: "Editer", dependsOn: "view_all_users" },
        { value: "delete_user", label: "Supprimer", dependsOn: "view_all_users" },
      ],
    },
  ];

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
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', columnGap: '16px', width: '100%' }}>
                      <div>
                        <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c' }}>
                          <i className="fas fa-users me-2"></i>{" "}
                          Gestion des utilisateurs
                        </span>
                        <p className="section-description text-muted mb-0">
                          {users.length} utilisateur{users.length > 1 ? 's' : ''} actuellement enregistré{users.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifySelf: 'end' }}>
                        <Button
                          onClick={handleShowFormButtonClick}
                          className="btn d-flex align-items-center"
                          size="sm"
                          style={{
                            width: '180px',
                            height: '34px',
                            backgroundColor: '#2c767c',
                            color: '#ffffff',
                            border: 'none',
                            marginRight: '10px'
                          }}
                        >
                          <FaPlusCircle className="me-2" />
                          Ajouter un utilisateur
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <ExpandRTable
                  columns={columns}
                  data={users}
                  filteredData={filteredUsers}
                  loading={usersLoading && !hasWarmUsersCache}
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
          {navigationPermissionGroups.map((group) => (
            <div
              key={group.title}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#f9fafb'
              }}
            >
              <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '10px', fontSize: '0.9rem' }}>
                {group.title}
              </div>
              {group.permissions.map((permission) => (
                <React.Fragment key={permission.value}>
                  {renderPermissionsCheckbox(
                    permission.value,
                    permission.label,
                    permission.dependsOn ? !selectedPermissions.includes(permission.dependsOn) : false
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}
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
      <i className="fas fa-check me-2"></i>{" "}
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
    </>
  );
};

export default Users;
