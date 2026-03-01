"use client";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Culture from "@/components/Culture";
import JobBoard from "@/components/JobBoard";
import Impact from "@/components/Impact";
import Footer from "@/components/Footer";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function Home() {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Ensure this is hitting the public endpoint
                const data = await apiFetch('/v1/public/settings');
                setSettings(data || {});
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading) return null; // Or a subtle skeleton loader

    return (
        <main>
            <Header />
            <Hero settings={settings} onSearch={setSearchQuery} currentSearch={searchQuery} />
            <Features />
            <Culture settings={settings} />
            <JobBoard settings={settings} searchQuery={searchQuery} onClearSearch={() => setSearchQuery("")} />
            <Impact settings={settings} />
            <Footer />
        </main>
    );
}
