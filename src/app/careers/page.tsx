'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, API_URL } from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Job {
    id: number;
    title: string;
    location: string;
    type: string;
    tenant?: { name: string };
}

function CareersContent() {
    const searchParams = useSearchParams();
    const applyId = searchParams.get('apply');

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [appStep, setAppStep] = useState(1); // 1: Identity, 2: Resume/Profile, 3: Success
    const [isApplying, setIsApplying] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        phone: '',
        age: '',
        gender: '',
        professional_background: '',
        years_of_experience: '',
        portfolio_link: '',
    });
    const [resume, setResume] = useState<File | null>(null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await apiFetch('/v1/public/jobs');
                const jobList = data || [];
                setJobs(jobList);

                // Auto-open modal if 'apply' param is present
                if (applyId) {
                    const jobToApply = jobList.find((j: any) => j.id.toString() === applyId);
                    if (jobToApply) {
                        setSelectedJob(jobToApply);
                        setIsApplying(true);
                        setAppStep(1);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch public jobs', err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [applyId]);

    const handleApplyClick = (job: Job) => {
        setSelectedJob(job);
        setIsApplying(true);
        setAppStep(1);
    };

    const handleIdentitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAppStep(2);
    };

    const handleSSO = (provider: string) => {
        // Mock SSO behavior
        setFormData(prev => ({ ...prev, email: `user@${provider.toLowerCase()}.com`, name: 'John Doe' }));
        setAppStep(2);
    };

    const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResume(file);
            // PRO TIP: Mock Resume Parsing
            setTimeout(() => {
                if (!formData.name) setFormData(prev => ({ ...prev, name: 'John Applicant' }));
                if (!formData.professional_background) setFormData(prev => ({ ...prev, professional_background: 'Experienced Pharma Specialist with a focus on supply chain management...' }));
                if (!formData.years_of_experience) setFormData(prev => ({ ...prev, years_of_experience: '5' }));
            }, 1000);
        }
    };

    const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleSubmitApplication = async () => {
        if (!selectedJob || !resume) return;
        setSubmitting(true);
        try {
            const body = new FormData();
            body.append('job_posting_id', selectedJob.id.toString());
            body.append('name', formData.name);
            body.append('email', formData.email);
            body.append('phone', formData.phone);
            body.append('age', formData.age);
            body.append('gender', formData.gender);
            body.append('professional_background', formData.professional_background);
            body.append('years_of_experience', formData.years_of_experience);
            body.append('portfolio_link', formData.portfolio_link);
            body.append('resume', resume);
            if (photo) body.append('photo', photo);
            attachments.forEach((file, i) => {
                body.append(`attachments[${i}]`, file);
            });

            const cleanBaseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
            const res = await fetch(`${cleanBaseUrl}/v1/apply`, {
                method: 'POST',
                body: body,
            });

            if (res.ok) {
                setAppStep(3);
            } else {
                const errorData = await res.json();
                alert(`Submission failed: ${errorData.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Application failed', err);
            alert('Application failed. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F6FA]">
            {/* Guest Navbar */}
            <nav className="bg-white border-b border-gray-100 px-8 py-5">
                <div className="max-w-[1200px] mx-auto flex justify-between items-center">
                    <Link href="/" className="flex flex-col group relative">
                        <div className="flex items-center">
                            <span className="text-[#1A2B3D] font-black text-xl tracking-tight">
                                DROGA
                            </span>
                            <span className="text-[#1F7A6E] font-medium text-xl tracking-tight ml-1.5">
                                GROUP
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 -mt-0.5">
                            <div className="h-[0.5px] w-3 bg-[#1F7A6E]/40" />
                            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[#1A2B3D]/60 whitespace-nowrap">
                                Hiring Hub
                            </span>
                            <div className="h-[0.5px] w-full bg-[#1F7A6E]/40 flex-1" />
                        </div>
                    </Link>
                    <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-[#1A2B3D]/40 hover:text-[#1F7A6E] transition-colors">
                        Internal Login
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="bg-white border-b border-gray-100 py-20 px-8 text-center text-[#1A2B3D]">
                <div className="max-w-[1200px] mx-auto space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-black tracking-tight"
                    >
                        Join the Droga Pharma Team
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
                    >
                        We're looking for passionate individuals to help us innovate in the pharmaceutical industry. Discover your next career move below.
                    </motion.p>
                </div>
            </header>

            {/* Job List */}
            <main className="max-w-[1000px] mx-auto py-16 px-8">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Open Positions ({jobs.length})</h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 text-[#1A2B3D]">
                        <div className="w-8 h-8 border-4 border-[#1F7A6E] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm font-bold">Discovering opportunities…</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job, idx) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1F7A6E]/5 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-[#1A2B3D] group-hover:text-[#1F7A6E] transition-colors">{job.title}</h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="bg-gray-50 text-[10px] font-black text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{job.type}</span>
                                        <span className="text-gray-300 text-sm">•</span>
                                        <span className="text-gray-500 text-sm font-medium">{job.location}</span>
                                        <span className="text-gray-300 text-sm">•</span>
                                        <span className="text-[#1F7A6E] text-sm font-bold">{job.tenant?.name}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleApplyClick(job)}
                                    className="bg-[#1F7A6E] text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#1F7A6E]/20 hover:bg-[#165C53] transition-all"
                                >
                                    Apply Now
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Application Modal */}
            <AnimatePresence>
                {isApplying && selectedJob && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsApplying(false)}
                            className="fixed inset-0 bg-[#1A2B3D]/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden relative z-[210] flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 pb-4 flex justify-between items-center bg-[#F5F6FA]">
                                <div>
                                    <p className="text-[10px] font-black text-[#1F7A6E] uppercase tracking-widest mb-1">Applying for</p>
                                    <h2 className="text-xl font-black text-[#1A2B3D]">{selectedJob.title}</h2>
                                </div>
                                <button onClick={() => setIsApplying(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-8">
                                {appStep === 1 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-black text-[#1A2B3D]">Identity Check</h3>
                                            <p className="text-gray-500 font-medium">Please verify your identity to continue with the application.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <button onClick={() => handleSSO('Google')} className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/10 transition-all font-bold text-[#1A2B3D]">
                                                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" />
                                                Continue with Google
                                            </button>
                                            <button onClick={() => handleSSO('Outlook')} className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-sky-600 hover:bg-sky-50/10 transition-all font-bold text-[#1A2B3D]">
                                                <img src="https://logodownload.org/wp-content/uploads/2020/04/microsoft-outlook-logo-0.png" className="w-6 h-6" />
                                                Continue with Outlook
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest bg-white px-4 text-gray-300">Or use email</div>
                                        </div>

                                        <form onSubmit={handleIdentitySubmit} className="space-y-4">
                                            <input
                                                type="email" required
                                                placeholder="Enter your email address"
                                                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#1F7A6E]/10 focus:border-[#1F7A6E] transition-all font-bold text-gray-600"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                            <button type="submit" className="w-full py-4 bg-[#1A2B3D] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-[#13222F] transition-all">
                                                Next Step
                                            </button>
                                        </form>
                                    </motion.div>
                                )}

                                {appStep === 2 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                        <section className="bg-[#1F7A6E]/5 rounded-3xl p-8 border border-[#1F7A6E]/10 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-[11px] font-black text-[#1F7A6E] uppercase tracking-widest">Resume Parsing</h3>
                                                {resume && <span className="text-[10px] font-black text-[#1F7A6E] bg-white px-2 py-1 rounded-full shadow-sm">AI Active ⚡</span>}
                                            </div>
                                            <label className="block p-10 border-2 border-dashed border-[#1F7A6E]/30 rounded-2xl text-center cursor-pointer hover:bg-white transition-all group">
                                                <input type="file" className="hidden" accept=".pdf" onChange={handleResumeUpload} />
                                                <div className="space-y-2">
                                                    <div className="w-12 h-12 bg-[#1F7A6E]/10 rounded-full flex items-center justify-center mx-auto text-[#1F7A6E] group-hover:scale-110 transition-transform">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                    </div>
                                                    <p className="text-sm font-bold text-[#1A2B3D]">{resume ? resume.name : 'Upload Resume (PDF)'}</p>
                                                    <p className="text-xs text-gray-500">Auto-fill your details instantly</p>
                                                </div>
                                            </label>
                                        </section>

                                        <section className="space-y-6">
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Profile Details</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Photo Upload</label>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                                                            {photo ? (
                                                                <img src={URL.createObjectURL(photo)} alt="Profile" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <svg className="w-8 h-8 text-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                                            )}
                                                        </div>
                                                        <label className="px-4 py-2 border border-gray-100 rounded-lg text-xs font-bold text-[#1A2B3D] cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                                                            {photo ? 'Change Photo' : 'Upload Photo'}
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Full Name</label>
                                                    <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1F7A6E] font-bold text-[#1A2B3D] text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Email Address</label>
                                                    <input type="email" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1F7A6E] font-bold text-[#1A2B3D] text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Phone Number</label>
                                                    <input type="tel" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1F7A6E] font-bold text-[#1A2B3D] text-sm" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Age</label>
                                                    <input type="number" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1F7A6E] font-bold text-[#1A2B3D] text-sm" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Portfolio Link</label>
                                                    <input type="url" placeholder="https://..." className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1F7A6E] font-bold text-[#1A2B3D] text-sm" value={formData.portfolio_link} onChange={(e) => setFormData({ ...formData, portfolio_link: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Gender</label>
                                                    <select className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1F7A6E] font-bold text-[#1A2B3D] text-sm appearance-none" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                                                        <option value="">Select</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Professional Background / Profile Abstract</label>
                                                    <textarea rows={3} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1F7A6E] font-bold text-[#1A2B3D] text-sm" placeholder="Summarize your professional experience..." value={formData.professional_background} onChange={(e) => setFormData({ ...formData, professional_background: e.target.value })} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Years of Experience</label>
                                                    <input type="number" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#1F7A6E] font-bold text-[#1A2B3D] text-sm" value={formData.years_of_experience} onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })} />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Additional Attachments</h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {attachments.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-xs font-bold text-[#1A2B3D]">{f.name}</span>
                                                        <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="flex items-center justify-center gap-2 p-4 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                                    <input type="file" multiple className="hidden" onChange={handleAttachmentUpload} />
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Add Files (Cover Letter, Certificates...)</span>
                                                </label>
                                            </div>
                                        </section>

                                        <button
                                            onClick={handleSubmitApplication}
                                            disabled={submitting || !resume || !formData.name}
                                            className="w-full py-5 bg-[#1F7A6E] text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-[#1F7A6E]/20 hover:bg-[#165C53] transition-all disabled:opacity-50"
                                        >
                                            {submitting ? 'Submitting Application...' : 'Confirm & Apply'}
                                        </button>
                                    </motion.div>
                                )}

                                {appStep === 3 && (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-12 text-center space-y-6">
                                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-black text-[#1A2B3D]">Application Received!</h3>
                                            <p className="text-gray-500 font-medium text-lg">We've received your application for **{selectedJob.title}**. Check your email for a confirmation from our team.</p>
                                        </div>
                                        <button
                                            onClick={() => setIsApplying(false)}
                                            className="px-10 py-4 bg-[#1A2B3D] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#13222F] transition-all"
                                        >
                                            Return to Careers
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="py-20 text-center border-t border-gray-100 bg-white mt-10">
                <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">© 2026 DROGA GROUP — ALL RIGHTS RESERVED</p>
            </footer>
        </div>
    );
}

export default function CareersPage() {
    return (
        <Suspense fallback={<div>Loading Careers...</div>}>
            <CareersContent />
        </Suspense>
    );
}
