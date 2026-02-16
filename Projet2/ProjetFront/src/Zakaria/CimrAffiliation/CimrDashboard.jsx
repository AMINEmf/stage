import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    Chip,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
    Users,
    FileText,
    DollarSign,
    TrendingUp,
    Calendar,
    CheckCircle,
} from "lucide-react";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";

// Palette de couleurs professionnelle
const colors = {
    primary: '#2c767c',
    primaryLight: '#4db6ac',
    primaryDark: '#004d40',
    secondary: '#26a69a',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    hoverBg: '#f8fafc',
    progressBg: '#e2e8f0',
};

const CimrDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const { setTitle, clearActions } = useHeader();
    const { dynamicStyles } = useOpen();

    // Conserver pour compatibilité
    const theme = colors;

    useEffect(() => {
        setTitle("Dashboard CIMR");
        return () => {
            clearActions();
        };
    }, [setTitle, clearActions]);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://127.0.0.1:8000/api/cimr-declarations/dashboard-stats', {
                withCredentials: true
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Composant StatCard avec design moderne
    const StatCard = ({ title, value, icon: Icon, bgColor, textColor, iconBg }) => (
        <Card sx={{
            background: `linear-gradient(135deg, ${bgColor}10 0%, ${bgColor}05 100%)`,
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `1px solid ${bgColor}30`,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
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
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{
                            color: colors.textSecondary,
                            mb: 1.5,
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            lineHeight: 1.4,
                        }}>
                            {title}
                        </Typography>
                        <Typography sx={{
                            fontWeight: 700,
                            color: colors.primaryDark,
                            fontSize: { xs: '2rem', sm: '2.5rem' },
                            lineHeight: 1,
                        }}>
                            {loading ? '...' : value}
                        </Typography>
                    </Box>
                    <Box sx={{
                        backgroundColor: iconBg,
                        borderRadius: '16px',
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 8px 16px ${bgColor}25`
                    }}>
                        <Icon size={32} color={textColor} />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    // Couleurs par statut selon les spécifications
    const getStatusColor = (statut) => {
        const normalizedStatut = statut?.toUpperCase?.() || '';
        
        // ACTIVE/TERMINÉE → vert
        if (['ACTIF', 'ACTIVE', 'TERMINEE', 'TERMINÉE', 'PAYE', 'PAYÉ'].includes(normalizedStatut)) {
            return { bg: `${colors.success}20`, color: colors.success };
        }
        // EN_COURS → orange
        if (['EN_COURS', 'EN COURS', 'A_DECLARER', 'A DECLARER', 'À DÉCLARER'].includes(normalizedStatut)) {
            return { bg: `${colors.warning}20`, color: colors.warning };
        }
        // RESILIE/Refusée/Annulée → rouge
        if (['RESILIE', 'RÉSILIÉ', 'REFUSEE', 'REFUSÉE', 'ANNULEE', 'ANNULÉE', 'REFUSE', 'ANNULE'].includes(normalizedStatut)) {
            return { bg: `${colors.error}20`, color: colors.error };
        }
        // DECLARE → bleu info
        if (['DECLARE', 'DÉCLARÉ', 'DECLARÉ'].includes(normalizedStatut)) {
            return { bg: `${colors.info}20`, color: colors.info };
        }
        
        return { bg: '#f3f4f6', color: '#374151' };
    };

    const getStatusLabel = (statut) => {
        switch (statut?.toLowerCase()) {
            case 'a_declarer': return 'À Déclarer';
            case 'declare': return 'Déclaré';
            case 'paye': return 'Payé';
            case 'actif': return 'Actif';
            case 'en_cours': return 'En Cours';
            case 'resilie': return 'Résilié';
            case 'terminee': return 'Terminée';
            case 'refusee': return 'Refusée';
            case 'annulee': return 'Annulée';
            default: return statut;
        }
    };

    // Section de chargement
    if (loading || !stats) {
        return (
            <ThemeProvider theme={createTheme()}>
                <Box sx={{ ...dynamicStyles, backgroundColor: '#fafbfc' }}>
                    <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 12 }}>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            minHeight: '50vh'
                        }}>
                            <Typography sx={{ 
                                color: colors.textSecondary, 
                                fontSize: '1rem',
                                fontWeight: 500 
                            }}>
                                Chargement du dashboard...
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={createTheme()}>
            <Box sx={{ ...dynamicStyles, backgroundColor: '#fafbfc' }}>
                <Box component="main" sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3 },
                    mt: 12,
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 64px)'
                }}>
                    {/* En-tête de page */}
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ 
                            fontWeight: 700, 
                            color: colors.textPrimary, 
                            mb: 1,
                            fontSize: '1.5rem',
                            lineHeight: 1.3,
                        }}>
                            Dashboard CIMR
                        </Typography>
                        <Typography sx={{ 
                            color: colors.textSecondary,
                            fontSize: '0.875rem',
                        }}>
                            Vue d'ensemble des affiliations et déclarations CIMR
                        </Typography>
                    </Box>

                    {/* KPI Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Affiliations Actives"
                                value={stats.totalAffiliations}
                                icon={Users}
                                bgColor={theme.primary}
                                textColor={theme.primaryDark}
                                iconBg={`${theme.primary}15`}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Déclarations ce mois"
                                value={stats.declarationsThisMonth}
                                icon={FileText}
                                bgColor={theme.secondary}
                                textColor={theme.primaryDark}
                                iconBg={`${theme.secondary}15`}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Montant Total (MAD)"
                                value={parseFloat(stats.totalAmountThisMonth || 0).toFixed(2)}
                                icon={DollarSign}
                                bgColor={theme.success}
                                textColor={theme.primaryDark}
                                iconBg={`${theme.success}15`}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Taux d'Affiliation"
                                value={`${stats.totalAffiliations > 0 ? ((stats.declarationsThisMonth / stats.totalAffiliations) * 100).toFixed(1) : 0}%`}
                                icon={TrendingUp}
                                bgColor={theme.info}
                                textColor={theme.primaryDark}
                                iconBg={`${theme.info}15`}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {/* Section Dernières Affiliations */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{
                                borderRadius: '24px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                border: `1px solid ${colors.primary}20`,
                                height: '100%',
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{
                                            backgroundColor: `${colors.primary}15`,
                                            borderRadius: '12px',
                                            p: 1.5,
                                            mr: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Users size={24} color={colors.primary} />
                                        </Box>
                                        <Typography sx={{
                                            fontWeight: 700,
                                            color: colors.textPrimary,
                                            fontSize: '1.1rem'
                                        }}>
                                            Dernières Affiliations
                                        </Typography>
                                    </Box>

                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ 
                                                        fontWeight: 600, 
                                                        color: colors.textSecondary, 
                                                        border: 'none', 
                                                        pb: 2,
                                                        fontSize: '0.875rem',
                                                    }}>
                                                        Employé
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        fontWeight: 600, 
                                                        color: colors.textSecondary, 
                                                        border: 'none', 
                                                        pb: 2,
                                                        fontSize: '0.875rem',
                                                    }}>
                                                        Montant
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        fontWeight: 600, 
                                                        color: colors.textSecondary, 
                                                        border: 'none', 
                                                        pb: 2,
                                                        fontSize: '0.875rem',
                                                    }}>
                                                        Statut
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {stats.recentAffiliations.map((aff) => {
                                                    const statusStyle = getStatusColor(aff.statut);
                                                    return (
                                                        <TableRow
                                                            key={aff.id}
                                                            sx={{
                                                                '&:hover': { backgroundColor: colors.hoverBg },
                                                                '& td': { border: 'none', py: 2 }
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Typography sx={{ 
                                                                    color: colors.textPrimary, 
                                                                    fontWeight: 500, 
                                                                    fontSize: '0.875rem' 
                                                                }}>
                                                                    {aff.employe}
                                                                </Typography>
                                                                <Typography sx={{ 
                                                                    color: colors.textSecondary, 
                                                                    fontSize: '0.75rem' 
                                                                }}>
                                                                    {aff.matricule}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography sx={{ 
                                                                    color: colors.textPrimary, 
                                                                    fontWeight: 600, 
                                                                    fontSize: '0.875rem' 
                                                                }}>
                                                                    {parseFloat(aff.montant_cotisation || 0).toFixed(2)} MAD
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={getStatusLabel(aff.statut)}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: statusStyle.bg,
                                                                        color: statusStyle.color,
                                                                        fontWeight: 500,
                                                                        fontSize: '0.75rem',
                                                                        borderRadius: '8px',
                                                                    }}
                                                                />
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

                        {/* Section Dernières Déclarations */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{
                                borderRadius: '24px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                border: `1px solid ${colors.primary}20`,
                                height: '100%',
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{
                                            backgroundColor: `${colors.secondary}15`,
                                            borderRadius: '12px',
                                            p: 1.5,
                                            mr: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <FileText size={24} color={colors.secondary} />
                                        </Box>
                                        <Typography sx={{
                                            fontWeight: 700,
                                            color: colors.textPrimary,
                                            fontSize: '1.1rem'
                                        }}>
                                            Derniers Dossiers
                                        </Typography>
                                    </Box>

                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ 
                                                        fontWeight: 600, 
                                                        color: colors.textSecondary, 
                                                        border: 'none', 
                                                        pb: 2,
                                                        fontSize: '0.875rem',
                                                    }}>
                                                        Employé
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        fontWeight: 600, 
                                                        color: colors.textSecondary, 
                                                        border: 'none', 
                                                        pb: 2,
                                                        fontSize: '0.875rem',
                                                    }}>
                                                        Période
                                                    </TableCell>
                                                    <TableCell sx={{ 
                                                        fontWeight: 600, 
                                                        color: colors.textSecondary, 
                                                        border: 'none', 
                                                        pb: 2,
                                                        fontSize: '0.875rem',
                                                    }}>
                                                        Statut
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {stats.recentDeclarations.map((decl) => {
                                                    const statusStyle = getStatusColor(decl.statut);
                                                    return (
                                                        <TableRow
                                                            key={decl.id}
                                                            sx={{
                                                                '&:hover': { backgroundColor: colors.hoverBg },
                                                                '& td': { border: 'none', py: 2 }
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Typography sx={{ 
                                                                    color: colors.textPrimary, 
                                                                    fontWeight: 500, 
                                                                    fontSize: '0.875rem' 
                                                                }}>
                                                                    {decl.employe}
                                                                </Typography>
                                                                <Typography sx={{ 
                                                                    color: colors.textSecondary, 
                                                                    fontSize: '0.75rem' 
                                                                }}>
                                                                    {parseFloat(decl.montant_cimr_employeur || 0).toFixed(2)} MAD
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <Calendar size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                                                    <Typography sx={{ 
                                                                        color: colors.textSecondary, 
                                                                        fontSize: '0.875rem' 
                                                                    }}>
                                                                        {decl.mois}/{decl.annee}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={getStatusLabel(decl.statut)}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: statusStyle.bg,
                                                                        color: statusStyle.color,
                                                                        fontWeight: 500,
                                                                        fontSize: '0.75rem',
                                                                        borderRadius: '8px',
                                                                    }}
                                                                />
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

                        {/* Section Répartition des Statuts */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{
                                borderRadius: '24px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                border: `1px solid ${colors.primary}20`,
                                height: '100%',
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{
                                            backgroundColor: `${colors.info}15`,
                                            borderRadius: '12px',
                                            p: 1.5,
                                            mr: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <CheckCircle size={24} color={colors.info} />
                                        </Box>
                                        <Typography sx={{
                                            fontWeight: 700,
                                            color: colors.textPrimary,
                                            fontSize: '1.1rem'
                                        }}>
                                            Répartition des Statuts
                                        </Typography>
                                    </Box>

                                    {stats.statusBreakdown.map((status, index) => {
                                        const statusStyle = getStatusColor(status.statut);
                                        const total = stats.declarationsThisMonth || 1;
                                        const percentage = Math.min((status.count / total) * 100, 100);

                                        return (
                                            <Box key={index} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography sx={{
                                                        fontWeight: 500,
                                                        color: colors.textPrimary,
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {getStatusLabel(status.statut)}
                                                    </Typography>
                                                    <Typography sx={{
                                                        color: statusStyle.color,
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                    }}>
                                                        {status.count}
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={percentage}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: '6px',
                                                        backgroundColor: colors.progressBg,
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundColor: statusStyle.color,
                                                            borderRadius: '6px',
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default CimrDashboard;
