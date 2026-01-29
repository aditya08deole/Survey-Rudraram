import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Shield, Map as MapIcon,
    BarChart3, Globe, ArrowRight, Zap
} from 'lucide-react';
import landingBg from '../assets/landing-bg.png';
import './LandingPage.css';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            {/* Hero Section */}
            <header
                className="landing-hero"
                style={{ backgroundImage: `url(${landingBg})` }}
            >
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <div className="badge animate-fade-in">Deployment Grade Infrastructure</div>
                    <h1 className="animate-slide-up">
                        Rudraram Digital <br />
                        <span>Supply Network</span>
                    </h1>
                    <p className="hero-subtitle animate-slide-up-delayed">
                        A mission-critical geospatial platform for monitoring,
                        analyzing, and scaling water infrastructure across segments.
                    </p>
                    <div className="hero-actions animate-slide-up-further">
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/dashboard')}
                        >
                            Open Dashboard
                            <ArrowRight size={20} />
                        </button>
                        <button className="btn-secondary">
                            View Project Docs
                        </button>
                    </div>
                </div>
            </header>

            {/* Mission Stats */}
            <section className="stats-section">
                <div className="stat-card">
                    <h3>1200+</h3>
                    <p>Assets Tracked</p>
                </div>
                <div className="stat-card">
                    <h3>14</h3>
                    <p>Operational Zones</p>
                </div>
                <div className="stat-card">
                    <h3>99.9%</h3>
                    <p>Data Integrity</p>
                </div>
                <div className="stat-card">
                    <h3>Real-time</h3>
                    <p>Sync Engine</p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-grid">
                <div className="section-header">
                    <h2>Advanced Capabilities</h2>
                    <p>Engineered for field resilience and executive clarity.</p>
                </div>

                <div className="features-container">
                    <div className="feature-item">
                        <div className="feature-icon"><MapIcon /></div>
                        <h3>Pro Mapping</h3>
                        <p>High-density clustering and geospatial visualization for all assets.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon"><Zap /></div>
                        <h3>Offline First</h3>
                        <p>Progressive Web App support ensures workers can sync data in dead zones.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon"><Shield /></div>
                        <h3>Verified Data</h3>
                        <p>Multi-step validation pipeline for every entry from Excel to DB.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon"><BarChart3 /></div>
                        <h3>Deep Analytics</h3>
                        <p>Trend analysis and health scoring to predict maintenance needs.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon"><Activity /></div>
                        <h3>Field Sync</h3>
                        <p>Direct-to-cloud image uploads with edge-compression logic.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon"><Globe /></div>
                        <h3>Unified View</h3>
                        <p>One source of truth for Borewells, Sumps, and OHSR assets.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">RUDRARAM SURVEY v1.0</div>
                    <p>© 2026 Smart Infrastructure Solutions. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
