import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

import axios from "axios";
import Navigation from "../Acceuil/Navigation";
import '../App.css';
import {
  Autocomplete,
  Button,
  Select,
  TextField,
  Toolbar,
} from "@mui/material";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import PeopleIcon from "@mui/icons-material/People";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faList,
  faMinus,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { border, style, textAlign } from "@mui/system";

const PreparationLogo = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [siteClients, setSiteClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingCommandes, setEditingCommandes] = useState(null);
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [modifiedLotValues, setModifiedLotValues] = useState({});
  const [modifiedQuantiteValues, setModifiedQuantiteValues] = useState({});
  const [expandedPrepRows, setExpandedPrepRows] = useState([]);
  const [expandedOrderRows, setExpandedOrderRows] = useState([]);
  const [formContainerStyle, setFormContainerStyle] = useState({
    right: "-100%",
  });
  const [warningIndexes, setWarningIndexes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("en_attente");

  const csrfTokenMeta = document.head.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfTokenMeta ? csrfTokenMeta.content : null;
  const [showForm, setShowForm] = useState(false);
  const[content,setContent]=useState(false)
  const [
    existingLignePreparationCommandes,
    setExistingLignePreparationCommandes,
  ] = useState([]);
  const [existingLigneCommandes, setExistingLigneCommandes] = useState([]);

  const [editingCommandesId, setEditingCommandesId] = useState(null);
  const [tableContainerStyle, setTableContainerStyle] = useState({
    marginRight: "0px",
  });
  const [selectedClients, setSelectedClients] = useState([]);

  const [formData, setFormData] = useState({
    reference: "",
    dateCommande: "",
    datePreparationCommande: "",
    client_id: "",
    site_id: "",
    mode_payement: "",
    status: "",
    status_preparation: "",
    user_id: "",
    produit_id: "",
    prix_unitaire: "",
    quantite: "",
    codePreparation: "",
  });
  useEffect(() => {
    if (editingCommandesId) {
      fetchExistingLigneCommandes(editingCommandesId);
      fetchExistingLignePreparationCommandes(editingCommandesId);
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
  const fetchExistingLignePreparationCommandes = async (commandId) => {
    axios
      .get(`http://localhost:8000/api/lignePreparationCommandes/${commandId}`)
      .then((lignePreparationCommandesResponse) => {
        const existingLignePreparationCommandes =
          lignePreparationCommandesResponse.data.lignePreparationCommandes;

        setExistingLignePreparationCommandes(existingLignePreparationCommandes);
      });
  };
  const fetchData = async () => {
    try {
      const [
        commandesResponse,
        clientsResponse,
        siteClientResponse,
        produitsResponse,
      ] = await Promise.all([
        axios.get("http://localhost:8000/api/commandes"),
        axios.get("http://localhost:8000/api/clients"),
        axios.get("http://localhost:8000/api/siteclients"),
        axios.get("http://localhost:8000/api/produits"),
      ]);
      setCommandes(commandesResponse.data.commandes);
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
    if (editingCommandes) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        client_id: editingCommandes.client_id,
      }));
    }
  }, [editingCommandes]);
  const [status ,setStatus]=useState();
  function changeStatus(status){
    setStatus(status)
  }
  const [clientid , setClientid]=useState();
   function hndelid (id){
    setClientid(id)
  }
  const fetchOrdersByClientAndStatus = async (clientId) => {
    setClientid(clientId);
    try {
      console.log(status)
      const response = await axios.get(`http://localhost:8000/api/clients/${clientId}/commandes`);

      const orders = response.data.commandes;
      console.log('comde',response.data.
      preparations
      );
      
      // Filtrer les commandes par statut
      const filteredOrders = orders.filter(order => order.status === status);
      console.log('status',status)
      // Afficher les commandes filtrées par statut
      console.log("Commandes filtrées par statut", filteredOrders);
     
      // Mettre à jour l'état avec les commandes filtrées
      setSelectedOrder(filteredOrders);
    } catch (error) {
      console.error("Erreur lors de la récupération des commandes :", error);
    }
};
const [filtredatacmd,setFiltredatacmd]=useState([]);
const filtredata = async ( id,clientid) => {
  try {
      // Logging the status for debugging purposes
      console.log('Status:', status ,clientid);
      
      // Making the API request to fetch orders by client ID
      const response = await axios.get(`http://localhost:8000/api/clients/${clientid}/commandes`);
      const orders = response.data.commandes;

      // Logging preparations for debugging purposes
      console.log('Preparations:', response.data.preparations);

      // Filtering the orders by status and id
      const filteredOrders = orders.filter(order => order.status === status && order.id === id);
      console.log(id)
      // Logging the status and filtered orders for debugging purposes
      console.log('Filtered by Status:', status);
      console.log("Filtered Orders:", filteredOrders);

      // Updating the state with the filtered orders
      setFiltredatacmd(filteredOrders);
  } catch (error) {
      console.error("Error fetching orders:", error);
  }
};
const [filtrecmd ,setFiltrecmd]=useState([])
const filtrecmddata = async () => {
  try {
      // Logging the status for debugging purposes
      console.log('Status:', status ,clientid);
      
      // Making the API request to fetch orders by client ID
     

      // Filtering the orders by status and id
      const filteredOrders = selectedOrder.filter(selectedOrder => selectedOrder.id === id);
      console.log(id)
      // Logging the status and filtered orders for debugging purposes
      console.log('Filtered by Status:', status);
      console.log("Filtered Orders:", filteredOrders);

      // Updating the state with the filtered orders
      setFiltrecmd(filteredOrders);
  } catch (error) {
      console.error("Error fetching orders:", error);
  }
};

// Example usage


  
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getElementValueById = (id) => {
    return document.getElementById(id)?.value || "";
  };


  const calculateTotalQuantity = (ligneCommandes) => {
    // S'assurer que ligneCommandes est un tableau
    if (!Array.isArray(ligneCommandes)) {
      console.error("Expected an array but received:", ligneCommandes);
      return 0; // Retourner 0 si ligneCommandes n'est pas un tableau
    }

    return ligneCommandes.reduce((total, ligneCommande) => {
      return total + ligneCommande.quantite;
    }, 0);
  };
  const calculateTotalPreparationQuantityForCommande = (preparations) => {
    if (!Array.isArray(preparations)) {
      console.error("Expected an array but received:", preparations);
      return 0; // Retourner 0 si les préparations ne sont pas un tableau
    }

    return preparations.reduce((total, preparation) => {
      if (!Array.isArray(preparation.lignes_preparation)) {
        console.error(
          "Expected an array but received:",
          preparation.lignes_preparation
        );
        return total; // Ignorer cette préparation si les lignes de préparation ne sont pas un tableau
      }

      return (
        total +
        preparation.lignes_preparation.reduce((subtotal, lignePreparation) => {
          return subtotal + lignePreparation.quantite;
        }, 0)
      );
    }, 0);
  };
  const calculateRowColor = (ligne_commandes, preparations) => {
    if (!Array.isArray(ligne_commandes) || !Array.isArray(preparations)) {
      console.error(
        "Expected arrays but received:",
        ligne_commandes,
        preparations
      );
      return "#FF8787"; // Retourner rouge en cas d'erreur ou d'absence de préparations
    }

    const totalCommandes = calculateTotalQuantity(ligne_commandes);
    const totalPreparation =
      calculateTotalPreparationQuantityForCommande(preparations);
    console.log("Total des lignes de commande:", totalCommandes);
    console.log(
      "Total des lignes de préparation pour la commande:",
      totalPreparation
    );
    return totalCommandes === totalPreparation ? "#87A922" : "#FCDC2A";
  };

  const getSiteClientValue = (siteClientId, field) => {
    const site = siteClients.find((p) => p.id === siteClientId);

    if (site) {
      return site[field];
    }

    return "";
  };

  const handleClientClick = (clientId) => {
    fetchOrdersByClientAndStatus(clientId, selectedStatus);
  };
  const populateProductInputs = (id, inputType) => {
    console.log(
      "existing LignePreparationCommande",
      existingLignePreparationCommandes
    );
    const existingLignePreparationCommande = selectedProductsData.find(
      (data) => data.id === id
    );
    if (existingLignePreparationCommande) {
      return existingLignePreparationCommande[inputType];
    }
    return "";
  };
  const getClientValue = (clientId, field) => {
    const client = clients.find((p) => p.id === clientId);

    if (client) {
      return client[field];
    }
    return "";
  };

  const handleOrderClient = (order) => {
    setSelectedOrder(order);
  };
  const handleOrderClick = (filteredOrders) => {
    // Utiliser un objet pour enregistrer les clients uniques
    const clientsWithOrders = {};
    filteredOrders.forEach(order => {
      if (!clientsWithOrders[order.client.id]) {
        clientsWithOrders[order.client.id] = order.client;
        setContent(true);
      }
    });

    // Convertir l'objet en un tableau de clients uniques
    const uniqueClients = Object.values(clientsWithOrders);
    setSelectedClients(uniqueClients);
  };

  const handleShowLigneCommandes = (commandeId) => {
    setExpandedOrderRows((prevRows) =>
      prevRows.includes(commandeId)
        ? prevRows.filter((row) => row !== commandeId)
        : [...prevRows, commandeId]
    );
  };

  const handleShowLignePreparationCommandes = (preparationId) => {
    setExpandedPrepRows((prevRows) =>
      prevRows.includes(preparationId)
        ? prevRows.filter((row) => row !== preparationId)
        : [...prevRows, preparationId]
    );
  };

  const handleInputChange = (index, inputType, event) => {
    const newValue = event.target.value;
    console.log("selectedProductsData", selectedProductsData);
    console.log("index", index);
    if (selectedProductsData[index]) {
      const productId = selectedProductsData[index].produit_id;
      const quantite = selectedProductsData[index].quantite;
      if (inputType === "lot") {
        setModifiedLotValues((prev) => {
          const updatedValues = {
            ...prev,
            [`${index}_${productId}`]: newValue,
          };
          console.log("Modified Lot values:", updatedValues);
          return updatedValues;
        });
      } else if (inputType === "quantite") {
        if (newValue > quantite) {
          setWarningIndexes((prev) => [...prev, index]); // Add index to warning indexes
        } else {
          setWarningIndexes((prev) => prev.filter((item) => item !== index)); // Remove index from warning indexes

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
    }
  };
  const handleDeleteAllSelection = () => {
    // Clear the selected products data
    setSelectedProductsData([]);
  };
  const closeForm = () => {
    handleDeleteAllSelection();
    setFormContainerStyle({ right: "-100%" });
    setTableContainerStyle({ marginRight: "0" });
    setShowForm(false); // Hide the form
    setFormData({
      // Clear form data
      reference: "",
      dateCommande: "",
      datePreparationCommande: "",
      codePreparation: "",
      client_id: "",
      site_id: "",
      mode_payement: "",
      status: "",
      user_id: "",
      produit_id: "",
      prix_unitaire: "",
      quantite: "",
    });
    setWidth('90%')
    setEditingCommandes(null); // Clear editing client
  };
  //---------------------------Produit--------------------------
  const handleDeleteProduct = (index, id) => {
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData.splice(index, 1);
    setSelectedProductsData(updatedSelectedProductsData);
    if (id) {
      axios
        .delete(`http://localhost:8000/api/lignePreparationCommandes/${id}`)
        .then(() => {
          fetchData();
        });
    }
  };
  const handleProductSelection = (selectedProduct, index) => {
    console.log("selectedProduct", selectedProduct);
    const updatedSelectedProductsData = [...selectedProductsData];
    updatedSelectedProductsData[index] = selectedProduct;
    setSelectedProductsData(updatedSelectedProductsData);
    console.log("selectedProductsData", selectedProductsData);
  };

  const handleAddEmptyRow = () => {
    // Ajouter un objet initialisé avec les valeurs nécessaires
    setSelectedProductsData([
      ...selectedProductsData,
      {
        produit_id: "",
        Code_produit: "",
        designation: "",
        calibre_id: "",
      },
    ]);
    console.log("selectedProductData", selectedProductsData);
  };
const [width ,setWidth]=useState('90%');

  const handleShowPreparationForm = (commande) => {
console.log('id',id)
    console.log('addcomd',commande)
    setFormData({
      reference: commande.reference,
      dateCommande: commande.dateCommande,
      client_id: commande.client_id,
      site_id: commande.site_id,
      mode_payement: commande.mode_payement,
      status: commande.status,
      status_preparation: "",
      datePreparationCommande: "",
      produit_id: "",
      prix_unitaire: 12,
      quantite: "",
      lot: "",
    });
    console.log("datafram",formData ,formData.status_preparation)
setWidth("63%")
    setSelectedProductsData([]); // Reset selected products data
    setEditingCommandes(commande); // Clear editing command
    setIsEditing(false); // Set to adding mode

    if (formContainerStyle.right === "-100%") {
      setFormContainerStyle({ right: "0" });
      setTableContainerStyle({ marginRight: "1200px" });
    } else {
      closeForm();
    }
  };
  const [id ,setId]=useState();
        function changeId(id){
          const filteredOrders = selectedOrder.filter(selectedOrder => selectedOrder.id === id);
      console.log(id)
      // Logging the status and filtered orders for debugging purposes 
      setId(id)

      setFiltrecmd(filteredOrders);
        }
        
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userResponse = await axios.get("http://localhost:8000/api/users", {
        withCredentials: true,
        headers: {
          "X-CSRF-TOKEN": csrfToken,
        },
      });

      const authenticatedUserId = userResponse.data[0].id;
      console.log("auth user", authenticatedUserId);

      let preparationId;

      if (isEditing && editingCommandes) {
        // Update existing preparation
console.log('id',id)
        await axios.put(
          `http://localhost:8000/api/PreparationCommandes/${id}`,
          {
            commande_id:id,
            datePreparationCommande: formData.datePreparationCommande,
            status_preparation: formData.status_preparation,
            CodePreparation: formData.codePreparation,

          }
        );
         
        preparationId = editingCommandes.id;
      } else {
        console.log("stat",formData)

        console.log('Selected order:', selectedOrder);

        console.log('Creating new preparation with:',
        id,
          formData.datePreparationCommande,
          formData.status_preparation,
          formData.codePreparation
        );
        
        const preparationResponse = await axios.post(
          `http://localhost:8000/api/PreparationCommandes`,
          {
            commande_id: id,
            datePreparationCommande: formData.datePreparationCommande,
            status_preparation: formData.status_preparation,
            CodePreparation: formData.codePreparation,
          }
          
        );
        console.log('datafram ',preparationResponse)

        console.log("form",formData)
        await axios.put(
          `http://localhost:8000/api/commandes/${id}`,
          {
            status: formData.status_preparation,
           
          }
        );
        handleEditPreparationForm(preparationId) 
        fetchOrdersByClientAndStatus(clientid)        
        preparationId = preparationResponse.data.id;
      }

      // Get existing lignePreparationCommandes
      const existingLignePreparationCommandesResponse = await axios.get(
        `http://localhost:8000/api/PreparationCommandes/${preparationId}/lignePreparationCommandes`
      );
      const existingLignePreparationCommandes = Array.isArray(
        existingLignePreparationCommandesResponse.data
      )
        ? existingLignePreparationCommandesResponse.data
        : [];
      
      // Map selectedProductsData to include existing ids if they exist
      const selectedPrdsData = selectedProductsData.map(
        (selectedProduct, index) => {
          const existingLignePreparationCommande =
            existingLignePreparationCommandes.find(
              (lignePreparationCommande) =>
                lignePreparationCommande.produit_id ===
                selectedProduct.produit_id
            );

          return {
            id: existingLignePreparationCommande
              ? existingLignePreparationCommande.id
              : undefined,
            preparation_id: preparationId,
            produit_id: selectedProduct.produit_id,
            prix_unitaire: 12,
            quantite: getElementValueById(
              `quantite_${index}_${selectedProduct.produit_id}`
            ),
            lot: getElementValueById(
              `lot_${index}_${selectedProduct.produit_id}`
            ),
          };
        }
      );

      console.log("selectedPrdsData", selectedPrdsData);

      // Track IDs to be deleted (i.e., those not in the new set of data)
      const newProductIds = selectedPrdsData.map((item) => item.produit_id);
      const idsToDelete = existingLignePreparationCommandes
        .filter((item) => !newProductIds.includes(item.produit_id))
        .map((item) => item.id);

      // Delete lines that are not in the new set
      for (const id of idsToDelete) {
        await axios.delete(
          `http://localhost:8000/api/lignePreparationCommandes/${id}`,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
            },
          }
        );
      }

      // Update or create lignePreparationCommandes
      for (const lignePreparationCommandeData of selectedPrdsData) {
        if (lignePreparationCommandeData.id) {
          await axios.put(
            `http://localhost:8000/api/lignePreparationCommandes/${lignePreparationCommandeData.id}`,
            lignePreparationCommandeData,
            {
              withCredentials: true,
              headers: {
                "X-CSRF-TOKEN": csrfToken,
              },
            }
          );
        } else {
          await axios.post(
            "http://localhost:8000/api/lignePreparationCommandes",
            lignePreparationCommandeData,
            {
              withCredentials: true,
              headers: {
                "X-CSRF-TOKEN": csrfToken,
              },
            }
          );
        }
      }

      fetchData();

      setFormData({
        id: "",
        reference: "",
        dateCommande: "",
        client_id: "",
        site_id: "",
        mode_payement: "",
        status: "",
        datePreparationCommande: "",
        status_preparation: "",
        produit_id: "",
        prix_unitaire: 12,
        quantite: "",
        lot: "",
      });
      console.log("stat",formData)

      setShowForm(false);
      setIsEditing(false); // Reset editing mode
      Swal.fire({
        icon: "success",
        title: "Succès !",
        text: "Succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la soumission des données :", error);
      Swal.fire({
        icon: "error",
        title: "Erreur !",
        text: "Erreur lors de la soumission des données.",
      });
    }
    closeForm();
  };

  const handleEditPreparationForm = async (preparation) => {
    console.log("pr",preparation.preparations.id)
const preparations = preparation.preparations
const maxId = preparations.reduce((max, preparation) => {
  return (preparation.id > max) ? preparation.id : max;
}, preparations[0].id);

console.log(maxId);
    try {
      // Récupérer les données de la préparation et de la commande associée
      const response = await axios.get(
        `http://localhost:8000/api/PreparationCommandes/${maxId}`
      );
      const { preparation: preparationData, commande: commandeData } =
        response.data;
      console.log("data",response.data);

      // Mettre à jour les états avec les données récupérées
      setFormData({
        reference: commandeData.reference,
        dateCommande: commandeData.dateCommande,
        client_id: commandeData.client_id,
        site_id: commandeData.site_id,
        mode_payement: commandeData.mode_payement,
        datePreparationCommande: preparationData.datePreparationCommande,
        status: commandeData.status,
        status_preparation: preparationData.status_preparation,
        codePreparation: preparationData.CodePreparation,
      });
      setWidth('63%')
      setSelectedProductsData(preparationData.lignes_preparation);
      console.log(preparationData.lignes_preparation);
      setEditingCommandes(preparation);
      setIsEditing(true); // Set to editing mode

      // Afficher le formulaire
      if (formContainerStyle.right === "-100%") {
        setFormContainerStyle({ right: "0" });
        setTableContainerStyle({ marginRight: "1200px" });
      } else {
        closeForm();
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
    }
  };

  const handleDeletePreparation = async (preparationId) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: "Cette action est irréversible!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `http://localhost:8000/api/PreparationCommandes/${preparationId}`,
          {
            withCredentials: true,
            headers: {
              "X-CSRF-TOKEN": csrfToken,
            },
          }
        );
        fetchData(); // Re-fetch data to update the UI
        Swal.fire({
          icon: "success",
          title: "Succès !",
          text: "Préparation supprimée avec succès.",
        });
      } catch (error) {
        console.error(
          "Erreur lors de la suppression de la préparation :",
          error
        );
        Swal.fire({
          icon: "error",
          title: "Erreur !",
          text: "Erreur lors de la suppression de la préparation.",
        });
      }
    }
  };
  const getColorByStatus = (status) => {
    switch (status) {
      case "en_attente":
        return " rgb(253 224 71)";
      case "En cours":
        return "rgb(249 115 22)";
      case "Valide":
        return "rgb(34 197 94)";
      default:
        return "#ffffff"; // Default color
    }
  };
  return (
    <ThemeProvider theme={createTheme()} >
      <Box sx={{ position:'absolute',
        top:'0px',
        left:'220px',
        width:'90%' }}
      >
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 4 }}>
          {/* <Toolbar /> */}
          <Typography
            variant="h5"
            gutterBottom
            component="div"
            sx={{
              color: "grey",
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
              marginTop:"30px"
            }}
          >
            <PeopleIcon sx={{ fontSize: "24px", marginRight: "8px"}} />
            Liste des clients avec les logos
          </Typography>
          <div style={{ width: "100%" }}>
    <div className="d-flex flex-wrap">
      {["en_attente", "En cours", "Valide"].map((status) => {
        const filteredOrders = commandes.filter(
          (order) => order.status === status
        );
        const orderCount = filteredOrders.length;
        const color = getColorByStatus(status);

        return (
          <div
            key={status}
            style={{ marginLeft: "40px", marginBottom: "-20px", width: "30%" }}
          >
            <Card
              sx={{
                width: "100%",
                padding: "5px",
                backgroundColor: color,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    color: "#333",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                    marginBottom: "10px",
                  }}
                >
                  {status.replace("_", " ") === "En cours" ? "prépare" : status.replace("_", " ")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#333",
                    marginBottom: "5px",
                    marginTop: "-35px",
                    marginLeft: "250px",
                  }}
                >
                  Nombre de commandes : {orderCount}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#1976d2",
                    cursor: "pointer",
                    "&:hover": { color: "#1976d2" },
                  }}
                  onClick={() => {
                    handleOrderClick(filteredOrders);
                    changeStatus(status);
                  }}
                >
                  Voir les détails
                </Typography>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  </div>
      {content &&
      <Typography
      variant="h5"
      gutterBottom
      component="div"
      sx={{
        color: "grey",
        display: "flex",
        alignItems: "center",
        marginBottom: "10px",
        marginTop:"40px",
        marginLeft:"-px"

      }}
    >
      <PeopleIcon sx={{ fontSize: "24px", marginRight: "8px"}} />
       {status === "en_attente" ? "En attente" : status}
    </Typography>
      }
          
    
   <div
       style={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'scroll',
        height: '750px',

        alignItems: 'flex-start',
        width: '120px', // Ajuster selon vos besoins
        scrollbarColor: '#F5F5F5 #F5F5F5', // Couleur de la barre de défilement et du fond
      }}
    >
      {selectedClients.map((client) => (
        <div
          key={client.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%', // Pour que l'élément prenne toute la largeur disponible
            paddingBottom: '10px',
            cursor: 'pointer',
            borderBottom: '1px solid #ccc', // Bordure inférieure entre les clients
          }}
        onClick={() =>{ handleClientClick(client.id);
          hndelid(client.id)
        }}
        >
           <img
            src={client.logoC}
            alt="Logo"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              marginTop:'5px'
            }}
          />
          <Typography variant="subtitle1" gutterBottom style={{ textAlign: 'center' }}>
            {client.raison_sociale}
          </Typography>
         
          
        </div>
        
      ))}
     
      
    </div>
    {
        content && 
        <div 
        style={{
          border:'1px solid #ddd',
          backgroundColor:'#ddd',
          width:'5px',
          height:'700px',
          position:'absolute',
          top:'250px',
          left:'170px'
        }}
        >

        </div>
      }
          {selectedOrder && (
            <>
              <div
                id="formContainerCommande"
                style={{
                  ...formContainerStyle,
                  padding: "50px",
                  overflow: "auto",
                  maxHeight: "500px",
                  marginRight:'-2%'
                  
                }}
              >
                {" "}
                <Form className="row" style={{
                  marginTop:'-400px',
                  position:'fixed',
                  width:'25%',
                  top:'670px',
                  zIndex:'1000',
                  border:'2px solid #ddd',
                  borderRadius:'10px',
                  backgroundColor:'#ffffff',
                  overflowY: 'scroll',
                  maxHeight:'700px',

                  
                }} onSubmit={handleSubmit}>
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
                      {isEditing
                        ? "mise à jour Preparation"
                        : "Ajouter une Preparation"}
                    </h4>
                  </Form.Label>
                  <h5
                    style={{
                      fontSize: "25px",
                      color: "black",
                      backgroundColor:'#ddd',
                    }}
                    >information client :</h5>
                    <div className="col-md-12">
                    <div className="row mb-3">
                      <div className="col-sm-6">
                        <label htmlFor="client_id" className="col-form-label">
                          Client:
                        </label>
                      </div>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          className="form-control"
                          id="client_id"
                          name="client_id"
                          value={getClientValue(
                            formData.client_id,
                            "raison_sociale"
                          )}
                          readOnly // Make the input read-only
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="row mb-3">
                      <div className="col-sm-6">
                        <label htmlFor="status" className="col-form-label">
                          Status:
                        </label>
                      </div>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          className="form-control"
                          id="status"
                          name="status"
                          value={formData.status}
                          readOnly // Make the input read-only
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="row mb-3">
                      <div className="col-sm-6">
                        <label
                          htmlFor="mode_payement"
                          className="col-form-label"
                        >
                          Mode Paiement:
                        </label>
                      </div>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          className="form-control"
                          id="mode_payement"
                          name="mode_payement"
                          value={formData.mode_payement}
                          readOnly // Make the input read-only
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
                        <input
                          type="text"
                          className={
                            formData.site_id
                              ? "form-control"
                              : "text-danger form-control"
                          }
                          id="site_id"
                          name="site_id"
                          value={
                            formData.site_id
                              ? getSiteClientValue(
                                  formData.site_id,
                                  "raison_sociale"
                                )
                              : "aucun site"
                          }
                          readOnly // Make the input read-only
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-12">
                    <div className="row mb-3">
                      <div className="col-sm-6">
                        <label
                          htmlFor="dateCommande"
                          className="col-form-label"
                        >
                          Date Commande:
                        </label>
                      </div>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          className="form-control"
                          id="dateCommande"
                          name="dateCommande"
                          value={formData.dateCommande}
                          readOnly // Make the input read-only
                        />
                      </div>
                    </div>
                  </div>
                 
                  <h5
                    style={{
                      fontSize: "25px",
                      color: "black",
                      backgroundColor:'#ddd',
                    }}
                    >information commande :</h5>
                  <div className="col-md-12">
                    <div className="row mb-3">
                      <div className="col-sm-6">
                        <label
                          htmlFor="datePreparationCommande"
                          className="col-form-label"
                        >
                          Date Preparation Commande:
                        </label>
                      </div>
                      <div className="col-sm-6">
                        <Form.Group controlId="datePreparationCommande">
                          <Form.Control
                            type="date"
                            name="datePreparationCommande"
                            value={formData.datePreparationCommande}
                            onChange={handleChange}
                            className="form-control-sm"
                          />
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="row mb-3">
                      <div className="col-sm-6">
                        <label
                          htmlFor="codePreparation"
                          className="col-form-label"
                        >
                          Code de Préparation:
                        </label>
                      </div>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          className="form-control"
                          id="CodePreparation"
                          name="codePreparation"
                          value={formData.codePreparation}
                          onChange={handleChange} // Assurez-vous que handleChange met à jour le formData
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="row mb-3">
                      <div className="col-sm-6">
                        <label htmlFor="status" className="col-form-label">
                          status de preparation:
                        </label>
                      </div>
                      <div className="col-sm-6">
                        <select
                          className="form-control"
                          id="status_preparation"
                          name="status_preparation"
                          value={formData.status_preparation}
                          onChange={handleChange} // Assurez-vous que handleChange met à jour le formData
                        >
                          <option value="en_attente">En attente</option>
                          <option value=" En cours">préparer</option>
                          <option value="Valide"> valide</option>
                        </select>
                      </div>
                    </div>
                  </div>
                 
                    <>
                      {/* {calculateTotalQuantity(
                        editingCommandes.ligne_preparation_commandes
                      ) !==
                        calculateTotalQuantity(
                          editingCommandes.ligne_commandes
                        ) && ( */}
                      <div>
                        <Button
                          className="btn btn-sm mb-2"
                          variant="primary"
                          onClick={handleAddEmptyRow}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </Button>
                        <strong>Ajouter Produit</strong>
                      </div>
                      {/* )} */}

                      {/* Add other JSX elements with the same condition */}
                    </>
                

                  <div className="col-md-12">
                    {console.log("selectedProductsData:", selectedProductsData)}
                    <Form.Group controlId="selectedProduitTable">
                      <div className="table-responsive">
                      <table className="table table-bordered">
  <thead>
    <tr>
      <th>Code Produit</th>
      <th>Designation</th>
      <th>Calibre</th>
      <th>Quantité</th>
      <th>Lot</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    {isEditing ? (
      selectedProductsData.map((productData, index) => (
        <tr key={index}>
          <td>
            <Autocomplete
              value={produits.find((prod) => prod.id === productData.produit_id)}
              options={produits}
              getOptionLabel={(option) => option.Code_produit || ""}
              onChange={(event, newValue) => {
                const updatedSelectedProductsData = [...selectedProductsData];
                updatedSelectedProductsData[index] = {
                  ...productData,
                  produit_id: newValue ? newValue.id : "",
                  Code_produit: newValue ? newValue.Code_produit : "",
                  designation: newValue ? newValue.designation : "",
                  calibre_id: newValue ? newValue.calibre_id : "",
                };
                setSelectedProductsData(updatedSelectedProductsData);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select a product"
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </td>
          <td>{productData.designation || "N/A"}</td>
          <td>{productData.calibre_id || "N/A"}</td>
          <td>
            <input
              type="text"
              className={warningIndexes.includes(index) ? "input-warning" : ""}
              style={{ width: '60px', border: 'none' }}
              id={`quantite_${index}_${productData.produit_id}`}
              placeholder={productData.quantite}
              value={
                modifiedQuantiteValues[`${index}_${productData.produit_id}`] ||
                populateProductInputs(productData.id, "quantite")
              }
              onChange={(event) => handleInputChange(index, "quantite", event)}
            />
          </td>
          <td>
            <input
              type="text"
              style={{ width: '60px', border: 'none' }}
              id={`lot_${index}_${productData.produit_id}`}
              className="lotInput"
              placeholder="Lot"
              value={
                modifiedLotValues[`${index}_${productData.produit_id}`] ||
                populateProductInputs(productData.id, "lot")
              }
              onChange={(event) => handleInputChange(index, "lot", event)}
            />
          </td>
          <td>
            <Button
              className="btn btn-danger btn-sm m-1"
              onClick={() => handleDeleteProduct(index, productData.id)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </td>
        </tr>
      ))
    ) : (
      
      console.log('selec', selectedOrder),
      filtrecmd.map((order, orderIndex) => (
        <React.Fragment key={order.id}>
          {order.ligne_commandes.map((ligneCommande, ligneIndex) => {
            const produit = produits.find(prod => prod.id === ligneCommande.produit_id);
            return (
              <tr key={`${order.id}-${ligneCommande.id}`}>
                          <td>
            <Autocomplete
              value={produits.find((prod) => prod.id === order.produit_id)}
              options={produits}
              getOptionLabel={(option) => option.Code_produit || ""}
              onChange={(event, newValue) => {
                const updatedSelectedProductsData = [...selectedProductsData];
                updatedSelectedProductsData[index] = {
                  ...order,
                  produit_id: newValue ? newValue.id : "",
                  Code_produit: newValue ? newValue.Code_produit : "",
                  designation: newValue ? newValue.designation : "",
                  calibre_id: newValue ? newValue.calibre_id : "",
                };
                setSelectedProductsData(updatedSelectedProductsData);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={produit.Code_produit}
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </td>
                <td>{produit ? produit.designation : "N/A"}</td>
                <td>{produit ? produit.calibre_id : "N/A"}</td>
                <td>
                  <input
                    type="text"
                    className={warningIndexes.includes(orderIndex) ? "input-warning" : ""}
                    style={{ width: '60px', border: 'none' }}
                    id={`quantite_${orderIndex}_${ligneCommande.produit_id}`}
                    placeholder={ligneCommande.quantite}
                    value={
                      modifiedQuantiteValues[`${orderIndex}_${ligneCommande.produit_id}`] ||
                      populateProductInputs(ligneCommande.id, "quantite")
                    }
                    onChange={(event) => handleInputChange(orderIndex, "quantite", event)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    style={{ width: '60px', border: 'none' }}
                    id={`lot_${orderIndex}_${ligneCommande.produit_id}`}
                    className="lotInput"
                    placeholder="Lot"
                    value={
                      modifiedLotValues[`${orderIndex}_${ligneCommande.produit_id}`] ||
                      populateProductInputs(ligneCommande.id, "lot")
                    }
                    onChange={(event) => handleInputChange(orderIndex, "lot", event)}
                  />
                </td>
                <td>
                  <Button
                    className="btn btn-danger btn-sm m-1"
                    onClick={() => handleDeleteProduct(orderIndex, ligneCommande.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              </tr>
            );
          })}
        </React.Fragment>
      ))
    
    )}
  </tbody>
</table>



                      </div>
                    </Form.Group>
                  </div>

                  <Form.Group className="col m-3 text-center ">
                    <Button type="submit" className="btn btn-danger col-md-4 m-3"
 >
                      {isEditing ? "mise à jour" : "Ajouter"}
                    </Button>
                    <Button
                      className="btn btn-secondary col-4 offset-1"
                      onClick={() => {
                        closeForm();
                        hndelid(client.id);
                      }}

                      
                    >
                      Annuler
                    </Button>
                  </Form.Group>
                </Form>
              </div>
              <div
    id="tableContainer"
    className="table-responsive-sm"
    style={{ padding: '20px', maxHeight: '500px', overflowY: 'auto',
      marginTop:'-800px',
      marginLeft:'150px',
      width: width,
     }}
  >
    <table className="table table-bordered">
      <thead className="text-center ddd" >
        <tr>
          
          <th>Code de Préparation</th>
          <th>Status de Préparation</th>
          <th>Date de Préparation</th>
          <th>Référence Commande</th>
          <th>Client</th>
          <th>Site</th>
          <th>Date Commande</th>
          <th>Mode de payement</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody className="text-center">
        {selectedOrder && selectedOrder.map((order) => (
          <React.Fragment key={order.id}>
            <tr>
              <td>
                <button
                  className="btn btn-sm btn-light"
                  style={{ marginRight: "10px" }}
                  onClick={() => handleShowLignePreparationCommandes(order.id)}
                >
                  <FontAwesomeIcon icon={expandedPrepRows.includes(order.id) ? faMinus : faPlus} />
                </button>
                {order.CodePreparation}
              </td>
              <td>{order.status_preparation}</td>
              <td>{order.datePreparationCommande}</td>
              <td>
                {order.reference}
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => handleShowLigneCommandes(order.id)}
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              </td>
              <td>{selectedClient?.id || 'N/A'}</td>
              <td className={order.site_id ? "" : "text-danger"}>
                {order.site_id ? getSiteClientValue(order.site_id, "raison_sociale") : "Aucun site"}
              </td>
              <td>{order.dateCommande}</td>
              <td>{order.mode_payement}</td>
              <td>{order.status}</td>
              <td>
                <div className="d-inline-flex text-center">
                  <FontAwesomeIcon
                    onClick={() => {
                      changeId(order.id);
                      handleShowPreparationForm(order);
                      
                    }}
                    icon={faPlus}
                    style={{ margin: "0 10px", cursor: "pointer", color: "blue" }}
                  />
                  <FontAwesomeIcon
                    onClick={() => {handleEditPreparationForm(order);
                      changeId(order.id);

                    }}
                    
                    icon={faEdit}
                    style={{ margin: "0 10px", cursor: "pointer", color: "green" }}
                  />
                  <FontAwesomeIcon
                    onClick={() => handleDeletePreparation(order.id)}
                    icon={faTrash}
                    style={{ margin: "0 10px", cursor: "pointer", color: "red" }}
                  />
                </div>
              </td>
            </tr>
            {expandedPrepRows.includes(order.id) && (
              <tr>
                <td colSpan="11" style={{ padding: "0" }}>
                  <div id="lignesCommandes">
                    <table className="table-bordered" style={{ borderCollapse: "collapse", width: "100%" }}>
                      <thead>
                        <tr>
                          <th colSpan="8" style={{ backgroundColor: "#EEEEEE" }}>Liste des Préparation de Commande</th>
                        </tr>
                        <tr>
                          <th style={{ backgroundColor: "#ddd" }}>Code Produit</th>
                          <th style={{ backgroundColor: "#ddd" }}>Designation</th>
                          <th style={{ backgroundColor: "#ddd" }}>Quantite</th>
                          <th style={{ backgroundColor: "#ddd" }}>Calibre</th>
                          <th style={{ backgroundColor: "#ddd" }}>Prix Unitaire</th>
                          <th style={{ backgroundColor: "#ddd" }}>Lot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.preparations.map((preparation) =>
                          preparation.lignes_preparation.map((lignePreparationCommande) => {
                            const produit = produits.find(prod => prod.id === lignePreparationCommande.produit_id);
                            return (
                              <tr key={lignePreparationCommande.id}>
                                <td>{produit?.Code_produit}</td>
                                <td>{produit?.designation}</td>
                                <td>{lignePreparationCommande.quantite}</td>
                                <td>{produit?.calibre.calibre}</td>
                                <td>{lignePreparationCommande.prix_unitaire} DH</td>
                                <td>{lignePreparationCommande.lot}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            )}
            {expandedOrderRows.includes(order.id) && order.ligne_commandes && (
              <tr>
                <td colSpan="12" style={{ padding: "0" }}>
                  <div id="lignesCommandes">
                    <table className="table-bordered" style={{ borderCollapse: "collapse", width: "100%" }}>
                      <thead>
                        <tr>
                          <th colSpan="4" style={{ backgroundColor: "#EEEEEE" }}>Liste des lignes de Commandes</th>
                        </tr>
                        <tr>
                          <th style={{ backgroundColor: "#ddd" }}>Produit</th>
                          <th style={{ backgroundColor: "#ddd" }}>Quantite</th>
                          <th style={{ backgroundColor: "#ddd" }}>Prix Vente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.ligne_commandes.map((ligneCommande) => (
                          <tr key={ligneCommande.id}>
                            <td>{ligneCommande.produit_id}</td>
                            <td>{ligneCommande.quantite}</td>
                            <td>{ligneCommande.prix_unitaire} DH</td>
                          </tr>
                        ))}
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
  </div>
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PreparationLogo;
