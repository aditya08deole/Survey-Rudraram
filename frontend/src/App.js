/**
 * Rudraram Survey - Main App Component
 * 
 * Enterprise dashboard with 7 professional views
 * TypeScript + React Router
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import NavigationHeader from './components/Navigation/NavigationHeader';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ZonesPage from './pages/ZonesPage';
import TypesPage from './pages/TypesPage';
import DeviceTablePage from './pages/DeviceTablePage';
import ExportPage from './pages/ExportPage';
import './App.css';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <NavigationHeader />
          <main className="app-main">
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/zones" element={<ZonesPage />} />
              <Route path="/types" element={<TypesPage />} />
              <Route path="/table" element={<DeviceTablePage />} />
              <Route path="/export" element={<ExportPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
