/**
 * Rudraram Survey - Main App Component
 * 
 * Enterprise dashboard with 7 professional views
 * TypeScript + React Router
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import NavigationHeader from './components/Navigation/NavigationHeader';
import { LandingPage } from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ZonesPage from './pages/ZonesPage';
import TypesPage from './pages/TypesPage';
import DeviceTablePage from './pages/DeviceTablePage';
import ExportPage from './pages/ExportPage';
import './App.css';
import OfflineBanner from './components/OfflineBanner';
import AppTutorial from './components/AppTutorial';
import { Toaster } from 'react-hot-toast';

// Layout component to handle conditional header
function AppLayout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="app-container">
      <AppTutorial />
      {!isLandingPage && <NavigationHeader />}
      <main className={isLandingPage ? 'landing-main' : 'app-main'}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/types" element={<TypesPage />} />
          <Route path="/table" element={<DeviceTablePage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </main>
      <OfflineBanner />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppLayout />
      </Router>
    </AppProvider>
  );
}

export default App;
