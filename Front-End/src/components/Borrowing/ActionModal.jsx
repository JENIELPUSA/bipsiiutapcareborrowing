import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, ArrowUpRight, ArrowDownLeft, X } from "lucide-react";

const SkeletonLine = ({ className = "h-4 w-full" }) => (
    <div className={`animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}></div>
);

const ActionModal = ({ 
    isOpen, 
    onClose, 
    onActionSelect, 
    specificBorrower, 
    fetchingSpecific,
    onReset 
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border-b-[10px] border-[#facc15] bg-white p-8 shadow-2xl dark:border-[#fbbf24] dark:bg-slate-900"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1e40af]/10 text-[#1e40af] dark:bg-[#1e40af]/20 dark:text-[#3b82f6]">
                                <Scan size={44} strokeWidth={2.5} />
                            </div>

                            <h3 className="mb-4 text-2xl font-black uppercase tracking-tight text-[#1e40af] dark:text-white">
                                Choose <span className="text-[#facc15] dark:text-[#fbbf24]">Action</span>
                            </h3>

                            <div className="mb-8">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                    Borrower Detected
                                </p>

                                {/* Avatar Section with specificBorrower data */}
                                <div className="mt-3 flex flex-col items-center gap-3">
                                    {fetchingSpecific ? (
                                        // Loading state while fetching borrower details
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                            <SkeletonLine className="h-4 w-32" />
                                            <SkeletonLine className="h-3 w-24" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Avatar - Try different possible paths for avatar URL */}
                                            {(() => {
                                                const avatarUrl =
                                                    specificBorrower?.linkedAccount?.avatar?.url ||
                                                    specificBorrower?.avatar?.url ||
                                                    specificBorrower?.linkedAccount?.avatar ||
                                                    specificBorrower?.avatar ||
                                                    null;

                                                if (avatarUrl && typeof avatarUrl === "string") {
                                                    return (
                                                        <div className="relative">
                                                            <div className="animate-spin-slow absolute inset-0 rounded-full bg-gradient-to-r from-[#1e40af] via-[#facc15] to-[#1e40af] p-[2px]">
                                                                <div className="h-full w-full rounded-full bg-white p-[2px] dark:bg-slate-900">
                                                                    <img
                                                                        src={avatarUrl}
                                                                        alt="Borrower avatar"
                                                                        className="h-20 w-20 rounded-full object-cover"
                                                                        onError={(e) => {
                                                                            console.error("Failed to load avatar from URL:", avatarUrl);
                                                                            e.target.onerror = null;
                                                                            e.target.style.display = "none";
                                                                            const parent = e.target.parentElement?.parentElement;
                                                                            if (parent) {
                                                                                const div = document.createElement("div");
                                                                                div.className =
                                                                                    "flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1e40af] to-blue-600 text-3xl font-black uppercase text-[#facc15] shadow-lg";
                                                                                div.textContent =
                                                                                    specificBorrower?.linkedAccount?.first_name?.charAt(0) ||
                                                                                    "?";
                                                                                parent.parentElement?.replaceChild(div, parent);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                } else {
                                                    // Fallback avatar
                                                    return (
                                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1e40af] to-blue-600 text-3xl font-black uppercase text-[#facc15] shadow-lg">
                                                            {specificBorrower?.linkedAccount?.first_name?.charAt(0) ||
                                                                specificBorrower?.first_name?.charAt(0) ||
                                                                specificBorrower?.name?.charAt(0) ||
                                                                specificBorrower?.username?.charAt(0) ||
                                                                "?"}
                                                        </div>
                                                    );
                                                }
                                            })()}

                                            {/* Borrower Full Name */}
                                            <div className="text-center">
                                                <p className="text-xl font-black text-slate-800 dark:text-slate-200">
                                                    {specificBorrower?.linkedAccount?.first_name &&
                                                    specificBorrower?.linkedAccount?.last_name ? (
                                                        <>
                                                            {specificBorrower.linkedAccount.first_name}
                                                            {specificBorrower.linkedAccount.middle_name && (
                                                                <> {specificBorrower.linkedAccount.middle_name}.</>
                                                            )}
                                                            <> {specificBorrower.linkedAccount.last_name}</>
                                                            {specificBorrower.linkedAccount.suffix && (
                                                                <> {specificBorrower.linkedAccount.suffix}</>
                                                            )}
                                                        </>
                                                    ) : specificBorrower?.first_name && specificBorrower?.last_name ? (
                                                        <>
                                                            {specificBorrower.first_name}
                                                            {specificBorrower.middle_name && <> {specificBorrower.middle_name}.</>}
                                                            <> {specificBorrower.last_name}</>
                                                            {specificBorrower.suffix && <> {specificBorrower.suffix}</>}
                                                        </>
                                                    ) : (
                                                        specificBorrower?.linkedAccount?.username ||
                                                        specificBorrower?.username ||
                                                        specificBorrower?.name ||
                                                        "Unknown Borrower"
                                                    )}
                                                </p>

                                                {/* Borrower Type Badge */}
                                                {specificBorrower?.borrowerType && (
                                                    <p className="mt-1 text-[8px] font-bold uppercase text-[#1e40af] dark:text-[#3b82f6]">
                                                        {specificBorrower.borrowerType}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => onActionSelect("borrow")}
                                    className="group flex flex-1 flex-col items-center gap-3 rounded-2xl bg-[#facc15]/10 p-6 transition-all hover:bg-[#facc15] hover:text-white dark:bg-[#facc15]/20 dark:hover:bg-[#facc15]"
                                >
                                    <ArrowUpRight size={28} className="text-[#facc15] group-hover:text-white" />
                                    <span className="text-xs font-black uppercase tracking-wider">Borrow</span>
                                </button>
                                <button
                                    onClick={() => onActionSelect("return")}
                                    className="group flex flex-1 flex-col items-center gap-3 rounded-2xl bg-emerald-50 p-6 transition-all hover:bg-emerald-500 hover:text-white dark:bg-emerald-950/30 dark:hover:bg-emerald-500"
                                >
                                    <ArrowDownLeft size={28} className="text-emerald-500 group-hover:text-white dark:text-emerald-400" />
                                    <span className="text-xs font-black uppercase tracking-wider">Return</span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onReset}
                            className="absolute right-6 top-6 text-slate-300 transition-colors hover:text-[#1e40af] dark:text-slate-600 dark:hover:text-[#3b82f6]"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ActionModal;