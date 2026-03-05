'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DeptManagerDashboard from './DeptManagerDashboard';
import HRManagerDashboard from './HRManagerDashboard';
import TADashboard from './TADashboard';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

// Full-screen spinner shown while we determine who the user is
function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#F5F6FA] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#008170] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-bold tracking-wide">Loading your workspace…</p>
        </div>
    );
}

function DashboardContent() {
    const [user, setUser] = useState<any>(null);
    const [ready, setReady] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'Jobs';

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/login');
            return;
        }
        try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
        } catch (e) {
            localStorage.removeItem('user');
            router.push('/login');
        }
        setReady(true);
    }, [router]);

    const handleLogout = async () => {
        try {
            await apiFetch('/v1/logout', { method: 'POST' });
        } catch (_) {
            // Silence logout errors as it may be due to expired token
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const roleSlug: string = (() => {
        const roles = user?.roles;
        if (!roles || roles.length === 0) return 'ta_manager';
        const first = roles[0];
        return (typeof first === 'string' ? first : first?.slug || first?.name || 'ta_manager').toLowerCase();
    })();

    useEffect(() => {
        if (ready && user && roleSlug === 'admin') {
            router.push('/admin/dashboard');
        }
    }, [ready, user, roleSlug, router]);

    if (!ready || !user || roleSlug === 'admin') return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-[#F5F6FA]">
            <Navbar user={user} onLogout={handleLogout} />

            <div className="max-w-[1400px] mx-auto pt-10 px-8">
                {/* Dashboard Switch based on Role & Current Tab */}
                {activeTab === 'Calendar' ? (
                    <TADashboard user={user} activeTab={activeTab} onLogout={handleLogout} />
                ) : roleSlug === 'hiring_manager' ? (
                    <DeptManagerDashboard user={user} activeTab={activeTab} onLogout={handleLogout} />
                ) : roleSlug === 'hr_manager' ? (
                    <HRManagerDashboard user={user} activeTab={activeTab} onLogout={handleLogout} />
                ) : (
                    <TADashboard user={user} activeTab={activeTab} onLogout={handleLogout} />
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <DashboardContent />
        </Suspense>
    );
}
