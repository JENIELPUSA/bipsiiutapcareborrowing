import React, { useEffect } from "react";
import { X, Loader2, Scan, Upload, MapPin, Mail } from "lucide-react";
import { motion } from "framer-motion";

const BorrowerForm = ({
    isModalOpen,
    handleCloseModal,
    handleSubmit,
    formData,
    setFormData,
    editingBorrower,
    isSubmitting,
    laboratories,
    handleLabChange
}) => {

    // --- DEFAULT ROLE LOGIC ---
    useEffect(() => {
        if (isModalOpen && !formData.role) {
            setFormData(prev => ({
                ...prev,
                role: "borrower"
            }));
        }
    }, [isModalOpen, setFormData, formData.role]);

    // Handle input changes (auto-uppercase)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value.toUpperCase(),
            role: "borrower"
        }));
    };

    // Handle specific changes without auto-uppercase (Email, Password)
    const handleRawInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            role: "borrower" 
        }));
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
                className="absolute inset-0"
            />
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between bg-[#1e40af] px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white/20 p-2">
                            <Scan size={20} className="text-[#facc15]" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tighter">
                            {editingBorrower ? "Update" : "Enroll"} <span className="text-[#facc15]">Borrower</span>
                        </h3>
                    </div>
                    <button onClick={handleCloseModal} className="rounded-full p-1.5 transition-colors hover:bg-white/10">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto space-y-4 p-6 text-left">
                    
                    {/* RFID STATUS SECTION */}
                    <div className={`flex items-center justify-between rounded-2xl border-2 border-dashed p-4 transition-all ${formData.rfidId ? "border-green-500 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
                        <div className="flex items-center gap-3">
                            <div className={`rounded-xl p-3 ${formData.rfidId ? "bg-green-500 shadow-green-200" : "bg-[#1e40af] animate-pulse"} text-white shadow-lg`}>
                                <Scan size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">RFID Tag Status</p>
                                <p className={`font-mono text-sm font-bold ${formData.rfidId ? "text-green-600" : "text-slate-400 italic"}`}>
                                    {formData.rfidId || "Tap RFID Card to scan..."}
                                </p>
                            </div>
                        </div>
                        {formData.rfidId && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-600 uppercase">Linked</span>
                        )}
                    </div>

                    {/* NAME FIELDS */}
                    <div className="grid grid-cols-6 gap-2">
                        <div className="col-span-3 space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400">First Name</label>
                            <input required type="text" name="first_name" placeholder="JUAN" value={formData.first_name || ""} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Middle Name</label>
                            <input type="text" name="middle_name" placeholder="M" value={formData.middle_name || ""} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Suffix</label>
                            <input type="text" name="suffix" placeholder="JR" value={formData.suffix || ""} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                        </div>
                        <div className="col-span-6 space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Last Name</label>
                            <input required type="text" name="last_name" placeholder="DELA CRUZ" value={formData.last_name || ""} onChange={handleInputChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                        </div>
                    </div>

                    {/* CONTACT, EMAIL & TYPE */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Contact Number</label>
                            <input required type="tel" name="contactNumber" placeholder="09xxxxxxxxx" value={formData.contactNumber || ""} onChange={handleRawInputChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                        </div>
                        <div className="space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Borrower Type</label>
                            <select required name="borrowerType" value={formData.borrowerType || "student"} onChange={handleRawInputChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]">
                                <option value="student">Student</option>
                                <option value="employee">Employee</option>
                            </select>
                        </div>
                        {/* EMAIL FIELD ADDED HERE */}
                        <div className="col-span-2 space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
                                <Mail size={10} /> Email Address
                            </label>
                            <input required type="email" name="email" placeholder="juan.delacruz@example.com" value={formData.email || ""} onChange={handleRawInputChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                        </div>
                    </div>

                    {/* ADDRESS FIELD */}
                    <div className="space-y-1">
                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
                            <MapPin size={10} /> Home Address
                        </label>
                        <textarea 
                            required 
                            name="address" 
                            rows="2"
                            placeholder="HOUSE NO., STREET, BARANGAY, CITY, PROVINCE" 
                            value={formData.address || ""} 
                            onChange={handleInputChange} 
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af] resize-none"
                        />
                    </div>

                    {/* PASSWORD FIELDS */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Password</label>
                            <input required={!editingBorrower} type="password" name="password" placeholder="••••••••" value={formData.password || ""} onChange={handleRawInputChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                        </div>
                        <div className="space-y-1">
                            <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Confirm Password</label>
                            <input required={!editingBorrower} type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword || ""} onChange={handleRawInputChange} className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 ${formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-[#1e40af]"}`} />
                        </div>
                    </div>
                    {/* ACTION BUTTON */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.rfidId}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[11px] font-black uppercase tracking-widest shadow-md transition-all active:scale-[0.98] ${!formData.rfidId ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-[#facc15] text-[#1e40af] hover:brightness-110 shadow-yellow-200"}`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin" size={14} /> SYNCING TO DATABASE...</>
                            ) : (
                                <><Upload size={14} /> {editingBorrower ? "UPDATE BORROWER" : "CONFIRM REGISTRATION"}</>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default BorrowerForm;