/**
 * Layout Component
 * 
 * Main layout wrapper with header and navigation.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Table, 
  Droplets,
  Menu,
  X
} from 'lucide-react';
import './Layout.css';

function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Map View' },
    { path: '/table', icon: Table, label: 'Table View' }
  ];

  const isMapPage = location.pathname === '/map';

  return (
    <div className={`layout ${isMapPage ? 'layout-fullscreen' : ''}`}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <Droplets className="logo-icon" />
              <div className="logo-text">
                <span className="logo-title">Rudraram Survey</span>
                <span className="logo-subtitle">Water Infrastructure Dashboard</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="nav-mobile">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => 
                  `nav-link-mobile ${isActive ? 'nav-link-active' : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className={`main-content ${isMapPage ? 'main-content-fullscreen' : ''}`}>
        {children}
      </main>

      {/* Footer - hidden on map page */}
      {!isMapPage && (
        <footer className="footer">
          <div className="footer-content">
            <p>© 2024 Rudraram Village, Isnapur Municipality, Telangana</p>
            <p className="footer-subtitle">Water Infrastructure Mapping System</p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default Layout;
