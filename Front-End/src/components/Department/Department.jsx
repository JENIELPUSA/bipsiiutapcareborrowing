import React, { useState } from "react";
import { Search, Building2, Trash2, ChevronRight, X, Plus, Edit3, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDepartment } from "../../contexts/DepartmentContext/DepartmentContext";

const DepartmentManagement = () => {
    const {
        departments,
        isLoading,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        currentPage,
        setCurrentPage,
        totalPages,
        totalDepartmentCount,
        setSearchQuery
    } = useDepartment();

    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);

    const [formData, setFormData] = useState({
        departmentName: "",
    });

    // --- HANDLERS ---

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleOpenAdd = () => {
        setEditingDept(null);
        setFormData({ departmentName: "" });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (dept) => {
        setEditingDept(dept);
        setFormData({
            departmentName: dept.departmentName || "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { departmentName: formData.departmentName };
        try {
            if (editingDept) {
                await updateDepartment(editingDept._id, payload);
            } else {
                await createDepartment(payload);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save department:", error);
            alert("Nagkaroon ng problema sa pag-save.");
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        const confirmDelete = window.confirm("Are you sure you want to remove this department record?");
        if (confirmDelete) {
            try {
                await deleteDepartment(id);
            } catch (error) {
                console.error("Failed to delete department:", error);
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
        <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 p-4">
            {/* --- HEADER SECTION --- */}
            <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[#1e40af] dark:text-slate-50">
                        DEPARTMENT <span className="text-[#facc15]">REGISTRY</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-[#facc15]"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Organizational Structure & Units</p>
                    </div>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="group relative flex-1 md:w-80">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search departments..."
                            value={searchTerm}
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none transition-all focus:ring-2 focus:ring-[#1e40af] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            onChange={handleSearchChange}
                        />
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="group flex items-center gap-2 whitespace-nowrap rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg transition-all hover:bg-[#1e3a8a] active:scale-95"
                    >
                        <Building2
                            size={18}
                            className="text-[#facc15]"
                        />
                        ADD DEPARTMENT
                    </button>
                </div>
            </div>

            {/* --- TABLE SECTION - UPDATED UI (BiPSU Style) --- */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#1e40af]">
                                <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white">
                                    Department Name & Info
                                </th>
                                <th className="border border-[#1e3a8a] px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <AnimatePresence mode="popLayout">
                                {(departments || []).map((dept) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={dept._id}
                                        className="group transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="border border-slate-200 px-6 py-4 align-top dark:border-slate-700">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e40af] to-blue-600 text-[#facc15] shadow-md">
                                                    <LayoutGrid size={22} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">
                                                        {dept.departmentName}
                                                    </p>
                                                    <p className="mt-1 text-[9px] font-mono font-bold uppercase text-slate-400">
                                                        ID: DEPT-{dept._id ? dept._id.toString().slice(-6) : "????"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
        
                                        <td className="border border-slate-200 px-6 py-4 text-center align-top dark:border-slate-700">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(dept)}
                                                    className="p-1.5 text-slate-500 transition-colors hover:text-amber-600"
                                                    title="Edit Department"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dept._id)}
                                                    className="p-1.5 text-slate-500 transition-colors hover:text-red-600"
                                                    title="Delete Department"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {(!departments || departments.length === 0) && (
                                <tr>
                                    <td colSpan="3" className="py-20 text-center font-bold uppercase tracking-widest text-slate-400">
                                        No departments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION - UPDATED UI --- */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/30 md:flex-row">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Showing <span className="text-[#1e40af] dark:text-[#facc15]">{departments?.length || 0}</span> of{" "}
                        <span className="text-slate-800 dark:text-slate-100">{totalDepartmentCount || 0}</span> Units
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        >
                            <ChevronRight size={12} className="rotate-180" /> Prev
                        </button>

                        <div className="flex gap-1">
                            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`h-8 w-8 rounded-lg text-[9px] font-black transition-all ${
                                            currentPage === pageNum
                                                ? "bg-[#1e40af] text-white shadow-md"
                                                : "bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        >
                            Next <ChevronRight size={12} />
                        </button>
                    </div>

                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Page <span className="text-[#1e40af] dark:text-[#facc15]">{currentPage}</span> of {totalPages || 1}
                    </p>
                </div>
            </div>

            {/* --- MODAL - UPDATED UI --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 "
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl border-b-[6px] border-[#facc15] bg-white shadow-2xl dark:bg-slate-900"
                        >
                            <div className="bg-[#1e40af] p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">
                                            {editingDept ? "Update" : "Register"} <span className="text-[#facc15]">Department</span>
                                        </h3>
                                        <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white/50">
                                            Internal Unit Management
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="rounded-full p-2 transition-colors hover:bg-white/10"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4 p-6">
                                <div className="space-y-1">
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Department Name</label>
                                    <div className="relative">
                                        <Building2
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                            size={18}
                                        />
                                        <input
                                            required
                                            type="text"
                                            value={formData.departmentName}
                                            onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-5 text-sm font-bold outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="e.g., College of Engineering"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] py-3.5 text-xs font-black uppercase tracking-widest text-[#1e40af] shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
                                >
                                    {editingDept ? <Edit3 size={16} /> : <Plus size={16} />}
                                    {editingDept ? "SAVE CHANGES" : "CREATE DEPARTMENT"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DepartmentManagement;