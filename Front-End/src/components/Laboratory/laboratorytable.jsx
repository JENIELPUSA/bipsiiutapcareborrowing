import React, { useState, useEffect } from "react";
import { 
    Search, Beaker, FlaskConical, Trash2, 
    ChevronRight, Info, X, Plus, Edit3, 
    UserCircle, Building2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLaboratory } from "../../contexts/LaboratoryContext/laboratoryContext.jsx";
import { useDepartment } from "../../contexts/DepartmentContext/DepartmentContext.jsx";

const LabManagement = () => {
    const {
        laboratories,
        isLoading,
        createLaboratory,
        updateLaboratory,
        deleteLaboratory,
        currentPage,
        setCurrentPage,
        totalPages,
        totalCategoryCount,
        setSearchQuery,
    } = useLaboratory();

    const { departments } = useDepartment();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLab, setEditingLab] = useState(null);

    console.log("Laboratories:", laboratories);

    const [formData, setFormData] = useState({
        laboratoryName: "",
        description: "",
        status: "Operational",
        role: "Admin", 
        departmentId: "",
    });

    // --- HANDLERS ---
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleOpenAdd = () => {
        setEditingLab(null);
        setFormData({ 
            laboratoryName: "", 
            description: "", 
            status: "Operational",
            role: "Admin",
            departmentId: "" 
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (lab) => {
        setEditingLab(lab);
        setFormData({
            laboratoryName: lab.laboratoryName || "",
            description: lab.description || "",
            status: lab.status || "Operational",
            role: lab.role || "Admin",
            departmentId: lab.departmentId || "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalData = {
                ...formData,
                departmentId: formData.role === "In-charge" ? formData.departmentId : null
            };

            if (editingLab) {
                await updateLaboratory(editingLab.id, finalData);
            } else {
                await createLaboratory(finalData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save error:", error);
            alert("Nagkaroon ng problema sa pag-save.");
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (window.confirm("Remove this laboratory record?")) {
            try {
                await deleteLaboratory(id);
            } catch (error) {
                console.error("Delete error:", error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1e40af] border-t-[#facc15]"></div>
            </div>
        );
    }

    return (
        <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 bg-slate-50 p-4 dark:bg-slate-950">
            {/* --- HEADER --- */}
            <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[#1e40af] dark:text-slate-50">
                        LABORATORY <span className="text-[#facc15]">REGISTRY</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-[#facc15]"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Facility Management</p>
                    </div>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="group relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e40af]" size={18} />
                        <input
                            type="text"
                            placeholder="Search labs..."
                            value={searchTerm}
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none transition-all focus:ring-2 focus:ring-[#1e40af] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            onChange={handleSearchChange}
                        />
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="group flex items-center gap-2 rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg transition-all hover:bg-[#1e3a8a] active:scale-95"
                    >
                        <FlaskConical size={18} className="text-[#facc15]" />
                        ADD LABORATORY
                    </button>
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl dark:border-slate-900 dark:bg-slate-950">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="border-b border-slate-100 px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-900">Details</th>
                                <th className="border-b border-slate-100 px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-900">Description</th>
                                <th className="border-b border-slate-100 px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-900">Status</th>
                                <th className="border-b border-slate-100 px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                            <AnimatePresence mode="popLayout">
                                {(laboratories || []).map((lab) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={lab.id}
                                        className="group transition-all hover:bg-[#1e40af]/[0.03] dark:hover:bg-[#facc15]/[0.02]"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e40af] text-[#facc15]">
                                                    <Beaker size={22} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">{lab.laboratoryName}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">Role: {lab.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm italic text-slate-600 dark:text-slate-400">"{lab.description}"</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 ${
                                                lab.status === "Operational" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                            }`}>
                                                {lab.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEdit(lab)} className="p-2 text-slate-400 hover:text-[#1e40af]"><Edit3 size={18} /></button>
                                                <button onClick={() => handleDelete(lab.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                                <ChevronRight size={18} className="text-slate-300" />
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION CONTROLS (BALIK NA!) --- */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-900 dark:bg-slate-900/30 md:flex-row">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Showing <span className="text-[#1e40af] dark:text-[#facc15]">{laboratories?.length || 0}</span> of {totalCategoryCount} Labs
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase disabled:opacity-30 dark:bg-slate-900 dark:border-slate-800"
                        >
                            Prev
                        </button>
                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`h-10 w-10 rounded-xl text-[10px] font-black ${currentPage === i + 1 ? "bg-[#1e40af] text-white" : "bg-white text-slate-400 dark:bg-slate-900"}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase disabled:opacity-30 dark:bg-slate-900 dark:border-slate-800"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden shadow-2xl">
                            <div className="bg-[#1e40af] p-8 text-white flex justify-between items-center">
                                <h3 className="text-xl font-black uppercase tracking-tighter">{editingLab ? "Edit" : "Register"} <span className="text-[#facc15]">Laboratory</span></h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-8 space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Laboratory Name</label>
                                    <input required type="text" value={formData.laboratoryName} onChange={(e) => setFormData({ ...formData, laboratoryName: e.target.value })} className="w-full rounded-2xl border bg-slate-50 py-3.5 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1e40af] dark:bg-slate-800 dark:text-white" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">User Role</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full appearance-none rounded-2xl border bg-slate-50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1e40af] dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="In-charge">In-charge</option>
                                        </select>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {formData.role === "In-charge" && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-[#1e40af] dark:text-[#facc15]">Assign Department</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#facc15]" size={18} />
                                                <select
                                                    required={formData.role === "In-charge"}
                                                    value={formData.departmentId}
                                                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                                    className="w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/30 py-3.5 pl-12 pr-5 text-sm font-bold outline-none dark:bg-slate-800"
                                                >
                                                    <option value="">Select Department...</option>
                                                    {departments?.map((dept) => (
                                                        <option key={dept.id || dept._id} value={dept.id || dept._id}>{dept.departmentName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                                    <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-2xl border bg-slate-50 py-3.5 px-5 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:bg-slate-800 dark:text-white resize-none" />
                                </div>

                                <button type="submit" className="w-full py-4 rounded-2xl bg-[#facc15] text-[#1e40af] font-black uppercase text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all">
                                    {editingLab ? "SAVE CHANGES" : "REGISTER FACILITY"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LabManagement;