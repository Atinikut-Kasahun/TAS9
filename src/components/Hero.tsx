"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";

export default function Hero({ settings, onSearch, currentSearch }: { settings?: any, onSearch: (query: string) => void, currentSearch?: string }) {
    // Dynamic Hero Stats Badge State
    const [heroStats, setHeroStats] = useState({
        title: "Training Hours",
        value: "1,200+",
        icon: "BookOpen"
    });

    // Mock Dashboard Stats State
    const [mockStats, setMockStats] = useState({
        rating: "9.8",
        members: "500+"
    });

    const [teamDiversity, setTeamDiversity] = useState([
        { label: 'Location A', value: 45 },
        { label: 'Location B', value: 20 },
        { label: 'Location C', value: 35 }
    ]);

    // Content Settings State (Existing)
    const [content, setContent] = useState({
        title: "Build the Future with Droga Group",
        subtitle: "Join a team of innovators, creators, and problem-solvers who are redefining what's possible in technology."
    });

    const [searchInput, setSearchInput] = useState("");

    // Sync local input with prop for auto-clearing
    useEffect(() => {
        if (currentSearch !== undefined && currentSearch !== searchInput) {
            setSearchInput(currentSearch);
        }
    }, [currentSearch]);

    useEffect(() => {
        // Read the hero_stats from the parent props
        if (settings?.site_hero_stats) {
            const stats = settings.site_hero_stats;
            setHeroStats(typeof stats === 'string' ? JSON.parse(stats) : stats);
        }

        if (settings?.site_hero_mock_stats) {
            const mStats = settings.site_hero_mock_stats;
            setMockStats(typeof mStats === 'string' ? JSON.parse(mStats) : mStats);
        }

        if (settings?.site_team_diversity) {
            const diversity = settings.site_team_diversity;
            setTeamDiversity(typeof diversity === 'string' ? JSON.parse(diversity) : diversity);
        }

        // This is safe to keep just in case, though the parent could technically pass it now
        if (settings?.hero_content) {
            const hContent = settings.hero_content;
            setContent(typeof hContent === 'string' ? JSON.parse(hContent) : hContent);
        }
    }, [settings]);

    // Dynamically select the icon from Lucide
    const IconComponent = (LucideIcons as any)[heroStats.icon] || LucideIcons.BookOpen;

    const handleSearchSubmit = () => {
        onSearch(searchInput);
        // Clear locally if needed, but user said "if not found... automatically clear" 
        // We'll let the parent or JobBoard handle the "clear if not found" logic 
        // to avoid race conditions. Actually, typically clearing upon button click is fine too.
        // But user asked for it to clear specifically if NOT found.

        // Let's at least scroll
        const jobBoard = document.getElementById('jobs');
        if (jobBoard) {
            jobBoard.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="min-h-[85vh] flex items-center bg-[#FDF9F3] pt-20">
            <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 gap-16 items-center py-16">
                {/* Left Content */}
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="text-6xl font-black leading-[1.1] text-[#00453B] mb-6 whitespace-pre-line"
                    >
                        {content.title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        className="text-lg text-[#00453B]/80 font-medium leading-relaxed mb-12 max-w-xl"
                    >
                        {content.subtitle}
                    </motion.p>


                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        className="relative max-w-xl mb-12 group"
                    >
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-[#00453B]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                            placeholder="Search jobs by title, skill, or location..."
                            className="w-full bg-white border border-[#00453B]/10 rounded-[28px] py-6 pl-16 pr-40 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#00453B]/5 focus:bg-white transition-all text-[#00453B] font-bold text-sm"
                        />
                        <button
                            onClick={handleSearchSubmit}
                            className="absolute right-3 top-3 bottom-3 bg-[#00453B] text-white font-black text-[11px] uppercase tracking-widest px-10 rounded-[20px] hover:bg-black transition-all flex items-center gap-2"
                        >
                            Find Jobs <span>→</span>
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex items-center gap-6"
                    >
                        <a
                            href="#positions"
                            className="text-[#00453B] font-bold border-b-2 border-[#00453B]/20 hover:border-[#00453B] transition-all pb-1 flex items-center gap-2"
                        >
                            Explore Opportunities <span className="text-[#00453B]">→</span>
                        </a>
                        <div className="h-4 w-px bg-[#00453B]/20" />
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#FDF9F3] bg-[#EFE8DE] flex items-center justify-center text-[10px] text-[#00453B]">👤</div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-[#FDF9F3] bg-[#00453B] text-white flex items-center justify-center text-[10px] font-bold">+12</div>
                        </div>
                        <p className="text-xs text-[#00453B]/60 font-medium">Join 200+ team members</p>
                    </motion.div>
                </div>

                {/* Right — Abstract Illustration */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    <motion.div
                        animate={{ y: [0, -16, 0] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        className="rounded-[40px] overflow-hidden bg-white border border-[#00453B]/5 p-4 aspect-[4/3] flex flex-col gap-4 shadow-2xl shadow-[#00453B]/5"
                    >
                        {/* Mock Dashboard Snippet */}
                        <div className="flex items-center justify-between px-4 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#EFE8DE]" />
                                <div className="w-24 h-2 rounded-full bg-[#00453B]/5" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-[#00453B]/5 flex items-center justify-center text-xs">🔔</div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 p-4 mt-2">
                            <div className="bg-[#EFE8DE]/20 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="text-[10px] font-bold text-[#00453B]/60 uppercase tracking-wider">Average Rating</div>
                                <div className="text-3xl font-bold text-[#00453B]">{mockStats.rating}<span className="text-lg text-[#00453B]/40">/10</span></div>
                            </div>
                            <div className="bg-[#00453B]/5 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="text-[10px] font-bold text-[#00453B]/40 uppercase tracking-wider">Team Members</div>
                                <div className="text-3xl font-bold text-[#00453B]">{mockStats.members}</div>
                            </div>
                            <div className="col-span-2 bg-[#FDF9F3] rounded-2xl p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-[#00453B]/40 uppercase tracking-wider">Scale & Reach</div>
                                    <div className="text-[10px] font-bold text-[#00453B]">Global Presence</div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {teamDiversity.map((item, idx) => (
                                        <div key={idx} className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-[#00453B] border border-[#00453B]/5">
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute -top-6 -right-6 bg-white shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 border border-[#00453B]/5"
                    >
                        <div className="w-11 h-11 bg-[#EFE8DE] rounded-full flex items-center justify-center text-[#00453B] font-bold">
                            <IconComponent strokeWidth={1.5} size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-[#00453B]/40 font-bold uppercase tracking-wider">{heroStats.title}</p>
                            <p className="text-lg font-bold text-[#00453B]">{heroStats.value}</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section >
    );
}
