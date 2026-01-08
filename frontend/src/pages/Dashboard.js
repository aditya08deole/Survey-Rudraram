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
  TrendingUp,
  Activity,
  Zap,
  Gauge,
  Clock,
  Layers,
  BarChart3,
  Wrench,
  Power,
  Battery,
  Thermometer
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
            <span className="stat-label">Total Devices</span>
            <span className="stat-value">{formatNumber(overview.totalDevices)}</span>
            <span className="stat-trend">Across all zones</span>
          </div>
          <div className="stat-badge">100%</div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Working</span>
            <span className="stat-value">
              {formatNumber(statusBreakdown.find(s => s.status === 'Working')?.count || 0)}
            </span>
            <span className="stat-trend">
              {Math.round((statusBreakdown.find(s => s.status === 'Working')?.count || 0) / (overview.totalDevices || 1) * 100)}% operational
            </span>
          </div>
          <div className="stat-badge stat-badge-success">✓</div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Not Working</span>
            <span className="stat-value">
              {formatNumber(statusBreakdown.find(s => s.status === 'Not Work')?.count || 0)}
            </span>
            <span className="stat-trend">Need attention</span>
          </div>
          <div className="stat-badge stat-badge-warning">!</div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Failed</span>
            <span className="stat-value">
              {formatNumber(statusBreakdown.find(s => s.status === 'Failed')?.count || 0)}
            </span>
            <span className="stat-trend">Critical status</span>
          </div>
          <div className="stat-badge stat-badge-danger">×</div>
        </div>
      </div>

      {/* Quick Insights */}
      <section className="dashboard-section">
        <div className="insights-grid">
          <div className="insight-card insight-gradient-blue">
            <div className="insight-header">
              <Activity size={20} />
              <span className="insight-tag">Real-time</span>
            </div>
            <div className="insight-value">{summary.healthScore || 0}%</div>
            <div className="insight-label">System Health Score</div>
            <div className="insight-footer">
              <Gauge size={14} />
              <span>Excellent performance</span>
            </div>
          </div>

          <div className="insight-card insight-gradient-green">
            <div className="insight-header">
              <Zap size={20} />
              <span className="insight-tag">Connected</span>
            </div>
            <div className="insight-value">{formatNumber(summary.totalHousesConnected || 0)}</div>
            <div className="insight-label">Houses Connected</div>
            <div className="insight-footer">
              <Users size={14} />
              <span>Serving community</span>
            </div>
          </div>

          <div className="insight-card insight-gradient-purple">
            <div className="insight-header">
              <MapPin size={20} />
              <span className="insight-tag">Mapped</span>
            </div>
            <div className="insight-value">{formatNumber(overview.mappedDevices || 0)}</div>
            <div className="insight-label">GPS Located Devices</div>
            <div className="insight-footer">
              <Layers size={14} />
              <span>Geo-referenced</span>
            </div>
          </div>

          <div className="insight-card insight-gradient-orange">
            <div className="insight-header">
              <Clock size={20} />
              <span className="insight-tag">Updated</span>
            </div>
            <div className="insight-value">{lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
            <div className="insight-label">Last Data Refresh</div>
            <div className="insight-footer">
              <RefreshCw size={14} />
              <span>Auto-synced</span>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Metrics */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>
            <Activity size={20} />
            Operational Metrics
          </h2>
        </div>

        <div className="metrics-grid">
          <div className="metric-card metric-card-gradient-1">
            <div className="metric-icon-wrapper">
              <Clock size={28} />
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {summary.avgDailyUsage || 'N/A'}
                <span className="metric-unit">hrs/day</span>
              </div>
              <div className="metric-label">Avg. Daily Usage</div>
              <div className="metric-trend">
                <TrendingUp size={14} />
                <span>Optimal range</span>
              </div>
            </div>
          </div>

          <div className="metric-card metric-card-gradient-2">
            <div className="metric-icon-wrapper">
              <Power size={28} />
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {summary.totalMotorCapacity || 0}
                <span className="metric-unit">HP</span>
              </div>
              <div className="metric-label">Total Motor Capacity</div>
              <div className="metric-trend">
                <Battery size={14} />
                <span>Installed capacity</span>
              </div>
            </div>
          </div>

          <div className="metric-card metric-card-gradient-3">
            <div className="metric-icon-wrapper">
              <Wrench size={28} />
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {summary.maintenanceDue || 0}
              </div>
              <div className="metric-label">Maintenance Pending</div>
              <div className="metric-trend">
                <AlertTriangle size={14} />
                <span>Requires action</span>
              </div>
            </div>
          </div>

          <div className="metric-card metric-card-gradient-4">
            <div className="metric-icon-wrapper">
              <Thermometer size={28} />
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {Math.round((statusBreakdown.find(s => s.status === 'Working')?.count || 0) / (overview.totalDevices || 1) * 100)}
                <span className="metric-unit">%</span>
              </div>
              <div className="metric-label">Uptime Rate</div>
              <div className="metric-trend">
                <CheckCircle size={14} />
                <span>Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
          <h2>
            <BarChart3 size={20} />
            Device Type Distribution
          </h2>
          <Link to="/table" className="section-link">
            View Details <ArrowRight size={16} />
          </Link>
        </div>

        <div className="device-type-cards">
          {deviceTypes.map((dt, index) => {
            const icons = ['⚫', '⬛', '🔺'];
            const colors = ['#3B82F6', '#8B5CF6', '#F59E0B'];
            const workingPercent = Math.round((dt.working / dt.total) * 100);
            
            return (
              <div key={dt.type} className="device-type-card" style={{'--card-color': colors[index]}}>
                <div className="device-type-header">
                  <div className="device-type-icon-wrapper" style={{background: `${colors[index]}20`}}>
                    <span className="device-type-icon" style={{color: colors[index]}}>
                      {icons[index]}
                    </span>
                  </div>
                  <h3>{dt.type}</h3>
                </div>
                <div className="device-type-count">{formatNumber(dt.total)}</div>
                <div className="device-type-progress">
                  <div className="device-progress-bar">
                    <div className="device-progress-fill" style={{width: `${workingPercent}%`, background: colors[index]}}></div>
                  </div>
                  <span className="device-progress-label">{workingPercent}% Working</span>
                </div>
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
            );
          })}
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
