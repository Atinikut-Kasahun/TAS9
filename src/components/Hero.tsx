"use client";

import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section className="min-h-[85vh] flex items-center bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] pt-20">
            <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 gap-16 items-center py-16">
                {/* Left Content */}
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="text-6xl font-black leading-[1.1] text-[#1A2B3D] mb-6"
                    >
                        Build the Future <br />
                        with <span className="relative">
                            <span className="relative z-10 text-[#1F7A6E]">Droga Group</span>
                            <span className="absolute bottom-2 left-0 w-full h-4 bg-[#F2F44D]/30 -z-0"></span>
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        className="text-lg text-gray-500 font-medium leading-relaxed mb-12 max-w-xl"
                    >
                        Join a team of innovators, creators, and problem-solvers who are
                        redefining what&apos;s possible in technology.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        className="relative max-w-xl mb-12 group"
                    >
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search jobs by title, skill, or location..."
                            className="w-full bg-[#FAFAFA] border border-gray-100 rounded-[28px] py-6 pl-16 pr-40 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#1F7A6E]/5 focus:bg-white transition-all text-[#1A2B3D] font-bold text-sm"
                        />
                        <button className="absolute right-3 top-3 bottom-3 bg-[#0D3B34] text-white font-black text-[11px] uppercase tracking-widest px-10 rounded-[20px] hover:bg-black transition-all">
                            Find Jobs
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
                            className="text-primary font-bold border-b-2 border-primary/20 hover:border-accent transition-all pb-1 flex items-center gap-2"
                        >
                            Explore Opportunities <span className="text-accent">→</span>
                        </a>
                        <div className="h-4 w-px bg-primary/20" />
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-cream bg-accent/20 flex items-center justify-center text-[10px] text-primary">👤</div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-cream bg-primary text-white flex items-center justify-center text-[10px] font-bold">+12</div>
                        </div>
                        <p className="text-xs text-primary/60 font-medium">Join 200+ team members</p>
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
                        className="rounded-[40px] overflow-hidden bg-white border border-primary/5 p-4 aspect-[4/3] flex flex-col gap-4 shadow-2xl shadow-primary/5"
                    >
                        {/* Mock Dashboard Snippet */}
                        <div className="flex items-center justify-between px-4 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-accent/20" />
                                <div className="w-24 h-2 rounded-full bg-primary/5" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-xs">🔔</div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 p-4 mt-2">
                            <div className="bg-accent/5 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="text-[10px] font-bold text-accent uppercase tracking-wider">Hired This Month</div>
                                <div className="text-3xl font-bold text-primary">12</div>
                            </div>
                            <div className="bg-primary/5 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="text-[10px] font-bold text-primary/40 uppercase tracking-wider">New Applicants</div>
                                <div className="text-3xl font-bold text-primary text-primary/60">48</div>
                            </div>
                            <div className="col-span-2 bg-cream rounded-2xl p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-primary/40 uppercase tracking-wider">Top Skills Found</div>
                                    <div className="text-[10px] font-bold text-accent">View Report</div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-primary border border-primary/5">React</div>
                                    <div className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-primary border border-primary/5">TypeScript</div>
                                    <div className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-primary border border-primary/5">AI</div>
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
                        className="absolute -top-6 -right-6 bg-white shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 border border-primary/5"
                    >
                        <div className="w-11 h-11 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xl font-bold">
                            📈
                        </div>
                        <div>
                            <p className="text-[10px] text-primary/40 font-bold uppercase tracking-wider">Growth Pace</p>
                            <p className="text-lg font-bold text-primary">+150% YoY</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section >
    );
}
