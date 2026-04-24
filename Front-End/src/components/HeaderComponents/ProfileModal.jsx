import React, { useState, useRef, useEffect, useContext } from "react";
import { X, Shield, Mail, UserPen, MapPin, Save, Camera, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import profileImg from "@/assets/profile-image.jpg";
import { AuthContext } from "../../contexts/AuthContext";

export const ProfileModal = ({ isOpen, onClose, user }) => {
    const { UpdateUser } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // Initial state matching MERN snake_case schema
    const [formData, setFormData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        avatarPreview: profileImg,
        avatarFile: null,
    });

    // Sync state when modal opens or user data changes
    useEffect(() => {
        if (user && isOpen && !isSubmitting) {
            setFormData({
                first_name: user.first_name || "",
                middle_name: user.middle_name || "",
                last_name: user.last_name || "",
                suffix: user.suffix || "",
                avatarPreview: user.avatar?.url || profileImg,
                avatarFile: null,
            });
        }
    }, [user, isOpen, isSubmitting]);

    // Memory Cleanup para sa Blob URLs (iwas memory leak)
    useEffect(() => {
        return () => {
            if (formData.avatarPreview && formData.avatarPreview.startsWith("blob:")) {
                URL.revokeObjectURL(formData.avatarPreview);
            }
        };
    }, [formData.avatarPreview]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Linisin ang lumang blob bago mag-create ng bago
            if (formData.avatarPreview.startsWith("blob:")) {
                URL.revokeObjectURL(formData.avatarPreview);
            }
            setFormData((prev) => ({
                ...prev,
                avatarFile: file,
                avatarPreview: URL.createObjectURL(file),
            }));
        }
    };

    const handleSave = async () => {
        // Basic Validation
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            return alert("First and Last name are required.");
        }

        console.log("Submitting form with data:", formData);

        try {
            setIsSubmitting(true);

            // FormData Payload logic
            const data = new FormData();
            data.append("first_name", formData.first_name.trim());
            data.append("middle_name", formData.middle_name.trim());
            data.append("last_name", formData.last_name.trim());
            data.append("suffix", formData.suffix.trim());

            if (formData.avatarFile) {
                data.append("avatar", formData.avatarFile);
            }

            // Tawagin ang context function para sa update
            const response = await UpdateUser(user._id, data);

            if (response) {
                setIsEditing(false);
                onClose(); 
            }
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setIsEditing(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop with Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-[#1e40af]/20 backdrop-blur-md"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border-b-[10px] border-[#facc15] bg-white shadow-2xl dark:bg-slate-900"
                    >
                        {/* Banner & Avatar Section */}
                        <div className="relative h-32 bg-gradient-to-br from-[#1e40af] via-blue-600 to-blue-700">
                            <button
                                onClick={handleClose}
                                className="absolute right-5 top-5 z-20 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/40"
                            >
                                <X size={20} />
                            </button>

                            <div className="absolute -bottom-12 left-8">
                                <div className={`relative h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-white bg-slate-100 shadow-2xl dark:border-slate-900 ${isSubmitting ? 'animate-pulse' : ''}`}>
                                    <img
                                        src={formData.avatarPreview}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                    {isEditing && (
                                        <button
                                            disabled={isSubmitting}
                                            onClick={() => fileInputRef.current.click()}
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white transition-opacity hover:bg-black/70 disabled:opacity-50"
                                        >
                                            <Camera size={24} />
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="px-8 pb-8 pt-16">
                            {!isEditing ? (
                                <div className="space-y-6">
                                    <header>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                                {user?.first_name} {user?.last_name} {user?.suffix}
                                            </h2>
                                            {user?.status === "Active" && (
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                            )}
                                        </div>
                                        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
                                            <Mail size={14} /> {user?.username || user?.email}
                                        </p>
                                    </header>

                                    <div className="grid gap-3">
                                        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#1e40af] dark:bg-blue-900/30">
                                                <Shield size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position</p>
                                                <p className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">{user?.role}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Laboratory</p>
                                                <p className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">
                                                    {user?.laboratory?.laboratoryName || "General Access"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1e40af] py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 dark:shadow-none"
                                    >
                                        <UserPen size={16} /> Edit Profile Info
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <div className="col-span-2">
                                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">First Name</label>
                                            <input
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-sm font-bold outline-none transition-all focus:border-[#1e40af] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Middle Name</label>
                                            <input
                                                name="middle_name"
                                                value={formData.middle_name}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-sm font-bold outline-none transition-all focus:border-[#1e40af] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Last Name</label>
                                            <input
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-sm font-bold outline-none transition-all focus:border-[#1e40af] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Suffix</label>
                                            <input
                                                name="suffix"
                                                value={formData.suffix}
                                                onChange={handleInputChange}
                                                disabled={isSubmitting}
                                                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 text-sm font-bold outline-none transition-all focus:border-[#1e40af] focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="e.g. Jr., III"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3 pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSubmitting}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95 disabled:bg-emerald-300 dark:shadow-none"
                                        >
                                            <Save size={16} /> {isSubmitting ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            disabled={isSubmitting}
                                            className="flex-1 rounded-2xl bg-slate-100 py-4 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};