/**
 * SPOTLIGHT COMMAND CENTER
 * 
 * Global command palette inspired by MacOS Spotlight / VS Code.
 * Trigger: Ctrl + K (or Cmd + K)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Map, Zap, Cloud, X, ArrowRight } from 'lucide-react';
import { Device } from '../../types/device';
import './Spotlight.css';

interface SpotlightProps {
    devices: Device[];
    onDeviceSelect: (device: Device) => void;
    onCommand: (cmd: string) => void; // e.g., 'LAYER_SATELLITE'
}

const Spotlight = ({ devices, onDeviceSelect, onCommand }: SpotlightProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(p => !p);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isOpen]);

    // Filtering Logic
    const getResults = () => {
        if (!query) return [];
        const q = query.toLowerCase();

        // Commands
        const commands = [
            { id: 'cmd_sat', type: 'COMMAND', label: 'Switch to Satellite', icon: <Map size={14} />, action: 'LAYER_SATELLITE' },
            { id: 'cmd_str', type: 'COMMAND', label: 'Switch to Street Map', icon: <Map size={14} />, action: 'LAYER_STREET' },
            { id: 'cmd_cli', type: 'COMMAND', label: 'Clear Selection', icon: <X size={14} />, action: 'CLEAR' },
        ].filter(c => c.label.toLowerCase().includes(q));

        // Devices
        const deviceRes = devices
            .filter(d =>
                (d.survey_id || '').toLowerCase().includes(q) ||
                (d.original_name || '').toLowerCase().includes(q)
            )
            .slice(0, 5) // Limit to top 5
            .map(d => ({
                id: d.survey_id,
                type: 'DEVICE',
                label: d.original_name || d.survey_id,
                detail: `Status: ${d.status || 'Unknown'}`,
                icon: <Zap size={14} color={d.status?.includes('Working') ? '#39FF14' : '#FF073A'} />,
                data: d
            }));

        return [...commands, ...deviceRes];
    };

    const results = getResults();

    const execute = (item: any) => {
        if (item.type === 'DEVICE') {
            onDeviceSelect(item.data);
        } else if (item.type === 'COMMAND') {
            onCommand(item.action);
        }
        setIsOpen(false);
        setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            if (results[selectedIndex]) execute(results[selectedIndex]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="spotlight-overlay" onClick={() => setIsOpen(false)}>
            <div className="spotlight-modal" onClick={e => e.stopPropagation()}>
                <div className="spotlight-search">
                    <Search className="search-icon" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search devices, zones, or commands..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="shortcut-hint">Esc to close</div>
                </div>

                {results.length > 0 && (
                    <div className="spotlight-results">
                        {results.map((item, idx) => (
                            <div
                                key={item.id}
                                className={`result-item ${idx === selectedIndex ? 'selected' : ''}`}
                                onClick={() => execute(item)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                            >
                                <div className="result-icon">{item.icon}</div>
                                <div className="result-info">
                                    <div className="result-label">{item.label}</div>
                                    {(item as any).detail && <div className="result-detail">{(item as any).detail}</div>}
                                </div>
                                {idx === selectedIndex && <ArrowRight size={14} className="enter-hint" />}
                            </div>
                        ))}
                    </div>
                )}

                {query && results.length === 0 && (
                    <div className="no-results">No matches found.</div>
                )}
            </div>
        </div>
    );
};

export default Spotlight;
