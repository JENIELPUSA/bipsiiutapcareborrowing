import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import {
    History,
    BadgeCheck,
    Printer,
    Monitor,
    Video,
    AirVent,
    Wrench,
    Box,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { RFIDContext } from "../../contexts/RFIDContext/RfidContext";
import { LoanEquipmentContext } from "../../contexts/LoanEuipmentContext/LoanEuipmentContext";
import BorrowModal from "./BorrowModal";
import ReturnModal from "./ReturnModal";
import StatusModal from "../../ReusableFolder/SuccessandField";
import { BorrowerContext } from "../../contexts/BorrowerContext/BorrowerContext";
import ActionModal from "./ActionModal";

// ===== Helper to map category name to icon =====
const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("printer")) return Printer;
    if (name.includes("monitor")) return Monitor;
    if (name.includes("projector")) return Video;
    if (name.includes("aircon") || name.includes("air con")) return AirVent;
    if (name.includes("tool") || name.includes("equipment")) return Wrench;
    return Box;
};

// ===== Helper functions for facilitator/incharge =====
const getFacilitatorName = (incharge) => {
    if (!incharge) return "Unassigned";
    if (incharge.name && incharge.name.trim()) return incharge.name;
    if (incharge.first_name || incharge.last_name) {
        return `${incharge.first_name || ""} ${incharge.last_name || ""}`.trim();
    }
    return "Unassigned";
};

const getFacilitatorInitial = (incharge) => {
    const name = getFacilitatorName(incharge);
    return name !== "Unassigned" ? name.charAt(0).toUpperCase() : "?";
};

// ===== Skeleton Components =====
const SkeletonLine = ({ className = "h-4 w-full" }) => (
    <div className={`animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}></div>
);

const SkeletonTableRow = () => (
    <tr className="animate-pulse">
        <td className="py-4 pl-4 pr-4">
            <SkeletonLine className="h-3 w-20" />
        </td>
        <td className="px-4 py-4">
            <div className="flex items-center gap-3">
                <SkeletonLine className="h-8 w-8 rounded-full" />
                <SkeletonLine className="h-3 w-28" />
            </div>
        </td>
        <td className="px-4 py-4">
            <SkeletonLine className="h-3 w-32" />
        </td>
        <td className="px-4 py-4">
            <SkeletonLine className="h-3 w-24" />
        </td>
        <td className="py-4 pl-4 pr-4 text-right">
            <SkeletonLine className="ml-auto h-5 w-16" />
        </td>
    </tr>
);

const NoDataFound = ({ message = "No data found", subtitle = "Please scan an RFID tag to begin.", icon: Icon = Box }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-4">
            <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-slate-100 opacity-50 dark:bg-slate-800"></div>
            <div className="relative rounded-full border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <Icon size={40} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
            </div>
        </div>
        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">{message}</h4>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
    </div>
);

const SmartBorrowStation = () => {
    const { rfidData, clearRFID, setRfidData } = useContext(RFIDContext) || {};
    const { fetchRFIDLoans, rfidLoans = [], RfidLoansAll = [], createLoan, setRfidLoans } = useContext(LoanEquipmentContext) || {};
    const { getSpecificBorrower, specificBorrower, fetchingSpecific } = useContext(BorrowerContext) || {};

    const [searchID, setSearchID] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [borrowerFetched, setBorrowerFetched] = useState(false);

    const [borrowBucket, setBorrowBucket] = useState([]);
    const [returnBucket, setReturnBucket] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingLoans, setLoadingLoans] = useState(false);
    const [selectedLaboratory, setSelectedLaboratory] = useState("");
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalProps, setStatusModalProps] = useState({
        status: "success",
        error: null,
        title: "",
        message: "",
        onRetry: null,
    });

    // ===== LOCAL STATE TO FIX THE DUPLICATE ISSUE =====
    const [localActiveLoans, setLocalActiveLoans] = useState([]);
    const [localAllLoans, setLocalAllLoans] = useState([]);
    const [currentBorrowerUid, setCurrentBorrowerUid] = useState(null);

    // --- PAGINATION FOR HISTORY TABLE ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const inputRef = useRef(null);
    const isMounted = useRef(true);
    const lastProcessedUid = useRef(null);

    // Use LOCAL state for display instead of context state
    const displayLoans = localActiveLoans.length > 0 ? localActiveLoans : rfidLoans;
    const displayAllLoans = localAllLoans.length > 0 ? localAllLoans : RfidLoansAll;

    const borrowerInfo = displayLoans.length > 0 ? displayLoans[0]?.borrower : null;
    const selectableLoans = displayAllLoans.filter((loan) => loan.returnDate === null && loan.equipment?.status !== "Returned");

    // --- PAGINATION LOGIC FOR HISTORY ---
    const totalPages = Math.max(1, Math.ceil(displayLoans.length / itemsPerPage));
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLoans = displayLoans.slice(indexOfFirstItem, indexOfLastItem);

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

    // ===== RESET FUNCTION - Clears ALL state properly =====
    const resetStation = useCallback(() => {
        setBorrowBucket([]);
        setReturnBucket([]);
        setSelectedLaboratory("");
        setSearchID("");
        setIsSelectionModalOpen(false);
        setIsReturnModalOpen(false);
        setIsModalOpen(false);
        setCurrentPage(1);
        setBorrowerFetched(false);

        setLocalActiveLoans([]);
        setLocalAllLoans([]);
        setCurrentBorrowerUid(null);
        lastProcessedUid.current = null;

        if (setRfidLoans) {
            setRfidLoans([]);
        }

        if (clearRFID) clearRFID();
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [clearRFID, setRfidLoans]);

    useEffect(() => {
        isMounted.current = true;
        if (clearRFID) clearRFID();
        setTimeout(() => inputRef.current?.focus(), 100);
        return () => {
            isMounted.current = false;
            if (clearRFID) clearRFID();
            lastProcessedUid.current = null;
        };
    }, [clearRFID]);

    // ===== TRIGGER getSpecificBorrower WHEN RFID IS SCANNED =====
    useEffect(() => {
        const fetchBorrowerByRFID = async () => {
            if (rfidData?.uid && getSpecificBorrower && !borrowerFetched) {
                await getSpecificBorrower(rfidData.uid);
            }
        };

        fetchBorrowerByRFID();
    }, [rfidData?.uid, getSpecificBorrower, borrowerFetched]);

    // ===== MAIN RFID SCAN HANDLER =====
    useEffect(() => {
        if (!isMounted.current) return;

        if (rfidData?.uid) {
            if (lastProcessedUid.current === rfidData.uid) {
                return;
            }

            if (setRfidLoans) {
                setRfidLoans([]);
            }

            setLocalActiveLoans([]);
            setLocalAllLoans([]);
            setCurrentBorrowerUid(null);
            setBorrowBucket([]);
            setReturnBucket([]);
            setSelectedLaboratory("");
            setCurrentPage(1);
            setBorrowerFetched(false);
            setIsSelectionModalOpen(false);
            setIsModalOpen(false);
            setIsReturnModalOpen(false);
            setSearchID(rfidData.uid);

            const loadData = async () => {
                setLoadingLoans(true);
                try {
                    if (fetchRFIDLoans) {
                        const [activeResult, allResult] = await Promise.all([
                            fetchRFIDLoans(rfidData.uid, false),
                            fetchRFIDLoans(rfidData.uid, true),
                        ]);

                        const errorResult = activeResult?.success === false ? activeResult : allResult?.success === false ? allResult : null;

                        if (errorResult) {
                            showStatusMessage("error", null, {
                                title: errorResult.error === "This RFID is not registered" ? "REGISTRATION REQUIRED" : "ERROR",
                                message: errorResult.error,
                                onRetry: () => {
                                    resetStation();
                                },
                            });
                            lastProcessedUid.current = null;
                            return;
                        }

                        const activeData = activeResult?.data || activeResult || [];
                        const allData = allResult?.data || allResult || [];

                        setLocalActiveLoans(activeData);
                        setLocalAllLoans(allData);
                        setCurrentBorrowerUid(rfidData.uid);

                        if (setRfidLoans && activeData) {
                            setRfidLoans(activeData);
                        }

                        lastProcessedUid.current = rfidData.uid;

                        if (isMounted.current) {
                            setIsSelectionModalOpen(true);
                        }
                    }
                } catch (err) {
                    console.error("Error loading RFID data:", err);
                    showStatusMessage("error", null, {
                        title: "CONNECTION ERROR",
                        message: err?.message || "Failed to connect to server. Please check your connection.",
                        onRetry: () => resetStation(),
                    });
                    lastProcessedUid.current = null;
                } finally {
                    if (isMounted.current) setLoadingLoans(false);
                }
            };
            loadData();
        }
    }, [rfidData?.uid, fetchRFIDLoans, showStatusMessage, resetStation, setRfidLoans]);

    const handleActionSelection = (type) => {
        setIsSelectionModalOpen(false);
        if (type === "borrow") {
            setIsModalOpen(true);
        } else if (type === "return") {
            setReturnBucket([]);
            setIsReturnModalOpen(true);
        }
    };

    const handleConfirmBorrow = async () => {
        if (!searchID || borrowBucket.length === 0 || !selectedLaboratory) return;
        setLoading(true);
        try {
            await createLoan({
                borrowerID: searchID,
                laboratoryId: selectedLaboratory,
                category: borrowBucket.map((i) => i.categoryId),
            });

            showStatusMessage("success", null, {
                title: "BORROW SUCCESSFUL",
                message: `Successfully borrowed ${borrowBucket.length} item(s).`,
            });

            resetStation();
        } catch (err) {
            console.error("Borrow failed:", err);
            showStatusMessage("error", null, {
                title: "BORROW FAILED",
                message: err?.response?.data?.message || err?.message || "Failed to borrow equipment. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    useEffect(() => {
        if (!isSelectionModalOpen && !isModalOpen && !isReturnModalOpen && !showStatusModal) {
            if (setRfidData && rfidData?.uid) {
                setRfidData(null);
            }
        }
    }, [isSelectionModalOpen, isModalOpen, isReturnModalOpen, showStatusModal, setRfidData, rfidData]);

    return (
        <>
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 text-left font-sans md:p-6">
                {/* --- HEADER with BiPSU Style --- */}
                <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                    <div className="w-full space-y-1 text-left">
                        <h2 className="text-3xl font-black uppercase leading-none tracking-tighter text-[#1e40af] dark:text-[#3b82f6]">
                            Smart <span className="text-[#facc15] dark:text-[#fbbf24]">Borrow</span> Station
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                            RFID Equipment Management System
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 transition-colors ${
                                rfidData?.uid
                                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50"
                                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                            }`}
                        >
                            <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                    rfidData?.uid ? "animate-pulse bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                                }`}
                            ></div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {rfidData?.uid ? "Scanner Active" : "Waiting for Scan"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Action Selection Modal --- */}
                <ActionModal
                    isOpen={isSelectionModalOpen}
                    onClose={() => setIsSelectionModalOpen(false)}
                    onActionSelect={handleActionSelection}
                    specificBorrower={specificBorrower}
                    fetchingSpecific={fetchingSpecific}
                    onReset={resetStation}
                />

                {/* Functional Modals */}
                <BorrowModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    searchID={searchID}
                    onConfirm={handleConfirmBorrow}
                    loading={loading}
                    borrowBucket={borrowBucket}
                    setBorrowBucket={setBorrowBucket}
                    selectedLaboratory={selectedLaboratory}
                    setSelectedLaboratory={setSelectedLaboratory}
                    SkeletonLine={SkeletonLine}
                    NoDataFound={NoDataFound}
                    getCategoryIcon={getCategoryIcon}
                />

                <ReturnModal
                    isOpen={isReturnModalOpen}
                    onClose={() => setIsReturnModalOpen(false)}
                    selectableLoans={selectableLoans}
                    RfidLoansAll={displayAllLoans}
                    setReturnBucket={setReturnBucket}
                    onConfirm={resetStation}
                    loading={loading}
                    formatDate={formatDate}
                    NoDataFound={NoDataFound}
                />

                {/* --- History Table --- */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-[#1e40af] p-2.5 text-white shadow-md dark:bg-[#1e3a8a]">
                                <History size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                    Active Transactions
                                </h3>
                                <p className="text-[9px] font-medium uppercase text-slate-400 dark:text-slate-500">
                                    Recent records for current borrower
                                </p>
                            </div>
                        </div>
                        {displayLoans.length > 0 && (
                            <div className="flex items-center gap-2 rounded-full bg-[#facc15]/10 px-3 py-1.5 dark:bg-[#facc15]/20">
                                <BadgeCheck size={14} className="text-[#1e40af] dark:text-[#3b82f6]" />
                                <span className="text-[9px] font-black uppercase text-[#1e40af] dark:text-[#3b82f6]">
                                    {displayLoans.length} Active Loans
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        {loadingLoans ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#1e40af] dark:bg-[#1e3a8a]">
                                        <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                            Transaction ID
                                        </th>
                                        <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                            Facilitator
                                        </th>
                                        <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                            Equipment
                                        </th>
                                        <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                            Issued Date
                                        </th>
                                        <th className="border border-[#1e3a8a] px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(3)].map((_, i) => (
                                        <SkeletonTableRow key={i} />
                                    ))}
                                </tbody>
                            </table>
                        ) : displayLoans.length > 0 ? (
                            <>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#1e40af] dark:bg-[#1e3a8a]">
                                            <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                                Transaction ID
                                            </th>
                                            <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                                Facilitator
                                            </th>
                                            <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                                Equipment
                                            </th>
                                            <th className="border border-[#1e3a8a] px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                                Issued Date
                                            </th>
                                            <th className="border border-[#1e3a8a] px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-white dark:border-[#1e3a8a]">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {currentLoans.map((loan, index) => {
                                            const categoryName = loan.equipment?.categoryName || "Equipment";
                                            const IconComponent = getCategoryIcon(categoryName);
                                            const isReturned = loan.equipment?.status === "Returned";
                                            const isPending = loan.equipment?.status === "Pending";
                                            const facilitatorName = getFacilitatorName(loan.incharge);
                                            const facilitatorInitial = getFacilitatorInitial(loan.incharge);

                                            return (
                                                <tr
                                                    key={`${loan._id}-${index}-${loan.updatedAt}`}
                                                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                >
                                                    <td className="border border-slate-200 px-6 py-4 align-top dark:border-slate-700">
                                                        <span className="font-mono text-[10px] font-black text-slate-400 dark:text-slate-500">
                                                            #{loan._id?.slice(-8).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="border border-slate-200 px-6 py-4 align-top dark:border-slate-700">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e40af] to-blue-600 text-[10px] font-black uppercase text-[#facc15] shadow-md dark:from-[#1e3a8a] dark:to-[#1e40af]">
                                                                {facilitatorInitial}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                                {facilitatorName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="border border-slate-200 px-6 py-4 align-top dark:border-slate-700">
                                                        <div className="flex items-center gap-3">
                                                            <div className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                                <IconComponent size={16} />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                                {categoryName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="border border-slate-200 px-6 py-4 align-top dark:border-slate-700">
                                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                            {formatDate(loan.createdAt)}
                                                        </span>
                                                    </td>
                                                    <td className="border border-slate-200 px-6 py-4 text-right align-top dark:border-slate-700">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase shadow-sm ${
                                                                isPending
                                                                    ? "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                                                                    : isReturned
                                                                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                                                                      : "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                                                            }`}
                                                        >
                                                            <div
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    isPending
                                                                        ? "animate-pulse bg-amber-500"
                                                                        : isReturned
                                                                          ? "bg-emerald-500"
                                                                          : "bg-blue-500"
                                                                }`}
                                                            ></div>
                                                            {loan.equipment?.status || "Active"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* --- PAGINATION CONTROLS --- */}
                                {displayLoans.length > itemsPerPage && (
                                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50 md:flex-row">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                            Showing <span className="text-[#1e40af] dark:text-[#3b82f6]">{indexOfFirstItem + 1}</span> to{" "}
                                            <span className="text-[#1e40af] dark:text-[#3b82f6]">
                                                {Math.min(indexOfLastItem, displayLoans.length)}
                                            </span>{" "}
                                            of <span className="text-slate-800 dark:text-slate-300">{displayLoans.length}</span> Entries
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                                className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                            >
                                                <ChevronLeft size={12} /> Prev
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
                                                                    ? "bg-[#1e40af] text-white shadow-md dark:bg-[#3b82f6]"
                                                                    : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                disabled={currentPage === totalPages || totalPages === 0}
                                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                                className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-wider text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                            >
                                                Next <ChevronRight size={12} />
                                            </button>
                                        </div>

                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                            Page <span className="text-[#1e40af] dark:text-[#3b82f6]">{currentPage}</span> of {totalPages || 1}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <NoDataFound
                                message="No active history found"
                                subtitle="Scan an RFID tag to view transaction history"
                                icon={History}
                            />
                        )}
                    </div>
                </div>

                {/* Hidden Input for RFID Auto-focus */}
                <input
                    ref={inputRef}
                    type="text"
                    className="fixed left-[-9999px] opacity-0"
                    autoFocus
                    onChange={(e) => setSearchID(e.target.value)}
                />
            </div>

            <StatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                {...statusModalProps}
            />
        </>
    );
};

export default SmartBorrowStation;