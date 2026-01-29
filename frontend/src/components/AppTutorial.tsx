import React, { useState, useEffect } from 'react';
import Joyride, { Step, STATUS, CallBackProps } from 'react-joyride';
import { useLocation } from 'react-router-dom';

export function AppTutorial() {
    const [run, setRun] = useState(false);
    const location = useLocation();

    // Steps configuration
    const steps: Step[] = [
        {
            target: '.nav-brand',
            content: 'Welcome to Rudraram Survey! This is your central hub for water infrastructure data.',
            placement: 'bottom',
        },
        {
            target: '.nav-links .nav-link:nth-child(1)',
            content: 'Use the Professional Map to visualize all devices in high-definition geospatial views.',
            placement: 'bottom'
        },
        {
            target: '.nav-links .nav-link:nth-child(2)',
            content: 'The Analytics Dashboard provides real-time insights into system health and trends.',
            placement: 'bottom'
        },
        {
            target: '.nav-dropdown',
            content: 'Access advanced views like the virtualized Data Table and Zone management here.',
            placement: 'bottom'
        }
    ];

    // Map Page specific steps
    const mapSteps: Step[] = [
        ...steps,
        {
            target: '.unified-controls',
            content: 'Filter thousands of devices instantly by Zone, Type, or Status.',
            placement: 'bottom'
        }
    ];

    useEffect(() => {
        // Auto-run tutorial for new users (mocked with localStorage)
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial && location.pathname !== '/') {
            setRun(true);
        }
    }, [location.pathname]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            localStorage.setItem('hasSeenTutorial', 'true');
            setRun(false);
        }
    };

    return (
        <Joyride
            steps={location.pathname === '/map' ? mapSteps : steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#2563eb',
                    zIndex: 10000,
                },
                tooltipContainer: {
                    textAlign: 'left'
                }
            }}
        />
    );
}

export default AppTutorial;
