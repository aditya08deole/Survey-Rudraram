import React, { useState, useEffect } from 'react';
import { History, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { fetchSyncHistory, triggerExcelSync } from '../../services/apiService';
import './SyncLogTab.css';

const SyncLogTab = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<{ status: 'success' | 'error', message?: string, time?: Date } | null>(null);

    const loadHistory = async () => {
        setLoading(true);
        const data = await fetchSyncHistory();
        setHistory(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleManualSync = async () => {
        if (syncing) return;
        setSyncing(true);
        try {
            await triggerExcelSync();
            await loadHistory();
            setLastSync({ status: 'success', time: new Date() });
        } catch (err: any) {
            setLastSync({ status: 'error', message: err.message });
        } finally {
            setSyncing(false);
        }
    };

    const formatDate = (dateStr: any) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="sync-log-container">
            <div className="sync-header">
                <div className="sync-title">
                    <History size={20} className="title-icon" />
                    <h3>Data Sync Pipeline</h3>
                </div>
                <button
                    className={`sync-trigger-btn ${syncing ? 'loading' : ''}`}
                    onClick={handleManualSync}
                    disabled={syncing}
                >
                    <RefreshCw size={16} className={syncing ? 'spin' : ''} />
                    <span>{syncing ? 'Syncing...' : 'Sync with Excel'}</span>
                </button>
            </div>

            {lastSync && (
                <div className={`sync-alert ${lastSync.status}`}>
                    {lastSync.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{lastSync.status === 'success' ? 'Sync completed successfully!' : `Sync failed: ${lastSync.message}`}</span>
                </div>
            )}

            <div className="history-list">
                {loading ? (
                    <div className="history-loading">
                        <RefreshCw size={24} className="spin" />
                        <p>Loading history...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="history-empty">
                        <Clock size={40} />
                        <p>No sync history found</p>
                    </div>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Started</th>
                                <th>Duration</th>
                                <th>Devices</th>
                                <th>Trigger</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => {
                                const duration = item.finished_at && item.started_at
                                    ? Math.round((new Date(item.finished_at).getTime() - new Date(item.started_at).getTime()) / 1000)
                                    : null;

                                return (
                                    <tr key={item.id} className={`status-${item.status}`}>
                                        <td>
                                            <div className="status-cell">
                                                {item.status === 'success' ? <CheckCircle2 size={14} className="icon-success" /> :
                                                    item.status === 'failed' ? <XCircle size={14} className="icon-failed" /> :
                                                        <RefreshCw size={14} className="icon-running spin" />}
                                                <span className="capitalize">{item.status}</span>
                                            </div>
                                        </td>
                                        <td>{formatDate(item.started_at)}</td>
                                        <td>{duration !== null ? `${duration}s` : '—'}</td>
                                        <td>{item.devices_synced || 0}</td>
                                        <td>{item.triggered_by || 'manual'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SyncLogTab;
