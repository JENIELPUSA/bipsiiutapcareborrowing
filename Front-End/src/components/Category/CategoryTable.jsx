import React, { useState, useRef, useContext, useCallback } from "react";
import { Search, PlusCircle, X, Info, Settings, Tag, Box, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryContext } from "../../contexts/CategoryContext/categoryContext";
import StatusModal from "../../ReusableFolder/SuccessandField";

const EquipmentCategoryRegistry = () => {
    // Kinukuha ang lahat ng kailangan mula sa CategoryContext
    const { 
        createCategory, 
        categories, 
        currentPage, 
        setCurrentPage, 
        totalPages, 
        totalCategoryCount, 
        setSearchQuery, 
    } = useContext(CategoryContext);

    console.log("Categories in Table:", categories); // Debugging log

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalProps, setStatusModalProps] = useState({
        status: "success",
        error: null,
        title: "",
        message: "",
        onRetry: null,
    });

    const nameRef = useRef();
    const descRef = useRef();

    // Hanler para sa Search - ikokonekta sa context searchQuery
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // I-reset sa page 1 kapag naghahanap
    };

    const showStatusMessage = useCallback((status, error = null, customProps = {}) => {
        setStatusModalProps({
            status,
            error,
            title: customProps.title || "",
            message: customProps.message || "",
            onRetry: customProps.onRetry || null,
        });
        setShowStatusModal(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            categoryName: nameRef.current.value,
            discription: descRef.current.value, // Spelling based sa API context mo
            priority: "Medium",
            assetCount: 0,
        };

        try {
            const result = await createCategory(payload);
            if (result?.success) {
                showStatusMessage("success", null, { 
                    title: "Successfully Created!", 
                    message: "Category created successfully." 
                });
                setIsModalOpen(false);
                e.target.reset();
            } else {
                showStatusMessage("error", null, { 
                    title: "Registration Failed", 
                    message: result?.message || "Failed to create category" 
                });
            }
        } catch (error) {
            console.error("Failed to create category:", error);
        }
    };

    return (
        <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 bg-slate-50 p-2 transition-colors dark:bg-slate-950">
            
            {/* --- HEADER SECTION --- */}
            <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[#1e40af] dark:text-slate-50">
                        EQUIPMENT <span className="text-[#facc15]">CATEGORIES</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-[#facc15]"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Inventory Classification & Management</p>
                    </div>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="group relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Category..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm outline-none transition-all focus:ring-2 focus:ring-[#1e40af] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            onChange={handleSearchChange}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group flex items-center gap-2 whitespace-nowrap rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg transition-all hover:bg-[#1e3a8a] active:scale-95"
                    >
                        <PlusCircle size={18} className="text-[#facc15]" />
                        ADD CATEGORY
                    </button>
                </div>
            </div>

            {/* --- TABLE SECTION --- */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl dark:border-slate-900 dark:bg-slate-950">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="border-b border-slate-100 px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-800">Category Name</th>
                                <th className="border-b border-slate-100 px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-800">Description</th>
                                <th className="border-b border-slate-100 px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-800">Asset Count</th>
                                <th className="border-b border-slate-100 px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-800">Priority</th>
                                <th className="border-b border-slate-100 px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-800">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                            {categories?.length > 0 ? (
                                categories.map((cat) => (
                                    <motion.tr
                                        key={cat._id || Math.random()}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group transition-all hover:bg-[#1e40af]/[0.03] dark:hover:bg-white/[0.02]"
                                    >
                                        <td className="px-8 py-5 text-sm font-bold text-slate-800 dark:text-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1e40af] dark:bg-slate-800 dark:text-[#facc15]">
                                                    <Tag size={16} />
                                                </div>
                                                {cat.categoryName || "Untitled"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="line-clamp-1 max-w-[400px] text-xs italic text-slate-500 dark:text-slate-400">
                                                {cat.discription || "No description provided."}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Box size={14} className="text-slate-400" />
                                                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{cat.equipmentCount ?? 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className={`mx-auto w-fit rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider 
                                                ${cat.priority === "Critical" ? "border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10" : 
                                                  cat.priority === "High" ? "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10" : 
                                                  "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10"}`}>
                                                {cat.priority || "Medium"}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#1e40af] transition-colors hover:text-[#facc15] dark:text-slate-400">
                                                <Settings size={12} /> Manage
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-sm italic text-slate-400">No categories found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION CONTROLS --- */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-8 py-6 md:flex-row dark:border-slate-900 dark:bg-slate-900/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Showing <span className="text-[#1e40af] dark:text-[#facc15]">{categories?.length || 0}</span> of <span className="text-slate-800 dark:text-slate-100">{totalCategoryCount}</span> Entries
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>

                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`h-10 w-10 rounded-xl text-[10px] font-black transition-all ${
                                        currentPage === i + 1 
                                        ? "bg-[#1e40af] text-white shadow-lg shadow-blue-200 dark:shadow-none" 
                                        : "bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Page <span className="text-[#1e40af] dark:text-[#facc15]">{currentPage}</span> of {totalPages}
                    </p>
                </div>
            </div>

            {/* --- ADD MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
                            <div className="flex items-center justify-between bg-[#1e40af] p-8 text-white">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">New <span className="text-[#facc15]">Category</span></h3>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Classification Entry</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-white/10"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4 p-8">
                                <div className="space-y-1">
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Category Name</label>
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input ref={nameRef} required type="text" placeholder="e.g. Glassware" className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3.5 pl-12 pr-5 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                                    <div className="relative">
                                        <Info className="absolute left-4 top-4 text-slate-300" size={16} />
                                        <textarea ref={descRef} required rows={4} placeholder="Scope and purpose..." className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 py-3.5 pl-12 pr-5 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                    </div>
                                </div>
                                <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#facc15] py-4 text-xs font-black uppercase tracking-widest text-[#1e40af] shadow-lg hover:brightness-110 transition-all active:scale-[0.98]">
                                    <PlusCircle size={16} /> Register Category
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <StatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                {...statusModalProps}
            />
        </div>
    );
};

export default EquipmentCategoryRegistry;