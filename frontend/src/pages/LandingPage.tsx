import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import landingBg from '../assets/landing-bg.png';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="executive-landing">
            <header className="hero-viewport" style={{ backgroundImage: `url(${landingBg})` }}>
                <div className="viewport-overlay" />
                <div className="hero-core">
                    <div className="core-badge">DEPLOYMENT GRADE INFRASTRUCTURE v1.0</div>
                    <h1 className="hero-title">
                        INTEGRATED GEOSPATIAL <br />
                        <span>INFRASTRUCTURE INTEL</span>
                    </h1>
                    <p className="hero-desc">
                        A mission-critical platform for precision mapping,
                        operational telemetry, and geospatial network intelligence.
                    </p>
                    <div className="hero-cta-wrap">
                        <button className="cta-primary-obsidian" onClick={() => navigate('/dashboard')}>
                            ACCESS CONSOLE
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <section className="intel-summary">
                <div className="intel-grid">
                    <div className="intel-item">
                        <h2>PRECISION FIELD MAPPING</h2>
                        <p>High-fidelity B/S/O iconography with real-time status telemetry and terrain intelligence integration.</p>
                    </div>
                    <div className="intel-item">
                        <h2>OPERATIONAL INTELLIGENCE</h2>
                        <p>A unified command center for managing water supply networks with executive-level data clarity.</p>
                    </div>
                </div>
            </section>

            <footer className="executive-footer">
                <div className="footer-brand">RUDRARAM SURVEY</div>
                <div className="footer-legal">&copy; 2026 EvaraTech Systems. All technical rights reserved.</div>
            </footer>
        </div>
    );
};

export default LandingPage;
