import React, { useState, useContext, useEffect, useCallback } from "react";
import {
    Search,
    RotateCcw,
    PlusCircle,
    X,
    Loader2,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    AlertTriangle,
    Check,
    HelpCircle,
    XCircle,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    Inbox,
} from "lucide-react";
import { LoanEquipmentContext } from "../../contexts/LoanEuipmentContext/LoanEuipmentContext";
import StatusModal from "../../ReusableFolder/SuccessandField";
import { AuthContext } from "../../contexts/AuthContext";

const SkeletonRow = () => (
    <tr className="animate-pulse">
        {Array(5)
            .fill(0)
            .map((_, i) => (
                <td
                    key={i}
                    className="border border-slate-200 px-4 py-4 dark:border-slate-700"
                >
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                </td>
            ))}
    </tr>
);

const RequestEquipment = () => {
    const { updateLoan, loading: contextLoading, setCurrentPage, setSearchQuery, latestEquipment, pagination } = useContext(LoanEquipmentContext);
    const { role } = useContext(AuthContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [activeSelection, setActiveSelection] = useState(null);
    const [inputSN, setInputSN] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalProps, setStatusModalProps] = useState({
        status: "success",
        error: null,
        title: "",
        message: "",
        onRetry: null,
    });

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setSearchQuery(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, setSearchQuery, setCurrentPage]);

    const openSNModal = (loanId, equipmentId) => {
        setActiveSelection({ loanId, equipmentId });
        setIsModalOpen(true);
        setInputSN("");
    };

    const openReturnModal = (loanId, equipmentId) => {
        setActiveSelection({ loanId, equipmentId });
        setIsReturnModalOpen(true);
    };

    const showStatusMessage = useCallback((status, error = null, customProps = {}) => {
        // Extract message safely - don't pass Error object directly
        let errorMessage = "";
        if (error) {
            errorMessage = typeof error === "string" ? error : error.message || JSON.stringify(error);
        }

        setStatusModalProps({
            status: status,
            error: errorMessage, // Pass string message, not Error object
            title: customProps.title || "",
            message: customProps.message || errorMessage,
            onRetry: customProps.onRetry || null,
        });
        setShowStatusModal(true);
    }, []);

    const handleSaveSN = async () => {
        if (!inputSN.trim()) {
            showStatusMessage("error", null, {
                title: "Validation Error",
                message: "Please enter a serial number.",
            });
            return;
        }

        const { equipmentId, loanId: parentId } = activeSelection;
        setProcessingId(equipmentId);

        try {
            const result = await updateLoan(parentId, {
                equipmentId,
                serialNumber: inputSN,
                status: "Release",
            });

            // Check if result indicates an error
            if (result?.error || result?.success === false) {
                throw new Error(result?.message || "Failed to assign serial number");
            }

            // Success
            setIsModalOpen(false);
            showStatusMessage("success", null, {
                title: "Success!",
                message: "Serial number assigned successfully and equipment released.",
            });
        } catch (error) {
            console.error("Save SN Error:", error);

            // Extract meaningful error message
            let errorMessage = "Failed to assign serial number. Please try again.";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Show error modal with string message, not Error object
            showStatusMessage("error", errorMessage, {
                title: "Operation Failed",
                message: errorMessage,
                onRetry: () => handleSaveSN(),
            });
        } finally {
            setProcessingId(null);
        }
    };

    const submitReturn = async (condition) => {
        const { loanId, equipmentId } = activeSelection;
        setProcessingId(equipmentId);

        try {
            const newStatus = condition === "Ok" ? "Returned" : condition;
            const result = await updateLoan(loanId, {
                equipmentId,
                status: newStatus,
                condition: condition,
            });

            // Check if result indicates an error
            if (result?.error || result?.success === false) {
                throw new Error(result?.message || "Failed to process return");
            }

            // Success
            setIsReturnModalOpen(false);
            showStatusMessage("success", null, {
                title: "Return Processed!",
                message: `Equipment marked as ${condition === "Ok" ? "Returned" : condition} successfully.`,
            });
        } catch (error) {
            console.error("Return Error:", error);

            // Extract meaningful error message
            let errorMessage = "Failed to process return. Please try again.";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Show error modal with string message, not Error object
            showStatusMessage("error", errorMessage, {
                title: "Return Failed",
                message: errorMessage,
                onRetry: () => submitReturn(condition),
            });
        } finally {
            setProcessingId(null);
        }
    };

    // Pagination handlers
    const goToPage = (page) => {
        if (page < 1 || page > pagination.totalPages) return;
        setCurrentPage(page);
    };

    const getPageNumbers = () => {
        const { page, totalPages } = pagination;
        if (totalPages <= 1) return [1];
        const delta = 2;
        const range = [];
        for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
            range.push(i);
        }
        if (page - delta > 2) range.unshift("...");
        if (page + delta < totalPages - 1) range.push("...");
        range.unshift(1);
        if (totalPages !== 1) range.push(totalPages);
        return range;
    };

    console.log("Latest Equipment Data:", latestEquipment);

    const hasData = latestEquipment && latestEquipment.length > 0;
    
    // Determine if In-Charge column should be hidden
    const hideInChargeColumn = role === "in-charge";
    // Determine if Actions column should be hidden (for admin role)
    const hideActionsColumn = role === "admin";

    return (
        <div className="min-h-screen w-full bg-slate-50 p-4 font-sans md:p-8 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* HEADER */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-[#1e40af] p-3 shadow-lg shadow-blue-200 dark:bg-[#1e3a8a] dark:shadow-blue-950/50">
                            <ClipboardList
                                className="text-[#facc15] dark:text-[#fbbf24]"
                                size={28}
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
                                Equipment <span className="text-[#1e40af] dark:text-[#3b82f6]">Logs</span>
                            </h2>
                        </div>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search borrower..."
                            className="w-full rounded-xl border-none bg-white py-3 pl-12 pr-4 text-sm shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#1e40af] dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:ring-slate-700 dark:focus:ring-[#3b82f6]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Borrower</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        Asset Info
                                    </th>
                                    {!hideInChargeColumn && (
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">In-charge</th>
                                    )}
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</th>
                                    {!hideActionsColumn && (
                                        <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {contextLoading ? (
                                    Array(5)
                                        .fill(0)
                                        .map((_, i) => <SkeletonRow key={i} />)
                                ) : !hasData ? (
                                    <tr>
                                        <td 
                                            colSpan={(() => {
                                                let cols = 3; // Borrower, Asset Info, Status
                                                if (!hideInChargeColumn) cols++;
                                                if (!hideActionsColumn) cols++;
                                                return cols;
                                            })()} 
                                            className="py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
                                                <Inbox
                                                    size={48}
                                                    strokeWidth={1.5}
                                                />
                                                <div className="text-base font-semibold text-slate-500 dark:text-slate-400">No Data Found</div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">No equipment records match your criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    latestEquipment.map((loan) =>
                                        (loan.equipmentIds || []).map((item, idx) => (
                                            <tr
                                                key={`${loan._id}-${idx}`}
                                                className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{loan.borrower?.fullName}</div>
                                                    <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{loan.borrower?.rfidId}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold uppercase text-[#1e40af] dark:text-[#3b82f6]">{item.categoryName}</div>
                                                    <div
                                                        className={`text-[10px] font-medium ${item.status === "Damage" ? "font-bold text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
                                                    >
                                                        SN: {item.serialNumber || "Unassigned"}
                                                    </div>
                                                </td>

                                                {!hideInChargeColumn && (
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{loan.incharge?.fullName}</div>
                                                    </td>
                                                )}

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase ${
                                                            item.status === "Damage"
                                                                ? "border-red-200 bg-red-50 text-red-600 line-through decoration-red-800 decoration-2 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                                : item.status === "Returned"
                                                                  ? "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                  : item.status === "Missing"
                                                                    ? "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                                    : "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                        }`}
                                                    >
                                                        {item.status || "Pending"}
                                                    </span>
                                                </td>
                                                
                                                {!hideActionsColumn && (
                                                    <td className="px-6 py-4 text-center">
                                                        {item.status === "Damage" ? (
                                                            <button
                                                                onClick={() => openReturnModal(loan._id, item.equipmentId)}
                                                                disabled={processingId === item.equipmentId}
                                                                className="rounded-lg bg-red-100 p-2 text-red-700 shadow-sm transition-all hover:bg-red-600 hover:text-white disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                                                            >
                                                                {processingId === item.equipmentId ? (
                                                                    <Loader2
                                                                        size={16}
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <XCircle size={16} />
                                                                )}
                                                            </button>
                                                        ) : item.status === "Missing" || item.status === "In-Review" ? (
                                                            <button
                                                                onClick={() => openReturnModal(loan._id, item.equipmentId)}
                                                                disabled={processingId === item.equipmentId}
                                                                className="rounded-lg bg-red-50 p-2 text-red-600 shadow-sm transition-all hover:bg-red-600 hover:text-white disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                                                            >
                                                                {processingId === item.equipmentId ? (
                                                                    <Loader2
                                                                        size={16}
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <RotateCcw size={16} />
                                                                )}
                                                            </button>
                                                        ) : !item.status || item.status === "Pending" ? (
                                                            <button
                                                                onClick={() => openSNModal(loan._id, item.equipmentId)}
                                                                className="rounded-lg bg-amber-50 p-2 text-amber-600 shadow-sm transition-all hover:bg-[#facc15] hover:text-[#1e40af] dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-[#fbbf24] dark:hover:text-[#1e3a8a]"
                                                            >
                                                                <PlusCircle size={16} />
                                                            </button>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-0.5 opacity-60">
                                                                <CheckCircle
                                                                    size={18}
                                                                    className="mx-auto text-emerald-500 dark:text-emerald-400"
                                                                />
                                                                <span className="text-[7px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">
                                                                    Settled
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        )),
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PAGINATION */}
                {!contextLoading && hasData && pagination && pagination.totalPages > 0 && (
                    <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-md dark:bg-slate-900 dark:shadow-slate-800/50 sm:flex-row">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => goToPage(1)}
                                disabled={pagination.page === 1}
                                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronsLeft size={18} />
                            </button>
                            <button
                                onClick={() => goToPage(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((pageNum, idx) =>
                                    pageNum === "..." ? (
                                        <span
                                            key={idx}
                                            className="px-2 text-slate-400 dark:text-slate-500"
                                        >
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={idx}
                                            onClick={() => goToPage(pageNum)}
                                            className={`h-8 w-8 rounded-lg text-sm font-semibold transition-all ${pagination.page === pageNum ? "bg-[#1e40af] text-white shadow-md dark:bg-[#3b82f6]" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
                                        >
                                            {pageNum}
                                        </button>
                                    ),
                                )}
                            </div>
                            <button
                                onClick={() => goToPage(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={() => goToPage(pagination.totalPages)}
                                disabled={pagination.page === pagination.totalPages}
                                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                            of {pagination.total} entries
                        </div>
                    </div>
                )}
            </div>

            {/* SN ASSIGNMENT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm dark:bg-black/50">
                    <div className="animate-in zoom-in w-full max-w-sm rounded-3xl border-t-8 border-[#1e40af] bg-white p-8 shadow-2xl duration-200 dark:border-[#3b82f6] dark:bg-slate-900">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
                                Assign <span className="text-[#1e40af] dark:text-[#3b82f6]">SN</span>
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input
                                autoFocus
                                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-[#3b82f6]"
                                placeholder="Enter Serial Number..."
                                value={inputSN}
                                onChange={(e) => setInputSN(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSaveSN()}
                            />
                            <button
                                onClick={handleSaveSN}
                                disabled={!inputSN || processingId}
                                className="w-full rounded-2xl bg-[#1e40af] py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:brightness-110 disabled:opacity-50 dark:bg-[#3b82f6] dark:hover:brightness-110"
                            >
                                {processingId ? (
                                    <Loader2
                                        size={16}
                                        className="mx-auto animate-spin"
                                    />
                                ) : (
                                    "Confirm Release"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RETURN MODAL */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm dark:bg-black/50">
                    <div className="animate-in zoom-in w-full max-w-sm rounded-3xl border-t-8 border-red-500 bg-white p-8 shadow-2xl duration-200 dark:bg-slate-900">
                        <div className="mb-6 flex items-center justify-between font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
                            Return Status
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => submitReturn("Ok")}
                                disabled={processingId}
                                className="flex w-full items-center justify-between rounded-2xl border-2 border-emerald-100 bg-emerald-50 px-5 py-4 font-bold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                            >
                                <div className="flex items-center gap-3">
                                    <Check size={20} /> Good Condition
                                </div>
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => submitReturn("Damage")}
                                disabled={processingId}
                                className="flex w-full items-center justify-between rounded-2xl border-2 border-red-100 bg-red-50 px-5 py-4 font-bold text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                            >
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={20} /> Damaged
                                </div>
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => submitReturn("Missing")}
                                disabled={processingId}
                                className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <div className="flex items-center gap-3">
                                    <HelpCircle size={20} /> Missing
                                </div>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        {processingId && (
                            <div className="mt-4 flex justify-center">
                                <Loader2
                                    className="animate-spin text-slate-400 dark:text-slate-500"
                                    size={24}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STATUS MODAL */}
            <StatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                {...statusModalProps}
            />
        </div>
    );
};

export default RequestEquipment;