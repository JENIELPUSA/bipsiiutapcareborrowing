import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Hash, ChevronDown, Info, 
    User, HardDrive, ShieldCheck 
} from "lucide-react";

const AssetSidebar = ({
    isOpen,
    onClose,
    selectedCategory,
    Equipments,
    isShowingAll,
    handleShowAll,
    setEquipments
}) => {

    // Function para i-clear ang list bago i-close para iwas "flicker" sa susunod na bukas
    const handleCloseSidebar = () => {
        if (setEquipments) {
            setEquipments(null); 
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex justify-end">
                    {/* Overlay Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseSidebar}
                        className="absolute inset-0 bg-[#1e40af]/10 backdrop-blur-sm"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative flex h-full w-full max-w-sm flex-col bg-slate-50 shadow-2xl dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800"
                    >
                        {/* Header Section */}
                        <div className="bg-white px-6 py-6 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-[#facc15]" />
                                        <h3 className="text-lg font-black uppercase tracking-tighter text-[#1e40af] dark:text-slate-100">
                                            {selectedCategory?.categoryName || "Category"}
                                        </h3>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                        Asset Registry Overview
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseSidebar}
                                    className="rounded-xl bg-slate-100 p-2 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 dark:bg-slate-800"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Equipment List Container */}
                        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-4">
                            {Equipments && Equipments.length > 0 ? (
                                <>
                                    {Equipments.map((item) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={item._id}
                                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[#1e40af] dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            {/* Status Badge */}
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    <Hash size={12} className="text-[#1e40af]" />
                                                    {item.serialNo}
                                                </div>
                                            </div>

                                            {/* Main Info */}
                                            <div className="mb-4 grid grid-cols-2 gap-2">
                                                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                                                    <p className="mb-1 text-[8px] font-black uppercase tracking-widest text-slate-400">Brand / Model</p>
                                                    <p className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                        {item.brand} {item.model}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                                                    <p className="mb-1 text-[8px] font-black uppercase tracking-widest text-slate-400">Location</p>
                                                    <p className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                        {item.incharge?.laboratory?.laboratoryName || "NOT ASSIGNED"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Custodian Info */}
                                            <div className="flex items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#1e40af] dark:bg-blue-900/20">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Custodian</p>
                                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                        {item.incharge?.full_name || "Unassigned personnel"}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* View All Button */}
                                    {!isShowingAll && selectedCategory?.equipmentCount > Equipments.length && (
                                        <button
                                            onClick={handleShowAll}
                                            className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 transition-all hover:border-[#1e40af] hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-blue-900/10"
                                        >
                                            <ChevronDown size={16} className="text-slate-400 group-hover:text-[#1e40af]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-[#1e40af]">
                                                Load More Records ({selectedCategory?.equipmentCount - Equipments.length})
                                            </span>
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center space-y-3 py-20 text-center opacity-40">
                                    <div className="rounded-full bg-slate-200 p-6 dark:bg-slate-800">
                                        <Info size={40} className="text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">No Assets Found</p>
                                        <p className="text-[10px] text-slate-400">Inventory for this category is currently empty.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Footer Info */}
                        <div className="bg-slate-100 p-4 dark:bg-slate-900/50">
                             <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800">
                                <ShieldCheck size={16} className="text-[#1e40af]" />
                                <p className="text-[9px] font-bold text-slate-500 uppercase">
                                    Verified Institutional Asset Registry
                                </p>
                             </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AssetSidebar;