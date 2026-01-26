import React, { useState, useEffect } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Navigation from "../Acceuil/Navigation";
import { Form, Button } from "react-bootstrap";
import { Toolbar } from "@mui/material";
import PrintList from "./PrintCommandes";
import ExportPdfButton from "./ExportPdfCommande";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faTrash,
  faPlus,
  faMinus,
  faFileExcel,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import Select from "react-dropdown-select";
import "jspdf-autotable";
import Swal from "sweetalert2";
import Search from "../Acceuil/Search";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TablePagination from "@mui/material/TablePagination";
import "../style.css";
const CommandeList = () => {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [commandes, setCommandes] = useState([]);
  const [selectedClient, setSelectedClient] = useState([]);
  const [clients, setClients] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [expandedClient, setExpandedClient] = useState([]);
  const [filteredCommandes, setFilteredCommandes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [modifiedPrixValues, setModifiedPrixValues] = useState({});
  const [modifiedQuantiteValues, setModifiedQuantiteValues] = useState({});
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfTokenMeta ? csrfTokenMeta.content : null;
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [authId, setAuthId] = useState([]);
  const [selectedSiteClient, setSelectedSiteClient] = useState(null);
  useState(null);
  const [formData, setFormData] = useState({
    reference: "",
    dateCommande: "",
    client_id: "",
    site_id: "",
    mode_payement: "",
    status: "",
    user_id: authId,
    produit_id: "",
    prix_unitaire: "",
    quantite: "",
  });
  const [existingLigneCommandes, setExistingLigneCommandes] = useState([]);
  const [siteClients, setSiteClients] = useState([]);
  const [editingCommandes, setEditingCommandes] = useState(null);
  const [editingCommandesId, setEditingCommandesId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expand_total, setExpandTotal] = useState([]);
  const [expand_status, setExpandedStatus] = useState([]);
  const calibres = produits.map((produit) => produit.calibre.calibre);
  const uniqueCalibres = [...new Set(calibres)];
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });

  // const fetchData = async () => {
  //   try {
  //     const response = await axios.get("http://localhost:8000/api/commandes");
  //     setCommandes(response.data.commandes);
  //     const clientResponse = await axios.get(
  //       "http://localhost:8000/api/clients"
  //     );
  //     setClients(clientResponse.data.client);

  //     const produitResponse = await axios.get(
  //       "http://localhost:8000/api/produits"
  //     );
  //     setProduits(produitResponse.data.produit);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 5));
    setPage(0);
  };
  useEffect(() => {
    if (editingCommandesId) {
      fetchExistingLigneCommandes(editingCommandesId);
      console.log(existingLigneCommandes);
    }
  }, [editingCommandesId]);

  const fetchExistingLigneCommandes = async (commandId) => {
    axios
      .get(`http://localhost:8000/api/ligneCommandes/${commandId}`)
      .then((ligneCommandesResponse) => {
        const existingLigneCommandes =
          ligneCommandesResponse.data.ligneCommandes;

        setExistingLigneCommandes(existingLigneCommandes);
      });
  };

  const handleShowTotalDetails = (commande) => {
    const selectedProducts = commande.ligne_commandes.map((ligneCommande) => {
      const product = produits.find(
        (produit) => produit.id === ligneCommande.produit_id
      );
      return {
        id: ligneCommande.id,
        Code_produit: product.Code_produit,
        calibre_id: product.calibre_id,
        calibre: product.calibre,
        designation: product.designation,
        produit_id: ligneCommande.produit_id,
        quantite: ligneCommande.quantite,
        prix_unitaire: ligneCommande.prix_unitaire,
      };
    });
    setSelectedProductsData(selectedProducts);

    setExpandTotal((prevRows) =>
      prevRows.includes(commande.id)
        ? prevRows.filter((row) => row !== commande.id)
        : [...prevRows, commande.id]
    );
  };
  const handleShowLigneCommandes = async (commandeId) => {
    setExpandedRows((prevRows) =>
      prevRows.includes(commandeId)
        ? prevRows.filter((row) => row !== commandeId)
        : [...prevRows, commandeId]
    );
  };
  const handleShowSiteClients = async (commandeId) => {
    setExpandedClient((prevRows) =>
      prevRows.includes(commandeId)
        ? prevRows.filter((row) => row !== commandeId)
        : [...prevRows, commandeId]
    );
  };
  const handleShowStatusCommandes = async (commande) => {
    setExpandedStatus((prevRows) =>
      prevRows.includes(commande)
        ? prevRows.filter((row) => row !== commande)
        : [...prevRows, commande]
    );
  };
  const exportToExcel = () => {
    const selectedClients = clients.filter((client) =>
      selectedItems.includes(client.id)
    );
    const ws = XLSX.utils.json_to_sheet(selectedClients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "clients.xlsx");
  };
  const fetchData = async () => {
    try {
      const [
        userResponse,
        commandesResponse,
        clientsResponse,
        siteClientResponse,
        produitsResponse,
      ] = await Promise.all([
        axios.get("http://localhost:8000/api/user"),
        axios.get("http://localhost:8000/api/commandes"),
        axios.get("http://localhost:8000/api/clients"),
        axios.get("http://localhost:8000/api/siteclients"),
        axios.get("http://localhost:8000/api/produits"),
      ]);
      setAuthId(userResponse.data.id);
      setCommandes(commandesResponse.data.commandes);
      console.log("commandes", commandesResponse.data);
      setClients(clientsResponse.data.client);
      setSiteClients(siteClientResponse.data.siteclient);
      setProduits(produitsResponse.data.produit);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    // Update formData.client_id when commande changes
    if (editingCommandes) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        client_id: editingCommandes.client_id,
      }));
    }
  }, [editingCommandes]);
  const handleChange = (e) => {
    console.log(e.target.value);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getElementValueById = (id) => {
    return document.getElementById(id)?.value || "";
  };
  const calculateTotalQuantity = (ligneCommandes) => {
    // fetchData();
    return ligneCommandes.reduce((total, ligneCommande) => {
      return total + ligneCommande.quantite;
    }, 0);
  };

  const getQuantity = (ligneCommandes, calibre, designation) => {
    const correspondingProduct = produits.find(
      (product) =>
        product.calibre.calibre === calibre &&
        product.designation === designation
    );

    if (!correspondingProduct) {
      return 0; // If no corresponding product is found, return 0
    }

    const correspondingLigneCommande = ligneCommandes.find(
      (ligne) => ligne.produit_id === correspondingProduct.id
    );
    return correspondingLigneCommande ? correspondingLigneCommande.quantite : 0;
  };
  const populateProductInputs = (ligneCommandId, inputType) => {
    console.log("ligneCommandId", ligneCommandId);
    const existingLigneCommande = selectedProductsData.find(
      (ligneCommande) => ligneCommande.id === ligneCommandId
    );
    console.log("existing LigneCommande", existingLigneCommandes);

    if (existingLigneCommande) {
      return existingLigneCommande[inputType];
    }
    return "";
  };

  const getTotalForCalibre = (ligneCommandes, calibre, produits) => {
    // Filter ligneCommandes for the given calibre
    const ligneCommandesForCalibre = ligneCommandes.filter(
      (ligne) =>
        produits.find((produit) => produit.id === ligne.produit_id)?.calibre
          .calibre === calibre
    );

    // Calculate the total quantity for the calibre
    const total = ligneCommandesForCalibre.reduce(
      (acc, ligne) => acc + ligne.quantite,
      0
    );

    return total;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // const userResponse = await axios.get("http://localhost:8000/api/users", {
      //   withCredentials: true,
      //   headers: {
      //     "X-CSRF-TOKEN": csrfToken,
      //   },
      // });

      // const authenticatedUserId = userResponse.data[0].id;
      // console.log("auth user", authenticatedUserId);
      // Préparer les données du Commandes
      const CommandesData = {
        dateCommande: formData.dateCommande,
        status: formData.status,
        mode_payement: formData.mode_payement,
        site_id: selectedSiteClient ? selectedSiteClient.id : null,
        client_id: selectedClient.id,
        user_id: authId,
      };

      let response;
      if (editingCommandes) {
        // Mettre à jour le Commandes existant
        response = await axios.put(
          `http://localhost:8000/api/commandes/${editingCommandes.id}`,
          {
            dateCommande: formData.dateCommande,
            status: formData.status,
            mode_payement: formData.mode_payement,
            site_id: selectedSiteClient ? selectedSiteClient.id : null,
            client_id: selectedClient.id,
            user_id: authId,
          }
        );
        const existingLigneCommandesResponse = await axios.get(
          `http://localhost:8000/api/ligneCommandes/${editingCommandes.id}`
        );

        const existingLigneCommandes =
          existingLigneCommandesResponse.data.ligneCommandes;
        console.log("existing LigneCommandes", existingLigneCommandes);
        const selectedPrdsData = selectedProductsData.map(
          (selectedProduct, index) => {
            // const existingLigneCommande = existingLigneCommandes.find(
            //   (ligneCommande) =>
            //     ligneCommande.produit_id === selectedProduct.produit_id
            // );

            return {
              id: selectedProduct.id,
              commande_id: editingCommandes.id,
              produit_id: selectedProduct.produit_id,
              quantite: getElementValueById(
                `quantite_${index}_${selectedProduct.produit_id}`
              ),
              prix_unitaire: getElementValueById(
                `prix_unitaire_${index}_${selectedProduct.produit_id}`
              ),
              // Update other properties as needed
            };
          }
        );
        console.log("selectedPrdsData:", selectedPrdsData);
        for (const ligneCommandeData of selectedPrdsData) {
          // Check if ligneCommande already exists for this produit_id and update accordingly

          if (ligneCommandeData.id) {
            console.log(ligneCommandeData.id);
            await axios.put(
              `http://localhost:8000/api/ligneCommandes/${ligneCommandeData.id}`,
              ligneCommandeData,
              {
                withCredentials: true,
                headers: {
                  "X-CSRF-TOKEN": csrfToken,
                },
              }
            );
          } else {
            await axios.post(
              "http://localhost:8000/api/ligneCommandes",
              ligneCommandeData,
              {
                withCredentials: true,
                headers: {
                  "X-CSRF-TOKEN": csrfToken,
                },
              }
            );
          }
        }

        const existingStatusesResponse = await axios.get(
          "http://localhost:8000/api/statusCommande"
        );
        const existingStatuses = existingStatusesResponse.data.StatusCommande;

        const selectedStatus = getElementValueById("status");
        const statusExists = existingStatuses.some(
          (status) => status.status === selectedStatus
        );
        const statusCommandeData = {
          commande_id: editingCommandes.id,
          status: getElementValueById("status"),
          // Update other properties as needed
        };
        // if (!statusExists) {
        await axios.post(
          `http://localhost:8000/api/statusCommande/`,
          statusCommandeData,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
            },
          }
        );
      } else {
        // Créer un nouveau Commandes
        response = await axios.post(
          "http://localhost:8000/api/commandes",
          CommandesData
        );
        const selectedPrdsData = selectedProductsData.map(
          (selectProduct, index) => {
            return {
              commande_id: response.data.commande.id,
              produit_id: selectProduct.produit_id,
              quantite: getElementValueById(
                `quantite_${index}_${selectProduct.produit_id}`
              ),
              prix_unitaire: getElementValueById(
                `prix_unitaire_${index}_${selectProduct.produit_id}`
              ),
            };
          }
        );
        console.log("selectedPrdsData", selectedPrdsData);
        for (const ligneCommandesData of selectedPrdsData) {
          // Sinon, il s'agit d'une nouvelle ligne de Commandes
          await axios.post(
            "http://localhost:8000/api/ligneCommandes",
            ligneCommandesData
          );
        }
        const statusCommandeData = {
          commande_id: response.data.commande.id,
          status: "En cours",
        };
        await axios.post(
          "http://localhost:8000/api/statusCommande",
          statusCommandeData,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
            },
          }
        );
      }
      console.log("response of postCommande: ", response.data);

      fetchData();

      setSelectedClient([]);
      setSelectedSiteClient([]);
      setSelectedProductsData([]);
      fetchExistingLigneCommandes();
      closeForm();

      // Afficher un message de succès à l'utilisateur
      Swal.fire({
        icon: "success",
        title: "Commande ajoutée avec succès",
        text: "La commande a été ajoutée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la soumission des données :", error);

      // Afficher un message d'erreur à l'utilisateur
      Swal.fire({
        icon: "error",
        title: "Erreur !",
        text: "Erreur !",
      });
    }
    closeForm();
  };
  const getProduitValue = (produitId, field) => {
    // Find the product in the produits array based on produitId
    const produit = produits.find((p) => p.id === produitId);

    // If the product is found, return the value of the specified field
    if (produit) {
      return produit[field];
    }

    // If the product is not found, return an empty string or any default value
    return "";
  };
  const getClientValue = (clientId, field) => {
    // Find the product in the produits array based on produitId
    const client = clients.find((p) => p.id === clientId);

    // If the product is found, return the value of the specified field
    if (client) {
      return client[field];
    }

    // If the product is not found, return an empty string or any default value
    return "";
  };

  const getSiteClientValue = (siteClientId, field) => {
    const siteClient = siteClients.find((s) => s.id === siteClientId);

    // If the product is found, return the value of the specified field
    if (siteClient) {
      return siteClient[field];
    }

    // If the product is not found, return an empty string or any default value
    return "";
  };
  const handleEdit = (commande) => {
    fetchExistingLigneCommandes(commande.id);
    setModifiedQuantiteValues({});
    setModifiedPrixValues({});
    setEditingCommandesId(commande.id);
    setEditingCommandes(commande);
    console.log(commande);
    setFormData({
      reference: commande.reference,
      dateCommande: commande.dateCommande,
      client_id: commande.client_id,
      site_id: commande.site_id,
      mode_payement: commande.mode_payement,
      status: commande.status,
    });

    console.log("formData,", formData);

    const selectedProducts = commande.ligne_commandes.map((ligneCommande) => {
      const product = produits.find(
        (produit) => produit.id === ligneCommande.produit_id
      );
      return {
        id: ligneCommande.id,
        Code_produit: product.Code_produit,
        calibre_id: product.calibre_id,
        designation: product.designation,
        produit_id: ligneCommande.produit_id,
        quantite: ligneCommande.quantite,
        prix_unitaire: ligneCommande.prix_unitaire,
      };
    });
    setSelectedProductsData(selectedProducts);

    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "1200px" });
    } else {
      closeForm();
    }
  };
  const handleInputChange = (index, inputType, event) => {
    const newValue = event.target.value;
    console.log("selectedProductsData", selectedProductsData);
    console.log("index", index);
    if (selectedProductsData[index]) {
      const productId = selectedProductsData[index].produit_id;

      if (inputType === "prix_unitaire") {
        setModifiedPrixValues((prev) => {
          const updatedValues = {
            ...prev,
            [`${index}_${productId}`]: newValue,
          };
          console.log("Modified prix values:", updatedValues);
          return updatedValues;
        });
      } else if (inputType === "quantite") {
        setModifiedQuantiteValues((prev) => {
          const updatedValues = {
            ...prev,
            [`${index}_${productId}`]: newValue,
          };
          console.log("Modified quantite values:", updatedValues);
          return updatedValues;
        });
      }
    }
  };

  // const handleInputChange = (index, inputType, event) => {
  //   const newValue = event.target.value;
  //   const productId = selectedProductsData[index].id;

  //   if (inputType === "prix_unitaire") {
  //     setModifiedPrixValues((prev) => ({
  //       ...prev,
  //       [`${productId}_${index}`]: newValue,
  //     }));
  //   } else if (inputType === "quantite") {
  //     setModifiedQuantiteValues((prev) => ({
  //       ...prev,
  //       [`${productId}_${index}`]: newValue,
  //     }));
  //   }
  // };
  const handleDelete = (id) => {
    Swal.fire({
      title: "Confirmation de suppression",
      text: "Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`http://localhost:8000/api/commandes/${id}`)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Succès!",
              text: "Commandes supprimé avec succès.",
            });
            fetchData();
          })
          .catch((error) => {
            console.error("Erreur lors de la suppression du Commandes:", error);
            Swal.fire({
              icon: "error",
              title: "Erreur!",
              text: "Échec de la suppression du Commandes.",
            });
          });
      } else {
        console.log("Suppression annulée");
      }
    });
  };

  const handleShowFormButtonClick = () => {
    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "-0%" });
      setTableContainerStyle({ marginRight: "1200px" });
    } else {
      closeForm();
    }
  };

  const closeForm = () => {
    handleDeleteAllSelection();
    handleClientSelection(null); // Réinitialise la sélection du client
    handleSiteClientSelection(null); // Réinitialise la sélection du site client
    setFormContainerStyle({ right: "-100%" });
    setTableContainerStyle({ marginRight: "0" });
    setShowForm(false); // Hide the form
    setSelectedClient([null]);
    setSelectedSiteClient([null]);
    setFormData({
      // Clear form data
      reference: "",
      dateCommande: "",
      client_id: "",
      site_id: "",
      mode_payement: "",
      status: "",
      user_id: authId,
      produit_id: "",
      prix_unitaire: "",
      quantite: "",
    });
    setEditingCommandes(null); // Clear editing client
  };
  //---------------------------Produit--------------------------

  // const handleClientSelection = (selectedOption) => {
  //   console.log("Selected option:", selectedOption);
  //   if (selectedOption && selectedOption.length > 0) {
  //     // Handle the selected client
  //     console.log("Selected client:", selectedOption[0].value);
  //     setFormData((prevFormData) => ({
  //       ...prevFormData,
  //       client_id: selectedOption.value,
  //     }));
  //   } else {
  //     console.log("No client selected");
  //   }
  // };

  const handleProductSelection = (selectedProduct, index) => {
    console.log("selectedProduct", selectedProduct);
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData[index] = selectedProduct;
    setSelectedProductsData(updatedSelectedProductsData);
    console.log("selectedProductsData", selectedProductsData);
  };
  const handleClientSelection = (selected) => {
    if (selected) {
      setSelectedClient(selected);
      console.log("selectedClient", selectedClient);
    } else {
      setSelectedClient(null);
    }
  };
  // const handleClientSelection = (selected) => {
  //   if (selected && selected.length > 0) {
  //     console.log("selectedOptionClient", selected);
  //     setSelectedClientId(selected[0].value);
  //     const client = clients.find((c) => c.id === selectedClientId);
  //     setSelectedClient(client);
  //     console.log("selected client", selectedClient);
  //   }
  // };
  const handleSiteClientSelection = (selected) => {
    if (selected) {
      setSelectedSiteClient(selected);
      console.log("selectedSiteClient", selectedSiteClient);
    } else {
      setSelectedSiteClient(null);
    }
  };

  useEffect(() => {
    const filtered = commandes.filter((Commandes) =>
      Commandes.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCommandes(filtered);
  }, [commandes, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
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
      setSelectedItems(commandes.map((Commandes) => Commandes.id));
    }
  };

  const handlePrint = (CommandesId) => {
    // Récupérer les informations spécifiques au Commandes sélectionné
    const selectedCommandes = commandes.find(
      (Commandes) => Commandes.id === CommandesId
    );

    // Création d'une nouvelle instance de jsPDF
    const doc = new jsPDF();

    // Position de départ pour l'impression des données
    let startY = 20;

    // Dessiner les informations du client dans un tableau à gauche
    const clientInfo = [
      {
        label: "Raison sociale:",
        value: selectedCommandes.client.raison_sociale,
      },
      { label: "Adresse:", value: selectedCommandes.client.adresse },
      { label: "Téléphone:", value: selectedCommandes.client.tele },
      { label: "ICE:", value: selectedCommandes.client.ice },
      // Ajoutez d'autres informations client si nécessaire
    ];

    // Dessiner le tableau d'informations client à gauche
    doc.setFontSize(10); // Police plus petite pour les informations du client
    clientInfo.forEach((info) => {
      doc.text(`${info.label}`, 10, startY);
      doc.text(`${info.value}`, 40, startY);
      startY += 10; // Espacement entre les lignes du tableau
    });

    // Dessiner le tableau des informations du Commandes à droite
    const CommandesInfo = [
      { label: "N° Commandes:", value: selectedCommandes.reference },
      { label: "Date:", value: selectedCommandes.date },
      {
        label: "Validation de l'offre:",
        value: selectedCommandes.validation_offer,
      },
      { label: "Mode de Paiement:", value: selectedCommandes.modePaiement },
    ];

    // Dessiner le tableau des informations du Commandes à droite
    startY = 20; // Réinitialiser la position Y
    CommandesInfo.forEach((info) => {
      doc.text(`${info.label}`, 120, startY);
      doc.text(`${info.value}`, 160, startY);
      startY += 10; // Espacement entre les lignes du tableau
    });

    // Vérifier si les détails des lignes de Commandes sont définis
    if (selectedCommandes.ligneCommandes) {
      // Dessiner les en-têtes du tableau des lignes de Commandes
      const headersLigneCommandes = [
        "Code produit",
        "Désignation",
        "Quantité",
        "Prix",
        "Total HT",
      ];

      // Récupérer les données des lignes de Commandes
      const rowsLigneCommandes = selectedCommandes.ligneCommandes.map(
        (ligneCommandes) => [
          ligneCommandes.Code_produit,
          ligneCommandes.designation,
          ligneCommandes.quantite,
          ligneCommandes.prix_vente,
          // Calculate the total for each product line
          (ligneCommandes.quantite * ligneCommandes.prix_vente).toFixed(2), // Assuming the price is in currency format
        ]
      );

      // Dessiner le tableau des lignes de Commandes
      doc.autoTable({
        head: [headersLigneCommandes],
        body: rowsLigneCommandes,
        startY: startY + 20, // Décalage vers le bas pour éviter de chevaucher les informations du Commandes
        margin: { top: 20 },
        styles: {
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fontSize: 8, // Police plus petite pour les lignes de Commandes
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Largeur de la première colonne
          1: { cellWidth: 60 }, // Largeur de la deuxième colonne
          2: { cellWidth: 20 }, // Largeur de la troisième colonne
          3: { cellWidth: 30 }, // Largeur de la quatrième colonne
          4: { cellWidth: 30 }, // Largeur de la cinquième colonne
        },
      });

      // Dessiner le tableau des montants
      // const montantTable = [
      //   [
      //     "Montant Total Hors Taxes:",
      //     getTotalHT(selectedCommandes.ligneCommandes).toFixed(2),
      //   ],
      //   [
      //     "TVA (20%):",
      //     calculateTVA(getTotalHT(selectedCommandes.ligneCommandes)).toFixed(2),
      //   ],
      //   ["TTC:", getTotalTTC(selectedCommandes.ligneCommandes).toFixed(2)],
      // ];

      // doc.autoTable({
      //   body: montantTable,
      //   startY: doc.autoTable.previous.finalY + 10,
      //   margin: { top: 20 },
      //   styles: {
      //     lineWidth: 0.1,
      //     lineColor: [0, 0, 0],
      //     fontSize: 10, // Police plus petite pour les montants
      //   },
      // });
    }

    // Enregistrer le fichier PDF avec le nom 'Commandes.pdf'
    doc.save("Commandes.pdf");
  };
  const handleDeleteProduct = (index, id) => {
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData.splice(index, 1);
    setSelectedProductsData(updatedSelectedProductsData);
    if (id) {
      axios
        .delete(`http://localhost:8000/api/ligneCommandes/${id}`)
        .then(() => {
          fetchData();
        });
    }
  };
  
  const handleDeleteAllSelection = () => {
    // Clear the selected products data
    setSelectedProductsData([]);
  };
  const handleProductCheckboxChange = (selectedOptions) => {
    const selectedProductIds = selectedOptions.map((option) => option.value);

    const updatedSelectedProducts = produits
      .map((produit) => ({
        ...produit,
        prix: produit.prix_vente, // Initialize prix with prix_vente
      }))
      .filter((produit) => selectedProductIds.includes(produit.id));

    setSelectedProducts(updatedSelectedProducts);
    console.log("selectedProducts :", selectedProducts);
  };

  // Fonction pour calculer le montant total hors taxes
  // const getTotalHT = (ligneCommandes) => {
  //   return ligneCommandes.reduce(
  //     (total, item) => total + item.quantite * item.prix_vente,
  //     0
  //   );
  // };

  // // Fonction pour calculer la TVA
  // const calculateTVA = (totalHT) => {
  //   return totalHT * 0.2; // 20% de TVA
  // };

  // // Fonction pour calculer le montant total toutes taxes comprises (TTC)
  // const getTotalTTC = (ligneCommandes) => {
  //   return (
  //     getTotalHT(ligneCommandes) + calculateTVA(getTotalHT(ligneCommandes))
  //   );
  // };

  const handleAddEmptyRow = () => {
    setSelectedProductsData([...selectedProductsData, {}]);
    console.log("selectedProductData", selectedProductsData);
  };

  const handleDeleteSelected = () => {
    Swal.fire({
      title: "Confirmation de suppression",
      text: "Êtes-vous sûr de vouloir supprimer les éléments sélectionnés ? Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        const promises = selectedItems.map((id) => {
          return axios
            .delete(`http://localhost:8000/api/commandes/${id}`)
            .then(() => {
              return { id, success: true };
            })
            .catch(() => {
              return { id, success: false };
            });
        });

        Promise.all(promises).then((results) => {
          const successCount = results.filter((res) => res.success).length;
          if (successCount === results.length) {
            Swal.fire({
              icon: "success",
              title: "Success!",
              text: "Toute les commandes sélectionnées ont été supprimées avec succès.",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text: "Certains commandes n'ont pas pu être supprimées.",
            });
          }
          fetchData();
          setSelectedItems([]);
        });
      } else {
        setSelectedItems([]);
      }
    });
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{  position:'absolute',
        top:'0px',
        left:'220px',
        width:'90%'}}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          {/* <Toolbar /> */}
          {/* <div
            className="d-flex flex-row justify-content-end"
            style={{ marginLeft: "1300px" }}
          >
            <div style={{ width: "500px", marginRight: "20px" }}>
              <Search onSearch={handleSearch} type="search" />
            </div>{" "}
            <PrintList
              tableId="CommandeTable"
              title="Liste des commandes"
              commandes={commandes}
              filteredCommandes={filteredCommandes}
            />{" "}
            <ExportPdfButton
              commandes={commandes}
              selectedItems={selectedItems}
            />{" "}
            <FontAwesomeIcon
              icon={faFileExcel}
              onClick={exportToExcel}
              style={{
                cursor: "pointer",
                color: "green",
                fontSize: "2.5rem",
                marginLeft: "15px",
              }}
            />
          </div>

          <h3 className="text-left" style={{ color: "grey" }}>Liste des Commandes</h3> */}
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ marginTop: "50px" }}
          >
            <h3 className="text-left" style={{ color: "grey" }}>
              Liste des Commandes
            </h3>

            <div className="d-flex">
              <div style={{ width: "500px", marginRight: "20px" }}>
                <Search onSearch={handleSearch} type="search" />
              </div>
              <div>
                <PrintList
                  tableId="CommandeTable"
                  title="Liste des commandes"
                  commandes={commandes}
                  filteredCommandes={filteredCommandes}
                />{" "}
                <ExportPdfButton
                  commandes={commandes}
                  selectedItems={selectedItems}
                />{" "}
                <FontAwesomeIcon
                  icon={faFileExcel}
                  onClick={exportToExcel}
                  style={{
                    cursor: "pointer",
                    color: "green",
                    fontSize: "2rem",
                    marginLeft: "15px",
                  }}
                />
              </div>
            </div>
          </div>
          <a
            // href="#"
            onClick={handleShowFormButtonClick}
            style={{
              // textDecoration: "none",
              color: "rgb(0, 0, 238)",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <ShoppingBagIcon style={{ fontSize: "24px", marginRight: "8px" }} />
            Passer une Commande
          </a>
          <div
            id="formContainerCommande"
            style={{ ...formContainerStyle, padding: "50px" }}
          >
            <Form className="row" onSubmit={handleSubmit}>
              <Form.Label className="text-center m-2">
                <h4
                  style={{
                    fontSize: "25px",
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "bold",
                    color: "black",
                    borderBottom: "2px solid black",
                    paddingBottom: "5px",
                  }}
                >
                  {editingCommandes ? "Modifier" : "Ajouter"} une Commande
                </h4>
              </Form.Label>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="client_id" className="col-form-label">
                      Client:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    {console.log("selected client  :", selectedClient)}
                    <Select
                      options={clients.map((client) => ({
                        value: client.id,
                        label: client.raison_sociale,
                      }))}
                      onChange={(selected) => {
                        if (selected && selected.length > 0) {
                          const client = clients.find(
                            (client) => client.id === selected[0].value
                          );
                          handleClientSelection({
                            id: selected[0].value,
                            raison_sociale: client.raison_sociale,
                            adresse: client.adresse,
                            tele: client.tele,
                            abreviation: client.abreviation,
                            code_postal: client.code_postal,
                            ice: client.ice,
                            zone: client.zone,
                            siteclients: client.siteclients,
                          });
                        } else {
                          handleClientSelection(null);
                        }
                      }}
                      values={
                        formData.client_id
                          ? [
                              {
                                value: formData.client_id,
                                label: getClientValue(
                                  formData.client_id,
                                  "raison_sociale"
                                ),
                              },
                            ]
                          : []
                      }
                      placeholder="Client ..."
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="site_id" className="col-form-label">
                      Site Client:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    {console.log("selected siteClient  :", selectedSiteClient)}
                    <Select
                      options={
                        selectedClient && selectedClient.siteclients
                          ? selectedClient.siteclients.map((site) => ({
                              value: site.id,
                              label: site.raison_sociale,
                            }))
                          : []
                      }
                      onChange={(selected) => {
                        if (selected && selected.length > 0) {
                          const site = siteClients.find(
                            (site) => site.id === selected[0].value
                          );
                          handleSiteClientSelection({
                            id: selected[0].value,
                            raison_sociale: site.raison_sociale,
                            adresse: site.adresse,
                            tele: site.tele,
                            abreviation: site.abreviation,
                            code_postal: site.code_postal,
                            ice: site.ice,
                            zone: site.zone,
                          });
                        } else {
                          handleSiteClientSelection(null); // Handle deselection
                        }
                      }}
                      values={
                        formData.site_id
                          ? [
                              {
                                value: formData.site_id,
                                label: getSiteClientValue(
                                  formData.site_id,
                                  "raison_sociale"
                                ),
                              },
                            ]
                          : []
                      }
                      placeholder="Site client ..."
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-6">
                    <label htmlFor="mode_payement" className="col-form-label">
                      Mode Paiement:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <Form.Select
                      name="mode_payement"
                      value={
                        formData ? formData.mode_payement : "Mode de Paiement"
                      }
                      onChange={handleChange}
                    >
                      <option>mode de paiement</option>
                      <option value="Espece">Espece</option>
                      <option value="Tpe">Tpe</option>
                      <option value="Cheque">Cheque</option>
                      {/* Add more payment types as needed */}
                    </Form.Select>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                {editingCommandes && (
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <label htmlFor="status" className="col-form-label">
                        Status:
                      </label>
                    </div>
                    <div className="col-sm-6">
                      <Form.Select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="En cours">En cours</option>
                        <option value="Valide">Valide</option>
                        <option value="en_attente">En Attente</option>
                        {/* Add more statuses as needed */}
                      </Form.Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-md-12">
                <div className="row mb-4">
                  <div className="col-sm-6">
                    <label htmlFor="dateCommande" className="col-form-label">
                      Date Commande:
                    </label>
                  </div>
                  <div className="col-sm-6">
                    <Form.Group controlId="dateCommande">
                      <Form.Control
                        controlId="dateCommande"
                        type="date"
                        name="dateCommande"
                        value={formData.dateCommande}
                        onChange={handleChange}
                        className="form-control-sm"
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
              <div>
                <Button
                  className="btn btn-sm mb-2 "
                  variant="primary"
                  onClick={handleAddEmptyRow}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
                <strong style={{ marginLeft: "12px" }}>Ajouter Produit</strong>
              </div>

              <div className="col-md-12">
                <div className="row mb-3">
                  <div className="col-sm-12">
                    <Form.Group controlId="selectedProduitTable">
                      <div className="table-responsive">
                        <table className="table table-bordered ">
                          <thead>
                            <tr>
                              <th>Code Produit</th>
                              <th>Designation</th>
                              <th>Calibre</th>
                              <th>Quantité</th>
                              <th>Prix vente</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          {/* <tbody>
                            {selectedProductsData.map((productData, index) => (
                              <tr key={index}>
                                <td>
                                  <Select
                                    options={produits.map((produit) => ({
                                      value: produit.id,
                                      label: produit.Code_produit,
                                    }))}
                                    onChange={(selected) => {
                                      const produit = produits.find(
                                        (prod) => prod.id === selected[0].value
                                      );
                                      handleProductSelection(
                                        {
                                          produit_id: selected[0].value,
                                          Code_produit: produit.Code_produit,
                                          designation: produit.designation,
                                          calibre_id: produit.calibre_id,
                                          calibre: produit.calibre,
                                        },
                                        index
                                      );
                                    }}
                                    values={
                                      productData.produit_id
                                        ? [
                                            {
                                              value: productData.produit_id,
                                              label: productData.Code_produit,
                                            },
                                          ]
                                        : []
                                    }
                                    placeholder="Code ..."
                                  />
                                </td>
                                <td>
                                  <Select
                                    options={produits.map((produit) => ({
                                      value: produit.id,
                                      label: produit.Code_produit,
                                    }))}
                                    onChange={(selected) => {
                                      const produit = produits.find(
                                        (prod) => prod.id === selected[0].value
                                      );
                                      handleProductSelection(
                                        {
                                          produit_id: selected[0].value,
                                          Code_produit: produit.Code_produit,
                                          designation: produit.designation,
                                          calibre_id: produit.calibre_id,
                                          calibre: produit.calibre,
                                        },
                                        index
                                      );
                                    }}
                                    values={
                                      productData.produit_id
                                        ? [
                                            {
                                              value: productData.produit_id,
                                              label: productData.Code_produit,
                                            },
                                          ]
                                        : []
                                    }
                                    placeholder="Code ..."
                                  />
                                </td>
                                <td>{productData.designation}</td>
                                <td>{productData.calibre_id}</td>
                                <td>
                                  <input
                                    type="text"
                                    id={`quantite_${index}_${productData.produit_id}`}
                                    className="quantiteInput"
                                    placeholder="Quantite"
                                    value={
                                      modifiedQuantiteValues[
                                        `${index}_${productData.produit_id}`
                                      ] ||
                                      populateProductInputs(
                                        productData.id,
                                        "quantite"
                                      )
                                    }
                                    onChange={(event) =>
                                      handleInputChange(
                                        index,
                                        "quantite",
                                        event
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    id={`prix_unitaire_${index}_${productData.produit_id}`}
                                    className="prixInput"
                                    placeholder="Prix"
                                    value={
                                      modifiedPrixValues[
                                        `${index}_${productData.produit_id}`
                                      ] ||
                                      populateProductInputs(
                                        productData.id,
                                        "prix_unitaire"
                                      )
                                    }
                                    onChange={(event) =>
                                      handleInputChange(
                                        index,
                                        "prix_unitaire",
                                        event
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <Button
                                    className=" btn btn-danger btn-sm m-1"
                                    onClick={() =>
                                      handleDeleteProduct(
                                        index,
                                        productData.produit_id
                                      )
                                    }
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody> */}
                          <tbody>
                            {selectedProductsData.map((productData, index) => (
                              <tr key={index}>
                                <td style={{ backgroundColor: "white" }}>
                                  <Select
                                    options={produits.map((produit) => ({
                                      value: produit.id,
                                      label: produit.Code_produit,
                                    }))}
                                    onChange={(selected) => {
                                      const produit = produits.find(
                                        (prod) => prod.id === selected[0].value
                                      );
                                      handleProductSelection(
                                        {
                                          produit_id: selected[0].value,
                                          Code_produit: produit.Code_produit,
                                          designation: produit.designation,
                                          calibre_id: produit.calibre_id,
                                          calibre: produit.calibre,
                                        },
                                        index
                                      );
                                    }}
                                    values={
                                      productData.produit_id
                                        ? [
                                            {
                                              value: productData.produit_id,
                                              label: productData.Code_produit,
                                            },
                                          ]
                                        : []
                                    }
                                    placeholder="Code ..."
                                  />
                                </td>
                                <td style={{ backgroundColor: "white" }}>
                                  <Select
                                    options={produits.map((produit) => ({
                                      value: produit.id,
                                      label: produit.designation,
                                    }))}
                                    onChange={(selected) => {
                                      const produit = produits.find(
                                        (prod) => prod.id === selected[0].value
                                      );
                                      handleProductSelection(
                                        {
                                          produit_id: selected[0].value,
                                          Code_produit: produit.Code_produit,
                                          designation: produit.designation,
                                          calibre_id: produit.calibre_id,
                                          calibre: produit.calibre,
                                        },
                                        index
                                      );
                                    }}
                                    values={
                                      productData.produit_id
                                        ? [
                                            {
                                              value: productData.produit_id,
                                              label: productData.designation,
                                            },
                                          ]
                                        : []
                                    }
                                    placeholder="Designation ..."
                                  />
                                </td>
                                {/* <td>{productData.designation}</td> */}
                                <td style={{ backgroundColor: "white" }}>
                                  {productData.calibre_id}
                                </td>
                                <td style={{ backgroundColor: "white" }}>
                                  <input
                                    type="text"
                                    id={`quantite_${index}_${productData.produit_id}`}
                                    className="quantiteInput"
                                    placeholder="Quantite"
                                    value={
                                      modifiedQuantiteValues[
                                        `${index}_${productData.produit_id}`
                                      ] ||
                                      populateProductInputs(
                                        productData.id,
                                        "quantite"
                                      )
                                    }
                                    onChange={(event) =>
                                      handleInputChange(
                                        index,
                                        "quantite",
                                        event
                                      )
                                    }
                                  />
                                </td>
                                <td style={{ backgroundColor: "white" }}>
                                  <input
                                    type="text"
                                    id={`prix_unitaire_${index}_${productData.produit_id}`}
                                    className="prixInput"
                                    placeholder="Prix"
                                    value={
                                      modifiedPrixValues[
                                        `${index}_${productData.produit_id}`
                                      ] ||
                                      populateProductInputs(
                                        productData.id,
                                        "prix_unitaire"
                                      )
                                    }
                                    onChange={(event) =>
                                      handleInputChange(
                                        index,
                                        "prix_unitaire",
                                        event
                                      )
                                    }
                                  />
                                </td>
                                <td style={{ backgroundColor: "white" }}>
                                  <Button
                                    className=" btn btn-danger btn-sm m-1"
                                    onClick={() =>
                                      handleDeleteProduct(
                                        index,
                                        productData.id // Utilisez l'ID de la ligne de commande ici
                                      )
                                    }
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Form.Group>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="text-center">
                  <Button type="submit" className=" btn-sm col-4">
                    {editingCommandes ? "Modifier" : "Valider"}
                  </Button>
                  <Button
                    className=" btn-sm btn-secondary col-4 offset-1 "
                    onClick={closeForm}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </Form>
          </div>

          <div
            id="tableContainer"
            className="table-responsive-sm"
            style={tableContainerStyle}
          >
            <table
              className="table table-responsive table-bordered"
              id="CommandeTable"
            >
              <thead
                className="text-center "
                style={{ backgroundColor: "#ddd" }}
              >
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAllChange}
                    />
                  </th>
                  <th>reference</th>
                  <th>Client</th>
                  <th>Site Client</th>
                  <th>Date Commande</th>
                  <th>Mode de Paiement</th>
                  <th>Status</th>
                  <th>Total</th>

                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {filteredCommandes &&
                  filteredCommandes.map((commande) => (
                    <React.Fragment key={commande.id}>
                      {console.log(
                        "Ligne_Commandes:",
                        commande.ligne_commandes
                      )}
                      <tr>
                        <td style={{ backgroundColor: "white" }}>
                          {/* <input
                              type="checkbox"
                              checked={selectedItems.some(
                                (item) => item.id === Commandes.id
                              )}
                              onChange={() => handleSelectItem(Commandes)}
                            /> */}
                          <input
                            type="checkbox"
                            onChange={() => handleCheckboxChange(commande.id)}
                            checked={selectedItems.includes(commande.id)}
                          />
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          <Button
                            className="btn btn-sm btn-light "
                            style={{ marginRight: "10px" }}
                            onClick={() =>
                              handleShowLigneCommandes(commande.id)
                            }
                          >
                            <FontAwesomeIcon
                              icon={
                                expandedRows.includes(commande.id)
                                  ? faMinus
                                  : faPlus
                              }
                            />
                          </Button>

                          {commande.reference}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          {/* <Button
                            className="btn btn-sm btn-light"
                            style={{ marginRight: "10px" }}
                            onClick={() =>
                              handleShowSiteClients(commande.client_id)
                            }
                          >
                            <FontAwesomeIcon
                              icon={
                                expandedClient.includes(commande.client_id)
                                  ? faMinus
                                  : faPlus
                              }
                            />
                          </Button> */}

                          {getClientValue(commande.client_id, "raison_sociale")}
                        </td>
                        <td
                          style={{ backgroundColor: "white" }}
                          className={commande.site_id ? "" : "text-danger"}
                        >
                          {commande.site_id
                            ? getSiteClientValue(
                                commande.site_id,
                                "raison_sociale"
                              )
                            : "aucun site"}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          {commande.dateCommande}
                        </td>

                        <td style={{ backgroundColor: "white" }}>
                          {commande.mode_payement}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          <button
                            className="btn btn-sm btn-light"
                            style={{ marginRight: "10px" }}
                            onClick={() =>
                              handleShowStatusCommandes(commande.id)
                            }
                          >
                            <FontAwesomeIcon
                              icon={
                                expand_status.includes(commande.id)
                                  ? faMinus
                                  : faPlus
                              }
                            />
                          </button>

                          {commande.status}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          <button
                            className="btn btn-sm btn-light"
                            style={{ marginRight: "10px" }}
                            onClick={() => handleShowTotalDetails(commande)}
                          >
                            <FontAwesomeIcon
                              icon={
                                expand_total.includes(commande.id)
                                  ? faMinus
                                  : faPlus
                              }
                            />
                          </button>

                          {calculateTotalQuantity(commande.ligne_commandes)}
                        </td>
                        <td style={{ backgroundColor: "white" }}>
                          <div className="d-inline-flex text-center">
                            {/* <Button
                              className=" btn btn-sm btn-info m-1"
                              onClick={() => handleEdit(commande)}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              className=" btn btn-danger btn-sm m-1"
                              onClick={() => handleDelete(commande.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button> */}
                            <FontAwesomeIcon
                              onClick={() => handleEdit(commande)}
                              icon={faEdit}
                              style={{ color: "#007bff", cursor: "pointer" }}
                            />
                            <span style={{ margin: "0 8px" }}></span>
                            <FontAwesomeIcon
                              onClick={() => handleDelete(commande.id)}
                              icon={faTrash}
                              style={{ color: "#ff0000", cursor: "pointer" }}
                            />
                          </div>
                        </td>
                      </tr>
                      {expandedRows.includes(commande.id) &&
                        commande.ligne_commandes && (
                          <tr>
                            <td
                              colSpan="11"
                              style={{
                                padding: "0",
                              }}
                            >
                              <div id="lignesCommandes">
                                <table
                                  className=" table-bordered"
                                  style={{
                                    borderCollapse: "collapse",
                                    // backgroundColor: "#f2f2f2",
                                    width: "100%",
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                      >
                                        Code Produit
                                      </th>
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                      >
                                        designation
                                      </th>
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                      >
                                        Calibre
                                      </th>
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                      >
                                        Quantite
                                      </th>
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                      >
                                        Prix Unitaire
                                      </th>
                                      {/* <th className="text-center">Action</th> */}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {commande.ligne_commandes.map(
                                      (ligneCommande) => {
                                        const produit = produits.find(
                                          (prod) =>
                                            prod.id === ligneCommande.produit_id
                                        );
                                        console.log("prod", produit);
                                        console.log(
                                          "id",
                                          ligneCommande.produit_id
                                        );
                                        return (
                                          <tr key={ligneCommande.id}>
                                            <td>{produit.Code_produit}</td>
                                            <td>{produit.designation}</td>
                                            <td>{produit.calibre.calibre}</td>
                                            <td>{ligneCommande.quantite}</td>
                                            <td>
                                              {ligneCommande.prix_unitaire} DH
                                            </td>
                                            {/* Ajoutez ici d'autres colonnes ou actions si nécessaire */}
                                          </tr>
                                        );
                                      }
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      {expand_total.includes(commande.id) && (
                        <tr>
                          <td
                            style={{
                              padding: "0",
                            }}
                            colSpan="11"
                          >
                            {/* Increased colspan to accommodate the new Total column */}
                            <table
                              className="table-bordered"
                              style={{
                                borderCollapse: "collapse",
                                // backgroundColor: "#f2f2f2",
                                width: "100%",
                              }}
                            >
                              <thead>
                                <tr>
                                  <th></th>
                                  {commande.ligne_commandes.map((ligne) => {
                                    const produit = produits.find(
                                      (prod) => prod.id === ligne.produit_id
                                    );
                                    return (
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                        key={produit.designation}
                                      >
                                        {produit.designation}
                                      </th>
                                    );
                                  })}
                                  {/* {selectedProductsData.map((ligne, index) => {
                                    return (
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                        key={index}
                                      >
                                        {ligne.designation}
                                      </th>
                                    );
                                  })} */}
                                  <th
                                    style={{
                                      backgroundColor: "#ddd",
                                    }}
                                  >
                                    Total (Unité) / Calibre
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {uniqueCalibres.map((calibre) => (
                                  <tr key={calibre}>
                                    <td
                                      style={{
                                        backgroundColor: "#ddd",
                                      }}
                                    >
                                      <strong>calibre : [{calibre}]</strong>
                                    </td>
                                    {commande.ligne_commandes.map((ligne) => {
                                      const produit = produits.find(
                                        (prod) => prod.id === ligne.produit_id
                                      );
                                      return (
                                        <td key={produit.designation}>
                                          {getQuantity(
                                            commande.ligne_commandes,
                                            calibre,
                                            produit.designation
                                          )}
                                        </td>
                                      );
                                    })}
                                    {/* {selectedProductsData.map(
                                      (ligne, index) => {
                                        return (
                                          <td key={index}>
                                            {getQuantity(
                                              commande.ligne_commandes,
                                              calibre,
                                              ligne.designation
                                            )}
                                          </td>
                                        );
                                      }
                                    )} */}

                                    <td>
                                      <strong>
                                        {getTotalForCalibre(
                                          commande.ligne_commandes,
                                          calibre,
                                          produits
                                        )}
                                      </strong>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                      {expand_status.includes(commande.id) &&
                        commande.status_commandes && (
                          <tr>
                            <td
                              colSpan="11"
                              style={{
                                padding: "0",
                              }}
                            >
                              <div id="statusCommandes">
                                <table
                                  className="table-bordered"
                                  style={{
                                    borderCollapse: "collapse",
                                    // backgroundColor: "#f2f2f2",
                                    width: "100%",
                                  }}
                                >
                                  <thead>
                                    <tr>
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                      >
                                        Status
                                      </th>
                                      <th
                                        style={{
                                          backgroundColor: "#ddd",
                                        }}
                                      >
                                        Date Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {commande.status_commandes.map(
                                      (statusCommande) => (
                                        <tr key={statusCommande.id}>
                                          <td>{statusCommande.status}</td>
                                          <td>{statusCommande.date_status}</td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredCommandes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
            <Button
              className="btn btn-danger btn-sm"
              onClick={handleDeleteSelected}
              disabled={selectedItems.length === 0}
            >
              <FontAwesomeIcon
                icon={faTrash}
                style={{ marginRight: "0.5rem" }}
              />
              Supprimer selection
            </Button>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CommandeList;
