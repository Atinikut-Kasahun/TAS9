"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await auth.login({ email, password });
            localStorage.setItem("auth_token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect based on role
            const roles = data.user?.roles;
            const firstRole = roles?.[0];
            const roleSlug = (typeof firstRole === 'string'
                ? firstRole
                : firstRole?.slug || firstRole?.name || 'ta_manager'
            ).toLowerCase();

            if (roleSlug === 'admin') {
                router.push("/admin/dashboard");
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-primary/5 border border-primary/5 p-10"
            >
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-6">
                        <div className="flex items-center justify-center">
                            <span className="text-primary font-black text-2xl tracking-tighter">DROGA</span>
                            <span className="text-accent font-light text-2xl tracking-normal ml-1">GROUP</span>
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-primary">Login to Hiring Hub</h1>
                    <p className="text-primary/60 text-sm mt-2">Enter your credentials to access your dashboard</p>
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg font-medium">
                            {error}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-primary mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl border border-primary/10 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder:text-primary/30"
                            placeholder="name@company.com"
                            required
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-sm font-bold text-primary">Password</label>
                            <a href="#" className="text-xs font-bold text-accent hover:underline">Forgot?</a>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-xl border border-primary/10 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder:text-primary/30"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-primary text-white py-4 rounded-xl font-bold transition-all hover:shadow-xl hover:shadow-primary/10 active:scale-95 ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-black"}`}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-primary/60 mb-4">
                        Don't have an account?{" "}
                        <a href="#" className="text-accent font-bold hover:underline">Contact Admin</a>
                    </p>
                    <div className="pt-6 border-t border-primary/5">
                        <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest mb-3">Demo Accounts</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {[
                                { label: 'Global Admin', email: 'admin@droga.com' },
                                { label: 'HR Manager', email: 'hr.droga@droga.com' },
                                { label: 'Pharma DM', email: 'dm.pharma@droga.com' },
                                { label: 'Pharma TA', email: 'ta.droga-pharma@droga.com' },
                                { label: 'Physio TA', email: 'ta.droga-physiotherapy@droga.com' },
                                { label: 'Health TA', email: 'ta.droga-health@droga.com' },
                                { label: 'Coffee TA', email: 'ta.droga-coffee@droga.com' },
                            ].map((acc) => (
                                <button
                                    key={acc.email}
                                    onClick={() => { setEmail(acc.email); setPassword("password"); }}
                                    className="px-3 py-1.5 rounded-lg bg-primary/5 text-primary/60 text-[10px] font-bold hover:bg-accent hover:text-white transition-all"
                                >
                                    {acc.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
