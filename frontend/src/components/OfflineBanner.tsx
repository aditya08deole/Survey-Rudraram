import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import './OfflineBanner.css';

const OfflineBanner = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="offline-banner bounce-in">
            <div className="offline-content">
                <WifiOff size={18} />
                <span>You are currently offline. Using cached data.</span>
            </div>
            <button className="offline-retry-btn" onClick={() => window.location.reload()}>
                <RefreshCw size={14} />
                Retry
            </button>
        </div>
    );
};

export default OfflineBanner;
