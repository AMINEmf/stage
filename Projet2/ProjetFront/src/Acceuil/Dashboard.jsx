import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  Typography, 
  ThemeProvider, 
  createTheme,
  Box,
  Grid,
  Toolbar,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import WomanIcon from "@mui/icons-material/Woman";
import ManIcon from "@mui/icons-material/Man";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ScheduleIcon from "@mui/icons-material/Schedule";

const Dashboard = () => {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [femmes, setFemmes] = useState(0);
  const [hommes, setHommes] = useState(0);
  const [departements, setDepartements] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Couleurs du thème de l'application
  const theme = {
    primary: '#00695c', // Vert teal principal de la barre latérale
    primaryLight: '#4db6ac',
    primaryDark: '#004d40',
    secondary: '#26a69a',
    accent: '#00bcd4',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  };
  
  // Date actuelle
  const today = new Date();
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  // Données simulées pour l'aperçu des activités
  const recentActivities = [
    { id: 1, employee: "Marie Dupont", action: "Arrivée", time: "08:30", department: "RH", avatar: "MD" },
    { id: 2, employee: "Jean Martin", action: "Congé approuvé", time: "09:15", department: "IT", avatar: "JM" },
    { id: 3, employee: "Sophie Bernard", action: "Nouveau recrutement", time: "10:00", department: "Marketing", avatar: "SB" },
    { id: 4, employee: "Pierre Durand", action: "Formation complétée", time: "11:30", department: "Ventes", avatar: "PD" },
    { id: 5, employee: "Claire Moreau", action: "Évaluation soumise", time: "14:20", department: "Finance", avatar: "CM" }
  ];

  const departmentStats = [
    { name: "Ressources Humaines", employees: 12, percentage: 15, color: theme.primary },
    { name: "Informatique", employees: 25, percentage: 31, color: theme.secondary },
    { name: "Marketing", employees: 18, percentage: 22, color: theme.accent },
    { name: "Ventes", employees: 20, percentage: 25, color: theme.primaryLight },
    { name: "Finance", employees: 6, percentage: 7, color: theme.primaryDark }
  ];

  // Fonction pour récupérer les statistiques du dashboard
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/employes/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setTotalEmployees(data.totalEmployees);
        setFemmes(data.femmes);
        setHommes(data.hommes);
      } else {
        console.error('Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalDepartements = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/total-departemet');
      const data = await response.json();
      setDepartements(data.totalDepartements);
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchTotalDepartements();
  }, []);

  const actualites = [
    {
      type: "info",
      title: "Nouvelle politique congés",
      color: theme.info
    },
    {
      type: "warning", 
      title: "Formation obligatoire",
      color: theme.warning
    },
    {
      type: "success",
      title: "Objectifs atteints",
      color: theme.success
    },
    {
      type: "urgent",
      title: "Demandes en attente",
      color: theme.error
    }
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircleIcon sx={{ color: theme.success, fontSize: 20 }} />;
      case 'warning': return <WarningIcon sx={{ color: theme.warning, fontSize: 20 }} />;
      case 'info': return <InfoIcon sx={{ color: theme.info, fontSize: 20 }} />;
      case 'urgent': return <NotificationsIcon sx={{ color: theme.error, fontSize: 20 }} />;
      default: return <InfoIcon sx={{ color: theme.info, fontSize: 20 }} />;
    }
  };

  const getActionColor = (action) => {
    switch(action.toLowerCase()) {
      case 'arrivée': return { bg: `${theme.success}20`, color: theme.success };
      case 'congé approuvé': return { bg: `${theme.info}20`, color: theme.info };
      case 'nouveau recrutement': return { bg: `${theme.primary}20`, color: theme.primary };
      case 'formation complétée': return { bg: `${theme.warning}20`, color: theme.warning };
      case 'évaluation soumise': return { bg: `${theme.secondary}20`, color: theme.secondary };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  
  // Composant pour les cartes statistiques améliorées
  const StatCard = ({ title, value, icon: Icon, bgColor, textColor, iconBg, trend }) => (
    <Card sx={{ 
      background: `linear-gradient(135deg, ${bgColor}08 0%, ${bgColor}04 100%)`,
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: `1px solid ${bgColor}15`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': { 
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)' 
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${bgColor}, ${bgColor}80)`,
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ 
              color: '#64748b', 
              mb: 1.5,
              fontWeight: 500,
              fontSize: '0.875rem'
            }}>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h2" sx={{ 
                fontWeight: 700, 
                color: textColor,
                fontSize: { xs: '2rem', sm: '2.5rem' },
                lineHeight: 1
              }}>
                {loading ? '...' : value}
              </Typography>
              {trend && (
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                  {trend > 0 ? (
                    <TrendingUpIcon sx={{ color: theme.success, fontSize: 18 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: theme.error, fontSize: 18 }} />
                  )}
                  <Typography variant="body2" sx={{ 
                    color: trend > 0 ? theme.success : theme.error,
                    fontWeight: 600,
                    ml: 0.5,
                    fontSize: '0.75rem'
                  }}>
                    {Math.abs(trend)}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Box sx={{ 
            backgroundColor: iconBg,
            borderRadius: '16px',
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 16px ${bgColor}20`
          }}>
            <Icon sx={{ fontSize: 32, color: textColor }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{
        position: 'absolute',
        top: '0px',
        left: '220px',
        width: '90%',
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
      }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          
          <Grid container spacing={4}>
            {/* Section principale */}
            <Grid item xs={12} md={9}>
              {/* Cartes statistiques améliorées */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total employés"
                    value={totalEmployees}
                    icon={PeopleAltIcon}
                    bgColor={theme.primary}
                    textColor={theme.primaryDark}
                    iconBg={`${theme.primary}15`}
                    trend={5.2}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Nombre de femmes"
                    value={femmes}
                    icon={WomanIcon}
                    bgColor={theme.secondary}
                    textColor={theme.primaryDark}
                    iconBg={`${theme.secondary}15`}
                    trend={2.1}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Nombre d'hommes"
                    value={hommes}
                    icon={ManIcon}
                    bgColor={theme.accent}
                    textColor={theme.primaryDark}
                    iconBg={`${theme.accent}15`}
                    trend={-1.3}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Départements"
                    value={departements}
                    icon={BusinessIcon}
                    bgColor={theme.primaryLight}
                    textColor={theme.primaryDark}
                    iconBg={`${theme.primaryLight}15`}
                  />
                </Grid>
              </Grid>

              {/* Aperçu des activités amélioré */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: `1px solid ${theme.primary}20`
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                          backgroundColor: `${theme.primary}15`,
                          borderRadius: 2,
                          p: 1.5,
                          mr: 2
                        }}>
                          <PersonAddIcon sx={{ color: theme.primary, fontSize: 24 }} />
                        </Box>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700, 
                          color: '#1e293b',
                          fontSize: '1.25rem'
                        }}>
                          Activités récentes
                        </Typography>
                      </Box>
                      
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none', pb: 2 }}>
                                Employé
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none', pb: 2 }}>
                                Action
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none', pb: 2 }}>
                                Heure
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none', pb: 2 }}>
                                Département
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recentActivities.map((activity) => {
                              const actionStyle = getActionColor(activity.action);
                              return (
                                <TableRow 
                                  key={activity.id} 
                                  sx={{ 
                                    '&:hover': { backgroundColor: '#f8fafc' },
                                    '& td': { border: 'none', py: 2 }
                                  }}
                                >
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Avatar sx={{ 
                                        width: 32, 
                                        height: 32, 
                                        fontSize: '0.75rem',
                                        backgroundColor: theme.primary,
                                        mr: 1.5
                                      }}>
                                        {activity.avatar}
                                      </Avatar>
                                      <Typography sx={{ 
                                        color: '#1e293b', 
                                        fontWeight: 500,
                                        fontSize: '0.875rem'
                                      }}>
                                        {activity.employee}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={activity.action} 
                                      size="small" 
                                      sx={{ 
                                        backgroundColor: actionStyle.bg,
                                        color: actionStyle.color,
                                        fontWeight: 500,
                                        fontSize: '0.75rem'
                                      }} 
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <ScheduleIcon sx={{ fontSize: 16, color: '#64748b', mr: 0.5 }} />
                                      <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                        {activity.time}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                      {activity.department}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: `1px solid ${theme.primary}20`
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                          backgroundColor: `${theme.secondary}15`,
                          borderRadius: 2,
                          p: 1.5,
                          mr: 2
                        }}>
                          <BusinessIcon sx={{ color: theme.secondary, fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          color: '#1e293b',
                          fontSize: '1.1rem'
                        }}>
                          Départements
                        </Typography>
                      </Box>
                      
                      {departmentStats.map((dept, index) => (
                        <Box key={index} sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500, 
                              color: '#1e293b',
                              fontSize: '0.875rem'
                            }}>
                              {dept.name}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: '#64748b',
                              fontSize: '0.875rem'
                            }}>
                              {dept.employees}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={dept.percentage}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: dept.color,
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Section droite - Calendrier et actualités */}
            <Grid item xs={12} md={3}>
              {/* Calendrier d'aujourd'hui */}
              <Card sx={{ 
                mb: 3, 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.primary}20`
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      backgroundColor: `${theme.primary}15`,
                      borderRadius: 2,
                      p: 1,
                      mr: 1.5
                    }}>
                      <CalendarTodayIcon sx={{ color: theme.primary, fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      Aujourd'hui
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h1" sx={{ 
                      fontWeight: 800, 
                      color: theme.primary,
                      fontSize: '3rem',
                      lineHeight: 1
                    }}>
                      {today.getDate()}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
                      {today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#94a3b8', 
                      mt: 1, 
                      textTransform: 'capitalize' 
                    }}>
                      {today.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </Typography>
                  </Box>
                  
                  {/* Statistiques du jour */}
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Présents
                      </Typography>
                      <Chip 
                        label="76" 
                        size="small" 
                        sx={{ 
                          backgroundColor: theme.success, 
                          color: '#fff', 
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }} 
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Absents
                      </Typography>
                      <Chip 
                        label="3" 
                        size="small" 
                        sx={{ 
                          backgroundColor: theme.error, 
                          color: '#fff', 
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }} 
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                        En congé
                      </Typography>
                      <Chip 
                        label="2" 
                        size="small" 
                        sx={{ 
                          backgroundColor: theme.warning, 
                          color: '#fff', 
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }} 
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Fiche d'actualité */}
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.primary}20`
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#1e293b',
                      mb: 3,
                      textAlign: 'center',
                      fontSize: '1.1rem'
                    }}
                  >
                    Actualités RH
                  </Typography>
                  
                  <Box>
                    {actualites.map((item, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          mb: 2,
                          p: 2.5,
                          backgroundColor: '#ffffff',
                          borderRadius: 2,
                          border: `2px solid ${item.color}15`,
                          borderLeft: `4px solid ${item.color}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          {getIcon(item.type)}
                          <Box sx={{ ml: 1.5, flex: 1 }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600, 
                                color: '#1e293b', 
                                fontSize: '0.9rem',
                                lineHeight: 1.4
                              }}
                            >
                              {item.title}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;