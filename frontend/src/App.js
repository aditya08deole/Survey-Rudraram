/**
 * Rudraram Survey - Main App Component
 * 
 * Root component that sets up routing and global state.
 * Data is loaded from FastAPI backend.
 * Enhanced with Framer Motion page transitions
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import TableView from './pages/TableView';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MapView />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/table" element={<TableView />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
