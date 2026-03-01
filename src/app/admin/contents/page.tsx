"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { apiFetch, API_URL } from '@/lib/api';
import { Save, Image as ImageIcon, Upload, Users, TrendingUp, BookOpen, Star, RefreshCw, Plus, Trash2, CheckCircle } from 'lucide-react';

// Reusable components for the Site Editor
function SectionCard({ title, description, children, onSave, saving }: { title: string, description: string, children: React.ReactNode, onSave: () => void, saving: boolean }) {
    return (
        <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="font-bold text-gray-900">{title}</h2>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#1F7A6E] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#155a50] transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Section'}
                </button>
            </div>
            <div className="p-6 space-y-6">
                {children}
            </div>
        </section>
    );
}

export default function SiteEditor() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Section States
    const [heroStats, setHeroStats] = useState({ title: 'Training Hours', value: '1,200+', icon: 'BookOpen' });
    const [mockStats, setMockStats] = useState({ rating: '4.8', members: '500+' });
    const [cultureText, setCultureText] = useState({
        heading: 'Life at Droga Group',
        bullets: [
            { heading: 'Continuous Growth', text: 'We invest heavily in the professional development of our team members.' },
            { heading: 'Inclusive Environment', text: 'Diversity is our strength. We welcome talent from all backgrounds.' },
            { heading: 'Health & Wellness', text: 'Comprehensive benefits to keep you and your family healthy.' }
        ]
    });
    const [cultureImages, setCultureImages] = useState({ img1: '', img2: '', img3: '' });
    const [teamDiversity, setTeamDiversity] = useState([
        { label: 'Addis Ababa', value: 45 },
        { label: 'Dire Dawa', value: 20 },
        { label: 'Hawassa', value: 35 }
    ]);
    const [jobDepartments, setJobDepartments] = useState<string[]>(["Engineering", "Design", "Product", "Operations", "Sales"]);

    // Saving States
    const [savingHero, setSavingHero] = useState(false);
    const [savingMockStats, setSavingMockStats] = useState(false);
    const [savingCultureText, setSavingCultureText] = useState(false);
    const [savingCultureImages, setSavingCultureImages] = useState(false);
    const [savingTeamDiversity, setSavingTeamDiversity] = useState(false);
    const [savingJobDepartments, setSavingJobDepartments] = useState(false);

    // Toast State
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchSettings();
    }, [router]);

    const fetchSettings = async () => {
        try {
            const data = await apiFetch('/v1/global-settings');
            const parseIfString = (val: any) => typeof val === 'string' ? JSON.parse(val) : val;
            if (data?.site_hero_stats) setHeroStats(parseIfString(data.site_hero_stats));
            if (data?.site_hero_mock_stats) setMockStats(parseIfString(data.site_hero_mock_stats));
            if (data?.site_culture_text) setCultureText(parseIfString(data.site_culture_text));
            if (data?.site_culture_images) setCultureImages(parseIfString(data.site_culture_images));
            if (data?.site_team_diversity) setTeamDiversity(parseIfString(data.site_team_diversity));
            if (data?.site_job_departments) setJobDepartments(parseIfString(data.site_job_departments));
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSetting = async (key: string, value: any, setSaving: (s: boolean) => void) => {
        setSaving(true);
        try {
            await apiFetch('/v1/global-settings', {
                method: 'POST',
                body: JSON.stringify({ key, value })
            });

            // Show success toast
            setToastMessage('Changes saved successfully!');
            setTimeout(() => setToastMessage(null), 3000);

        } catch (error) {
            console.error('Failed to save', key, error);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (file: File, imageKey: 'img1' | 'img2' | 'img3') => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL}/v1/global-settings/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setCultureImages(prev => ({ ...prev, [imageKey]: data.path }));
        } catch (error) {
            alert('Failed to upload image. Please ensure it is a valid JPG/PNG under 5MB.');
            console.error(error);
        }
    };

    if (!user || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F7A6E]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F6FA] flex">

            {/* Success Toast Configuration */}
            {toastMessage && (
                <div className="fixed top-20 right-8 z-50 bg-[#1F7A6E] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CheckCircle size={20} />
                    <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
                </div>
            )}

            <AdminSidebar user={user} />

            <div className="flex-1 ml-56 flex flex-col min-h-screen">
                <header className="bg-white border-b border-gray-100 h-14 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <div>
                        <h1 className="text-gray-800 font-bold text-sm">Site Editor</h1>
                    </div>
                </header>

                <main className="flex-1 p-8 max-w-5xl mx-auto w-full">

                    {/* Hero Mock Dashboard Stats */}
                    <SectionCard
                        title="Hero Mock Dashboard Stats"
                        description="Controls the abstract statistic cards shown inside the mock dashboard illustration."
                        onSave={() => saveSetting('site_hero_mock_stats', mockStats, setSavingMockStats)}
                        saving={savingMockStats}
                    >
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Average Rating</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 9.8"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none"
                                    value={mockStats.rating}
                                    onChange={e => setMockStats({ ...mockStats, rating: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Team Members</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 500+"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none"
                                    value={mockStats.members}
                                    onChange={e => setMockStats({ ...mockStats, members: e.target.value })}
                                />
                            </div>
                        </div>
                    </SectionCard>

                    {/* Hero Stats */}
                    <SectionCard
                        title="Hero Stats Badge"
                        description="Controls the floating badge on the public homepage hero section."
                        onSave={() => saveSetting('site_hero_stats', heroStats, setSavingHero)}
                        saving={savingHero}
                    >
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Metric Title</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none"
                                    value={heroStats.title}
                                    onChange={e => setHeroStats({ ...heroStats, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Metric Value</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none"
                                    value={heroStats.value}
                                    onChange={e => setHeroStats({ ...heroStats, value: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Icon</label>
                                <select
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none bg-white"
                                    value={heroStats.icon}
                                    onChange={e => setHeroStats({ ...heroStats, icon: e.target.value })}
                                >
                                    <option value="BookOpen">Book (Training)</option>
                                    <option value="Users">Users (Team Size)</option>
                                    <option value="TrendingUp">Trending (Growth)</option>
                                    <option value="Star">Star (Rating)</option>
                                </select>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Culture Text */}
                    <SectionCard
                        title="Our Culture Text"
                        description="The text content displayed in the Culture section of the landing page."
                        onSave={() => saveSetting('site_culture_text', cultureText, setSavingCultureText)}
                        saving={savingCultureText}
                    >
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Main Heading</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none"
                                value={cultureText.heading}
                                onChange={e => setCultureText({ ...cultureText, heading: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            {cultureText.bullets.map((bullet, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Bullet {idx + 1} Heading</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none mb-3 bg-white"
                                        value={bullet.heading}
                                        onChange={e => {
                                            const newBullets = [...cultureText.bullets];
                                            newBullets[idx].heading = e.target.value;
                                            setCultureText({ ...cultureText, bullets: newBullets });
                                        }}
                                    />
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Bullet {idx + 1} Text</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none bg-white resize-none"
                                        value={bullet.text}
                                        onChange={e => {
                                            const newBullets = [...cultureText.bullets];
                                            newBullets[idx].text = e.target.value;
                                            setCultureText({ ...cultureText, bullets: newBullets });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Culture Images */}
                    <SectionCard
                        title="Culture Images"
                        description="Upload the three photos that appear in the masonry grid in the Culture section."
                        onSave={() => saveSetting('site_culture_images', cultureImages, setSavingCultureImages)}
                        saving={savingCultureImages}
                    >
                        <div className="grid grid-cols-3 gap-6">
                            {(['img1', 'img2', 'img3'] as const).map((key, idx) => (
                                <div key={key} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center relative hover:bg-gray-50 transition-colors">
                                    {cultureImages[key] ? (
                                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-3">
                                            {/* We use a standard img tag because next/image requires domains config for external URLs */}
                                            <img
                                                src={`${API_URL.split('/api')[0]}/storage/${cultureImages[key]}`}
                                                alt={`Culture ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                    <label className="cursor-pointer bg-white border border-gray-200 shadow-sm text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:border-[#1F7A6E] hover:text-[#1F7A6E] transition-colors flex items-center gap-2">
                                        <Upload size={14} />
                                        {cultureImages[key] ? 'Replace Image' : 'Upload Image'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleFileUpload(e.target.files[0], key);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Team Diversity */}
                    <SectionCard
                        title="Team Diversity Metrics"
                        description="Statistics shown at the bottom of the landing page, like location spread or gender ratios."
                        onSave={() => saveSetting('site_team_diversity', teamDiversity, setSavingTeamDiversity)}
                        saving={savingTeamDiversity}
                    >
                        <div className="space-y-4">
                            {teamDiversity.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 relative group">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Location Name</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none bg-white"
                                            value={item.label}
                                            onChange={e => {
                                                const newDiversity = [...teamDiversity];
                                                newDiversity[idx].label = e.target.value;
                                                setTeamDiversity(newDiversity);
                                            }}
                                            placeholder="e.g. Addis Ababa"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Percentage (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none bg-white"
                                            value={item.value}
                                            onChange={e => {
                                                const newDiversity = [...teamDiversity];
                                                newDiversity[idx].value = parseInt(e.target.value) || 0;
                                                setTeamDiversity(newDiversity);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 pt-5">
                                        <div className="h-2 bg-gray-200 rounded-full w-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-500"
                                                style={{
                                                    width: `${item.value}%`,
                                                    backgroundColor: idx % 2 === 0 ? '#1F7A6E' : '#FFBA49'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => {
                                            const newDiversity = [...teamDiversity];
                                            newDiversity.splice(idx, 1);
                                            setTeamDiversity(newDiversity);
                                        }}
                                        className="absolute -right-3 -top-3 bg-red-50 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all shadow-sm border border-red-100"
                                        title="Remove Location"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => {
                                    setTeamDiversity([...teamDiversity, { label: '', value: 0 }]);
                                }}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold text-sm flex items-center justify-center gap-2 hover:border-[#1F7A6E] hover:text-[#1F7A6E] hover:bg-gray-50 transition-colors"
                            >
                                <Plus size={16} />
                                Add New Location
                            </button>
                        </div>
                    </SectionCard>

                    {/* Job Board Departments */}
                    <SectionCard
                        title="Job Board Departments"
                        description="Filter categories that appear on the public Job Board. 'All Departments' is added automatically."
                        onSave={() => saveSetting('site_job_departments', jobDepartments, setSavingJobDepartments)}
                        saving={savingJobDepartments}
                    >
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {jobDepartments.map((dept, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full border border-primary/10 group animate-in zoom-in-50 duration-200">
                                        <span className="text-sm font-bold tracking-tight">{dept}</span>
                                        <button
                                            onClick={() => {
                                                const newDepts = [...jobDepartments];
                                                newDepts.splice(idx, 1);
                                                setJobDepartments(newDepts);
                                            }}
                                            className="text-primary/40 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="new-dept-input"
                                    placeholder="Add new department (e.g. Marketing)"
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1F7A6E] outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            if (val && !jobDepartments.includes(val)) {
                                                setJobDepartments([...jobDepartments, val]);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById('new-dept-input') as HTMLInputElement;
                                        const val = input.value.trim();
                                        if (val && !jobDepartments.includes(val)) {
                                            setJobDepartments([...jobDepartments, val]);
                                            input.value = '';
                                        }
                                    }}
                                    className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium italic">Press Enter or click (+) to add a department to the list.</p>
                        </div>
                    </SectionCard>

                </main>
            </div>
        </div>
    );
}
