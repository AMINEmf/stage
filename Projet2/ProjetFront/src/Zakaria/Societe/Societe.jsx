import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Form, Button, Card, Tabs, Tab } from "react-bootstrap";
import Navigation from "../../Acceuil/Navigation";
import Search from "../../Acceuil/Search";
import TablePagination from "@mui/material/TablePagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faFilePdf,
  faFileExcel,
  faPrint,
  faEdit,
  faPlus,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Fab, Toolbar } from "@mui/material";
import { BsShop } from "react-icons/bs";
import { useOpen } from "../../Acceuil/OpenProvider.jsx"; 
import { BiPlus } from "react-icons/bi";
import ExpandRTable from "../Employe/ExpandRTable";
import PageHeader from "../../ComponentHistorique/PageHeader";
import SocieteForm from './SocieteForm';
import { FaUserPlus } from 'react-icons/fa';
import { FaPlusCircle, FaMinus, FaPlus } from "react-icons/fa";
import { useQuery } from '@tanstack/react-query';
import { useHeader } from "../../Acceuil/HeaderContext";




const Societe = () => {
  const [categories, setCategories] = useState([]);
  let isEdit = false;
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProduitsByCategory, setFilteredProduitsByCategory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [editingProduit, setEditingProduit] = useState(null);
  const [editingProduitId, setEditingProduitId] = useState(null);
  const [userHasDeletePermission, setUserHasDeletePermission] = useState(true);
  const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, setSearchQuery, clearActions } = useHeader();








  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-900px",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    width:"100%"
  });
  const { open } = useOpen();
  const { dynamicStyles } = useOpen();
  const tableHeaderStyle = {
    background: "#007bff",
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
  };

  const [showForm, setShowForm] = useState(false);
  const [calibres, setCalibres] = useState([]);

  const [globalSearch, setGlobalSearch] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    filters: [
      {
        key: 'RaisonSocial',
        label: 'Raison Sociale',
        value: '',
        options: [],
        placeholder: 'Filtrer par raison sociale'
      },
      {
        key: 'ICE',
        label: 'ICE',
        value: '',
        options: [],
        placeholder: 'Filtrer par ICE'
      }
    ]
  });

  const fetchAgent = async () => {
    const response = await axios.get('http://localhost:8000/api/societes');
    const societes = response.data;
    const usersResponse = await axios.get('http://localhost:8000/api/user');
    const user = usersResponse.data.id;
    return { societes, user };
  };

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['societes-user'],
    queryFn: fetchAgent,
    staleTime: Infinity,
    refetchInterval: 1000 * 60 * 10,
    refetchOnMount: false, 
    refetchOnWindowFocus: false,
  
  });

  const produits = data?.societes || [];
  const user = data?.user || null;
  


  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const selectedRows = parseInt(event.target.value, 10);
    setRowsPerPage(selectedRows);
    localStorage.setItem('rowsPerPageEmploye', selectedRows);  // Store in localStorage
    setPage(0);
  };

  useEffect(() => {
    const savedRowsPerPage = localStorage.getItem('rowsPerPageEmploye');
    if (savedRowsPerPage) {
      setRowsPerPage(parseInt(savedRowsPerPage, 10));
    }
  }, []);

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
      setSelectedItems(produits.map((produit) => produit.id));
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
            .delete(`http://localhost:8000/api/agents/${id}`)
            .then((response) => {
              refetch();            
            })
            .catch((error) => {
              console.error("Error deleting product:", error);
              if (error.response && error.response.status === 403) {
                Swal.fire({
                  icon: "error",
                  title: "Accès refusé",
                  text: "Vous n'avez pas l'autorisation de supprimer ce Agent.",
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Error!",
                  text: "Échec de la suppression du Agent.",
                });
              }
            });
        });
      }
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Agent supprimé avec succès.",
      });
    });
    setSelectedItems([]);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Êtes-vous sûr de vouloir supprimer ce produit ?",
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
          .delete(`http://localhost:8000/api/societes/${id}`)
          .then((response) => {
            refetch();
              Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Agent supprimé avec succès.",
            });
          })
          .catch((error) => {
            console.error("Error deleting product:", error);
            if (error.response && error.response.status === 403) {
              Swal.fire({
                icon: "error",
                title: "Accès refusé",
                text: "Vous n'avez pas l'autorisation de supprimer ce Agent.",
              });
            } else if (error.response && error.response.status === 400) {
              // Afficher le message d'erreur dans Swal.fire()
              Swal.fire({
                  icon: "error",
                  title: "Erreur",
                  text: error.response.data.error
              });
          } else {
              Swal.fire({
                icon: "error",
                title: "Erreur!",
                text: "Échec de la suppression du Agent.",
              });
            }
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };
  const handleShowFormButtonClick = () => {
    setShowForm(true);
    setTableContainerStyle({ width: "76.5%" });
  };

  const closeForm = () => {
    setShowForm(false);
    setTableContainerStyle({ width: "100%" });
    setEditingProduit(null);
  };

  const handleEdit = (societe) => {
    setEditingProduit(societe);
    setShowForm(true);
    setTableContainerStyle({ width: "61.5%" });
  };

  
  const handleSubmit = async (formData) => {
    try {
      const apiUrl = editingProduit
        ? `http://localhost:8000/api/societes/${editingProduit.id}`
        : `http://localhost:8000/api/societes`;

      const method = editingProduit ? "put" : "post";

      const response = await axios[method](apiUrl, formData);
      console.log(response.data);
      closeForm();
      refetch();
      const successMessage = `Société ${editingProduit ? "modifiée" : "ajoutée"} avec succès.`;
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: successMessage,
      });
    } catch (error) {
      console.error("Erreur lors de la soumission des données :", error);
      Swal.fire({
        icon: "error",
        title: "Échec de l'opération",
        text: "L'opération n'a pas pu être complétée. Veuillez réessayer plus tard.",
      });
    }
  };

  //------------------------- fournisseur export to excel ---------------------//
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProduits);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sociétés");
    XLSX.writeFile(wb, "societes.xlsx");
  };

  const handleDeletecatgeorie = async (categorieId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/categories/${categorieId}`
      );
      console.log(response.data);
      Swal.fire({
        icon: "success",
        title: "Succès!",
        text: "Categorie supprimé avec succès.",
      });
      fetchCategories();
    } catch (error) {
      console.error("Error deleting categorie:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur!",
        text: "Échec de la suppression de la categorie.",
      });
    }
  };

  useEffect(() => {
    if (produits) {
      const filtered = produits.filter((societe) => {
        return Object.entries(societe).some(([key, value]) => {
          if (
            key === "RaisonSocial" ||
            key === "ICE" ||
            key === "NumeroCNSS" ||
            key === "NumeroFiscale" ||
            key === "RegistreCommercial" ||
            key === "AdresseSociete"
          ) {
            if (typeof value === "string") {
              return value.toLowerCase().includes(globalSearch.toLowerCase());
            } else if (typeof value === "number") {
              return value.toString().includes(globalSearch.toString());
            }
          }
          return false;
        });
      });
      setFilteredProduits(filtered);
    }
  }, [produits, globalSearch]);
  

  
  const [genreFiltre, setGenreFiltre] = useState("");

  // Fonction pour filtrer les produits
  // const produitsFiltres = produits.filter((produit) =>
  //     genreFiltre ? produit.genre === genreFiltre : true
  // );

console.log('produit',produits)

  // Définir les colonnes pour ExpandRTable
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'RaisonSocial', label: 'Raison Sociale' },
    { key: 'ICE', label: 'ICE' },
    { key: 'NumeroCNSS', label: 'Numéro CNSS' },
    { key: 'NumeroFiscale', label: 'Numéro Fiscale' },
    { key: 'RegistreCommercial', label: 'Registre Commercial' },
    { key: 'AdresseSociete', label: 'Adresse' }
  ];

  // Fonction pour mettre en surbrillance le texte de recherche
  // const highlightText = (text, searchTerm) => {
  //   if (!searchTerm || !text) return text;
  //   const regex = new RegExp(`(${searchTerm})`, 'gi');
  //   return String(text).replace(regex, '<mark>$1</mark>');
  // };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['ID', 'Raison Sociale', 'ICE', 'Numéro CNSS', 'Numéro Fiscale', 'Registre Commercial', 'Adresse'];
    const tableRows = filteredProduits.map(societe => [
      societe.id,
      societe.RaisonSocial,
      societe.ICE,
      societe.NumeroCNSS,
      societe.NumeroFiscale,
      societe.RegistreCommercial,
      societe.AdresseSociete
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save('societes.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFilterChange = (key, value) => {
    setFilterOptions(prev => ({
      filters: prev.filters.map(filter => 
        filter.key === key ? { ...filter, value } : filter
      )
    }));
  };



  useEffect(() => {
    setTitle("Liste des sociétés");
    setOnPrint(() => handlePrint);
    setOnExportPDF(() => exportToPDF);
    setOnExportExcel(() => exportToExcel);
    return () => {
      clearActions();
      setTitle('');
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions, handlePrint, exportToPDF, exportToExcel]);
  
  


  useEffect(() => {
    setGlobalSearch(searchQuery || '');
  }, [searchQuery]);





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
                <SocieteForm
                  onSubmit={handleSubmit}
                  onCancel={closeForm}
                  initialData={editingProduit}
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
                                    Détails Société
                                </span>
                                <p className="section-description text-muted mb-0">
                                    {produits.length} société{produits.length > 1 ? 's' : ''} actuellement enregistrée{produits.length > 1 ? 's' : ''}
                                </p>
                            </div>
                            <Button
            onClick={handleShowFormButtonClick}
            className="btn btn-outline-primary d-flex align-items-center"
                                size="sm"
                                style={{ height:'45px' }}

                            >
            <FaPlusCircle className="me-2" />
            Ajouter une société
                            </Button>
                        </div>
                    </div>
                  </div>











<ExpandRTable
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'RaisonSocial', label: 'Raison Sociale' },
                    { key: 'ICE', label: 'ICE' },
                    { key: 'NumeroCNSS', label: 'Numéro CNSS' },
                    { key: 'NumeroFiscale', label: 'Numéro Fiscale' },
                    { key: 'RegistreCommercial', label: 'Registre Commercial' },
                    { key: 'AdresseSociete', label: 'Adresse' }
                  ]}
                  data={produits}
                  filteredData={filteredProduits}
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
    margin-bottom: 5px;            }
    

`}</style>



</>

  );
};

const tableCellStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
};

export default Societe; 