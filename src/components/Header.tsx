"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }

        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("auth_token");
        setUser(null);
        window.location.href = "/";
    };

    return (
        <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`sticky top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
                ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#00453B]/5 py-4"
                : "bg-white py-5"
                }`}
        >
            <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
                {/* Logo & Brand */}
                <motion.div whileHover="hover" className="relative">
                    <Link href="/" className="flex flex-col group relative">
                        <div className="flex items-center">
                            <motion.span
                                variants={{ hover: { x: 2 } }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="text-[#00453B] font-black text-3xl tracking-tight leading-none"
                            >
                                DROGA
                            </motion.span>
                            <motion.span
                                variants={{ hover: { x: 4 } }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="text-[#00453B]/60 font-medium text-3xl tracking-tight ml-2 leading-none"
                            >
                                GROUP
                            </motion.span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-[0.5px] w-4 bg-[#00453B]/40" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00453B]/60 whitespace-nowrap">
                                Hiring Hub
                            </span>
                            <motion.div
                                variants={{ hover: { scaleX: 1.1, originX: 0 } }}
                                className="h-[0.5px] w-full bg-[#00453B]/40 flex-1"
                            />
                        </div>

                        {/* Floating Underline Highlight */}
                        <motion.div
                            variants={{
                                initial: { width: 0, opacity: 0 },
                                hover: { width: "40%", opacity: 1 }
                            }}
                            initial="initial"
                            className="absolute -bottom-2 left-0 h-[2px] bg-[#00453B] rounded-full transition-all duration-300"
                        />
                    </Link>
                </motion.div>

                {/* Nav */}
                <nav className="flex items-center gap-10">
                    {["Jobs", "About Us", "Careers", "Contact"].map((item, i) => (
                        item === "Careers" ? (
                            <Link
                                key={item}
                                href="/careers"
                                className="text-[13px] font-black uppercase tracking-wider transition-all hover:text-[#00453B] text-[#00453B]"
                            >
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                >
                                    {item}
                                </motion.span>
                            </Link>
                        ) : (
                            <motion.a
                                key={item}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                href={`/${item.toLowerCase() === "about us" ? "#about-us" : item.toLowerCase() === "contact" ? "#contact" : "#" + item.toLowerCase()}`}
                                className="text-[13px] font-black uppercase tracking-wider transition-all hover:text-[#00453B] text-[#00453B]"
                            >
                                {item}
                            </motion.a>
                        )
                    ))}

                    {user ? (
                        <div className="flex items-center gap-6 pl-4 border-l border-[#00453B]/10">
                            <Link
                                href="/dashboard"
                                className="text-[13px] font-black uppercase tracking-wider text-[#00453B] hover:text-[#00453B] transition-colors"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-[13px] font-black uppercase tracking-wider text-red-500/80 hover:text-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="text-[13px] font-black uppercase tracking-wider text-[#00453B] hover:text-[#00453B] transition-colors pl-4 border-l border-[#00453B]/10"
                        >
                            Login
                        </Link>
                    )}

                    <motion.a
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        href="#jobs"
                        className="bg-[#00453B] text-white text-[11px] font-black uppercase tracking-[0.1em] px-10 py-4 rounded-full hover:bg-black transition-all hover:shadow-2xl hover:shadow-[#00453B]/20"
                    >
                        View Open Positions →
                    </motion.a>
                </nav>
            </div>
        </motion.header>
    );
}
