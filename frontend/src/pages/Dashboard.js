/**
 * Dashboard Page
 * 
 * Landing page with project overview, statistics, and zone summaries.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  MapPin, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  RefreshCw,
  Database,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatNumber, formatDate } from '../utils/helpers';
import './Dashboard.css';

function Dashboard() {
  const { 
    stats, 
    isLoading, 
    error, 
    hasData, 
    lastUpdated,
    refreshData 
  } = useApp();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertTriangle size={48} />
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={refreshData}>
          <RefreshCw size={18} />
          Retry
        </button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="dashboard-empty">
        <Database size={64} className="text-gray-400" />
        <h2>No Data Available</h2>
        <p>Upload an Excel file to get started with the water infrastructure dashboard.</p>
        <Link to="/admin" className="btn btn-primary btn-lg">
          <ArrowRight size={18} />
          Go to Admin Upload
        </Link>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const zoneStats = stats?.zones || [];
  const statusBreakdown = stats?.statusBreakdown || [];
  const deviceTypes = stats?.deviceTypes || [];
  const summary = stats?.summary || {};

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1>Rudraram Village</h1>
          <p className="dashboard-subtitle">Water Infrastructure Mapping Dashboard</p>
          <p className="dashboard-location">Isnapur Municipality, Telangana</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={refreshData}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <Link to="/map" className="btn btn-primary">
            <MapPin size={16} />
            View Map
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <Droplets size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(overview.totalDevices)}</span>
            <span className="stat-label">Total Devices</span>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {formatNumber(statusBreakdown.find(s => s.status === 'Working')?.count || 0)}
            </span>
            <span className="stat-label">Working</span>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {formatNumber(statusBreakdown.find(s => s.status === 'Not Work')?.count || 0)}
            </span>
            <span className="stat-label">Not Working</span>
          </div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {formatNumber(statusBreakdown.find(s => s.status === 'Failed')?.count || 0)}
            </span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
      </div>

      {/* Zone Summary Cards */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Zone-wise Summary</h2>
          <Link to="/map" className="section-link">
            View on Map <ArrowRight size={16} />
          </Link>
        </div>

        <div className="zone-cards">
          {zoneStats.map(zone => (
            <div 
              key={zone.zoneId} 
              className="zone-card"
              style={{ '--zone-color': zone.color }}
            >
              <div className="zone-header">
                <div className="zone-indicator" style={{ backgroundColor: zone.color }}></div>
                <div className="zone-info">
                  <h3>{zone.zoneName}</h3>
                  <span className="zone-population">
                    <Users size={14} />
                    Population: {formatNumber(zone.population)}
                  </span>
                </div>
              </div>

              <div className="zone-stats">
                <div className="zone-stat">
                  <span className="zone-stat-value">{zone.totalDevices}</span>
                  <span className="zone-stat-label">Devices</span>
                </div>
                <div className="zone-stat">
                  <span className="zone-stat-value zone-stat-success">{zone.working}</span>
                  <span className="zone-stat-label">Working</span>
                </div>
                <div className="zone-stat">
                  <span className="zone-stat-value zone-stat-warning">{zone.notWorking}</span>
                  <span className="zone-stat-label">Not Working</span>
                </div>
                <div className="zone-stat">
                  <span className="zone-stat-value zone-stat-danger">{zone.failed}</span>
                  <span className="zone-stat-label">Failed</span>
                </div>
              </div>

              <div className="zone-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${zone.workingPercentage}%`,
                      backgroundColor: '#22C55E'
                    }}
                  ></div>
                </div>
                <span className="progress-label">{zone.workingPercentage}% Operational</span>
              </div>

              <div className="zone-devices">
                <span className="device-count">
                  <span className="device-icon">⚫</span> {zone.borewells} Borewells
                </span>
                <span className="device-count">
                  <span className="device-icon">⬛</span> {zone.sumps} Sumps
                </span>
                <span className="device-count">
                  <span className="device-icon">🔺</span> {zone.ohts} OHTs
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Device Type Summary */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Device Type Summary</h2>
        </div>

        <div className="device-type-cards">
          {deviceTypes.map(dt => (
            <div key={dt.type} className="device-type-card">
              <div className="device-type-header">
                <span className="device-type-icon">
                  {dt.type === 'Borewell' ? '⚫' : dt.type === 'Sump' ? '⬛' : '🔺'}
                </span>
                <h3>{dt.type}</h3>
              </div>
              <div className="device-type-count">{formatNumber(dt.total)}</div>
              <div className="device-type-breakdown">
                <span className="breakdown-item success">
                  <CheckCircle size={12} /> {dt.working}
                </span>
                <span className="breakdown-item warning">
                  <AlertTriangle size={12} /> {dt.notWorking}
                </span>
                <span className="breakdown-item danger">
                  <XCircle size={12} /> {dt.failed}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Summary Section */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Infrastructure Summary</h2>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">
              <TrendingUp size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{summary.healthScore}%</span>
              <span className="summary-label">System Health Score</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">
              <Users size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{formatNumber(summary.totalHousesConnected)}</span>
              <span className="summary-label">Houses Connected</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">
              <MapPin size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{formatNumber(overview.mappedDevices)}</span>
              <span className="summary-label">Mapped on Map</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{formatNumber(summary.needsAttention)}</span>
              <span className="summary-label">Need Attention</span>
            </div>
          </div>
        </div>
      </section>

      {/* Last Updated */}
      <div className="dashboard-footer">
        <p>
          Last updated: {lastUpdated ? formatDate(lastUpdated) : 'Not available'}
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
