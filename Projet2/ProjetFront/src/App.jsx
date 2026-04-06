import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css'
import './Zakaria/Style.css'
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navigation from './Acceuil/Navigation';

import Dashboard from './Acceuil/Dashboard';
import DepartementManager from './Zakaria/Employe/DepartementManager';
import DepartementManager2 from './Zakaria/Employe/DepartementManager2';
import CimrManager from './Zakaria/CimrAffiliation/CimrManager';
import CimrDashboard from './Zakaria/CimrAffiliation/CimrDashboard';
import CimrDeclarationManager from './Zakaria/CimrDeclaration/CimrDeclarationManager';
import ConflitManager from './Zakaria/Conflits/ConflitManager';
import SanctionManager from './Zakaria/Sanctions/SanctionManager';
import Users from './Zakaria/Users/Users';

// Mutuelle/Assurance imports
import AffiliationMutuelleManagerSimple from './Zakaria/Mutuelle/AffiliationMutuelle/AffiliationMutuelleManagerSimple';
import MutuelleDashboard from './Zakaria/Mutuelle/MutuelleDashboard/MutuelleDashboard';
import DossierMutuelle from './Zakaria/Mutuelle/MutuelleDossier/DossierMutuelle';

// CNSS/Sécurité Sociale imports
import CNSSManager from './Zakaria/CNSS/CNSSManager';
import CNSSDashboard from './Zakaria/CNSS/CNSSDashboard';
import DossierCNSS from './Zakaria/CNSS/DossierCNSS';
import DeclarationsCNSS from './Zakaria/CNSS/DeclarationsCNSS';
import DeclarationsIndividuellesCNSS from './Zakaria/CNSS/DeclarationsIndividuellesCNSS';

import EmpHistorique from './Zakaria/EmpHistorique.jsx';
import CareerDashboard from './Zakaria/CarriereFormation/CareerDashboard';
import PositionsGrades from './Zakaria/CarriereFormation/PositionsGrades';
import TrainingDashboard from './Zakaria/CarriereFormation/TrainingDashboard';
import CarrieresPage from './Zakaria/CarriereFormation/CarrieresPage';
import FormationsPage from './Zakaria/CarriereFormation/FormationsPage';
import FormationParticipantsPage from './Zakaria/CarriereFormation/FormationParticipantsPage';
import DemandeMobilitePage from './Zakaria/CarriereFormation/DemandeMobilitePage';
import DemandeFormationPage from './Zakaria/CarriereFormation/DemandeFormationPage';


import { OpenProvider } from './Acceuil/OpenProvider.jsx';





// HeaderProvider import for global header state
import { HeaderProvider } from './Acceuil/HeaderContext';
import Societe from './Zakaria/Societe/Societe.jsx';
import Login from './Login/Login.jsx';

const App = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== '/login';
  return (
    <AuthProvider>
      <OpenProvider>
        <HeaderProvider>
          {showNavigation && <Navigation />}
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/login" element={<Login />} />

            <Route path="/employes" element={<DepartementManager />} />

            <Route path="/employes2" element={<DepartementManager2 />} />

            <Route path="/conflits" element={<ConflitManager />} />

            <Route path="/sanctions" element={<SanctionManager />} />

            <Route path="/cimr-dashboard" element={<CimrDashboard />} />
            <Route path="/cimr-affiliations" element={<CimrManager />} />
            <Route path="/cimr-declarations" element={<CimrDeclarationManager />} />
            <Route path="/users" element={<Users />} />

            {/* Mutuelle/Assurance Routes */}
            <Route path="/affiliation-mutuelle" element={<AffiliationMutuelleManagerSimple />} />
            <Route path="/mutuelle/dashboard" element={<MutuelleDashboard />} />
            <Route path="/mutuelle/dossiers" element={<DossierMutuelle />} />

            {/* CNSS/Sécurité Sociale Routes */}
            <Route path="/cnss-affiliations" element={<CNSSManager />} />
            <Route path="/cnss/dashboard" element={<CNSSDashboard />} />
            <Route path="/cnss/dossiers" element={<DossierCNSS />} />
            <Route path="/cnss/declarations" element={<DeclarationsCNSS />} />
            <Route path="/cnss/declarations-individuelles" element={<DeclarationsIndividuellesCNSS />} />

            <Route path="/carrieres-formations/dashboard-carrieres" element={<CareerDashboard />} />
            <Route path="/carrieres-formations/carrieres" element={<CarrieresPage />} />
            <Route path="/carrieres-formations/postes-grades" element={<PositionsGrades />} />
            <Route path="/carrieres-formations/dashboard-formations" element={<TrainingDashboard />} />
            <Route path="/carrieres-formations/formations" element={<FormationsPage />} />
            <Route path="/carrieres-formations/formations/:id/participants" element={<FormationParticipantsPage />} />
            <Route path="/carrieres-formations/demandes-mobilite" element={<DemandeMobilitePage />} />
            <Route path="/carrieres-formations/demandes-formation" element={<DemandeFormationPage />} />




            <Route path="/emphistorique" element={<EmpHistorique />} />






            <Route path="/societes" element={<Societe />} />




          </Routes>
        </HeaderProvider>
      </OpenProvider>
    </AuthProvider>
  );
};

export default App;
