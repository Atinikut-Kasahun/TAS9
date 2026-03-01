"use client";

import { motion } from "framer-motion";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

const defaultCulturePoints = [
    { heading: "Continuous Growth", text: "We invest heavily in the professional development of our team members." },
    { heading: "Inclusive Environment", text: "Diversity is our strength. We welcome talent from all backgrounds." },
    { heading: "Health & Wellness", text: "Comprehensive benefits to keep you and your family healthy." }
];

export default function Culture({ settings }: { settings?: any }) {
    const [cultureText, setCultureText] = useState({
        heading: "Life at Droga Group",
        bullets: defaultCulturePoints
    });
    const [cultureImages, setCultureImages] = useState({ img1: '', img2: '', img3: '' });
    const [teamDiversity, setTeamDiversity] = useState([
        { label: 'Addis Ababa', value: 45 },
        { label: 'Dire Dawa', value: 20 },
        { label: 'Hawassa', value: 35 }
    ]);

    useEffect(() => {
        if (settings?.site_culture_text) {
            const cText = settings.site_culture_text;
            setCultureText(typeof cText === 'string' ? JSON.parse(cText) : cText);
        }
        if (settings?.site_culture_images) {
            const cImages = settings.site_culture_images;
            setCultureImages(typeof cImages === 'string' ? JSON.parse(cImages) : cImages);
        }
        if (settings?.site_team_diversity) {
            const diversity = settings.site_team_diversity;
            setTeamDiversity(typeof diversity === 'string' ? JSON.parse(diversity) : diversity);
        }
    }, [settings]);

    const getImageUrl = (path: string, fallback: string) => {
        if (!path) return fallback;
        if (path.startsWith('http')) return path;
        return `${API_URL.split('/api')[0]}/storage/${path}`;
    };

    return (
        <section className="py-24 bg-[#FDF9F3]" id="about-us">
            <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 gap-24 items-center">
                {/* Left Text */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="text-[#00453B] font-bold text-xs uppercase tracking-widest mb-6 block">Our DNA</span>
                    <h2 className="text-5xl font-bold text-[#00453B] mb-6">
                        {cultureText.heading}
                    </h2>
                    <div className="space-y-8">
                        {cultureText.bullets.map((point: any, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.1 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="group"
                            >
                                <div className="flex items-start gap-5">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00453B]/10 flex items-center justify-center text-[#00453B] text-xs font-bold mt-1 group-hover:bg-[#00453B] group-hover:text-white transition-colors">•</span>
                                    <div>
                                        <p className="text-[#00453B] text-xl font-bold mb-1">{point.heading || point.text}</p>
                                        <p className="text-[#00453B]/50 text-sm font-medium">{point.text || point.detail}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Visual Grid */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.7 }}
                    className="grid grid-cols-2 gap-4"
                >
                    {/* Image 1 */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="rounded-2xl overflow-hidden aspect-[4/3]"
                        style={{
                            backgroundImage: `url('${getImageUrl(cultureImages.img1, "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=600&q=80")}')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    />
                    {/* Image 2 */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="rounded-2xl overflow-hidden aspect-[4/3]"
                        style={{
                            backgroundImage: `url('${getImageUrl(cultureImages.img2, "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80")}')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    />
                    {/* Image 3 */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="rounded-2xl overflow-hidden aspect-[4/3]"
                        style={{
                            backgroundImage: `url('${getImageUrl(cultureImages.img3, "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80")}')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    />
                    {/* Team Distribution Chart Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                        className="bg-white rounded-[40px] p-6 shadow-2xl shadow-[#00453B]/5 border border-[#00453B]/5 relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="text-lg font-bold text-[#00453B]">Team Diversity</h4>
                                <p className="text-xs text-[#00453B]/40 font-medium">Distribution by region</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00453B]/5 flex items-center justify-center text-xs">📊</div>
                            </div>
                        </div>

                        {/* Animated Bar Chart */}
                        <div className="space-y-4">
                            {(teamDiversity || []).map((row, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-[#00453B]/60 uppercase tracking-widest">
                                        <span>{row.label}</span>
                                        <span>{row.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#00453B]/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${Math.min(100, Math.max(0, Number(row.value)))}%` }}
                                            viewport={{ once: false }}
                                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                            className={`h-full ${i % 2 === 0 ? 'bg-[#00453B]' : 'bg-[#FFBA49]'} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
