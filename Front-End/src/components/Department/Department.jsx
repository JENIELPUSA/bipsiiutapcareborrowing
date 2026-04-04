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
        setSearchQuery,
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
        <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 bg-slate-50 p-4 dark:bg-slate-950">
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
                        className="group flex items-center gap-2 whitespace-nowrap rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-[#1e3a8a] active:scale-95"
                    >
                        <Building2
                            size={18}
                            className="text-[#facc15]"
                        />
                        ADD DEPARTMENT
                    </button>
                </div>
            </div>

            {/* --- TABLE SECTION --- */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-900 dark:bg-slate-950 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="border-b border-slate-100 px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-900">
                                    Department Name & Info
                                </th>
                                <th className="border-b border-slate-100 px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-900">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                            <AnimatePresence mode="popLayout">
                                {(departments || []).map((dept) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={dept._id}
                                        className="group transition-all hover:bg-[#1e40af]/[0.03] dark:hover:bg-[#facc15]/[0.02]"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e40af] to-[#3b82f6] text-[#facc15] shadow-inner">
                                                    <LayoutGrid size={22} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 transition-colors group-hover:text-[#1e40af] dark:text-slate-100 dark:group-hover:text-[#facc15]">
                                                        {dept.departmentName}
                                                    </p>
                                                    <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                                                        ID: DEPT-{dept._id ? dept._id.toString().slice(-4) : "????"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    onClick={() => handleOpenEdit(dept)}
                                                    className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-[#1e40af] dark:hover:bg-slate-800"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dept._id)}
                                                    className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button className="p-2 text-slate-300">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-900 dark:bg-slate-900/30 md:flex-row">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Showing <span className="text-[#1e40af] dark:text-[#facc15]">{departments?.length || 0}</span> of {totalDepartmentCount} Units
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                            Prev
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center justify-between bg-[#1e40af] p-8 text-white">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">
                                        {editingDept ? "Update" : "Register"} <span className="text-[#facc15]">Department</span>
                                    </h3>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Internal Unit Management</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-full p-2 hover:bg-white/10"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5 p-8"
                            >
                                <div className="space-y-1">
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Department Name</label>
                                    <div className="relative">
                                        <Building2
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                                            size={18}
                                        />
                                        <input
                                            required
                                            type="text"
                                            value={formData.departmentName}
                                            onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3.5 pl-12 pr-5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="e.g. College of Engineering"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#facc15] py-4 text-xs font-black uppercase tracking-widest text-[#1e40af] shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
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
