// export default Navigation;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import MuiDrawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Container from "@mui/material/Container";
import MenuIcon from "@mui/icons-material/Menu";
import {
  useTheme,
  ListItemButton,
  Collapse,
} from "@mui/material";
import {   InputBase,Menu } from "@mui/material";
import {  alpha } from "@mui/material/styles";



import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";




import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ListIcon from '@mui/icons-material/List';
import NotificationsIcon from "@mui/icons-material/Notifications";
import { styled } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import { Link } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import TimeToLeaveIcon from "@mui/icons-material/TimeToLeave";
import MuiAppBar from "@mui/material/AppBar";
import Swal from "sweetalert2";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import StoreIcon from "@mui/icons-material/Store";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DescriptionIcon from "@mui/icons-material/Description";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ReportTwoToneIcon from '@mui/icons-material/ReportTwoTone';
import AttachMoneyTwoToneIcon from '@mui/icons-material/AttachMoneyTwoTone';
import AccountBalanceTwoToneIcon from '@mui/icons-material/AccountBalanceTwoTone';
import MoreVertIcon from "@mui/icons-material/MoreVert";



import HomeIcon from "@mui/icons-material/Home";
import EventNoteIcon from "@mui/icons-material/EventNote";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import GavelIcon from "@mui/icons-material/Gavel";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import FunctionsIcon from "@mui/icons-material/Functions";
import SettingsIcon from "@mui/icons-material/Settings";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AlarmIcon from "@mui/icons-material/Alarm";
import { useOpen } from "./OpenProvider";


import { useHeader } from "./HeaderContext";


import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableViewIcon from "@mui/icons-material/TableView";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";



// const drawerWidth = "14%";
const drawerWidth = "13%";


const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
   // <--------------------------- Couleur de Appbar ----------------------------------->
  backgroundColor: "#f9fafb",
  boxShadow:"0 0 10px rgba(0,0,0,0.1)",

  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth})`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));



const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.black, 0.1),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: "400px",
  },


}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color:"#2c3e50"
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "#2c3e50",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
  },
}));

const StyledMenuItem = styled(ListItem)(({ theme }) => ({
  padding: "8px 16px",
  marginBottom: "2px",
  borderLeft: "4px solid transparent",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderLeft: "4px solid #ffffff",
  },
  "&.submenu-item": {
    paddingLeft: "32px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderLeft: "2px solid transparent",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.08)",
      borderLeft: "2px solid #ffffff",
    },
  },
}));


const SubMenuItem = styled(ListItem)(({ theme }) => ({
  paddingLeft: theme.spacing(6),
  paddingTop: theme.spacing(0.8),
  paddingBottom: theme.spacing(0.8),
  marginBottom: "1px",
  backgroundColor: "rgba(255, 255, 255, 0.08)",
  borderLeft: "3px solid rgba(255, 255, 255, 0.2)",
  transition: "all 0.2s ease",
  color: "#e8f4f8",
  
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderLeft: "3px solid #ffffff",
    transform: "translateX(2px)",
  },
  
  "& .MuiListItemIcon-root": {
    color: "#b8dce5",
    minWidth: "36px",
  },
  
  "& .MuiListItemText-root": {
    "& .MuiListItemText-primary": {
      fontSize: "0.875rem",
      fontWeight: 400,
    }
  }
}));

const MainMenuItem = styled(ListItem)(({ theme }) => ({
  padding: "12px 16px",
  marginBottom: "4px",
  borderRadius: "0 25px 25px 0",
  marginRight: "8px",
  transition: "all 0.3s ease",
  color: "#ffffff",
  
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: "translateX(4px)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
  
  "& .MuiListItemIcon-root": {
    color: "#ffffff",
    minWidth: "40px",
  },
  
  "& .MuiListItemText-root": {
    "& .MuiListItemText-primary": {
      fontSize: "0.95rem",
      fontWeight: 500,
    }
  }
}));


// Style de deconnection 

const LogoutButton = styled(ListItem)(({ theme }) => ({
  position: "sticky",
  bottom: 0,
  marginTop: "auto",
  padding: "16px 16px",
  backgroundColor: "rgba(255, 255, 255, 0.08)",

  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  transition: "all 0.3s ease",
  cursor: "pointer",
  
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderLeft: "4px solid #ff8a80",
  },
  
  "& .MuiListItemIcon-root": {
    color: "rgba(255, 255, 255, 0.7)",
    minWidth: "40px",
    transition: "all 0.3s ease",
  },
  
  "& .MuiListItemText-root": {
    "& .MuiListItemText-primary": {
      color: "rgba(255, 255, 255, 0.8)",
      fontWeight: 500,
      fontSize: "0.95rem",
    }
  },
  
  "&:hover .MuiListItemIcon-root": {
    color: "#ff8a80",
    transform: "translateX(4px)",
  },
  
  "&:hover .MuiListItemText-primary": {
    color: "#ff8a80",
  }
}));



// Style de Menu 
const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: 200,
    borderRadius: 12,
    border: '1px solid #e0e0e0',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    padding: '8px',
    
    '& .MuiMenuItem-root': {
      padding: '12px 16px',
      gap: '12px',
      borderRadius: 8,
      margin: '4px 0',
      transition: 'all 0.2s ease',
      fontWeight: 500,
      
      '&:hover': {
        backgroundColor: '#f5f5f5',
        transform: 'translateX(4px)',
      },
      
      '& .MuiSvgIcon-root': {
        fontSize: 20,
        color: '#666',
        transition: 'color 0.2s ease',
      },
      
      '&:hover .MuiSvgIcon-root': {
        color: '#37736f',
      }
    }
  }
}));















const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "fixed",
    height: "100vh",
    minHeight: "100vh",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    backgroundColor: "#2c767c",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),

      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const defaultTheme = createTheme();

const Navigation = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [isNavOpen, setIsNavOpen] = useState(false);
  // const [open, setOpen] = React.useState(true);
  const { open, toggleOpen } = useOpen();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(false);
  const [isPlanificationOpen, setIsPlanificationOpen] = useState(false);
  const [isPlanificationPaieOpen, setIsPlanificationPaieOpen] = useState(false);
  const [isTraitementPaieOpen, setIsTraitementPaieOpen] = useState(false);
  const [isCongeOpen, setIsCongeOpen] = useState(false);
  const [isSocieteOpen, setIsSocieteOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);




  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [submenuOpenvente, setSubmenuOpenvente] = useState(false);
  const [submenuOpenachat, setSubmenuOpenachat] = useState(false);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };


  const toggleSubmenu = (opt) => {

    if (opt === 'finance') {
      setSubmenuOpen(!submenuOpen);
    }
    if (opt === 'vente') {
      setSubmenuOpenvente(!submenuOpenvente);

    }
    if (opt === 'achat') {
      setSubmenuOpenachat(!submenuOpenachat);
    }
  };
  const handleCommandsClick = () => {
    setIsCommandsOpen(!isCommandsOpen);
  };


  const handleEmployeesClick = () => {
    setIsEmployeesOpen(!isEmployeesOpen);
  };

  const handlePlanificationClick = () => {
    setIsPlanificationOpen(!isPlanificationOpen);
  };

  const handlePlanificationPaieClick = () => {
    setIsPlanificationPaieOpen(!isPlanificationPaieOpen);
  };

  const handleTraitementPaieClick = () => {
    setIsTraitementPaieOpen(!isTraitementPaieOpen);
  };


  const handleTraitementCongeClick = () => {
    setIsCongeOpen(!isCongeOpen);
  };


  const handleTraitementSocieteClick = () => {
    setIsSocieteOpen(!isSocieteOpen);
  };

 
  const handleThemeClick = () => {
    setIsThemeOpen(!isThemeOpen);
  };
  


  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const token = localStorage.getItem("API_TOKEN");
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const { logout } = useAuth();
  const [openDrawer, setOpenDrawer] = useState(false);
  const handleOptionChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedOption(selectedValue);

    if (selectedValue === "charging") {
      navigate("/chargingCommand");
    } else if (selectedValue === "preparing") {
      navigate("/preparingCommand");
    } else if (selectedValue === "list") {
      navigate("/commandes"); //
    } else if (selectedValue === "details") {
      navigate("/details");
    } else if (selectedValue === "detailpreparations") {
      navigate("/detailpreparations");
    }
    else if (selectedValue === "preparationlogo") {
      navigate("/preparationlogo");
    }
  };


  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);



  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const response = await axios.get("http://localhost:8000/api/user", {
  //         withCredentials: true,
  //       });
  //       setUser(response.data);
  //       console.log(response.data);
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //     }
  //   };

  //   fetchUserData();
  // }, []);

  // useEffect(() => {
  //   const fetchUsersData = async () => {
  //     try {
  //       const response = await axios.get("http://localhost:8000/api/users", {
  //         withCredentials: true,
  //       });
  //       setUsers(response.data);
  //       console.log(response.data);
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //     }
  //   };

  //   fetchUsersData();
  // }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/user", {
          withCredentials: true,
        });
        if (response.data && response.data.length > 0) {
          setUser(response.data);
          const permissionsData = response.data[0].roles[0].permissions;

          // Récupérer les noms des permissions
          const permissionNames = permissionsData.map(
            (permission) => permission.name
          );

          // Mettre à jour l'état des permissions
          setPermissions(permissionNames);
          console.log(permissionNames);
          console.log(response.data);
        } else {
          console.error("Empty user data in response:", response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []); // Dépendance vide pour que ce useEffect s'exécute une seule fois après le montage initial


  const MyListItemButton = styled(ListItemButton)(({ theme }) => ({
    minHeight: 48,
    justifyContent: "center",
    px: 2.5,
  }));

  const handleLogoutClick = async () => {
    try {
      // Logout logic
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred during logout.",
      });
    }
  };

  const toggleDrawer = () => {
    // setOpen(!open);
    toggleOpen();
  };

  const { title, searchQuery, setSearchQuery, onPrint, onExportPDF, onExportExcel } = useHeader();

  return (


    
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{
        marginLeft: "-20px",
        marginTop: '-20px',
        maxHeight: '1400px',
        overflowY: 'auto',
        scrollbarColor: "#2c767c #e0e0e0" /* Scrollbar colors for Firefox */,
        "&::-webkit-scrollbar": {
          width: "8px" /* Adjust width as needed */,
          cursor: "pointer",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#2c767c",
          cursor: "pointer",
        },
        "&::-webkit-scrollbar-track": {
            backgroundColor: "#2c767c",
            cursor: "pointer",
          },
      }}>
        <CssBaseline />
        


        <AppBar position="absolute" open={open} className="beige-appbar">
          <Toolbar
            sx={{
              pr: "24px",

            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),

              }}
            >
              <MenuIcon />
            </IconButton>


            {/* <Typography 
              component="h1"
              variant="h6"
              // color="inherit"
              color="#2c3e50"

              noWrap
              sx={{ flexGrow: 1, }}
            >   */}



            <Typography 
  component="h1"
  variant="h6"
  noWrap
  sx={{ 
    flexGrow: 1,
    fontSize: "22px", 
    fontWeight: 700, 
    color: "#2c3e50", 
    letterSpacing: "-0.025em" 
  }}
>
              {title}
            </Typography>





 
  

            <Box sx={{ display: "flex", marginRight:'-1%' }}>
            <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Recherche globale..."
              inputProps={{ "aria-label": "search" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* Icône ⋮ à l'intérieur de la barre */}
            <IconButton color="#2c3e50" onClick={handleMenuOpen} size="small" style={{ marginLeft:'32%'}}>
              <MoreVertIcon />
            </IconButton>
          </Search>

          <StyledMenu
  anchorEl={anchorEl}
  open={openMenu}
  onClose={handleMenuClose}
>
  <MenuItem onClick={() => { handleMenuClose(); onPrint && onPrint(); }} disabled={!onPrint}>
    <PrintIcon /> Imprimer le document
  </MenuItem>
  <MenuItem onClick={() => { handleMenuClose(); onExportPDF && onExportPDF(); }} disabled={!onExportPDF}>
    <PictureAsPdfIcon /> Générer fichier PDF
  </MenuItem>
  <MenuItem onClick={() => { handleMenuClose(); onExportExcel && onExportExcel(); }} disabled={!onExportExcel}>
  <FontAwesomeIcon icon={faFileExcel} style={{ fontSize: "17px", color: "grey" , marginBottom:'3px'}} /> Exporter vers Excel
  </MenuItem>
  
</StyledMenu>





          {/* Icônes à côté */}
          {/* <IconButton color="inherit">
            <PrintIcon />
          </IconButton>
          <IconButton color="inherit">
            <PictureAsPdfIcon />
          </IconButton>
          <IconButton color="inherit">
            <TableViewIcon />
          </IconButton> */}

        </Box>




            <IconButton color="inherit">
              <Badge color="secondary">
                {user && (
                  <ListItem button style={{ color: "#2c3e50" }}>
                    <ListItemIcon style={{ color: '#2c3e50' }}>
                      <Avatar
                        alt={user[0].name}
                        src={user[0].photo}
                        style={{ width: "40px", height: "40px", }}
                      />
                    </ListItemIcon>
                    {/* <ListItemText primary={`${user[0].name}`} />{" "} */}
                  </ListItem>
                )}
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        
        <Drawer variant="permanent" open={open}>
          {/* <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              backgroundColor: '#2c767c',  
              px: [1],
              height:'71px',
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar> */}
          <Divider />
          <List style={{ backgroundColor: '#2c767c', height: '1307px' }}>
            <Toolbar
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                backgroundColor: '#2c767c',
                px: [1],
                height: '71px',
              }}
            >
              <IconButton onClick={toggleDrawer}>
                <ChevronLeftIcon />
              </IconButton>
            </Toolbar>
            {user && (
              <ListItem button style={{ color: "white" }}>
                {/*<ListItemIcon  style={{color:'white'}}>*/}
                {/*  <Avatar*/}
                {/*    alt={user.name}*/}
                {/*    src={user.photo}*/}
                {/*    style={{ width: "40px", height: "40px" }}*/}
                {/*  />*/}
                {/*</ListItemIcon>*/}
                <ListItemText primary={``} />
              </ListItem>
            )}
            <ListItem button component={Link} to="/" style={{ color: "white" }}     sx={{ "& .MuiListItemIcon-root": { minWidth: 56 } }}
            >
              <ListItemIcon style={{ color: 'white' }}>
                <HomeIcon style={{ fontSize: "1.6rem", color: "white" }} />

              </ListItemIcon>
              <ListItemText primary="Accueil" />
            </ListItem>
           








{/*-------------------------------- Menu Gestion des Employés -------------------------------------- */}


  <ListItem
    button
    onClick={handleEmployeesClick}
    sx={{ "& .MuiListItemIcon-root": { minWidth: 56 } }}
    style={{ color: "white", display: "flex" }}
  >
    <ListItemIcon >
    <PeopleIcon style={{ fontSize: "1.6rem", color: "white" }} />
    </ListItemIcon>
    <ListItemText primary="Gestion employés" />
    {isEmployeesOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
  </ListItem>


<Collapse in={isEmployeesOpen} timeout="auto" unmountOnExit>
  <List component="div" disablePadding>

    {permissions.includes("view_all_employes") && (
    <SubMenuItem button component={Link} to="/employes">
      <ListItemIcon>
        <ListIcon />
      </ListItemIcon>
      <ListItemText primary="Gestion des Employés" />
    </SubMenuItem>
    )}
    
   

    {permissions.includes("view_all_employee_histories") && (
      <SubMenuItem button component={Link} to="/emphistorique">
        <ListItemIcon>
          <LocalShippingIcon />
        </ListItemIcon>
        <ListItemText primary="Historique" />
      </SubMenuItem>
    )}

    
  </List>
</Collapse>










{/*-------------------------------- MEnu Planification  -------------------------------------- */}









{/*-------------------------------- MEnu Traitement Paie  -------------------------------------- */}



{/*-------------------------------- MEnu Société  -------------------------------------- */}
  <ListItem
    button
    style={{ color: "white", display: "flex" }}
    sx={{ "& .MuiListItemIcon-root": { minWidth: 56 } }}
    onClick={handleTraitementSocieteClick}
  >
    <ListItemIcon style={{ color: 'white' }}>
      <BusinessIcon style={{ fontSize: "1.6rem", color: "white" }} />
    </ListItemIcon>
    <ListItemText primary="Société" />
    {isTraitementPaieOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
  </ListItem>
  
<Collapse in={isSocieteOpen} timeout="auto" unmountOnExit>
  <List component="div" disablePadding>
    {permissions.includes("view_all_societes") && (
      <SubMenuItem button component={Link} to="/societes">
        <ListItemIcon style={{ color: 'white' }}>
          <ListIcon />
        </ListItemIcon>
        <ListItemText primary="Société" />
      </SubMenuItem>
    )}
    
  
  </List>
</Collapse>


          
 <ListItem
                button
                component={Link}
                to="/users"
                style={{ color: "white" }}
              >
                <ListItemIcon style={{ color: 'white' }}>
                  <StarHalfIcon />
                </ListItemIcon>
                <ListItemText primary="Users" />
              </ListItem>


















{/*--------------------------------   -------------------------------------- */}










        
         
           
          </List>

          <LogoutButton
  button
  onClick={() => {
    handleLogoutClick();
    logout();
  }}
>
  <ListItemIcon>
    <ExitToAppIcon  />
  </ListItemIcon>
  <ListItemText primary="Se déconnecter" />
</LogoutButton>




        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default Navigation;