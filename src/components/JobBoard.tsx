import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const defaultCategories = ["All Departments", "Engineering", "Design", "Product", "Operations", "Sales"];
const ITEMS_PER_PAGE = 3;

export default function JobBoard({ settings, searchQuery, onClearSearch }: { settings?: any, searchQuery?: string, onClearSearch?: () => void }) {
    // Dynamic categories from settings, fall back to default if not available
    const [jobCategories, setJobCategories] = useState<string[]>(["All Departments"]);
    const [activeCategory, setActiveCategory] = useState("All Departments");
    const [jobs, setJobs] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showNoResultsMessage, setShowNoResultsMessage] = useState(false);

    React.useEffect(() => {
        if (settings?.site_job_departments) {
            const dynamicDepts = typeof settings.site_job_departments === 'string'
                ? JSON.parse(settings.site_job_departments)
                : settings.site_job_departments;
            if (Array.isArray(dynamicDepts)) {
                setJobCategories(["All Departments", ...dynamicDepts]);
            } else {
                setJobCategories(defaultCategories);
            }
        } else {
            setJobCategories(defaultCategories);
        }
    }, [settings]);

    React.useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    per_page: ITEMS_PER_PAGE.toString()
                });
                if (activeCategory !== "All Departments") params.set('department', activeCategory);
                if (searchQuery) params.set('search', searchQuery);

                const response = await fetch(`${API_URL}/v1/public/jobs?${params.toString()}`);
                const data = await response.json();

                setJobs(data.data || []);
                setMeta(data);
            } catch (err) {
                console.error("Failed to fetch jobs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [currentPage, activeCategory, searchQuery]);

    const filteredJobs = jobs; // Server-side filtered now

    // Handle "No Results" auto-clear
    React.useEffect(() => {
        if (searchQuery && jobs.length === 0 && !loading) { // Check !loading to ensure fetch is complete
            setShowNoResultsMessage(true);
            const timer = setTimeout(() => {
                setShowNoResultsMessage(false);
                if (onClearSearch) onClearSearch();
            }, 5000); // Wait 5 seconds
            return () => clearTimeout(timer);
        } else {
            setShowNoResultsMessage(false);
        }
    }, [searchQuery, jobs.length, onClearSearch, loading]);

    // Pagination Logic
    const totalPages = meta?.last_page || 1;
    const paginatedJobs = jobs; // Server-side filtered now, so 'jobs' is already the paginated/filtered list

    return (
        <section className="py-24 bg-white" id="jobs">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-[#00453B] font-bold text-xs uppercase tracking-widest mb-4 block">Available Roles</span>
                        <h2 className="text-5xl font-bold text-[#00453B]">
                            {searchQuery ? `Results for "${searchQuery}"` : "Help us build the future."}
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-wrap gap-2"
                    >
                        {jobCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeCategory === cat
                                    ? "bg-[#00453B] text-white shadow-xl shadow-[#00453B]/20"
                                    : "bg-[#FDF9F3] text-[#00453B] hover:bg-[#00453B]/5"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </motion.div>
                </div>

                {showNoResultsMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 p-12 bg-[#FDF9F3] border border-[#00453B]/10 rounded-[40px] text-center shadow-sm"
                    >
                        <div className="w-16 h-16 bg-[#00453B]/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-[#00453B]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-[#00453B] font-black text-2xl mb-4">No matching opportunities found</h3>
                        <p className="text-[#00453B]/70 text-base max-w-lg mx-auto leading-relaxed">
                            While we don't have an exact match for your current search criteria, we've refreshed the view to show all open positions at <span className="font-bold text-[#00453B]">Droga Group</span>.
                        </p>
                        <p className="text-[#00453B]/50 text-sm mt-6 font-medium italic">We've automatically cleared the search filters for you.</p>
                    </motion.div>
                )}

                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence mode='popLayout'>
                        {paginatedJobs.map((job) => (
                            <motion.div
                                layout
                                key={job.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                                whileHover={{ y: -5 }}
                                className="group p-8 bg-[#FDF9F3]/20 rounded-[32px] border border-[#00453B]/5 hover:border-[#00453B]/20 hover:bg-white transition-all hover:shadow-2xl hover:shadow-[#00453B]/5 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="px-3 py-1 rounded-lg bg-[#EFE8DE] text-[10px] font-bold text-[#00453B] uppercase tracking-wider">
                                            {job.department}
                                        </span>
                                        <span className="text-[#00453B]/30 text-xs font-bold">{job.type}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#00453B] mb-2 group-hover:text-[#00453B] transition-colors">
                                        {job.title}
                                    </h3>
                                    <p className="text-[#00453B]/50 text-sm font-medium flex items-center gap-2">
                                        📍 {job.location || '—'}
                                    </p>
                                </div>
                                <Link
                                    href={`/careers?apply=${job.id}`}
                                    className="mt-8 w-full py-4 rounded-2xl bg-white border border-[#00453B]/5 text-[#00453B] text-sm font-bold group-hover:bg-[#00453B] group-hover:text-white group-hover:border-[#00453B] transition-all text-center block"
                                >
                                    Apply Now <span>→</span>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-16 flex items-center justify-center gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FDF9F3] text-[#00453B] transition-all hover:bg-[#00453B]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                if (pageNum > totalPages) pageNum = totalPages;
                                if (pageNum < 1) pageNum = 1;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentPage === pageNum
                                            ? "bg-[#00453B] text-white shadow-lg shadow-[#00453B]/20"
                                            : "bg-[#FDF9F3] text-[#00453B] hover:bg-[#00453B]/10"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FDF9F3] text-[#00453B] transition-all hover:bg-[#00453B]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
