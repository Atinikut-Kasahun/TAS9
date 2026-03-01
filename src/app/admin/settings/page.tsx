"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { apiFetch } from '@/lib/api';
import { Bell, Search, LogOut, User, Info, Save, Check } from 'lucide-react';

export default function GlobalSettings() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [name, setName] = useState('');
    const [saved, setSaved] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { router.push('/login'); return; }
        const u = JSON.parse(storedUser);
        setUser(u);
        setName(u.name || '');
        apiFetch('/v1/dashboard').then(setStats).catch(() => { });
    }, [router]);

    const handleLogout = async () => {
        try { await apiFetch('/v1/logout', { method: 'POST' }); } catch (_) { }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        // Update local display name
        const updated = { ...user, name };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F7A6E]" />
        </div>
    );

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: <User size={15} /> },
        { id: 'system', label: 'System Info', icon: <Info size={15} /> },
    ];

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">
            <AdminSidebar user={user} />

            <div className="flex-1 ml-56 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-100 h-14 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <h1 className="text-gray-800 font-bold text-sm">Settings</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-400 text-sm w-48">
                            <Search size={14} /><span className="text-xs">Search...</span>
                        </div>
                        <button className="text-gray-400 hover:text-gray-700 transition-colors"><Bell size={18} /></button>
                        <div className="flex items-center gap-3 border-l border-gray-200 pl-4 ml-2">
                            <div className="w-8 h-8 rounded-full bg-[#1F7A6E]/20 border border-[#1F7A6E]/40 flex items-center justify-center text-[#1F7A6E] font-black text-xs">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors">
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex min-h-[calc(100vh-8rem)]">
                        {/* Vertical Tabs */}
                        <div className="w-52 border-r border-gray-100 p-4 flex flex-col gap-1 shrink-0">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5 ${activeTab === tab.id ? 'bg-[#1F7A6E]/10 text-[#1F7A6E]' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {tab.icon}{tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-10 max-w-lg">

                            {/* ── PROFILE ── */}
                            {activeTab === 'profile' && (
                                <div>
                                    <h2 className="text-base font-black text-gray-900 mb-1">My Profile</h2>
                                    <p className="text-gray-400 text-xs mb-8">Your Global Admin identity.</p>

                                    {/* Avatar */}
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A2B3D] to-[#1F7A6E] flex items-center justify-center text-white font-black text-2xl shadow-lg">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900">{user.name}</p>
                                            <p className="text-xs text-[#1F7A6E] font-bold uppercase tracking-widest mt-0.5">Global Admin</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveProfile} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Display Name</label>
                                            <input
                                                type="text" required
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1F7A6E] focus:border-transparent outline-none"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
                                            <input
                                                type="email" disabled
                                                className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                                                value={user.email || ''}
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed from here.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Company</label>
                                            <input
                                                type="text" disabled
                                                className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                                                value={user.tenant?.name || 'Global Admin (No Company)'}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-[#1F7A6E] text-white hover:bg-[#165a51]'}`}
                                        >
                                            {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ── SYSTEM INFO ── */}
                            {activeTab === 'system' && (
                                <div>
                                    <h2 className="text-base font-black text-gray-900 mb-1">System Information</h2>
                                    <p className="text-gray-400 text-xs mb-8">Read-only overview of the platform state.</p>

                                    <div className="space-y-3">
                                        {[
                                            { label: 'Platform', value: 'TAS — Talent Acquisition System' },
                                            { label: 'Architecture', value: 'Multi-Tenant SaaS' },
                                            { label: 'Database', value: 'SQLite (Local Dev)' },
                                            { label: 'Total Companies', value: stats?.total_tenants ?? '—' },
                                            { label: 'Total Candidates', value: stats?.total_candidates ?? '—' },
                                            { label: 'Active Jobs', value: stats?.total_active_jobs ?? '—' },
                                            { label: 'Your Role', value: user.roles?.[0]?.name || 'Admin' },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                                                <span className="text-sm font-bold text-gray-800">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 p-4 bg-[#1A2B3D]/5 rounded-2xl border border-[#1A2B3D]/10">
                                        <p className="text-xs font-black text-[#1A2B3D] uppercase tracking-widest mb-1">Company & User Management</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            To add/remove companies and users, open the <strong>Global Admin Dashboard</strong> and click any company row to open the management panel.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
