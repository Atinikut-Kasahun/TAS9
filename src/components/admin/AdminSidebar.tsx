'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import {
    LayoutDashboard, FileText, Building2, Briefcase,
    Users, CalendarClock, Settings, HelpCircle,
    Image as ImageIcon, ChevronDown, ChevronRight,
    Globe, ClipboardList, LogOut
} from 'lucide-react';

interface AdminSidebarProps {
    user: any;
    tenants?: any[];
}

interface NavItem {
    label: string;
    href?: string;
    icon: React.ReactNode;
    children?: { label: string; href: string }[];
}

// Removed static navGroups since it needs dynamic tenants

const bottomItems = [
    { label: 'Settings', href: '/admin/settings', icon: <Settings size={16} /> },
];

export default function AdminSidebar({ user, tenants = [] }: AdminSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'Sister Companies': false });
    const isAdmin = user?.roles?.some((r: any) => r.slug === 'admin');
    const tenantName = user?.tenant?.name || 'Company Admin';

    const navGroups = [
        {
            group: 'Overview',
            items: [
                { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
            ]
        },
        ...(isAdmin ? [{
            group: 'Companies',
            items: [
                {
                    label: 'Sister Companies', icon: <Building2 size={16} />,
                    children: tenants.length > 0 ? tenants.map(t => ({
                        label: t.name,
                        href: `/admin/dashboard?company=${t.slug}`
                    })) : [
                        { label: 'No Companies Yet', href: '#' }
                    ]
                },
            ]
        }] : []),
        {
            group: 'Recruitment',
            items: [
                { label: 'Job Posts', href: '/admin/dashboard?tab=Jobs', icon: <Briefcase size={16} /> },
                { label: 'Applicants', href: '/admin/dashboard?tab=Candidates', icon: <Users size={16} /> },
                { label: 'Interview Schedule', href: '/admin/dashboard?tab=Calendar', icon: <CalendarClock size={16} /> },
                ...(isAdmin ? [{ label: 'Hiring Plan', href: '/admin/dashboard?tab=HiringPlan', icon: <ClipboardList size={16} /> }] : []),
            ]
        },
        {
            group: 'Organization',
            items: [
                { label: 'Team Members', href: '/admin/dashboard?tab=Users', icon: <Users size={16} /> },
                ...(isAdmin ? [
                    { label: 'Site Editor', href: '/admin/contents', icon: <Globe size={16} /> },
                    { label: 'Events', href: '/admin/dashboard?tab=Events', icon: <CalendarClock size={16} /> },
                ] : []),
            ]
        },
    ];

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const isActive = (href: string) => {
        if (!href || href === '#') return false;
        const [path, query] = href.split('?');
        if (query) {
            const param = new URLSearchParams(query);
            for (const [key, val] of param.entries()) {
                if (searchParams.get(key) !== val) return false;
            }
            return pathname === path;
        }
        return pathname === href && !searchParams.toString();
    };

    return (
        <aside className="w-56 min-h-screen bg-[#1E2A35] flex flex-col fixed top-0 left-0 z-50 shadow-2xl">
            {/* Header / Logo */}
            <div className="px-5 py-5 border-b border-white/5">
                <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-lg ${isAdmin ? 'bg-[#1F7A6E]' : 'bg-blue-500'}`}>
                        {isAdmin ? 'D' : tenantName.charAt(0)}
                    </div>
                    <div>
                        <p className="text-white font-black text-sm tracking-tight leading-none truncate max-w-[120px]">
                            {isAdmin ? 'DROGA' : tenantName}
                        </p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isAdmin ? 'text-[#1F7A6E]' : 'text-blue-400'}`}>
                            {isAdmin ? 'Admin Panel' : 'Talent Portal'}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {navGroups.map((group) => (
                    <div key={group.group}>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] px-2 mb-1.5">
                            {group.group}
                        </p>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                if ('children' in item && item.children) {
                                    const open = expandedGroups[item.label];
                                    return (
                                        <div key={item.label}>
                                            <button
                                                onClick={() => toggleGroup(item.label)}
                                                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold group"
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    <span className="text-gray-500 group-hover:text-[#1F7A6E] transition-colors">{item.icon}</span>
                                                    {item.label}
                                                </span>
                                                {open ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
                                            </button>
                                            {open && (
                                                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                                                    {item.children.map(child => (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            className={`block px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${isActive(child.href)
                                                                ? 'text-white bg-[#1F7A6E]/20 font-bold'
                                                                : 'text-gray-500 hover:text-gray-200'}`}
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                const href = (item as any).href as string;
                                const active = isActive(href);
                                return (
                                    <Link
                                        key={item.label}
                                        href={href}
                                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all group ${active
                                            ? 'bg-[#1F7A6E]/20 text-white border border-[#1F7A6E]/30'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className={`transition-colors ${active ? 'text-[#1F7A6E]' : 'text-gray-500 group-hover:text-[#1F7A6E]'}`}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1F7A6E]" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-white/5 px-3 py-3 space-y-0.5">
                {bottomItems.map(item => (
                    <Link key={item.label} href={item.href}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-all group">
                        <span className="group-hover:text-[#1F7A6E] transition-colors">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}

                {/* User Profile */}
                <div className="mt-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2.5 px-2.5 py-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${isAdmin ? 'bg-[#1F7A6E]/30 border border-[#1F7A6E]/50 text-[#1F7A6E]' : 'bg-blue-500/30 border border-blue-500/50 text-blue-400'}`}>
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-[11px] font-bold truncate leading-none">{user?.name}</p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isAdmin ? 'text-[#1F7A6E]' : 'text-blue-400'}`}>
                                {user?.roles?.[0]?.name || 'Manager'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
