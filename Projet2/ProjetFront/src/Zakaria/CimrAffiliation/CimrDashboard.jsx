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
    Avatar,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
    Users,
    FileText,
    TrendingUp,
    Calendar,
    CheckCircle,
    Wallet,
    Activity,
    BarChart3,
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
    purple: '#9c27b0',
    pink: '#e91e63',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    hoverBg: '#f8fafc',
    progressBg: '#e2e8f0',
    cardBg: '#ffffff',
};

const CimrDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const { setTitle, clearActions } = useHeader();
    const { dynamicStyles } = useOpen();

    useEffect(() => {
        setTitle("Tableau de bord CIMR");
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

    // Formater les données pour le PieChart des statuts
    const getStatusPieData = () => {
        if (!stats?.statusBreakdown?.length) return [];
        return stats.statusBreakdown.map((item, index) => ({
            id: index,
            value: item.count,
            label: getStatusLabel(item.statut),
            color: getStatusChartColor(item.statut),
        }));
    };

    // Formater les données pour le BarChart mensuel
    const getMonthlyBarData = () => {
        if (!stats?.monthlyEvolution?.length) return { months: [], amounts: [] };

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

        return {
            months: stats.monthlyEvolution.map(m => `${monthNames[m.mois - 1]} ${m.annee}`),
            amounts: stats.monthlyEvolution.map(m => parseFloat(m.total || 0)),
        };
    };

    // Couleur pour les statuts dans les graphiques
    const getStatusChartColor = (statut) => {
        const normalizedStatut = statut?.toUpperCase?.() || '';
        if (['ACTIF', 'ACTIVE', 'TERMINEE', 'TERMINÉE', 'PAYE', 'PAYÉ'].includes(normalizedStatut)) {
            return colors.success;
        }
        if (['EN_COURS', 'EN COURS', 'A_DECLARER', 'A DECLARER', 'À DÉCLARER'].includes(normalizedStatut)) {
            return colors.warning;
        }
        if (['RESILIE', 'RÉSILIÉ', 'REFUSEE', 'REFUSÉE', 'ANNULEE', 'ANNULÉE'].includes(normalizedStatut)) {
            return colors.error;
        }
        if (['DECLARE', 'DÉCLARÉ', 'DECLARÉ'].includes(normalizedStatut)) {
            return colors.info;
        }
        return colors.textSecondary;
    };

    // Composant StatCard amélioré
    const StatCard = ({ title, value, subtitle, icon: Icon, bgGradient }) => (
        <Card sx={{
            background: bgGradient,
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
            },
        }}>
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{
                            color: 'rgba(255,255,255,0.85)',
                            mb: 1,
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            {title}
                        </Typography>
                        <Typography sx={{
                            fontWeight: 700,
                            color: '#fff',
                            fontSize: '2.5rem',
                            lineHeight: 1.1,
                            mb: 0.5,
                        }}>
                            {loading ? '...' : value}
                        </Typography>
                        {subtitle && (
                            <Typography sx={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.8rem',
                            }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '16px',
                        p: 2,
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Icon size={32} color="#fff" />
                    </Box>
                </Box>
            </CardContent>
            {/* Decorative circles */}
            <Box sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: -30,
                right: 30,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
            }} />
        </Card>
    );

    // Couleurs par statut
    const getStatusColor = (statut) => {
        const normalizedStatut = statut?.toUpperCase?.() || '';
        if (['ACTIF', 'ACTIVE', 'TERMINEE', 'TERMINÉE', 'PAYE', 'PAYÉ'].includes(normalizedStatut)) {
            return { bg: `${colors.success}20`, color: colors.success };
        }
        if (['EN_COURS', 'EN COURS', 'A_DECLARER', 'A DECLARER', 'À DÉCLARER'].includes(normalizedStatut)) {
            return { bg: `${colors.warning}20`, color: colors.warning };
        }
        if (['RESILIE', 'RÉSILIÉ', 'REFUSEE', 'REFUSÉE', 'ANNULEE', 'ANNULÉE'].includes(normalizedStatut)) {
            return { bg: `${colors.error}20`, color: colors.error };
        }
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
            case 'suspendu': return 'Suspendu';
            default: return statut;
        }
    };

    // Section de chargement
    if (loading || !stats) {
        return (
            <ThemeProvider theme={createTheme()}>
                <Box sx={{ ...dynamicStyles, backgroundColor: '#ffffff', minHeight: '100vh' }}>
                    <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 12 }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '50vh',
                            gap: 2
                        }}>
                            <Box sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                border: '3px solid',
                                borderColor: `${colors.primary}30`,
                                borderTopColor: colors.primary,
                                animation: 'spin 1s linear infinite',
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' },
                                },
                            }} />
                            <Typography sx={{
                                color: colors.textSecondary,
                                fontSize: '1rem',
                                fontWeight: 500
                            }}>
                                Chargement du tableau de bord...
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </ThemeProvider>
        );
    }

    const monthlyData = getMonthlyBarData();
    const pieData = getStatusPieData();

    // Calculs supplémentaires
    const avgCotisation = stats.totalAffiliations > 0
        ? (stats.totalAmountThisMonth / stats.totalAffiliations).toFixed(2)
        : 0;

    const growthRate = stats.monthlyEvolution?.length >= 2
        ? (((stats.monthlyEvolution[stats.monthlyEvolution.length - 1]?.total || 0) -
            (stats.monthlyEvolution[stats.monthlyEvolution.length - 2]?.total || 0)) /
            (stats.monthlyEvolution[stats.monthlyEvolution.length - 2]?.total || 1) * 100).toFixed(1)
        : 0;

    return (
        <ThemeProvider theme={createTheme()}>
            <Box sx={{ ...dynamicStyles, backgroundColor: '#ffffff', minHeight: '100vh' }}>
                <Box component="main" sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3, md: 4 },
                    mt: 10,
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 64px)',
                }}>
                    {/* En-tête */}
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{
                            fontWeight: 800,
                            color: colors.textPrimary,
                            fontSize: '1.75rem',
                            mb: 0.5,
                        }}>
                            Tableau de bord CIMR
                        </Typography>
                        <Typography sx={{
                            color: colors.textSecondary,
                            fontSize: '0.95rem',
                        }}>
                            Vue d'ensemble des affiliations et cotisations CIMR
                        </Typography>
                    </Box>

                    {/* KPI Cards - Ligne 1 */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="Affiliations Actives"
                                value={stats.totalAffiliations}
                                subtitle="Employés affiliés"
                                icon={Users}
                                bgGradient="linear-gradient(135deg, #2c767c 0%, #4db6ac 100%)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="Déclarations du Mois"
                                value={stats.declarationsThisMonth}
                                subtitle={`${new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`}
                                icon={FileText}
                                bgGradient="linear-gradient(135deg, #26a69a 0%, #00897b 100%)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="Montant Total"
                                value={`${parseFloat(stats.totalAmountThisMonth || 0).toLocaleString('fr-FR')} DH`}
                                subtitle="Cotisations ce mois"
                                icon={Wallet}
                                bgGradient="linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <StatCard
                                title="Moyenne/Affilié"
                                value={`${avgCotisation} DH`}
                                subtitle={growthRate >= 0 ? `+${growthRate}% vs mois précédent` : `${growthRate}% vs mois précédent`}
                                icon={TrendingUp}
                                bgGradient="linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)"
                            />
                        </Grid>
                    </Grid>

                    {/* Graphiques - Ligne 2 */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Graphique à barres - Évolution mensuelle */}
                        <Grid item xs={12} lg={8}>
                            <Card sx={{
                                borderRadius: '20px',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                height: '100%',
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{
                                            backgroundColor: `${colors.primary}15`,
                                            borderRadius: '12px',
                                            p: 1.5,
                                            mr: 2,
                                        }}>
                                            <BarChart3 size={24} color={colors.primary} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{
                                                fontWeight: 700,
                                                color: colors.textPrimary,
                                                fontSize: '1.1rem'
                                            }}>
                                                Évolution des Cotisations
                                            </Typography>
                                            <Typography sx={{
                                                color: colors.textSecondary,
                                                fontSize: '0.8rem'
                                            }}>
                                                Montants mensuels (DH)
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {monthlyData.months.length > 0 ? (
                                        <Box sx={{ height: 300, width: '100%' }}>
                                            <BarChart
                                                xAxis={[{
                                                    scaleType: 'band',
                                                    data: monthlyData.months,
                                                    tickLabelStyle: {
                                                        fontSize: 12,
                                                        fill: colors.textSecondary,
                                                    }
                                                }]}
                                                series={[{
                                                    data: monthlyData.amounts,
                                                    color: colors.primary,
                                                    label: 'Montant (DH)',
                                                }]}
                                                height={280}
                                                sx={{
                                                    '& .MuiChartsAxis-line': { stroke: colors.progressBg },
                                                    '& .MuiChartsAxis-tick': { stroke: colors.progressBg },
                                                }}
                                                margin={{ left: 70, right: 20, top: 20, bottom: 40 }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{
                                            height: 280,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '12px',
                                        }}>
                                            <Typography sx={{ color: colors.textSecondary }}>
                                                Aucune donnée disponible
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Graphique circulaire - Répartition des statuts */}
                        <Grid item xs={12} lg={4}>
                            <Card sx={{
                                borderRadius: '20px',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                height: '100%',
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{
                                            backgroundColor: `${colors.info}15`,
                                            borderRadius: '12px',
                                            p: 1.5,
                                            mr: 2,
                                        }}>
                                            <Activity size={24} color={colors.info} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{
                                                fontWeight: 700,
                                                color: colors.textPrimary,
                                                fontSize: '1.1rem'
                                            }}>
                                                Statuts Déclarations
                                            </Typography>
                                            <Typography sx={{
                                                color: colors.textSecondary,
                                                fontSize: '0.8rem'
                                            }}>
                                                Ce mois-ci
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {pieData.length > 0 ? (
                                        <Box sx={{ height: 280, display: 'flex', justifyContent: 'center' }}>
                                            <PieChart
                                                series={[{
                                                    data: pieData,
                                                    innerRadius: 50,
                                                    outerRadius: 100,
                                                    paddingAngle: 2,
                                                    cornerRadius: 5,
                                                    highlightScope: { faded: 'global', highlighted: 'item' },
                                                    arcLabel: (item) => `${item.value}`,
                                                    arcLabelMinAngle: 30,
                                                }]}
                                                sx={{
                                                    [`& .${pieArcLabelClasses.root}`]: {
                                                        fill: '#fff',
                                                        fontWeight: 'bold',
                                                        fontSize: 14,
                                                    },
                                                }}
                                                width={280}
                                                height={280}
                                                slotProps={{
                                                    legend: {
                                                        direction: 'row',
                                                        position: { vertical: 'bottom', horizontal: 'middle' },
                                                        padding: 0,
                                                        itemMarkWidth: 10,
                                                        itemMarkHeight: 10,
                                                        markGap: 5,
                                                        itemGap: 10,
                                                        labelStyle: {
                                                            fontSize: 11,
                                                            fill: colors.textSecondary,
                                                        },
                                                    },
                                                }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{
                                            height: 280,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '12px',
                                        }}>
                                            <Activity size={48} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
                                            <Typography sx={{ color: colors.textSecondary }}>
                                                Aucune déclaration ce mois
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Tableaux - Ligne 3 */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Dernières Affiliations */}
                        <Grid item xs={12} lg={6}>
                            <Card sx={{
                                borderRadius: '20px',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                height: '100%',
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{
                                            backgroundColor: `${colors.primary}15`,
                                            borderRadius: '12px',
                                            p: 1.5,
                                            mr: 2,
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
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
                                                        Employé
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
                                                        Cotisation
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
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
                                                                '& td': { border: 'none', py: 1.5 }
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Avatar sx={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        backgroundColor: `${colors.primary}20`,
                                                                        color: colors.primary,
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 600,
                                                                    }}>
                                                                        {aff.employe?.charAt(0)?.toUpperCase() || '?'}
                                                                    </Avatar>
                                                                    <Box>
                                                                        <Typography sx={{ color: colors.textPrimary, fontWeight: 500, fontSize: '0.875rem' }}>
                                                                            {aff.employe}
                                                                        </Typography>
                                                                        <Typography sx={{ color: colors.textSecondary, fontSize: '0.75rem' }}>
                                                                            {aff.matricule}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography sx={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                                    {parseFloat(aff.montant_cotisation || 0).toLocaleString('fr-FR')} DH
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={getStatusLabel(aff.statut)}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: statusStyle.bg,
                                                                        color: statusStyle.color,
                                                                        fontWeight: 600,
                                                                        fontSize: '0.7rem',
                                                                        borderRadius: '6px',
                                                                        height: 24,
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

                        {/* Dernières Déclarations */}
                        <Grid item xs={12} lg={6}>
                            <Card sx={{
                                borderRadius: '20px',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                height: '100%',
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{
                                            backgroundColor: `${colors.secondary}15`,
                                            borderRadius: '12px',
                                            p: 1.5,
                                            mr: 2,
                                        }}>
                                            <FileText size={24} color={colors.secondary} />
                                        </Box>
                                        <Typography sx={{
                                            fontWeight: 700,
                                            color: colors.textPrimary,
                                            fontSize: '1.1rem'
                                        }}>
                                            Dernières Déclarations
                                        </Typography>
                                    </Box>

                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
                                                        Employé
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
                                                        Période
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: colors.textSecondary, border: 'none', pb: 2, fontSize: '0.8rem' }}>
                                                        Statut
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {stats.recentDeclarations.map((decl) => {
                                                    const statusStyle = getStatusColor(decl.statut);
                                                    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                                                    return (
                                                        <TableRow
                                                            key={decl.id}
                                                            sx={{
                                                                '&:hover': { backgroundColor: colors.hoverBg },
                                                                '& td': { border: 'none', py: 1.5 }
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Avatar sx={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        backgroundColor: `${colors.secondary}20`,
                                                                        color: colors.secondary,
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 600,
                                                                    }}>
                                                                        {decl.employe?.charAt(0)?.toUpperCase() || '?'}
                                                                    </Avatar>
                                                                    <Box>
                                                                        <Typography sx={{ color: colors.textPrimary, fontWeight: 500, fontSize: '0.875rem' }}>
                                                                            {decl.employe}
                                                                        </Typography>
                                                                        <Typography sx={{ color: colors.textSecondary, fontSize: '0.75rem' }}>
                                                                            {parseFloat(decl.montant_cimr_employeur || 0).toLocaleString('fr-FR')} DH
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    backgroundColor: '#f1f5f9',
                                                                    px: 1.5,
                                                                    py: 0.5,
                                                                    borderRadius: '8px',
                                                                }}>
                                                                    <Calendar size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                                                    <Typography sx={{ color: colors.textPrimary, fontSize: '0.8rem', fontWeight: 500 }}>
                                                                        {monthNames[decl.mois - 1]} {decl.annee}
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
                                                                        fontWeight: 600,
                                                                        fontSize: '0.7rem',
                                                                        borderRadius: '6px',
                                                                        height: 24,
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
                    </Grid>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default CimrDashboard;
