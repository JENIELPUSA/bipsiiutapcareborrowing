import React, { useState, useEffect, useContext } from "react";
import { CheckCircle2, AlertCircle, Loader2, X, PackageCheck, Calendar, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoanEquipmentContext } from "../../contexts/LoanEuipmentContext/LoanEuipmentContext";

const ReturnModal = ({ isOpen, onClose, onConfirm, loading, RfidLoansAll = [] }) => {
    const [checkedItems, setCheckedItems] = useState([]);
    const { returnLoan } = useContext(LoanEquipmentContext);

    // Only show items with "Release" status
    const availableLoans = RfidLoansAll.filter(
        (loan) => loan.equipment?.status === "Release"
    );

    // I-reset ang selection tuwing isasara ang modal
    useEffect(() => {
        if (!isOpen) setCheckedItems([]);
    }, [isOpen]);

    const toggleReturnItem = (loan) => {
        const targetId = loan.equipment?.equipmentId;
        const isAlreadyChecked = checkedItems.some((item) => item.equipment?.equipmentId === targetId);

        if (isAlreadyChecked) {
            setCheckedItems((prev) => prev.filter((item) => item.equipment?.equipmentId !== targetId));
        } else {
            setCheckedItems((prev) => [...prev, loan]);
        }
    };

    const toggleSelectAll = () => {
        if (checkedItems.length === availableLoans.length) {
            setCheckedItems([]);
        } else {
            setCheckedItems(availableLoans);
        }
    };

    const handleConfirm = async () => {
        if (checkedItems.length === 0) return;

        // 1. Ipunin ang lahat ng napiling items sa isang array (Bulk Payload)
        const bulkPayload = checkedItems.map((item) => ({
            equipmentId: item.equipment?.equipmentId,
            serialNumber: item.equipment?.serialNumber,
            status: "In-Review",
            isPunchReturn: true,
        }));

        try {
            // 2. Kunin ang main ID (posibleng transaction ID o loan ID)
            const mainId = checkedItems[0]?._id;

            console.log("📤 Sending Bulk Payload:", { id: mainId, items: bulkPayload });

            // 3. Isang tawag lang sa API gamit ang array
            await returnLoan(mainId, bulkPayload);

            if (onConfirm) {
                onConfirm(bulkPayload);
            }

            onClose();
        } catch (error) {
            console.error("❌ Bulk Update Error:", error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 10 }}
                        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900"
                    >
                        {/* HEADER */}
                        <div className="border-b border-slate-50 bg-white px-8 py-7 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-5">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:bg-emerald-600 dark:shadow-emerald-950/50">
                                    <PackageCheck size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black uppercase leading-none tracking-tight text-slate-800 dark:text-slate-100">Return Units</h3>
                                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400">
                                        <ShieldCheck size={12} />
                                        Setting status to: In-Review
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-full bg-slate-50 p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* LIST BODY */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/40 p-8 dark:bg-slate-900/50">
                            <div className="mb-5 flex items-center justify-between px-2 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                <span>Select Items ({availableLoans.length})</span>
                                {availableLoans.length > 0 && (
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-emerald-600 hover:underline dark:text-emerald-400"
                                    >
                                        {checkedItems.length === availableLoans.length ? "Clear All" : "Select All"}
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {availableLoans.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 dark:opacity-60">
                                        <AlertCircle
                                            size={48}
                                            className="mb-4 text-slate-500 dark:text-slate-400"
                                        />
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">No Items to Return</p>
                                        <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">Only items with "Release" status can be returned</p>
                                    </div>
                                ) : (
                                    availableLoans.map((loan) => {
                                        const isChecked = checkedItems.some((item) => item.equipment?.equipmentId === loan.equipment?.equipmentId);

                                        return (
                                            <motion.div
                                                key={loan.equipment?.equipmentId}
                                                onClick={() => toggleReturnItem(loan)}
                                                className={`group flex cursor-pointer items-center gap-5 rounded-2xl border-2 p-5 transition-all duration-300 ${
                                                    isChecked
                                                        ? "border-emerald-500 bg-white shadow-xl shadow-emerald-50 dark:border-emerald-500 dark:bg-slate-800 dark:shadow-emerald-950/30"
                                                        : "border-transparent bg-white shadow-sm hover:border-emerald-200 dark:bg-slate-800 dark:hover:border-emerald-800"
                                                }`}
                                            >
                                                <div
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                                                        isChecked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700"
                                                    }`}
                                                >
                                                    {isChecked && (
                                                        <CheckCircle2
                                                            size={14}
                                                            strokeWidth={4}
                                                        />
                                                    )}
                                                </div>

                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4
                                                            className={`truncate font-black uppercase tracking-tighter ${isChecked ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}
                                                        >
                                                            {loan.equipment?.categoryName}
                                                        </h4>
                                                        <span className="shrink-0 font-mono text-[10px] font-black text-slate-400 dark:text-slate-500">
                                                            SN: {loan.equipment?.serialNumber}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-3 text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={10} /> {new Date(loan.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                                                        <span className="text-emerald-500 dark:text-emerald-400">Ready for Return</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* FOOTER ACTION */}
                        <div className="flex items-center justify-between border-t border-slate-50 bg-white px-8 py-7 dark:border-slate-800 dark:bg-slate-900">
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">Selected Count</p>
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{checkedItems.length}</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="text-xs font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading || checkedItems.length === 0}
                                    className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:bg-emerald-600 active:scale-95 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-300 dark:bg-slate-800 dark:hover:bg-emerald-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
                                >
                                    {loading ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        "Proceed Return"
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReturnModal;