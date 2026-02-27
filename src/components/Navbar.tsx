'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    name: string;
    roles?: any[];
}

export default function Navbar({ user, onLogout }: { user: User; onLogout: () => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTabParam = searchParams.get('tab'); // e.g. "Jobs", "Candidates"

    const roleSlug = (() => {
        const roles = user.roles;
        if (!roles || roles.length === 0) return 'ta_manager';
        const first = roles[0];
        return (typeof first === 'string' ? first : first?.slug || first?.name || 'ta_manager').toLowerCase();
    })();

    const navItems = (() => {
        switch (roleSlug) {
            case 'hiring_manager':
                return [
                    { label: 'JOBS', href: '/dashboard?tab=Jobs' },
                    { label: 'HIRING PLAN', href: '/dashboard?tab=HiringPlan' },
                ];
            case 'hr_manager':
                return [
                    { label: 'JOBS', href: '/dashboard?tab=Jobs' },
                    { label: 'HIRING PLAN', href: '/dashboard?tab=HiringPlan' },
                    { label: 'REPORTS', href: '/dashboard?tab=Reports' },
                ];
            default: // TA Team / Admin
                return [
                    { label: 'JOBS', href: '/dashboard?tab=Jobs' },
                    { label: 'CANDIDATES', href: '/dashboard?tab=Candidates' },
                    { label: 'EMPLOYEES', href: '/dashboard?tab=Employees' },
                    { label: 'HIRING PLAN', href: '/dashboard?tab=HiringPlan' },
                    { label: 'REPORTS', href: '/dashboard?tab=Reports' },
                ];
        }
    })();

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasInterviewsToday, setHasInterviewsToday] = useState(false);
    const [showCalendarTooltip, setShowCalendarTooltip] = useState(false);

    useEffect(() => {
        const checkInterviewsToday = async () => {
            if (roleSlug === 'ta_manager') return; // Only managers see this in nav
            try {
                const interviews = await apiFetch('/v1/interviews?status=scheduled');
                if (interviews && Array.isArray(interviews)) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const found = interviews.some((i: any) => i.scheduled_at && i.scheduled_at.startsWith(todayStr));
                    setHasInterviewsToday(found);
                }
            } catch (e) {
                console.error('Failed to check interviews', e);
            }
        };
        checkInterviewsToday();
    }, [roleSlug]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await apiFetch('/v1/notifications');
                if (data) {
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unread_count || 0);
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await apiFetch(`/v1/notifications/${id}/read`, { method: 'POST' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiFetch('/v1/notifications/mark-all-read', { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
            setUnreadCount(0);
        } catch (e) {
            console.error(e);
        }
    };

    const [replyState, setReplyState] = useState<Record<string, { open: boolean; text: string; sending: boolean; sent: boolean }>>({});

    const toggleReply = (id: string) => {
        setReplyState(prev => ({
            ...prev,
            [id]: { open: !prev[id]?.open, text: prev[id]?.text || '', sending: false, sent: false }
        }));
    };

    const sendReply = async (notifId: string) => {
        const text = replyState[notifId]?.text?.trim();
        if (!text) return;
        setReplyState(prev => ({ ...prev, [notifId]: { ...prev[notifId], sending: true } }));
        try {
            await apiFetch(`/v1/notifications/${notifId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ message: text }),
            });
            setReplyState(prev => ({ ...prev, [notifId]: { open: false, text: '', sending: false, sent: true } }));
            // Also mark original as read locally
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
            setReplyState(prev => ({ ...prev, [notifId]: { ...prev[notifId], sending: false } }));
        }
    };

    // Compose new message
    const [users, setUsers] = useState<any[]>([]);
    const [showCompose, setShowCompose] = useState(false);
    const [composeTo, setComposeTo] = useState('');
    const [composeMsg, setComposeMsg] = useState('');
    const [composeSending, setComposeSending] = useState(false);
    const [composeSent, setComposeSent] = useState(false);

    useEffect(() => {
        apiFetch('/v1/users').then(data => setUsers(data || [])).catch(() => { });
    }, []);

    const sendDirect = async () => {
        if (!composeTo || !composeMsg.trim()) return;
        setComposeSending(true);
        setComposeSent(false);
        try {
            await apiFetch('/v1/messages/send', {
                method: 'POST',
                body: JSON.stringify({ to_user_id: composeTo, message: composeMsg }),
            });
            setComposeMsg('');
            setComposeTo('');
            setComposeSent(true);
            setTimeout(() => { setComposeSent(false); setShowCompose(false); }, 2500);
        } catch (e) {
            console.error(e);
        } finally {
            setComposeSending(false);
        }
    };

    return (
        <nav className="bg-[#1A2B3D] h-16 px-8 flex items-center justify-between shadow-lg sticky top-0 z-[100]">
            <div className="flex items-center gap-12">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="bg-white text-[#1A2B3D] w-8 h-8 rounded flex items-center justify-center font-black text-xl">D</div>
                    <span className="text-white font-black text-xl tracking-tighter group-hover:text-teal-400 transition-colors">DROGA</span>
                </Link>

                {/* Nav Links */}
                <div className="flex gap-2">
                    {navItems.map((item) => {
                        // Extract the tab value from the href (e.g. "Jobs" from "?tab=Jobs")
                        const tabValue = item.href.split('?tab=')[1];
                        const isActive = tabValue ? activeTabParam === tabValue : pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`text-[11px] font-black tracking-widest transition-all px-4 py-2 rounded-lg relative ${isActive
                                    ? 'text-white bg-[#1F7A6E]/30 border border-[#1F7A6E]/50'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.label}
                                {isActive && (
                                    <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1F7A6E]" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Interview Calendar Icon (Only for Managers) */}
                {(roleSlug === 'hiring_manager' || roleSlug === 'hr_manager') && (
                    <div className="relative group">
                        <Link
                            href="/dashboard?tab=Calendar"
                            onMouseEnter={() => setShowCalendarTooltip(true)}
                            onMouseLeave={() => setShowCalendarTooltip(false)}
                            className={`relative transition-colors ${activeTabParam === 'Calendar' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {hasInterviewsToday && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1A2B3D] animate-pulse" />
                            )}
                        </Link>

                        {/* Tooltip */}
                        <AnimatePresence>
                            {showCalendarTooltip && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest rounded whitespace-nowrap z-[130]"
                                >
                                    Interview Calendar
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Search icon */}
                <div className="relative flex items-center">
                    <AnimatePresence>
                        {isSearchOpen && (
                            <motion.input
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 220, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSearchQuery(val);
                                    const url = new URL(window.location.href);
                                    if (val) url.searchParams.set('search', val);
                                    else url.searchParams.delete('search');
                                    window.history.replaceState({}, '', url);
                                }}
                                placeholder="Search candidates, jobs..."
                                className="absolute right-8 bg-[#2D455A] text-white placeholder-gray-400 text-[11px] font-black tracking-widest px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#1F7A6E] z-[110]"
                                autoFocus
                            />
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => {
                            const opening = !isSearchOpen;
                            setIsSearchOpen(opening);
                            if (!opening) {
                                // Clear search when closing
                                setSearchQuery('');
                                const url = new URL(window.location.href);
                                url.searchParams.delete('search');
                                window.history.replaceState({}, '', url);
                            }
                        }}
                        className={`transition-colors relative z-[120] ${isSearchOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {isSearchOpen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Notifications Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifs(!showNotifs)}
                        className={`relative transition-colors ${showNotifs ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[9px] font-black text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#1A2B3D]">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifs && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[120]"
                            >
                                {/* Dropdown header */}
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-[#1A2B3D] tracking-widest uppercase">Notifications</h3>
                                        <div className="flex items-center gap-3">
                                            {unreadCount > 0 && (
                                                <button onClick={markAllAsRead} className="text-[10px] font-bold text-gray-400 hover:text-[#1F7A6E] transition-colors">
                                                    Mark all read
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { setShowCompose(!showCompose); setComposeSent(false); }}
                                                className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all ${showCompose ? 'bg-[#1F7A6E] text-white' : 'bg-[#1A2B3D] text-white hover:bg-[#1F7A6E]'}`}
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                                New
                                            </button>
                                        </div>
                                    </div>

                                    {/* Compose panel */}
                                    <AnimatePresence>
                                        {showCompose && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-2 space-y-2">
                                                    <select
                                                        value={composeTo}
                                                        onChange={e => setComposeTo(e.target.value)}
                                                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1F7A6E] focus:ring-1 focus:ring-[#1F7A6E] font-medium"
                                                    >
                                                        <option value="" disabled>To: Select colleague...</option>
                                                        {users.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                    <textarea
                                                        value={composeMsg}
                                                        onChange={e => setComposeMsg(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDirect(); } }}
                                                        placeholder="Write your message... (Enter to send)"
                                                        rows={2}
                                                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1F7A6E] focus:ring-1 focus:ring-[#1F7A6E]"
                                                    />
                                                    <div className="flex items-center justify-between">
                                                        {composeSent && (
                                                            <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                                Message sent!
                                                            </span>
                                                        )}
                                                        {!composeSent && <span />}
                                                        <button
                                                            onClick={sendDirect}
                                                            disabled={composeSending || !composeTo || !composeMsg.trim()}
                                                            className="px-4 py-1.5 bg-[#1F7A6E] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#165C53] disabled:opacity-50 transition-all flex items-center gap-1.5"
                                                        >
                                                            {composeSending
                                                                ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                : <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Send</>
                                                            }
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 text-xs italic">
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map(notif => {
                                            const rs = replyState[notif.id];
                                            const canReply = !!(notif.data?.sender_id);
                                            return (
                                                <div key={notif.id} className={`border-b border-gray-50 transition-colors ${notif.read_at ? 'bg-white' : 'bg-blue-50/30'}`}>
                                                    {/* Message row */}
                                                    <div
                                                        onClick={() => !notif.read_at && markAsRead(notif.id)}
                                                        className="p-4 flex gap-3 cursor-pointer hover:bg-gray-50/60"
                                                    >
                                                        <div className="mt-0.5 text-base">
                                                            {notif.data.type === 'requisition_alert' ? '📝' :
                                                                notif.data.type === 'candidate_mention' ? '💬' :
                                                                    notif.data.type === 'direct_reply' ? '↩️' :
                                                                        notif.data.type === 'interview_reminder' ? '⏰' :
                                                                            notif.data.type === 'system_status' ? '🔔' : '📌'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs leading-tight ${notif.read_at ? 'font-medium text-gray-700' : 'font-bold text-[#1A2B3D]'}`}>
                                                                {notif.data.title}
                                                            </p>
                                                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                                                {notif.data.message}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                                    {new Date(notif.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                {canReply && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); toggleReply(notif.id); }}
                                                                        className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors ${rs?.open ? 'text-[#1F7A6E]' : 'text-gray-400 hover:text-[#1F7A6E]'}`}
                                                                    >
                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                                        {rs?.open ? 'Cancel' : 'Reply'}
                                                                    </button>
                                                                )}
                                                                {rs?.sent && (
                                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                                        Sent
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!notif.read_at && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                                                    </div>

                                                    {/* Inline reply form */}
                                                    <AnimatePresence>
                                                        {rs?.open && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="px-4 pb-4 flex gap-2 bg-gray-50/70 border-t border-gray-100">
                                                                    <textarea
                                                                        value={rs.text || ''}
                                                                        onChange={(e) => setReplyState(prev => ({ ...prev, [notif.id]: { ...prev[notif.id], text: e.target.value } }))}
                                                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(notif.id); } }}
                                                                        placeholder={`Reply to ${notif.data.sender_name || 'sender'}...`}
                                                                        rows={2}
                                                                        className="flex-1 mt-3 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1F7A6E] focus:ring-1 focus:ring-[#1F7A6E]"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); sendReply(notif.id); }}
                                                                        disabled={rs.sending || !rs.text?.trim()}
                                                                        className="mt-3 self-end px-3 py-2 bg-[#1F7A6E] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#165C53] disabled:opacity-50 transition-all"
                                                                    >
                                                                        {rs.sending ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '↩ Send'}
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-6 w-px bg-white/10 mx-1" />

                {/* User Info */}
                <div className="flex items-center gap-3 group relative cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#2D455A] flex items-center justify-center text-[11px] font-black text-white border border-white/10 group-hover:border-teal-400 transition-all">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] font-black text-white leading-none mb-1">{user.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Droga Pharma</p>
                    </div>

                    {/* Logout Tooltip/Dropdown Placeholder */}
                    <button
                        onClick={onLogout}
                        className="opacity-0 group-hover:opacity-100 absolute -bottom-10 right-0 bg-[#2D455A] text-white px-4 py-2 rounded shadow-xl text-[10px] font-black tracking-widest border border-white/10 hover:bg-red-500 transition-all z-[110]"
                    >
                        LOGOUT
                    </button>
                </div>
            </div>
        </nav>
    );
}
