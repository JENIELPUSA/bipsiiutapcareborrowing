import React, { useState, useContext, useEffect } from "react";
import { EquipmentContext } from "../../contexts/EquipmentContext/EquipmentContext";
import { CategoryContext } from "../../contexts/CategoryContext/categoryContext.jsx";
import { Search, Trash2, PlusCircle, Settings, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const InventoryManagement = () => {
    // 1. Contexts
    const {
        equipments,
        createEquipment,
        updateEquipment,
        deleteEquipment,
        fetchEquipments,
        currentPage,
        setCurrentPage,
        totalPages,
        searchQuery,
        setSearchQuery,
        totalEquipmentCount,
        isLoading
    } = useContext(EquipmentContext);

    const { categoriesDropdown, fetchcategorydropdown } = useContext(CategoryContext);

    // 2. Local States
    const [searchTerm, setSearchTerm] = useState(searchQuery || "");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    console.log("Equipments in InventoryTable:", equipments);

    const initialFormState = {
        category: "",
        brand: "",
        model: "",
        serialNo: "",
        status: "Active",
    };

    const [formData, setFormData] = useState(initialFormState);

    // 3. Effects
    useEffect(() => {
        if (fetchcategorydropdown) fetchcategorydropdown();
    }, [fetchcategorydropdown]);

    // Debounced Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setSearchQuery(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, setSearchQuery, setCurrentPage]);

    // Auto-select first category if empty
    useEffect(() => {
        if (categoriesDropdown?.length > 0 && !formData.category) {
            setFormData((prev) => ({
                ...prev,
                category: categoriesDropdown[0]._id
            }));
        }
    }, [categoriesDropdown, formData.category]);

    // 4. Handlers
    const handleOpenAdd = () => {
        setEditingItem(null);
        setFormData({
            ...initialFormState,
            category: categoriesDropdown?.[0]?._id || "",
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);

        // Kunin ang ID ng category (maging object man ito o string galing sa API)
        const categoryId = typeof item.category === 'object'
            ? item.category._id
            : item.category;

        setFormData({
            category: categoryId || "",
            brand: item.brand || "",
            model: item.model || "",
            serialNo: item.serialNo || "",
            status: item.status || "Active",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Pinagsama para sa backend compatibility kung kailangan ng 'brandModel' field
        const finalData = {
            ...formData,
            brandModel: `${formData.brand} / ${formData.model}`,
        };

        try {
            if (editingItem) {
                await updateEquipment(editingItem._id, finalData);
            } else {
                await createEquipment(finalData);
            }
            setIsModalOpen(false);
            setFormData(initialFormState);
        } catch (error) {
            console.error("Error saving asset:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this asset?")) {
            try {
                if (deleteEquipment) await deleteEquipment(id);
            } catch (error) {
                console.error("Error deleting asset:", error);
            }
        }
    };

    const renderCategoryName = (categoryData) => {
        if (!categoryData) return "Uncategorized";
        // Kung object ang category (gaya ng sa data mo)
        if (typeof categoryData === 'object' && categoryData.categoryName) {
            return categoryData.categoryName;
        }
        // Kung ID lang ang dumarating, hanapin sa dropdown list
        const found = categoriesDropdown?.find(c => c._id === categoryData);
        return found ? found.categoryName : "Unknown";
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4">
            {/* --- HEADER --- */}
            <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter text-[#1e40af]">
                        ASSET <span className="text-[#facc15]">INVENTORY</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="h-1 w-8 rounded-full bg-[#facc15]"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Asset Tracking & Management</p>
                    </div>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="group relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Assets..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={16} />}
                    </div>
                    <button onClick={handleOpenAdd} className="group flex items-center gap-2 rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg active:scale-95 transition-transform">
                        <PlusCircle size={18} className="text-[#facc15]" />
                        ADD ASSET
                    </button>
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/80">
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Name</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Brand / Model</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Serial No</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {equipments?.length > 0 ? (
                                equipments.map((item) => (
                                    <tr key={item._id} className="group hover:bg-[#1e40af]/[0.02] transition-colors">
                                        {/* Ginamit ang Brand + Model bilang fallback sa Asset Name */}
                                        <td className="px-6 py-4 font-bold text-slate-700">{item.brand} {item.model}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500">
                                                {renderCategoryName(item.category)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 italic">
                                            {item.brand} / {item.model}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.serialNo}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase ${item.status === "Active" ? "border-green-200 bg-green-50 text-green-600" : "border-amber-200 bg-amber-50 text-amber-600"}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-400 hover:text-[#1e40af] transition-colors"><Settings size={16} /></button>
                                                <button onClick={() => handleDelete(item._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        {isLoading ? "Fetching Assets..." : "No Assets Found"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-50 bg-slate-50/50 px-8 py-4 md:flex-row">
                    <div className="flex flex-col items-center md:items-start">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Showing <span className="text-[#1e40af]">{equipments?.length || 0}</span> of <span className="text-[#1e40af]">{totalEquipmentCount || 0}</span> assets
                        </p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Page {currentPage} of {totalPages || 1}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>

                        <div className="hidden sm:flex gap-1">
                            {[...Array(totalPages || 0)].map((_, i) => {
                                if (i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)) {
                                    return (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`h-10 w-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1
                                                    ? "bg-[#1e40af] text-white shadow-md shadow-blue-200"
                                                    : "bg-white text-slate-400 border border-slate-100 hover:border-slate-300"
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                            className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
                            <div className="bg-[#1e40af] p-8 text-white flex justify-between items-center">
                                <h3 className="text-xl font-black uppercase tracking-tight">Asset <span className="text-[#facc15]">Details</span></h3>
                                <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#1e40af] transition-all"
                                    >
                                        <option value="">Select Category</option>
                                        {categoriesDropdown?.map((cat) => (
                                            <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Brand</label>
                                        <input 
                                            placeholder="e.g. ACER" 
                                            value={formData.brand} 
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })} 
                                            className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-[#1e40af]" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Model</label>
                                        <input 
                                            placeholder="e.g. ASPHIRE" 
                                            value={formData.model} 
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                                            className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-3 text-sm outline-none focus:ring-2 focus:ring-[#1e40af]" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Serial No</label>
                                        <input 
                                            placeholder="Serial No" 
                                            value={formData.serialNo} 
                                            onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })} 
                                            className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-[#1e40af]" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
                                        <select 
                                            value={formData.status} 
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                                            className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1e40af]"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="Retired">Retired</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="w-full rounded-2xl bg-[#facc15] py-4 text-xs font-black uppercase text-[#1e40af] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-yellow-100 mt-4">
                                    {editingItem ? "Update Asset" : "Register Asset"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventoryManagement;