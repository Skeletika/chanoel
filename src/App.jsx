import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CoupleProvider, useCouple } from './context/CoupleContext';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
// ── Composants PWA (installation Android & tutoriel iOS) ──
import AndroidInstallBanner from './components/ui/AndroidInstallBanner';
import IOSTutorialModal from './components/ui/IOSTutorialModal';

const ProtectedRoute = ({ children }) => {
  const { coupleData, loading } = useCouple();

  if (loading) return <div>Chargement...</div>;

  if (!coupleData.isAuthenticated) return <Navigate to="/login" replace />;

  if (!coupleData.couple?.id && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <CoupleProvider>
      {/*
       * IOSTutorialModal agit comme Provider (Context).
       * Il entoure toute l'app pour que Login, Onboarding et Dashboard
       * puissent appeler useIOSTutorial() pour rouvrir le modal.
       * La bannière Android reste montée en frère.
       */}
      <IOSTutorialModal>
        <AppContent />
        <AndroidInstallBanner />
      </IOSTutorialModal>
    </CoupleProvider>
  );
}

export default App;
