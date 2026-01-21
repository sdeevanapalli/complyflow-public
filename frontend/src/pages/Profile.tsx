import React, { useState, useEffect } from 'react';
import { User, Briefcase, Building, FileText, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getProfile, updateProfile, UserProfile } from '../services/api';

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state
    const [profession, setProfession] = useState('');
    const [company, setCompany] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        const data = await getProfile();
        if (data) {
            setProfile(data);
            setProfession(data.profession || '');
            setCompany(data.company_name || '');
            setBio(data.bio || '');
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const updated = await updateProfile({
            profession,
            company_name: company,
            bio
        });

        if (updated) {
            setProfile(updated);
            setMessage({ type: 'success', text: 'Profile updated successfully! The AI will now use this context.' });
        } else {
            setMessage({ type: 'error', text: 'Failed to update profile. Please check your connection.' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background">
                <Loader2 className="h-12 w-12 text-zinc-950 dark:text-zinc-100 animate-spin mb-4" />
                <p className="text-zinc-600 dark:text-zinc-400 font-medium">Loading your profile preferences...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">My Profile</h1>
                <p className="text-zinc-600 dark:text-zinc-400">Update your information to receive personalized tax compliance advice.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Summary Card */}
                <div className="md:col-span-1">
                    <div className="bg-card rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="h-24 bg-zinc-950 dark:bg-zinc-800"></div>
                        <div className="px-6 pb-6 text-center">
                            <div className="relative -mt-12 mb-4 inline-block">
                                <div className="h-24 w-24 rounded-full bg-card p-1 shadow-lg border border-zinc-100 dark:border-zinc-800">
                                    <div className="h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-950 dark:text-zinc-200">
                                        <User size={48} />
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{profile?.full_name || 'Tax Professional'}</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{profile?.email}</p>

                            <div className="flex flex-wrap justify-center gap-2">
                                <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider">
                                    {profession || 'Professional'}
                                </span>
                            </div>
                        </div>
                        <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-widest mb-3">
                                <CheckCircle2 size={14} className="mr-1 text-green-500" /> AI Insights Active
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                                "The AI will tailor responses specifically for a {profession || 'user'} at {company || 'their organization'}."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Editor Form */}
                <div className="md:col-span-2 space-y-6">
                    {message && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-red-50 border border-red-100 text-red-800'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="bg-card rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                        <Briefcase size={16} className="text-zinc-400" /> Profession
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Chartered Accountant"
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:focus:ring-zinc-100/10 focus:border-zinc-950 dark:focus:border-zinc-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        value={profession}
                                        onChange={(e) => setProfession(e.target.value)}
                                    />
                                    <p className="text-[11px] text-zinc-500 font-medium">Critical for context-aware tax advice from the AI.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                        <Building size={16} className="text-zinc-400" /> Company Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ABC Tax Solutions"
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:focus:ring-zinc-100/10 focus:border-zinc-950 dark:focus:border-zinc-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    <FileText size={16} className="text-zinc-400" /> Professional Bio
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Briefly describe your role or focus area..."
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:focus:ring-zinc-100/10 focus:border-zinc-950 dark:focus:border-zinc-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end items-center gap-4">
                                <p className="text-xs text-zinc-500 italic hidden sm:block">
                                    Changes take effect immediately across all AI interactions.
                                </p>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white dark:text-zinc-950 rounded-xl font-bold shadow-lg shadow-zinc-950/20 dark:shadow-zinc-950/40 transition-all flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Preferences
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex gap-4 items-start">
                        <div className="h-10 w-10 rounded-lg bg-zinc-950 dark:bg-zinc-800 flex items-center justify-center text-white shrink-0 mt-1">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">How your profile helps</h3>
                            <p className="text-xs text-zinc-800 dark:text-zinc-400 leading-relaxed">
                                When you ask ComplyFlow a question, we automatically share your profession and bio with the AI.
                                For example, an Accountant gets technical citations, while a Business Owner gets practical advice
                                on how to save taxes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
