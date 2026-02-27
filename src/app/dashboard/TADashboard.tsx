'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, API_URL } from '@/lib/api';

export default function TADashboard({ user, activeTab: initialTab, onLogout }: { user: any; activeTab: string; onLogout: () => void }) {
    const [jobs, setJobs] = useState<any[]>([]);
    const [requisitions, setRequisitions] = useState<any[]>([]);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [applicantsPagination, setApplicantsPagination] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [search, setSearch] = useState(''); // live search term from URL
    const [subTab, setSubTab] = useState('NEW'); // Represents the local view/stage
    const [drawerReq, setDrawerReq] = useState<any>(null);
    const [drawerApp, setDrawerApp] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [offerModal, setOfferModal] = useState(false);
    const [offerForm, setOfferForm] = useState({ salary: '', startDate: '', notes: '' });
    const [rejectModal, setRejectModal] = useState(false);
    const [rejectionNote, setRejectionNote] = useState('');
    const [reportFilters, setReportFilters] = useState({ dateRange: '30', department: 'All', jobId: 'All' });
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [interviewsList, setInterviewsList] = useState<any[]>([]);

    // Interview Scheduling Modal State
    const [scheduleModal, setScheduleModal] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', type: 'video', location: '', interviewer_id: '', message: '' });

    // Notifications & Mentions
    const [mentionUser, setMentionUser] = useState('');
    const [mentionNote, setMentionNote] = useState('');
    const [mentionLoading, setMentionLoading] = useState(false);
    const [mentionSuccess, setMentionSuccess] = useState(false);
    const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);

    useEffect(() => {
        if (drawerApp) {
            apiFetch('/v1/users').then(data => setDepartmentUsers(data || []));
        }
    }, [drawerApp]);

    // Poll URL for live search changes written by Navbar
    useEffect(() => {
        const interval = setInterval(() => {
            const params = new URLSearchParams(window.location.search);
            const s = params.get('search') ?? '';
            setSearch(prev => (prev !== s ? s : prev));
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const handleSendMention = async () => {
        if (!mentionUser || !mentionNote.trim()) return;
        setMentionLoading(true);
        setMentionSuccess(false);
        try {
            await apiFetch(`/v1/applicants/${drawerApp.id}/mention`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: mentionUser, note: mentionNote }),
            });
            setMentionNote('');
            setMentionSuccess(true);
            setTimeout(() => setMentionSuccess(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setMentionLoading(false);
        }
    };

    // Refetch when filters change
    useEffect(() => {
        if (initialTab === 'Reports') {
            fetchData(1);
        }
    }, [reportFilters]);

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            if (initialTab === 'Reports') {
                const params = new URLSearchParams({
                    date_range: reportFilters.dateRange,
                    department: reportFilters.department,
                    job_id: reportFilters.jobId
                });
                const statsData = await apiFetch(`/v1/applicants/stats?${params.toString()}`);
                setStats(statsData);
            }

            const tabToStatusMap: { [key: string]: string } = {
                'NEW': 'new',
                'INTERVIEWS': 'interview',
                'OFFERS': 'offer',
                'REJECTED': 'rejected',
                'HIRED': 'hired',
                'ACTIVE': 'active',
                'ARCHIVED': 'archived',
                'REQUISITIONS': 'ALL',
                'OVERVIEW': 'ALL',
            };

            const currentStatus = tabToStatusMap[subTab] ?? 'ALL';

            if (initialTab === 'Calendar') {
                const interviewsData = await apiFetch(`/v1/interviews?status=scheduled`);
                setInterviewsList(interviewsData || []);
                setApplicants([]); // Clear applicants
                setApplicantsPagination(null);
            } else {
                const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
                const [jobsData, reqsResponse, appsResponse] = await Promise.all([
                    apiFetch(`/v1/jobs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
                    apiFetch('/v1/requisitions'),
                    apiFetch(`/v1/applicants?page=${page}&status=${currentStatus}${searchParam}`),
                ]);
                setJobs(jobsData || []);
                setRequisitions(reqsResponse?.data || []);

                if (appsResponse?.data) {
                    setApplicants(appsResponse.data);
                    setApplicantsPagination({
                        total: appsResponse.total,
                        current_page: appsResponse.current_page,
                        last_page: appsResponse.last_page,
                        from: appsResponse.from,
                        to: appsResponse.to
                    });
                    setCurrentPage(appsResponse.current_page);
                } else {
                    setApplicants(appsResponse || []);
                    setApplicantsPagination(null);
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch dashboard data', err);
            setFetchError(err?.message || 'Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, [subTab, initialTab, search]); // Re-fetch when tab, globalTab, or search changes

    useEffect(() => {
        // Default sub-tab when global category changes
        if (initialTab === 'Candidates') setSubTab('NEW');
        else if (initialTab === 'Jobs') setSubTab('ACTIVE');
        else if (initialTab === 'Employees') setSubTab('HIRED');
        else if (initialTab === 'HiringPlan') setSubTab('REQUISITIONS');
        else if (initialTab === 'Reports') setSubTab('OVERVIEW');
        else if (initialTab === 'Calendar') setSubTab('UPCOMING');
    }, [initialTab]);


    const handlePostJob = async (req: any) => {
        setActionLoading(true);
        try {
            await apiFetch('/v1/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_requisition_id: req.id,
                    title: req.title,
                    description: req.description || `New opening for ${req.title} in ${req.department} department.`,
                    location: 'Addis Ababa',
                    type: 'full-time',
                }),
            });
            setDrawerReq(null);
            fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = async (applicantId: string, newStatus: string) => {
        setActionLoading(true);
        try {
            await apiFetch(`/v1/applicants/${applicantId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            setDrawerApp(null);
            fetchData(currentPage);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleScheduleInterview = async () => {
        if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.interviewer_id) return;
        setActionLoading(true);
        try {
            // Combine date and time to ISO format (assume local timezone)
            const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString();

            await apiFetch('/v1/interviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicant_id: drawerApp.id,
                    interviewer_id: scheduleForm.interviewer_id,
                    scheduled_at: scheduledAt,
                    type: scheduleForm.type,
                    location: scheduleForm.location,
                    message: scheduleForm.message
                }),
            });

            // Also update applicant status to interview
            await apiFetch(`/v1/applicants/${drawerApp.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'interview' }),
            });

            setDrawerApp((prev: any) => ({ ...prev, status: 'interview' }));
            setScheduleModal(false);
            setScheduleForm({ date: '', time: '', type: 'video', location: '', interviewer_id: '', message: '' });
            fetchData(currentPage);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendOffer = async () => {
        if (!offerForm.salary.trim()) return;
        setActionLoading(true);
        try {
            await apiFetch(`/v1/applicants/${drawerApp.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'offer',
                    offered_salary: offerForm.salary,
                    start_date: offerForm.startDate,
                    offer_notes: offerForm.notes,
                }),
            });
            setDrawerApp((prev: any) => ({ ...prev, status: 'offer' }));
            setOfferModal(false);
            setOfferForm({ salary: '', startDate: '', notes: '' });
            fetchData(currentPage);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendRejection = async () => {
        setActionLoading(true);
        try {
            await apiFetch(`/v1/applicants/${drawerApp.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected', rejection_note: rejectionNote }),
            });
            setDrawerApp((prev: any) => ({ ...prev, status: 'rejected' }));
            setRejectModal(false);
            setRejectionNote('');
            fetchData(currentPage);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Connection error banner */}
            <AnimatePresence>
                {fetchError && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mx-10 mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4"
                    >
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-red-700 uppercase tracking-wide">Connection Error</p>
                            <p className="text-xs text-red-600 mt-0.5">{fetchError}</p>
                        </div>
                        <button
                            onClick={() => { setFetchError(null); fetchData(1); }}
                            className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all"
                        >
                            Retry
                        </button>
                        <button onClick={() => setFetchError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Active Banner */}
            <AnimatePresence>
                {search && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-10 mt-2 p-3 bg-[#1F7A6E]/10 border border-[#1F7A6E]/20 rounded-2xl flex items-center gap-4"
                    >
                        <svg className="w-4 h-4 text-[#1F7A6E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-xs font-bold text-[#1F7A6E] flex-1">
                            Showing results for: <span className="font-black text-[#1A2B3D]">"{search}"</span>
                        </p>
                        <button
                            onClick={() => {
                                const url = new URL(window.location.href);
                                url.searchParams.delete('search');
                                window.history.replaceState({}, '', url);
                                setSearch('');
                            }}
                            className="text-[10px] font-black text-[#1F7A6E] uppercase tracking-widest hover:text-[#165C53] transition-colors"
                        >
                            Clear ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Page Header */}

            <div className="flex justify-between items-end mb-4">
                <div className="space-y-4">
                    {/* Breadcrumb trail */}
                    {(() => {
                        const tabLabels: { [key: string]: string } = {
                            'Candidates': 'Candidates',
                            'Jobs': 'Jobs',
                            'HiringPlan': 'Hiring Plan',
                            'Employees': 'Employees',
                            'Reports': 'Reports',
                        };
                        const subLabels: { [key: string]: string } = {
                            'NEW': 'New Applications',
                            'INTERVIEWS': 'Interview Stage',
                            'OFFERS': 'Offer Stage',
                            'REJECTED': 'Rejected',
                            'HIRED': 'Hired Roster',
                            'ACTIVE': 'Active Jobs',
                            'ARCHIVED': 'Archived Jobs',
                            'REQUISITIONS': 'Requisitions',
                            'OVERVIEW': 'Overview',
                        };
                        return (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span className="text-[#1F7A6E]">Droga Pharma</span>
                                <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                <span>{tabLabels[initialTab] || initialTab}</span>
                                {subLabels[subTab] && (
                                    <>
                                        <svg className="w-2.5 h-2.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                        <span className="text-[#1A2B3D] font-black">{subLabels[subTab]}</span>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                    <h1 className="text-[32px] font-bold text-[#1A2B3D] tracking-tight">Droga Pharma</h1>

                    {/* Hierarchical Sub Tabs - Contextual Logic */}
                    <div className="flex gap-10 border-b border-gray-100 mt-2">
                        {(() => {
                            let items: string[] = [];
                            if (initialTab === 'Candidates') items = ['NEW', 'INTERVIEWS', 'OFFERS', 'REJECTED'];
                            else if (initialTab === 'Jobs') items = ['ACTIVE', 'ARCHIVED'];
                            else if (initialTab === 'HiringPlan') items = ['REQUISITIONS'];
                            else if (initialTab === 'Employees') items = ['HIRED'];
                            else if (initialTab === 'Reports') items = ['OVERVIEW'];
                            else items = ['OVERVIEW'];

                            return items.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { setSubTab(t); setCurrentPage(1); }}
                                    className={`pb-4 text-[12px] font-black tracking-[0.15em] transition-all relative ${subTab === t
                                        ? 'text-[#1F7A6E]'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <span className="uppercase">{t}</span>
                                    {subTab === t && (
                                        <motion.div
                                            layoutId="activeSubTabIndicator"
                                            className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#1F7A6E] rounded-t-full"
                                        />
                                    )}
                                </button>
                            ));
                        })()}
                    </div>
                </div>

                {subTab === 'REQUISITIONS' && (
                    <button className="bg-[#1F7A6E] hover:bg-[#165C53] text-white px-6 py-3 rounded font-black text-[13px] tracking-wide shadow-xl shadow-[#1F7A6E]/20 transition-all flex items-center gap-2">
                        Create new requisition
                    </button>
                )}
            </div>

            {/* Content Table */}
            {loading ? (
                <div className="bg-white rounded border border-gray-100 p-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[#1F7A6E] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                    {initialTab === 'Jobs' && (
                        <table className="w-full text-left">
                            <thead className="bg-[#F9FAFB] border-b border-gray-100">
                                <tr>
                                    {['POSITION', 'LOCATION', 'DEPARTMENT', 'STATUS'].map(h => (
                                        <th key={h} className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {jobs
                                    .filter((j: any) => subTab === 'ACTIVE' ? j.status === 'active' : j.status === 'archived')
                                    .length === 0 ? (
                                    <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic text-sm">No {subTab.toLowerCase()} jobs found.</td></tr>
                                ) : jobs
                                    .filter((j: any) => subTab === 'ACTIVE' ? j.status === 'active' : j.status === 'archived')
                                    .map((job: any) => (
                                        <tr key={job.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-[#1A2B3D] group-hover:text-[#1F7A6E] transition-colors">{job.title}</p>
                                            </td>
                                            <td className="px-8 py-6 text-sm text-gray-500">{job.location || 'Addis Ababa'}</td>
                                            <td className="px-8 py-6 text-sm text-gray-500">{job.department || 'General'}</td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${job.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    )}

                    {(['Candidates', 'Employees'].includes(initialTab)) && (
                        <div className="flex flex-col">
                            {/* Header Section without inner filters */}
                            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-[#1A2B3D] flex items-center gap-3">
                                        <div className="w-2 h-8 bg-[#1F7A6E] rounded-full" />
                                        {subTab} PIPELINE
                                    </h2>
                                    <p className="text-xs font-medium text-gray-400">Manage talent through the {subTab.toLowerCase()} stage</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                                        Total: <span className="text-[#1A2B3D]">{applicantsPagination?.total || 0}</span>
                                    </p>
                                </div>
                            </div>

                            <table className="w-full text-left">
                                <thead className="bg-[#F9FAFB] border-b border-gray-100">
                                    <tr>
                                        {initialTab === 'Employees'
                                            ? ['CANDIDATE', 'APPLIED FOR', 'DEPARTMENT', 'EXPERIENCE', 'MATCHING', 'STATUS', 'APPLIED ON', 'HIRED ON'].map(h => (
                                                <th key={h} className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                            ))
                                            : ['CANDIDATE', 'APPLIED FOR', 'DEPARTMENT', 'EXPERIENCE', 'MATCHING', 'STATUS', 'APPLIED ON'].map(h => (
                                                <th key={h} className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {applicants.length === 0 ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic text-sm">No candidates in this stage.</td></tr>
                                    ) : (
                                        applicants.map((app: any) => (
                                            <tr
                                                key={app.id}
                                                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                                onClick={() => setDrawerApp(app)}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-[#1F7A6E] transition-all">
                                                            {app.photo_path ? (
                                                                <img
                                                                    src={app.photo_path.startsWith('http') ? app.photo_path : `${API_URL.replace('/api', '/storage')}/${app.photo_path}`}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=random`;
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="text-xs font-black text-gray-400">{app.name.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[13px] text-[#1A2B3D]">{app.name}</p>
                                                            <p className="text-[11px] text-gray-400 mt-0.5">{app.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[13px] text-gray-600 font-medium">
                                                    {app.job_posting?.title || 'Open Role'}
                                                </td>
                                                <td className="px-8 py-6 text-[13px] text-gray-600 font-medium">
                                                    {app.job_posting?.department || app.job_posting?.requisition?.department || '-'}
                                                </td>
                                                <td className="px-8 py-6 text-[13px] text-gray-600">
                                                    {app.years_of_experience || '0'} Years
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#1F7A6E]" style={{ width: `${app.match_score || 75}%` }} />
                                                    </div>
                                                    <p className="text-[10px] font-black text-[#1F7A6E] mt-1 uppercase">{app.match_score || 75}% Match</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {app.status === 'interview' && app.interviews && app.interviews.length > 0 ? (
                                                        <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-purple-50 text-purple-600">
                                                            Scheduled: {(() => {
                                                                const d = new Date(app.interviews[0].scheduled_at);
                                                                return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                                                            })()}
                                                        </span>
                                                    ) : (
                                                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${app.status === 'hired' ? 'bg-emerald-50 text-emerald-600' :
                                                            app.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                                                app.status === 'interview' ? 'bg-purple-50 text-purple-600' :
                                                                    app.status === 'offer' ? 'bg-amber-50 text-amber-600' :
                                                                        'bg-blue-50 text-blue-600'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    {app.created_at ? (() => {
                                                        const d = new Date(app.created_at);
                                                        const now = new Date();
                                                        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                                                        const relative = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
                                                        return (
                                                            <div>
                                                                <p className="text-[12px] font-bold text-[#1A2B3D]">
                                                                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                                    {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · <span className="text-[#1F7A6E] font-black">{relative}</span>
                                                                </p>
                                                            </div>
                                                        );
                                                    })() : <span className="text-gray-300 text-xs">—</span>}
                                                </td>
                                                {initialTab === 'Employees' && (
                                                    <td className="px-8 py-6">
                                                        {app.updated_at ? (() => {
                                                            const d = new Date(app.updated_at);
                                                            const now = new Date();
                                                            const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                                                            const relative = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
                                                            return (
                                                                <div>
                                                                    <p className="text-[12px] font-bold text-[#1A2B3D]">
                                                                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                                        {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · <span className="text-[#1F7A6E] font-black">{relative}</span>
                                                                    </p>
                                                                </div>
                                                            );
                                                        })() : <span className="text-gray-300 text-xs">—</span>}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {applicantsPagination && applicantsPagination.last_page > 1 && (
                                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                            Showing <span className="text-[#1A2B3D]">{applicantsPagination.from}</span> - <span className="text-[#1A2B3D]">{applicantsPagination.to}</span> of <span className="text-[#1A2B3D]">{applicantsPagination.total}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => fetchData(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1F7A6E] hover:border-[#1F7A6E] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                        </button>

                                        {[...Array(applicantsPagination.last_page)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => fetchData(i + 1)}
                                                className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all shadow-sm border ${currentPage === i + 1
                                                    ? 'bg-[#1F7A6E] text-white border-[#1F7A6E]'
                                                    : 'bg-white text-gray-400 border-gray-200 hover:border-[#1F7A6E] hover:text-[#1F7A6E]'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => fetchData(currentPage + 1)}
                                            disabled={currentPage === applicantsPagination.last_page}
                                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1F7A6E] hover:border-[#1F7A6E] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )
                            }
                        </div >
                    )
                    }

                    {
                        initialTab === 'Employees' && (
                            <div className="flex flex-col">
                                <table className="w-full text-left">
                                    <thead className="bg-[#F9FAFB] border-b border-gray-100">
                                        <tr>
                                            {['EMPLOYEE', 'ROLE', 'DEPARTMENT', 'JOINED DATE'].map(h => (
                                                <th key={h} className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {applicants.length === 0 ? (
                                            <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 italic text-sm">No hired employees yet.</td></tr>
                                        ) : applicants.map((app: any) => (
                                            <tr key={app.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setDrawerApp(app)}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-[#1F7A6E] transition-all">
                                                            {app.photo_path ? (
                                                                <img src={`${API_URL.replace('/api', '/storage')}/${app.photo_path}`} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-black text-gray-400">{app.name.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[13px] text-[#1A2B3D]">{app.name}</p>
                                                            <p className="text-[11px] text-gray-400 mt-0.5">{app.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[13px] text-gray-600 font-medium">{app.job_posting?.title || 'Team Member'}</td>
                                                <td className="px-8 py-6 text-[13px] text-gray-600">{app.job_posting?.department || 'Operations'}</td>
                                                <td className="px-8 py-6 text-[13px] text-gray-600">{new Date(app.updated_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Pagination for Employees */}
                                {applicantsPagination && applicantsPagination.last_page > 1 && (
                                    <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                                Exhibiting <span className="text-[#1A2B3D]">{applicantsPagination.from}</span> - <span className="text-[#1A2B3D]">{applicantsPagination.to}</span> of <span className="text-[#1A2B3D]">{applicantsPagination.total}</span> Talent
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => fetchData(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1F7A6E] hover:border-[#1F7A6E] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                            </button>
                                            {[...Array(applicantsPagination.last_page)].map((_, i) => (
                                                <button key={i + 1} onClick={() => fetchData(i + 1)} className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all shadow-sm border ${currentPage === i + 1 ? 'bg-[#1F7A6E] text-white border-[#1F7A6E]' : 'bg-white text-gray-400 border-gray-200 hover:border-[#1F7A6E] hover:text-[#1F7A6E]'}`}>
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button onClick={() => fetchData(currentPage + 1)} disabled={currentPage === applicantsPagination.last_page} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1F7A6E] hover:border-[#1F7A6E] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {
                        initialTab === 'HiringPlan' && (
                            <table className="w-full text-left">
                                <thead className="bg-[#F9FAFB] border-b border-gray-100">
                                    <tr>
                                        {['REQUISITION', 'HIRING MANAGER', 'REQUISITION OWNER', 'SALARY', 'PLAN DATE', 'STATUS'].map(h => (
                                            <th key={h} className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {requisitions.length === 0 ? (
                                        <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400 italic text-sm">No hiring plan items yet.</td></tr>
                                    ) : requisitions.map((req: any) => (
                                        <tr
                                            key={req.id}
                                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                            onClick={() => setDrawerReq(req)}
                                        >
                                            <td className="px-8 py-6">
                                                <p className="font-black text-[13px] text-[#0066CC] hover:underline group-hover:text-[#1F7A6E]">
                                                    REQ{req.id} {req.title}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5 tracking-tight">
                                                    {req.department} · {req.tenant?.name || 'Droga Pharma'}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-[13px] text-gray-600">
                                                {req.requester?.name || 'Hiring Manager'}
                                            </td>
                                            <td className="px-8 py-6 text-[13px] text-gray-600">
                                                {req.location || 'Addis Ababa'}
                                            </td>
                                            <td className="px-8 py-6 text-[13px] text-[#1A2B3D] font-black">
                                                ${req.budget ? (req.budget / 1000).toFixed(0) + 'k' : '45k'} /yr
                                            </td>
                                            <td className="px-8 py-6 text-[13px] text-gray-600">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                                    req.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-red-50 text-red-500'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    }

                    {
                        initialTab === 'Calendar' && (
                            <div className="flex flex-col">
                                <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-[#1A2B3D] flex items-center gap-3">
                                            <div className="w-2 h-8 bg-[#1F7A6E] rounded-full" />
                                            INTERVIEW CALENDAR
                                        </h2>
                                        <p className="text-xs font-medium text-gray-400">Manage and view all upcoming scheduled interviews</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                                            Upcoming: <span className="text-[#1A2B3D]">{interviewsList.length}</span>
                                        </p>
                                    </div>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-[#F9FAFB] border-b border-gray-100">
                                        <tr>
                                            {['CANDIDATE', 'CONTACT', 'INTERVIEW DATE & TIME', 'TYPE', 'STATUS'].map(h => (
                                                <th key={h} className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {interviewsList.length === 0 ? (
                                            <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic text-sm">No scheduled interviews found.</td></tr>
                                        ) : interviewsList.map((interview: any) => (
                                            <tr key={interview.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => {
                                                if (interview.applicant) setDrawerApp(interview.applicant);
                                            }}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-black">
                                                            {interview.applicant?.name?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[13px] text-[#1A2B3D]">{interview.applicant?.name || 'Unknown'}</p>
                                                            <p className="text-[11px] text-gray-400 mt-0.5">{interview.applicant?.job_posting?.title || 'Open Role'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[12px] font-medium text-gray-600">{interview.applicant?.email || 'N/A'}</p>
                                                    <p className="text-[11px] text-gray-400">{interview.applicant?.phone || '-'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1F7A6E] group-hover:text-white transition-colors">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#1A2B3D] text-[13px]">
                                                                {new Date(interview.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </p>
                                                            <p className="text-[#1F7A6E] font-black text-[11px]">
                                                                {new Date(interview.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[13px] text-gray-600 capitalize font-medium">
                                                    {interview.type}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                                        Confirmed
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    }
                    {
                        initialTab === 'Reports' && (
                            <div className="p-10 space-y-10">
                                {/* Global Filter Bar */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between sticky top-0 z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">📅</div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Timeframe</p>
                                                <select
                                                    value={reportFilters.dateRange}
                                                    onChange={e => setReportFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                                                    className="text-sm font-bold text-[#1A2B3D] bg-transparent outline-none cursor-pointer"
                                                >
                                                    <option value="7">Last 7 Days</option>
                                                    <option value="30">Last 30 Days</option>
                                                    <option value="90">Last 90 Days</option>
                                                    <option value="All">All Time</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">🏢</div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Department</p>
                                                <select
                                                    value={reportFilters.department}
                                                    onChange={e => setReportFilters(prev => ({ ...prev, department: e.target.value }))}
                                                    className="text-sm font-bold text-[#1A2B3D] bg-transparent outline-none cursor-pointer"
                                                >
                                                    <option value="All">All Departments</option>
                                                    {[...new Set(jobs.map(j => j.department || j.requisition?.department).filter(Boolean))].map(dept => (
                                                        <option key={String(dept)} value={String(dept)}>{String(dept)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100" />
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">💼</div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Specific Role</p>
                                                <select
                                                    value={reportFilters.jobId}
                                                    onChange={e => setReportFilters(prev => ({ ...prev, jobId: e.target.value }))}
                                                    className="text-sm font-bold text-[#1A2B3D] bg-transparent outline-none cursor-pointer w-48 truncate"
                                                >
                                                    <option value="All">All Open Roles</option>
                                                    {jobs.map(job => (
                                                        <option key={job.id} value={job.id}>{job.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button onClick={() => fetchData(1)} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                                            ↻ Refresh
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!stats || !stats.raw_data) return;

                                                const timestamp = new Date().toISOString();
                                                const recruiterId = user?.id || 'SYS';

                                                // Build Standardized Tabular Headers
                                                const headers = [
                                                    'Candidate_Name',
                                                    'Candidate_Email',
                                                    'Candidate_Phone',
                                                    'Job_Title',
                                                    'Department',
                                                    'Current_Status',
                                                    'Application_Date',
                                                    'Hired_Date_Time'
                                                ];

                                                const rows = stats.raw_data.map((row: any) => {
                                                    const appDate = row.created_at ? row.created_at.split('T')[0] : '';
                                                    let hiredDateTime = '';
                                                    if (row.status === 'hired' && row.updated_at) {
                                                        // Convert "2026-02-27T04:26:07.000000Z" to "2026-02-27 04:26:07"
                                                        hiredDateTime = row.updated_at.replace('T', ' ').split('.')[0];
                                                    }

                                                    return [
                                                        `"${(row.name || '').replace(/"/g, '""')}"`,
                                                        `"${(row.email || '').replace(/"/g, '""')}"`,
                                                        `"${(row.phone || '').replace(/"/g, '""')}"`,
                                                        `"${(row.job_title || '').replace(/"/g, '""')}"`,
                                                        `"${(row.department || '').replace(/"/g, '""')}"`,
                                                        `"${(row.status || '').replace(/"/g, '""')}"`,
                                                        appDate,
                                                        `"${hiredDateTime}"`
                                                    ];
                                                });

                                                const csvContent = "data:text/csv;charset=utf-8,"
                                                    + [headers.join(","), ...rows.map((e: string[]) => e.join(","))].join("\n");

                                                const encodedUri = encodeURI(csvContent);
                                                const link = document.createElement("a");
                                                link.setAttribute("href", encodedUri);
                                                link.setAttribute("download", `Candidate_Export_${timestamp.split('T')[0]}.csv`);
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="px-4 py-2 bg-[#1A2B3D] text-white rounded-lg text-xs font-bold hover:bg-[#1A2B3D]/90 transition-colors shadow-lg shadow-[#1A2B3D]/20"
                                        >
                                            Export CSV
                                        </button>
                                    </div>
                                </div>

                                {/* Analytics Stat Grid */}
                                <div className="grid grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Placements', value: stats?.funnel?.hired || 0, icon: '🏆', color: 'emerald' },
                                        { label: 'Active Pipeline', value: (stats?.funnel?.applied || 0) - (stats?.funnel?.hired || 0) - (stats?.funnel?.rejected || 0), icon: '🔥', color: 'blue' },
                                        { label: 'Pending Reqs', value: stats?.requisitions?.pending || 0, icon: '⏳', color: 'amber' },
                                        { label: 'Success Rate', value: stats?.funnel?.applied > 0 ? Math.round((stats.funnel.hired / stats.funnel.applied) * 100) + '%' : '0%', icon: '📈', color: 'indigo' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 hover:scale-[1.02] transition-transform group">
                                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-xl mb-4 group-hover:rotate-12 transition-transform`}>{stat.icon}</div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-3xl font-black text-[#1A2B3D]">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-10">
                                    {/* Application Funnel (Interactive) */}
                                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
                                        <h3 className="text-[13px] font-black text-[#1A2B3D] uppercase tracking-widest mb-8 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#1F7A6E]" />
                                            Hiring Funnel Analytics
                                        </h3>
                                        <div className="space-y-6 flex-1">
                                            {[
                                                { label: 'Applied', raw: 'new', tab: 'NEW', count: stats?.funnel?.applied || 0, color: '#1F7A6E', pct: 100 },
                                                { label: 'Interviewed', raw: 'interview', tab: 'INTERVIEWS', count: stats?.funnel?.interview || 0, color: '#0066CC', pct: stats?.funnel?.applied ? Math.round(((stats?.funnel?.interview || 0) / stats.funnel.applied) * 100) : 0 },
                                                { label: 'Offered', raw: 'offer', tab: 'OFFERS', count: stats?.funnel?.offer || 0, color: '#9B51E0', pct: stats?.funnel?.applied ? Math.round(((stats?.funnel?.offer || 0) / stats.funnel.applied) * 100) : 0 },
                                                { label: 'Hired', raw: 'hired', tab: 'HIRED', count: stats?.funnel?.hired || 0, color: '#27AE60', pct: stats?.funnel?.applied ? Math.round(((stats?.funnel?.hired || 0) / stats.funnel.applied) * 100) : 0 },
                                            ].map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="space-y-2 cursor-pointer group"
                                                    onClick={() => {
                                                        // Navigate to the Candidates tab and set the subTab
                                                        const url = new URL(window.location.href);
                                                        url.searchParams.set('tab', 'Candidates');
                                                        window.history.pushState({}, '', url);
                                                        setSubTab(item.tab);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-end">
                                                        <p className="text-[11px] font-black text-gray-400 group-hover:text-[#1A2B3D] transition-colors uppercase tracking-widest flex items-center gap-2">
                                                            {item.label}
                                                            <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                                        </p>
                                                        <p className="text-sm font-black text-[#1A2B3D]">{item.count} Talent</p>
                                                    </div>
                                                    <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5 group-hover:border-gray-200 transition-colors">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.pct}%` }}
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                💡 Click any stage to jump directly to those candidates
                                            </p>
                                        </div>
                                    </div>

                                    {/* Velocity & Sourcing Column */}
                                    <div className="space-y-10 flex flex-col">

                                        {/* Time To Hire Module */}
                                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <svg className="w-24 h-24 text-[#0066CC]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                                            </div>
                                            <h3 className="text-[13px] font-black text-[#1A2B3D] uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                                                <div className="w-2 h-2 rounded-full bg-[#0066CC]" />
                                                Velocity: Time-to-Hire
                                            </h3>
                                            <div className="flex items-end gap-4 relative z-10">
                                                <p className="text-5xl font-black text-[#1A2B3D] tracking-tighter">
                                                    {stats?.velocity?.average_time_to_hire_days || 0}
                                                </p>
                                                <div className="space-y-1 pb-1">
                                                    <p className="text-[14px] font-bold text-gray-500">Days on average</p>
                                                    <p className="text-[10px] font-black text-[#0066CC] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded inline-block">From App to Offer</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Candidate Sources */}
                                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex-1">
                                            <h3 className="text-[13px] font-black text-[#1A2B3D] uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#9B51E0]" />
                                                Candidate Sources
                                            </h3>
                                            <div className="space-y-4">
                                                {stats?.sources?.map((src: any, i: number) => {
                                                    const total = stats?.funnel?.applied || 1; // Prevent div by zero
                                                    const pct = Math.round((src.count / total) * 100);
                                                    return (
                                                        <div key={i} className="flex items-center gap-4 group">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm shadow-sm group-hover:border-[#9B51E0] transition-colors">
                                                                {src.source === 'LinkedIn' ? '💼' : src.source === 'Website' ? '🌐' : src.source === 'Referral' ? '🤝' : '📢'}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-end mb-1.5">
                                                                    <p className="text-[12px] font-bold text-[#1A2B3D]">{src.source || 'Direct Applied'}</p>
                                                                    <p className="text-[10px] font-black text-gray-400">{src.count} ({pct}%)</p>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-[#9B51E0] rounded-full" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(!stats?.sources || stats.sources.length === 0) && (
                                                    <p className="text-gray-400 italic text-sm text-center py-6">No sourcing data available.</p>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            )
            }

            {/* Requisition Detail Side Drawer */}
            <AnimatePresence>
                {drawerReq && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDrawerReq(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[120] flex flex-col"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-[#1F7A6E] tracking-widest uppercase mb-1">REQ{drawerReq.id} Details</p>
                                    <h2 className="text-2xl font-black text-[#1A2B3D]">{drawerReq.title}</h2>
                                    <p className="text-gray-400 text-sm mt-1">{drawerReq.department} · {drawerReq.tenant?.name || 'Droga Pharma'}</p>
                                </div>
                                <button onClick={() => setDrawerReq(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <section className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Status</p>
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${drawerReq.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                            drawerReq.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
                                            }`}>
                                            {drawerReq.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Requested By</p>
                                        <p className="text-sm font-bold text-[#1A2B3D]">{drawerReq.requester?.name || 'Hiring Manager'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Location / Branch</p>
                                        <p className="text-sm font-bold text-[#1A2B3D]">{drawerReq.location || 'Addis Ababa (Bole)'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Priority</p>
                                        <p className="text-sm font-bold uppercase text-orange-500">{drawerReq.priority}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Budget Salary</p>
                                        <p className="text-sm font-black text-[#1A2B3D]">${drawerReq.budget ? (drawerReq.budget / 1000).toFixed(0) + 'k' : '45k'} /yr</p>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Description & Justification</h3>
                                    <div className="text-sm text-gray-600 leading-relaxed bg-white p-6 rounded border border-gray-100 italic">
                                        "{drawerReq.description || 'No detailed description provided.'}"
                                    </div>
                                </section>

                                {drawerReq.status === 'approved' && (
                                    <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-4">
                                        <div className="bg-emerald-500 text-white p-2 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0114 0z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-emerald-800 uppercase tracking-wide">Approved & Ready</h4>
                                            <p className="text-xs text-emerald-600 mt-1 leading-relaxed">This requisition has been signed off by HR. You can now publish it to the external careers portal.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Requisition Action Bar */}
                            <div className="p-8 border-t border-gray-100 bg-gray-50/30">
                                {drawerReq.status === 'approved' ? (
                                    <button
                                        onClick={() => handlePostJob(drawerReq)}
                                        disabled={actionLoading}
                                        className="w-full py-5 bg-[#1F7A6E] text-white rounded-lg text-[13px] font-black tracking-widest uppercase shadow-xl shadow-[#1F7A6E]/20 hover:bg-[#165C53] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Post Job to Public Portal
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full py-5 bg-gray-100 text-gray-300 rounded-lg text-[13px] font-black tracking-widest uppercase cursor-not-allowed"
                                    >
                                        Awaiting HR Approval
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Applicant Detail Side Drawer */}
            <AnimatePresence>
                {drawerApp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDrawerApp(null)}
                            className="fixed inset-0 bg-[#1A2B3D]/40 backdrop-blur-sm z-[150]"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-[160] flex flex-col"
                        >
                            <div className="flex-1 overflow-y-auto pb-10 flex flex-col">
                                {/* Premium Profile Header - Now Sticky & Inside Scrollable */}
                                <div className="sticky top-0 z-[70] h-64 bg-[#1A2B3D] flex items-center px-10 shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#1F7A6E]/30 to-transparent opacity-40" />
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                                    <button
                                        onClick={() => setDrawerApp(null)}
                                        className="absolute top-8 right-8 text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-2.5 rounded-xl backdrop-blur-md z-[80]"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>

                                    <div className="relative flex items-center gap-8 w-full">
                                        <div className="w-32 h-32 rounded-[36px] bg-white p-1 shadow-2xl overflow-hidden border-4 border-white/10 shrink-0">
                                            {drawerApp.photo_path ? (
                                                <img
                                                    src={drawerApp.photo_path.startsWith('http') ? drawerApp.photo_path : `${API_URL.replace('/api', '/storage')}/${drawerApp.photo_path}`}
                                                    alt={drawerApp.name}
                                                    className="w-full h-full object-cover rounded-[30px]"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#1F7A6E] to-[#165C53] rounded-[30px] flex items-center justify-center text-white text-4xl font-black shadow-inner">
                                                    {drawerApp.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-4xl font-black text-white leading-tight tracking-tight drop-shadow-sm">{drawerApp.name}</h2>
                                            <div className="inline-flex items-center gap-2 bg-[#1F7A6E] px-3 py-1 rounded-lg">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                <p className="text-white font-black text-[10px] uppercase tracking-widest">{drawerApp.job_posting?.title || 'Open Role'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-10 space-y-10 flex-1">
                                    {/* Enhanced Stat Grid */}
                                    <section className="grid grid-cols-3 gap-6 -mt-8 relative z-[75]">
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Experience</p>
                                            <p className="text-2xl font-black text-[#1A2B3D]">{drawerApp.years_of_experience ?? drawerApp.experience ?? 'N/A'} <span className="text-xs text-gray-400 font-bold uppercase ml-1">Years</span></p>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Match Score</p>
                                            <div className="flex items-center gap-2.5">
                                                <p className="text-2xl font-black text-[#1F7A6E]">{drawerApp.match_score || 88}%</p>
                                                <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                    <div className="h-full bg-gradient-to-r from-[#1F7A6E] to-[#2ecc71]" style={{ width: `${drawerApp.match_score || 88}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Age / Gender</p>
                                            <p className="text-lg font-black text-[#1A2B3D]">{drawerApp.age || 'N/A'} <span className="text-gray-300 mx-1">•</span> {drawerApp.gender || 'N/A'}</p>
                                        </div>
                                    </section>

                                    {/* Detailed Info Cards */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <section className="space-y-4">
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1F7A6E]" />
                                                Candidate Profile
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-white transition-colors">
                                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#1F7A6E]">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Email Address</p>
                                                        <p className="text-sm font-bold text-[#1A2B3D] truncate">{drawerApp.email}</p>
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-white transition-colors">
                                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#1F7A6E]">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Phone Number</p>
                                                        <p className="text-sm font-bold text-[#1A2B3D] truncate">{drawerApp.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#1F7A6E]" />
                                                Professional Links
                                            </h3>
                                            <div className="space-y-3">
                                                {drawerApp.portfolio_link ? (
                                                    <a
                                                        href={drawerApp.portfolio_link}
                                                        target="_blank"
                                                        className="p-5 bg-[#1F7A6E]/5 rounded-2xl border border-[#1F7A6E]/10 flex items-center gap-4 hover:bg-[#1F7A6E]/10 transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-[#1F7A6E] flex items-center justify-center text-white shadow-lg shadow-[#1F7A6E]/20">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 019-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] font-black text-[#1F7A6E] uppercase leading-none mb-1">Portfolio</p>
                                                            <p className="text-sm font-bold text-[#1A2B3D] group-hover:underline flex items-center gap-1">Visit Portfolio <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></p>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <div className="p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-[11px] font-bold uppercase tracking-widest italic h-[116px]">
                                                        No Portfolio Provided
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>

                                    <section className="space-y-4">
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#1F7A6E]" />
                                            Professional Background
                                        </h3>
                                        <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 italic text-[#1A2B3D] leading-relaxed relative overflow-hidden group hover:bg-white hover:shadow-xl transition-all">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1F7A6E]" />
                                            <div className="absolute top-4 left-4 text-6xl text-gray-200/50 select-none group-hover:text-[#1F7A6E]/10 transition-colors">“</div>
                                            <p className="relative z-10 pl-6 text-[15px] font-medium opacity-80">{drawerApp.professional_background || "No professional summary provided."}</p>
                                        </div>
                                    </section>

                                    {/* Supporting Documents */}
                                    <section className="space-y-4">
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#1F7A6E]" />
                                            Supporting Documents
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="p-6 bg-white rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-[#1F7A6E]/20 hover:bg-gray-50/50 transition-all shadow-sm">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all shadow-inner">
                                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[#1A2B3D] uppercase tracking-tighter">Professional Resume</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">PDF Document</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`${API_URL}/v1/applicants/${drawerApp.id}/resume`}
                                                    target="_blank"
                                                    className="px-8 py-3 bg-white border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A2B3D] hover:text-white hover:border-[#1A2B3D] transition-all shadow-sm"
                                                >
                                                    Open Document
                                                </a>
                                            </div>

                                            {drawerApp.attachments?.map((file: any, i: number) => (
                                                <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 flex items-center justify-between group hover:border-[#F7F8FA] hover:bg-[#F7F8FA] transition-all shadow-sm">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-[#1A2B3D] group-hover:text-white transition-all shadow-inner">
                                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-[#1A2B3D] uppercase tracking-tighter truncate max-w-[200px]">{file.label || 'Additional File'}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{file.file_type?.toUpperCase() || 'FILE'}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`${API_URL}/v1/attachments/${file.id}/view`}
                                                        target="_blank"
                                                        className="px-8 py-3 bg-white border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A2B3D] hover:text-white hover:border-[#1A2B3D] transition-all shadow-sm"
                                                    >
                                                        Open File
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Team Collaboration / Mentions */}
                                    <section className="space-y-4">
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#1F7A6E]" />
                                            Team Collaboration
                                        </h3>
                                        <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 space-y-4">
                                            <p className="text-xs text-gray-500 font-medium">@Mention a manager to request review or leave interior feedback on this candidate.</p>

                                            <div className="flex gap-4">
                                                <select
                                                    value={mentionUser}
                                                    onChange={(e) => setMentionUser(e.target.value)}
                                                    className="w-1/3 bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#1F7A6E] focus:ring-1 focus:ring-[#1F7A6E] font-medium"
                                                >
                                                    <option value="" disabled>Select Manager</option>
                                                    {departmentUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                                    ))}
                                                </select>

                                                <input
                                                    type="text"
                                                    value={mentionNote}
                                                    onChange={(e) => setMentionNote(e.target.value)}
                                                    placeholder="Type your message..."
                                                    className="flex-1 bg-white border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#1F7A6E] focus:ring-1 focus:ring-[#1F7A6E]"
                                                />

                                                <button
                                                    onClick={handleSendMention}
                                                    disabled={mentionLoading || !mentionUser || !mentionNote.trim()}
                                                    className="px-6 bg-[#1A2B3D] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#1A2B3D]/90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-[#1A2B3D]/10"
                                                >
                                                    {mentionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'SEND'}
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {mentionSuccess && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700"
                                                    >
                                                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Success</p>
                                                            <p className="text-[11px] font-medium opacity-80">Message sent successfully.</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </section>
                                </div> {/* End of content padding */}
                            </div> {/* End of scrollable container */}

                            {/* Action Bar */}
                            <div className="p-8 border-t border-gray-100 bg-[#F9FAFB]/80 backdrop-blur-xl flex gap-5">
                                {drawerApp.status !== 'hired' && drawerApp.status !== 'rejected' && (
                                    <>
                                        {/* NEW / APPLIED → Move to Interview (Now opens Schedule Modal) */}
                                        {(drawerApp.status === 'applied' || drawerApp.status === 'new' || drawerApp.status === 'phone_screen') && (
                                            <button
                                                onClick={() => {
                                                    // Auto-select first department user as default interviewer
                                                    if (departmentUsers.length > 0) {
                                                        setScheduleForm(p => ({ ...p, interviewer_id: departmentUsers[0].id }));
                                                    }
                                                    setScheduleModal(true);
                                                }}
                                                disabled={actionLoading}
                                                className="flex-1 py-5 bg-gradient-to-r from-[#1F7A6E] to-[#165C53] text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#1F7A6E]/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                                            >
                                                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '📅 Schedule Interview'}
                                            </button>
                                        )}

                                        {/* INTERVIEW → Send Offer Letter (opens modal) */}
                                        {drawerApp.status === 'interview' && (
                                            <button
                                                onClick={() => setOfferModal(true)}
                                                disabled={actionLoading}
                                                className="flex-1 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                                            >
                                                ✉️ Send Offer Letter
                                            </button>
                                        )}

                                        {/* OFFER → Hire Candidate */}
                                        {drawerApp.status === 'offer' && (
                                            <button
                                                onClick={() => handleStatusUpdate(drawerApp.id, 'hired')}
                                                disabled={actionLoading}
                                                className="flex-1 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                                            >
                                                {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '🏆 Confirm Hire'}
                                            </button>
                                        )}

                                        {/* Reject always visible (unless already final) */}
                                        <button
                                            onClick={() => handleStatusUpdate(drawerApp.id, 'rejected')}
                                            disabled={actionLoading}
                                            className="flex-1 py-5 bg-white text-red-500 border-2 border-red-50 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-50 hover:border-red-100 transition-all"
                                        >
                                            {actionLoading ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" /> : '✕ Reject'}
                                        </button>
                                    </>
                                )}
                                {drawerApp.status === 'hired' && (
                                    <div className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                                        🏆 Active Employee
                                    </div>
                                )}
                                {drawerApp.status === 'rejected' && (
                                    <div className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest border border-red-100">
                                        Application Closed (Rejected)
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Offer Letter Modal */}
            <AnimatePresence>
                {offerModal && drawerApp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                        style={{ background: 'rgba(26,43,61,0.6)', backdropFilter: 'blur(8px)' }}
                        onClick={() => setOfferModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8">
                                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Next Step</p>
                                <h3 className="text-2xl font-black text-white">Send Offer Letter</h3>
                                <p className="text-sm text-white/80 mt-1">to {drawerApp.name} · {drawerApp.email}</p>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Offered Salary <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ETB 45,000 / month or $3,500 / month"
                                        value={offerForm.salary}
                                        onChange={e => setOfferForm(p => ({ ...p, salary: e.target.value }))}
                                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-amber-400 focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Proposed Start Date</label>
                                    <input
                                        type="date"
                                        value={offerForm.startDate}
                                        onChange={e => setOfferForm(p => ({ ...p, startDate: e.target.value }))}
                                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-amber-400 focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Additional Notes (optional)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. signing bonus, remote work policy, probation period..."
                                        value={offerForm.notes}
                                        onChange={e => setOfferForm(p => ({ ...p, notes: e.target.value }))}
                                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-amber-400 focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors resize-none"
                                    />
                                </div>

                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[12px] text-amber-700 font-medium">
                                    📧 A professional offer letter will be emailed directly to <strong>{drawerApp.email}</strong> with all the details above.
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="px-8 pb-8 flex gap-4">
                                <button
                                    onClick={() => setOfferModal(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendOffer}
                                    disabled={actionLoading || !offerForm.salary.trim()}
                                    className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-amber-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '✉️ Send Offer Letter'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Schedule Interview Modal */}
            <AnimatePresence>
                {scheduleModal && drawerApp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                        style={{ background: 'rgba(26,43,61,0.6)', backdropFilter: 'blur(8px)' }}
                        onClick={() => setScheduleModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-[#1F7A6E] to-[#165C53] p-8 shrink-0">
                                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Schedule Stage</p>
                                <h3 className="text-2xl font-black text-white">Schedule Interview</h3>
                                <p className="text-sm text-white/80 mt-1">with {drawerApp.name} · {drawerApp.job_posting?.title || 'Open Role'}</p>
                            </div>

                            {/* Modal Body (Scrollable if needed) */}
                            <div className="p-8 space-y-6 overflow-y-auto flex-1">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Date <span className="text-red-400">*</span></label>
                                        <input
                                            type="date"
                                            value={scheduleForm.date}
                                            onChange={e => setScheduleForm(p => ({ ...p, date: e.target.value }))}
                                            className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-[#1F7A6E] focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Time <span className="text-red-400">*</span></label>
                                        <input
                                            type="time"
                                            value={scheduleForm.time}
                                            onChange={e => setScheduleForm(p => ({ ...p, time: e.target.value }))}
                                            className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-[#1F7A6E] focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Format <span className="text-red-400">*</span></label>
                                        <select
                                            value={scheduleForm.type}
                                            onChange={e => setScheduleForm(p => ({ ...p, type: e.target.value }))}
                                            className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-[#1F7A6E] focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors"
                                        >
                                            <option value="video">Video Call</option>
                                            <option value="phone">Phone Screen</option>
                                            <option value="in-person">In-Person</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Location / Link</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Google Meet link or HQ Address"
                                            value={scheduleForm.location}
                                            onChange={e => setScheduleForm(p => ({ ...p, location: e.target.value }))}
                                            className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-[#1F7A6E] focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Interviewer <span className="text-red-400">*</span></label>
                                    <select
                                        value={scheduleForm.interviewer_id}
                                        onChange={e => setScheduleForm(p => ({ ...p, interviewer_id: e.target.value }))}
                                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-[#1F7A6E] focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors"
                                    >
                                        <option value="" disabled>Select Interviewer</option>
                                        {departmentUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Custom Message to Candidate</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Add instructions, details about the format, what to prepare, etc."
                                        value={scheduleForm.message}
                                        onChange={e => setScheduleForm(p => ({ ...p, message: e.target.value }))}
                                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:border-[#1F7A6E] focus:outline-none text-[#1A2B3D] font-bold text-sm transition-colors resize-none"
                                    />
                                </div>

                                <div className="bg-[#1F7A6E]/5 border border-[#1F7A6E]/20 rounded-2xl p-4 text-[12px] text-[#1F7A6E] font-medium flex gap-3">
                                    <span className="text-base text-xl leading-none">📧</span>
                                    <p>An official interview invitation will be emailed to <strong>{drawerApp.email}</strong> and the selected interviewer immediately. They will also receive a 24-hour reminder before the scheduled time.</p>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="px-8 pb-8 shrink-0 flex gap-4 pt-4 bg-white border-t border-gray-50">
                                <button
                                    onClick={() => setScheduleModal(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScheduleInterview}
                                    disabled={actionLoading || !scheduleForm.date || !scheduleForm.time || !scheduleForm.interviewer_id}
                                    className="flex-[2] py-4 bg-gradient-to-r from-[#1F7A6E] to-[#165C53] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#1F7A6E]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : '📅 Schedule & Send Invites'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
