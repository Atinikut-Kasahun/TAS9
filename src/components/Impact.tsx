"use client";

import { motion } from "framer-motion";

export default function Impact({ settings }: { settings?: any }) {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="py-24 bg-[#00453B] text-center"
            id="positions"
        >
            <div className="max-w-4xl mx-auto px-8">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    className="bg-[#EFE8DE] text-[#00453B] font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-full mb-8 inline-block"
                >
                    Get Started
                </motion.span>
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.6 }}
                    className="text-6xl font-black text-white mb-6"
                >
                    Ready to Make an Impact?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-lg text-white/60 mb-12 max-w-2xl mx-auto font-medium"
                >
                    Explore our open positions and find the perfect role where you can
                    grow, innovate, and make a difference.
                </motion.p>
                <motion.a
                    href="#jobs"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.05, backgroundColor: "#EFE8DE", color: "#00453B" }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-3 bg-white text-[#00453B] font-black px-12 py-5 rounded-full text-lg shadow-2xl hover:shadow-[#EFE8DE]/20 transition-all duration-300"
                >
                    View All Open Positions <span>→</span>
                </motion.a>
            </div>
        </motion.section>
    );
}
