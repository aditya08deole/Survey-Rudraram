import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, Trash2, CheckCircle, XCircle } from 'lucide-react';
import apiService from '../../services/apiService';
import './TeamTab.css';

const TeamTab = () => {
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({
        email: '',
        username: '',
        password: '',
        role: 'viewer'
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.fetchTeamMembers();
            setMembers(data);
        } catch (err) {
            console.error("Failed to load team", err);
            setError("Failed to load team members. Are you an admin?");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            await apiService.inviteUser(inviteData);
            setSuccess(`Member ${inviteData.username} added successfully!`);
            setShowInviteModal(false);
            setInviteData({ email: '', username: '', password: '', role: 'viewer' });
            loadTeam();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to invite user");
        }
    };

    if (isLoading) {
        return <div className="team-loading">Loading project team...</div>;
    }

    return (
        <div className="team-tab fade-in">
            <div className="team-header-actions">
                <h3>Project Members</h3>
                <button className="btn-invite" onClick={() => setShowInviteModal(true)}>
                    <UserPlus size={18} />
                    Add Member
                </button>
            </div>

            {error && <div className="auth-error-banner">{error}</div>}
            {success && <div className="auth-success-banner">{success}</div>}

            <div className="team-grid">
                {members.map(member => (
                    <div key={member.id} className="member-card glass-panel">
                        <div className="member-avatar">
                            {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-info">
                            <span className="member-name">{member.username}</span>
                            <span className="member-email"><Mail size={12} /> {member.email}</span>
                            <div className={`member-role role-${member.role}`}>
                                <Shield size={12} />
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </div>
                        </div>
                        {/* Admin actions could go here (delete, change role) */}
                    </div>
                ))}
            </div>

            {showInviteModal && (
                <div className="modal-overlay">
                    <div className="invite-modal glass-panel">
                        <div className="modal-header">
                            <h2>Add New Team Member</h2>
                            <button className="close-btn" onClick={() => setShowInviteModal(false)}><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    required
                                    value={inviteData.username}
                                    onChange={e => setInviteData({ ...inviteData, username: e.target.value })}
                                    placeholder="e.g. jdoe"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteData.email}
                                    onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                                    placeholder="e.g. john@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Initial Password</label>
                                <input
                                    type="password"
                                    required
                                    value={inviteData.password}
                                    onChange={e => setInviteData({ ...inviteData, password: e.target.value })}
                                    placeholder="Temporary password"
                                />
                            </div>
                            <div className="form-group">
                                <label>Project Role</label>
                                <select
                                    value={inviteData.role}
                                    onChange={e => setInviteData({ ...inviteData, role: e.target.value })}
                                >
                                    <option value="viewer">Viewer (Read Only)</option>
                                    <option value="editor">Editor (Field Engineer)</option>
                                    <option value="admin">Administrator (Full Access)</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowInviteModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit">Add to Team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamTab;
