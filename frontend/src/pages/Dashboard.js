/**
 * Dashboard Page
 * 
 * Landing page with project overview, statistics, and zone summaries.
 * Enhanced with Framer Motion animations
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import AnimatedCounter from '../components/AnimatedCounter';
import AnimatedPage from '../components/AnimatedPage';
import LoadingAnimation from '../components/LoadingAnimation';
import { containerVariants, itemVariants } from '../animations/transitions';
import { staggerFadeIn } from '../animations/gsap-effects';
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

  // GSAP animation refs
  const statsGridRef = useRef();
  const metricsGridRef = useRef();
  
  // Animate elements on mount
  useEffect(() => {
    if (!isLoading && hasData) {
      if (statsGridRef.current) {
        staggerFadeIn(statsGridRef.current.children, { stagger: 0.15 });
      }
      if (metricsGridRef.current) {
        staggerFadeIn(metricsGridRef.current.children, { stagger: 0.1, delay: 0.3 });
      }
    }
  }, [isLoading, hasData]);

  if (isLoading) {
    return <LoadingAnimation fullScreen message="Loading dashboard data..." />;
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
    <AnimatedPage className="dashboard">
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
      <motion.div 
        className="stats-grid" 
        ref={statsGridRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="stat-card stat-card-primary"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <motion.div 
            className="stat-icon"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Droplets size={24} />
          </motion.div>
          <div className="stat-content">
            <span className="stat-label">Total Devices</span>
            <span className="stat-value">
              <AnimatedCounter value={overview.totalDevices || 0} duration={2} />
            </span>
            <span className="stat-trend">Across all zones</span>
          </div>
          <div className="stat-badge">100%</div>
        </motion.div>

        <motion.div 
          className="stat-card stat-card-success"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <motion.div 
            className="stat-icon"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <CheckCircle size={24} />
          </motion.div>
          <div className="stat-content">
            <span className="stat-label">Working</span>
            <span className="stat-value">
              <AnimatedCounter 
                value={statusBreakdown.find(s => s.status === 'Working')?.count || 0} 
                duration={2.2}
              />
            </span>
            <span className="stat-trend">
              <AnimatedCounter 
                value={Math.round((statusBreakdown.find(s => s.status === 'Working')?.count || 0) / (overview.totalDevices || 1) * 100)}
                duration={2}
                suffix="%"
              /> operational
            </span>
          </div>
          <motion.div 
            className="stat-badge stat-badge-success"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            ✓
          </motion.div>
        </motion.div>

        <motion.div 
          className="stat-card stat-card-warning"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <motion.div 
            className="stat-icon"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.5, delay: 0.7, repeat: 3 }}
          >
            <AlertTriangle size={24} />
          </motion.div>
          <div className="stat-content">
            <span className="stat-label">Not Working</span>
            <span className="stat-value">
              <AnimatedCounter 
                value={statusBreakdown.find(s => s.status === 'Not Work')?.count || 0}
                duration={2.4}
              />
            </span>
            <span className="stat-trend">Need attention</span>
          </div>
          <motion.div 
            className="stat-badge stat-badge-warning"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, delay: 0.8, repeat: 2 }}
          >
            !
          </motion.div>
        </motion.div>

        <motion.div 
          className="stat-card stat-card-danger"
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <motion.div 
            className="stat-icon"
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 0.6, delay: 0.8, repeat: 2 }}
          >
            <XCircle size={24} />
          </motion.div>
          <div className="stat-content">
            <span className="stat-label">Failed</span>
            <span className="stat-value">
              <AnimatedCounter 
                value={statusBreakdown.find(s => s.status === 'Failed')?.count || 0}
                duration={2.6}
              />
            </span>
            <span className="stat-trend">Critical status</span>
          </div>
          <motion.div 
            className="stat-badge stat-badge-danger"
            animate={{ rotate: [0, 180] }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            ×
          </motion.div>
        </motion.div>
      </motion.div>

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

        <motion.div 
          className="metrics-grid"
          ref={metricsGridRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="metric-card metric-card-gradient-1" variants={itemVariants}>
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
          </motion.div>

          <motion.div className="metric-card metric-card-gradient-2" variants={itemVariants}>
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
          </motion.div>

          <motion.div className="metric-card metric-card-gradient-3" variants={itemVariants}>
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
          </motion.div>

          <motion.div className="metric-card metric-card-gradient-4" variants={itemVariants}>
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
          </motion.div>
        </motion.div>
      </section>

      {/* Status Distribution Chart */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>
            <BarChart3 size={20} />
            Status Distribution
          </h2>
        </div>

        <div className="chart-container">
          <div className="status-chart">
            {statusBreakdown.map((status, idx) => {
              const percentage = ((status.count / overview.totalDevices) * 100).toFixed(1);
              const colors = {
                'Working': '#00FF41',
                'Not Work': '#FF4500',
                'Failed': '#FF0040'
              };
              
              return (
                <div key={idx} className="chart-bar-wrapper">
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${colors[status.status] || '#6B7280'}, ${colors[status.status] || '#6B7280'}dd)`,
                        boxShadow: `0 0 20px ${colors[status.status] || '#6B7280'}66`
                      }}
                    >
                      <span className="chart-bar-label">{percentage}%</span>
                    </div>
                  </div>
                  <div className="chart-legend-item">
                    <div 
                      className="chart-legend-color"
                      style={{ backgroundColor: colors[status.status] || '#6B7280' }}
                    />
                    <span className="chart-legend-label">{status.status}</span>
                    <span className="chart-legend-count">{status.count} devices</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Device Type Distribution */}
          <div className="device-type-chart">
            <h3>Device Types</h3>
            <div className="device-type-grid">
              {deviceTypes.map((type, idx) => {
                const typeColors = {
                  'Borewell': '#667eea',
                  'Sump': '#f093fb',
                  'OHT': '#4facfe',
                  'OHSR': '#43e97b',
                  'CMSR': '#fa709a'
                };
                const percentage = ((type.count / overview.totalDevices) * 100).toFixed(0);
                
                return (
                  <div key={idx} className="device-type-card">
                    <div 
                      className="device-type-circle"
                      style={{
                        background: `conic-gradient(${typeColors[type.type] || '#6B7280'} ${percentage * 3.6}deg, #f3f4f6 0deg)`,
                      }}
                    >
                      <div className="device-type-inner">
                        <span className="device-type-percent">{percentage}%</span>
                      </div>
                    </div>
                    <div className="device-type-info">
                      <span className="device-type-name">{type.type}</span>
                      <span className="device-type-count">{type.count}</span>
                    </div>
                  </div>
                );
              })}
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
      <motion.div 
        className="dashboard-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <p>
          Last updated: {lastUpdated ? formatDate(lastUpdated) : 'Not available'}
        </p>
      </motion.div>
    </AnimatedPage>
  );
}

export default Dashboard;
