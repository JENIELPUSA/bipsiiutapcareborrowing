import React, { useState, useRef, useContext, useCallback } from "react";
import {
    Search, PlusCircle, X, Tag,
    ChevronLeft, ChevronRight, Eye, Edit2, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryContext } from "../../contexts/CategoryContext/categoryContext";
import StatusModal from "../../ReusableFolder/SuccessandField";
import AssetSidebar from "./AssetSidebar";

const EquipmentCategoryRegistry = () => {
    const {
        createCategory,
        updateCategory,
        deleteCategory,
        categories,
        currentPage,
        setCurrentPage,
        totalPages,
        totalCategoryCount,
        setSearchQuery,
        fetchEquipmentByCategory,
        Equipments, setEquipments
    } = useContext(CategoryContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isRightSideOpen, setIsRightSideOpen] = useState(false);
    const [isShowingAll, setIsShowingAll] = useState(false);

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

    const handleAddClick = () => {
        setIsEditing(false);
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (e, category) => {
        e.stopPropagation();
        setIsEditing(true);
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleViewClick = (category) => {
        setIsShowingAll(false);
        fetchEquipmentByCategory(category._id, false);
        setSelectedCategory(category);
        setIsRightSideOpen(true);
    };

    const handleShowAll = () => {
        if (selectedCategory) {
            fetchEquipmentByCategory(selectedCategory._id, true);
            setIsShowingAll(true);
        }
    };

    const handleDeleteClick = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                const result = await deleteCategory(id);
                if (result?.success) {
                    showStatusMessage("success", null, {
                        title: "Deleted!",
                        message: "Category has been removed successfully."
                    });
                }
            } catch (error) {
                console.error("Delete Error:", error);
            }
        }
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
            discription: descRef.current.value,
            priority: selectedCategory?.priority || "Medium",
        };

        try {
            let result;
            if (isEditing) {
                result = await updateCategory(selectedCategory._id, payload);
            } else {
                result = await createCategory({ ...payload, assetCount: 0 });
            }

            if (result?.success) {
                showStatusMessage("success", null, {
                    title: isEditing ? "Updated Successfully!" : "Successfully Created!",
                    message: isEditing ? "Category details have been modified." : "Category created successfully."
                });
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Action Failed:", error);
        }
    };

    return (
        <div className="relative mx-auto min-h-screen w-full max-w-7xl space-y-6 p-2">
            {/* HEADER SECTION */}
            <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[#1e40af] dark:text-slate-50">
                        EQUIPMENT <span className="text-[#facc15]">CATEGORIES</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-[#facc15]"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Inventory Classification</p>
                    </div>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="group relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-800 dark:bg-slate-900"
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <button onClick={handleAddClick} className="flex items-center gap-2 rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg active:scale-95 transition-transform">
                        <PlusCircle size={18} className="text-[#facc15]" /> ADD
                    </button>
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#1e40af]">
                                <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white">
                                    Category Name
                                </th>
                                <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white">
                                    Description
                                </th>
                                <th className="border border-[#1e3a8a] px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-white">
                                    Assets
                                </th>
                                <th className="border border-[#1e3a8a] px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {categories?.map((cat) => (
                                <tr key={cat._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="border border-slate-200 px-6 py-4 align-top dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e40af] to-blue-600 text-[#facc15] shadow-md">
                                                <Tag size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {cat.categoryName}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="border border-slate-200 px-6 py-4 align-top dark:border-slate-700">
                                        <p className="line-clamp-2 max-w-[300px] text-xs italic text-slate-500 dark:text-slate-400">
                                            {cat.discription || "No description provided"}
                                        </p>
                                    </td>
                                    <td className="border border-slate-200 px-6 py-4 text-center align-top dark:border-slate-700">
                                        <div className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-black text-[#1e40af] dark:bg-blue-900/20 dark:text-blue-300">
                                            {cat.equipmentCount || 0}
                                        </div>
                                    </td>
                                    <td className="border border-slate-200 px-6 py-4 text-center align-top dark:border-slate-700">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleViewClick(cat)} 
                                                className="p-1.5 text-slate-500 transition-colors hover:text-blue-600"
                                                title="View Equipment"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleEditClick(e, cat)} 
                                                className="p-1.5 text-slate-500 transition-colors hover:text-amber-600"
                                                title="Edit Category"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteClick(e, cat._id)} 
                                                className="p-1.5 text-slate-500 transition-colors hover:text-red-600"
                                                title="Delete Category"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/30 md:flex-row">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Showing <span className="text-[#1e40af] dark:text-[#facc15]">{categories?.length || 0}</span> of{" "}
                        <span className="text-slate-800 dark:text-slate-100">{totalCategoryCount || 0}</span> Entries
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        >
                            <ChevronLeft size={12} /> Prev
                        </button>

                        <div className="flex gap-1">
                            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;
                                
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
                            onClick={() => setCurrentPage(p => p + 1)}
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

            {/* SEPARATED ASSET SIDEBAR WITH FULL BLUR OVERLAY */}
            <AnimatePresence>
                {isRightSideOpen && (
                    <div className="fixed inset-0 z-[150] flex justify-end">
                        {/* Full-Screen Backdrop Overlay (Sagad sa taas) */}
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsRightSideOpen(false)} 
                            className="fixed inset-0 bg-[#1e40af]/10 backdrop-blur-md" 
                        />
                        
                        {/* Sidebar Content */}
                        <AssetSidebar
                            isOpen={isRightSideOpen}
                            onClose={() => setIsRightSideOpen(false)}
                            selectedCategory={selectedCategory}
                            Equipments={Equipments}
                            isShowingAll={isShowingAll}
                            handleShowAll={handleShowAll}
                            setEquipments={setEquipments}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL - ADD/EDIT CATEGORY */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsModalOpen(false)} 
                            className="fixed inset-0 " 
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-[161] w-full max-w-lg mx-4 overflow-hidden rounded-2xl border-b-[6px] border-[#facc15] bg-white shadow-2xl dark:bg-slate-900"
                        >
                            <div className="bg-[#1e40af] p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">
                                            {isEditing ? "Update" : "New"} <span className="text-[#facc15]">Category</span>
                                        </h3>
                                        <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white/50">
                                            Fill out category details
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
                                    <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Category Name</label>
                                    <input 
                                        ref={nameRef} 
                                        defaultValue={selectedCategory?.categoryName || ""} 
                                        required 
                                        placeholder="e.g., Laptops, Monitors, Projectors" 
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Description</label>
                                    <textarea 
                                        ref={descRef} 
                                        defaultValue={selectedCategory?.discription || ""} 
                                        required 
                                        rows={4} 
                                        placeholder="Describe the equipment category..." 
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all resize-none" 
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] py-3.5 text-xs font-black uppercase tracking-widest text-[#1e40af] shadow-lg transition-all hover:brightness-105 active:scale-[0.98]"
                                >
                                    <PlusCircle size={16} />
                                    {isEditing ? "UPDATE CATEGORY" : "CREATE CATEGORY"}
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