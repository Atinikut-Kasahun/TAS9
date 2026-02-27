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
                ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-black/5 py-4"
                : "bg-white/95 py-5"
                }`}
        >
            <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
                {/* Logo & Brand */}
                <Link href="/" className="flex flex-col group relative">
                    <div className="flex items-center">
                        <span className="text-[#1A2B3D] font-black text-3xl tracking-tight">
                            DROGA
                        </span>
                        <span className="text-[#1F7A6E] font-medium text-3xl tracking-tight ml-2">
                            GROUP
                        </span>
                    </div>
                    <div className="flex items-center gap-2 -mt-0.5">
                        <div className="h-[0.5px] w-4 bg-[#1F7A6E]/40" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A2B3D]/60 whitespace-nowrap">
                            Hiring Hub
                        </span>
                        <div className="h-[0.5px] w-full bg-[#1F7A6E]/40 flex-1" />
                    </div>
                </Link>

                {/* Nav */}
                <nav className="flex items-center gap-8">
                    {["Jobs", "About Us", "Careers", "Contact"].map((item, i) => (
                        item === "Careers" ? (
                            <Link
                                key={item}
                                href="/careers"
                                className="text-sm font-semibold transition-colors hover:text-accent text-primary"
                            >
                                <motion.span
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                >
                                    {item}
                                </motion.span>
                            </Link>
                        ) : (
                            <motion.a
                                key={item}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                href={`#${item.toLowerCase().replace(" ", "-")}`}
                                className="text-sm font-black transition-colors hover:text-[#1F7A6E] text-[#1A2B3D]"
                            >
                                {item}
                            </motion.a>
                        )
                    ))}

                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="text-sm font-black text-[#1A2B3D] hover:text-[#1F7A6E] transition-colors"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-sm font-black text-red-500 hover:text-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm font-black text-[#1A2B3D] hover:text-[#1F7A6E] transition-colors"
                        >
                            Login
                        </Link>
                    )}

                    <motion.a
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        href="#positions"
                        className="bg-[#0D3B34] text-white text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-black transition-all hover:-translate-y-px hover:shadow-lg"
                    >
                        View Open Positions →
                    </motion.a>
                </nav>
            </div>
        </motion.header>
    );
}
