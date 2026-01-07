/**
 * Rudraram Survey - Main App Component
 * 
 * Root component that sets up routing and global state.
 * Data is loaded directly from Excel file on GitHub (no backend).
 */

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import TableView from './pages/TableView';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/table" element={<TableView />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
