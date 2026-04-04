import React, { useContext, useState, useEffect, useRef } from "react";
import {
    Scan,
    RefreshCw,
    User,
    Box,
    BadgeCheck,
    History,
    ArrowUpRight,
    ArrowDownLeft,
    AlertCircle,
    Mail,
    Phone,
    GraduationCap,
    Printer,
    Monitor,
    Video,
    AirVent,
    Wrench,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RFIDContext } from "../../contexts/RFIDContext/RfidContext";
import { LoanEquipmentContext} from "../../contexts/LoanEuipmentContext/LoanEuipmentContext";
import BorrowModal from "./BorrowModal";
import ReturnModal from "./ReturnModal";

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

// ===== Skeleton Components =====
const SkeletonLine = ({ className = "h-4 w-full" }) => <div className={`animate-pulse rounded bg-slate-200 ${className}`}></div>;

const SkeletonAvatar = () => <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200"></div>;

const SkeletonTableRow = () => (
    <tr className="animate-pulse">
        <td className="py-4 pl-2 pr-4">
            <SkeletonLine className="h-3 w-20" />
        </td>
        <td className="px-4 py-4">
            <SkeletonLine className="h-3 w-28" />
        </td>
        <td className="px-4 py-4">
            <SkeletonLine className="h-3 w-32" />
        </td>
        <td className="px-4 py-4">
            <SkeletonLine className="h-3 w-24" />
        </td>
        <td className="py-4 pl-4 pr-2 text-right">
            <SkeletonLine className="ml-auto h-5 w-16" />
        </td>
    </tr>
);

const NoDataFound = ({ message = "No data found", icon: Icon = Box }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-slate-50 p-4">
            <Icon
                size={48}
                className="text-slate-300"
                strokeWidth={1.5}
            />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">{message}</p>
        <p className="text-xs text-slate-400">Try refreshing or check back later</p>
    </div>
);

// ===== Main Component =====
const SmartBorrowStation = () => {
    const { rfidData, clearRFID } = useContext(RFIDContext) || {};
    const { fetchRFIDLoans, rfidLoans = [], RfidLoansAll = [], createLoan} = useContext(LoanEquipmentContext) || {};

    const [searchID, setSearchID] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [borrowBucket, setBorrowBucket] = useState([]);
    const [returnBucket, setReturnBucket] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingLoans, setLoadingLoans] = useState(false);
    const [selectedLaboratory, setSelectedLaboratory] = useState("");
    const inputRef = useRef(null);

    const borrowerInfo = rfidLoans.length > 0 ? rfidLoans[0].borrower : null;
    const selectableLoans = RfidLoansAll.filter((loan) => loan.returnDate === null && loan.equipment?.status !== "Returned");

    useEffect(() => {
        if (rfidData?.uid) {
            setSearchID(rfidData.uid);
            const loadData = async () => {
                setLoadingLoans(true);
                try {
                    if (fetchRFIDLoans) {
                        await Promise.all([fetchRFIDLoans(rfidData.uid, false), fetchRFIDLoans(rfidData.uid, true)]);
                    }
                } catch (err) {
                    console.error("Error loading loans:", err);
                } finally {
                    setLoadingLoans(false);
                    setIsSelectionModalOpen(true);
                }
            };
            loadData();
        }
    }, [rfidData, fetchRFIDLoans]);

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
            if (createLoan) {
                await createLoan({
                    borrowerID: searchID,
                    laboratoryId: selectedLaboratory,
                    category: borrowBucket.map((i) => i.categoryId),
                });
                setIsModalOpen(false);
                resetStation();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReturn = async () => {
        if (returnBucket.length === 0) return;
        setLoading(true);
        try {
            // Build payload using the first loan as parent
            const firstLoan = returnBucket[0];
            const payload = {
                _id: firstLoan._id,
                equipmentIds: returnBucket.map((loan) => ({
                    equipmentId: loan.equipment?._id,
                    status: "Returned",
                    serialNumber: loan.equipment?.serialNumber || "",
                    assistsId: loan.equipment?.assistsId || null,
                    returnDate: new Date().toISOString(),
                    _id: loan._id,
                })),
                borrowerId: firstLoan.borrowerId,
                inchargeId: firstLoan.inchargeId,
                createdAt: firstLoan.createdAt,
                updatedAt: new Date().toISOString(),
                __v: firstLoan.__v,
            };

            // Replace with actual API call when ready
            // await returnLoan(payload);

            setIsReturnModalOpen(false);
            resetStation();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resetStation = () => {
        setBorrowBucket([]);
        setReturnBucket([]);
        setSelectedLaboratory("");
        setSearchID("");
        setIsSelectionModalOpen(false);
        setIsReturnModalOpen(false);
        setIsModalOpen(false);
        if (clearRFID) clearRFID();
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="mx-auto w-full max-w-7xl p-4 font-sans text-slate-800 md:p-6">
            {/* Action Selection Modal */}
            <AnimatePresence>
                {isSelectionModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
                        >
                            <div className="p-8 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                                    <Scan size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Select Action</h3>
                                <p className="mt-2 text-slate-500">
                                    What would you like to do for <br />
                                    <span className="font-bold text-blue-600">
                                        {borrowerInfo ? `${borrowerInfo.firstName} ${borrowerInfo.lastName}` : searchID}
                                    </span>
                                    ?
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 p-8 pt-0">
                                <button
                                    onClick={() => handleActionSelection("borrow")}
                                    className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-amber-400 hover:bg-amber-50 hover:shadow-md"
                                >
                                    <div className="rounded-full bg-amber-500 p-3 text-white shadow-md transition-transform group-hover:scale-105">
                                        <ArrowUpRight size={24} />
                                    </div>
                                    <span className="font-bold text-slate-700">Borrow</span>
                                </button>
                                <button
                                    onClick={() => handleActionSelection("return")}
                                    className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md"
                                >
                                    <div className="rounded-full bg-emerald-500 p-3 text-white shadow-md transition-transform group-hover:scale-105">
                                        <ArrowDownLeft size={24} />
                                    </div>
                                    <span className="font-bold text-slate-700">Return</span>
                                </button>
                            </div>
                            <button
                                onClick={() => setIsSelectionModalOpen(false)}
                                className="w-full border-t border-slate-100 py-4 text-center text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Borrow Modal */}
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

            {/* Return Modal */}
            <ReturnModal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                selectableLoans={selectableLoans}
                RfidLoansAll={RfidLoansAll}
                setReturnBucket={setReturnBucket}
                onConfirm={handleConfirmReturn}
                loading={loading}
                formatDate={formatDate}
                NoDataFound={NoDataFound}
            />

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-12">
                {/* Left Panel */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="relative flex flex-col items-center bg-gradient-to-b from-slate-50 to-white px-6 pb-4 pt-8">
                            {loadingLoans ? (
                                <SkeletonAvatar />
                            ) : (
                                <div className="relative mb-4">
                                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-100 shadow-inner ring-4 ring-white">
                                        {borrowerInfo?.avatar?.url ? (
                                            <img
                                                src={borrowerInfo.avatar.url}
                                                className="h-full w-full object-cover"
                                                alt="User"
                                            />
                                        ) : (
                                            <User
                                                size={40}
                                                className="text-slate-300"
                                            />
                                        )}
                                    </div>
                                    {searchID && (
                                        <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-emerald-500 p-1">
                                            <BadgeCheck
                                                size={12}
                                                className="text-white"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            {loadingLoans ? (
                                <>
                                    <SkeletonLine className="mb-2 h-5 w-32" />
                                    <SkeletonLine className="h-3 w-24" />
                                </>
                            ) : (
                                <>
                                    <h2 className="text-center text-lg font-bold text-slate-800">
                                        {borrowerInfo ? `${borrowerInfo.firstName} ${borrowerInfo.lastName}` : "No User Loaded"}
                                    </h2>
                                    <p className="mt-1 text-xs font-medium text-blue-600">{searchID ? `UID: ${searchID}` : "Waiting for scan"}</p>
                                </>
                            )}
                        </div>
                        {borrowerInfo && !loadingLoans && (
                            <div className="space-y-3 border-t border-slate-100 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                        <GraduationCap size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium uppercase text-slate-400">Type</p>
                                        <p className="text-sm font-medium text-slate-700">{borrowerInfo.borrowerType}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                        <Mail size={16} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-medium uppercase text-slate-400">Email</p>
                                        <p className="truncate text-sm font-medium text-slate-700">{borrowerInfo.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                                        <Phone size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium uppercase text-slate-400">Contact</p>
                                        <p className="text-sm font-medium text-slate-700">{borrowerInfo.contactNumber}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-5 text-white">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Scan
                                        size={16}
                                        className="text-amber-300"
                                    />
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-200">RFID Terminal</label>
                                </div>
                                <button
                                    onClick={resetStation}
                                    className="text-blue-300 transition-colors hover:text-white"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                placeholder="Tap or scan ID card..."
                                value={searchID}
                                onChange={(e) => setSearchID(e.target.value)}
                                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center text-lg font-bold outline-none placeholder:text-white/30 focus:border-amber-300 focus:bg-white/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel - History Table */}
                <div className="md:col-span-8 lg:col-span-9">
                    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Borrowing History</h3>
                                    <p className="text-sm text-slate-500">Active loans</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-x-auto p-4 md:p-6">
                            {loadingLoans ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <th className="pb-3 pl-2 pr-4">Transaction ID</th>
                                            <th className="px-4 pb-3">Staff</th>
                                            <th className="px-4 pb-3">Item</th>
                                            <th className="px-4 pb-3">Date</th>
                                            <th className="pb-3 pl-4 pr-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[...Array(3)].map((_, i) => (
                                            <SkeletonTableRow key={i} />
                                        ))}
                                    </tbody>
                                </table>
                            ) : rfidLoans.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <th className="pb-3 pl-2 pr-4">Transaction ID</th>
                                            <th className="px-4 pb-3">Staff</th>
                                            <th className="px-4 pb-3">Item</th>
                                            <th className="px-4 pb-3">Date</th>
                                            <th className="pb-3 pl-4 pr-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rfidLoans.map((loan) => {
                                            const categoryName = loan.equipment?.categoryName || "Equipment";
                                            const IconComponent = getCategoryIcon(categoryName);
                                            return (
                                                <tr
                                                    key={loan._id}
                                                    className="group transition-colors hover:bg-slate-50/50"
                                                >
                                                    <td className="py-4 pl-2 pr-4 font-mono text-xs font-medium text-slate-800">
                                                        #{loan._id?.slice(-6).toUpperCase()}
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-700">
                                                        {loan.incharge?.first_name} {loan.incharge?.last_name}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <IconComponent
                                                                size={16}
                                                                className="text-slate-500"
                                                            />
                                                            <span className="font-medium text-slate-800">{categoryName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-500">{formatDate(loan.createdAt)}</td>
                                                    <td className="py-4 pl-4 pr-2 text-right">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                                                loan.equipment?.status === "Pending"
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : loan.equipment?.status === "Returned"
                                                                      ? "bg-emerald-100 text-emerald-700"
                                                                      : "bg-slate-100 text-slate-600"
                                                            }`}
                                                        >
                                                            {loan.equipment?.status || "Active"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <NoDataFound
                                    message="No active loan records found"
                                    icon={Box}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartBorrowStation;
