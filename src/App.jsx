import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CoupleProvider, useCouple } from './context/CoupleContext';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';

const ProtectedRoute = ({ children }) => {
  const { coupleData, loading } = useCouple();

  if (loading) return <div>Chargement...</div>; // Or a spinner

  // Simple auth check
  if (!coupleData.isAuthenticated) return <Navigate to="/login" replace />;

  // If authenticated but no couple, force onboarding (unless we are already on onboarding)
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
      <AppContent />
    </CoupleProvider>
  );
}

export default App;
