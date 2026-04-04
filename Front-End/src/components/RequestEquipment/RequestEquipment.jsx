import React, { useState, useContext, useEffect } from "react";
import {
  User,
  Search,
  RotateCcw,
  ShieldCheck,
  PlusCircle,
  X,
  Phone,
  Fingerprint,
  Beaker,
  Loader2,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LoanEquipmentContext } from "../../contexts/LoanEuipmentContext/LoanEuipmentContext";

// Skeleton Table Row
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-200" />
          <div>
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="mt-1 h-3 w-16 rounded bg-slate-200" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="h-3 w-28 rounded bg-slate-200" />
        </div>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="space-y-3">
        <div className="h-24 w-full rounded-xl bg-slate-200" />
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="space-y-3">
        <div className="h-16 w-full rounded-lg bg-slate-200" />
        <div className="h-16 w-full rounded-lg bg-slate-200" />
      </div>
    </td>
  </tr>
);

const RequestEquipment = () => {
  const { 
    loans, 
    updateLoan, 
    fetchLoans, // Gumamit ng fetchLoans (base sa provider mo kanina)
    loading: contextLoading, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    setSearchQuery // Gamitin ang setter mula sa context
  } = useContext(LoanEquipmentContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSelection, setActiveSelection] = useState(null);
  const [inputSN, setInputSN] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState(null); 

  const selectedLoan = loans?.find((l) => l._id === activeSelection?.loanId);

  // Sync search input to context searchQuery
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchTerm);
      setCurrentPage(1); // Back to page 1 on search
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, setSearchQuery, setCurrentPage]);

  const openSNModal = (loanId, equipmentId) => {
    setActiveSelection({ loanId, equipmentId });
    setIsModalOpen(true);
    setInputSN("");
  };

  const handleSaveSN = async () => {
    if (!inputSN.trim()) {
      alert("Please enter a Serial Number");
      return;
    }

    const equipmentId = activeSelection?.equipmentId;
    const parentId = activeSelection?.loanId;

    setProcessingId(equipmentId);
    try {
      const payloads = {
        equipmentId,
        serialNumber: inputSN,
        status: "Release",
      };
      await updateLoan(parentId, payloads);
      setInputSN("");
      setIsModalOpen(false);
      setActiveSelection(null);
    } catch (error) {
      console.error("Failed to release equipment:", error);
      alert("Failed to release equipment.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReturn = async (loanId, equipmentId) => {
    if (window.confirm("Are you sure you want to mark this equipment as Returned?")) {
      setProcessingId(equipmentId);
      try {
        const payloads = {
          equipmentId,
          status: "Returned",
        };
        await updateLoan(loanId, payloads);
      } catch (error) {
        console.error("Failed to return equipment:", error);
        alert("Failed to return equipment.");
      } finally {
        setProcessingId(null);
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      Pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
      Release: { bg: "bg-blue-100", text: "text-blue-700", icon: ShieldCheck },
      "In-Review": { bg: "bg-indigo-100", text: "text-indigo-700", icon: Clock },
      Returned: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
    };
    const { bg, text, icon: Icon } = config[status] || config.Pending;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${bg} ${text}`}>
        <Icon size={10} />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 font-sans md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-2xl font-black tracking-tight text-blue-900">
            EQUIPMENT REQUESTS
          </h1>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search name or RFID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead className="bg-blue-900 text-[11px] font-bold uppercase tracking-wider text-yellow-400">
                <tr>
                  <th className="px-6 py-5 rounded-tl-2xl">Borrower Information</th>
                  <th className="px-6 py-5">Equipment Details</th>
                  <th className="px-6 py-5 rounded-tr-2xl">Deployment Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contextLoading ? (
                  Array(3).fill().map((_, i) => <SkeletonRow key={i} />)
                ) : loans?.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <User size={48} className="mb-3 text-slate-300" />
                        <p className="text-sm font-medium">No loan requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan._id} className="align-top transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                              <User size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-bold uppercase leading-tight text-slate-800">
                                {loan.borrower?.firstName} {loan.borrower?.lastName}
                              </div>
                              <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-600">
                                {loan.borrower?.borrowerType || "Student"}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1 text-[11px] font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Fingerprint size={12} className="text-slate-400" />
                              RFID: <span className="font-mono text-slate-700">{loan.borrower?.rfidId}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-slate-400" />
                              {loan.borrower?.contactNumber || "No Contact"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-3">
                          {loan.equipmentIds.map((item, idx) => (
                            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                              <div className="mb-2 flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-xs font-bold uppercase text-blue-950">
                                    {item.categoryName || `Equip ID: ${item.equipmentId.slice(-6)}`}
                                  </div>
                                  <div className="mt-1">
                                    <StatusBadge status={item.status || "Pending"} />
                                  </div>
                                </div>

                                {(item.status === "Release" || item.status === "In-Review") ? (
                                  <button
                                    onClick={() => handleReturn(loan._id, item.equipmentId)}
                                    disabled={processingId === item.equipmentId}
                                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {processingId === item.equipmentId ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <RotateCcw size={12} />
                                    )}
                                    {processingId === item.equipmentId ? "PROCESSING..." : "RETURN"}
                                  </button>
                                ) : item.status === "Returned" ? (
                                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase text-emerald-600">
                                    COMPLETED
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => openSNModal(loan._id, item.equipmentId)}
                                    disabled={processingId === item.equipmentId}
                                    className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-amber-600 disabled:opacity-50"
                                  >
                                    {processingId === item.equipmentId ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <PlusCircle size={12} />
                                    )}
                                    {processingId === item.equipmentId ? "ASSIGNING..." : "ASSIGN SN"}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                SN: {item.serialNumber ? (
                                  <span className="font-mono text-blue-600">{item.serialNumber}</span>
                                ) : (
                                  <span className="italic text-red-400">Awaiting Serial...</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-3 text-[11px]">
                          <div className="rounded-lg border border-slate-100 p-2">
                            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-600">
                              <Beaker size={12} className="text-purple-500" />
                              Lab Destination
                            </div>
                            <div className="truncate rounded bg-slate-50 p-1 font-mono text-slate-700">
                              {loan.borrower?.laboratoryId || "General Lab"}
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-100 p-2">
                            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-600">
                              <ShieldCheck size={12} className="text-green-500" />
                              Processor
                            </div>
                            <div className="font-bold uppercase text-slate-800">
                              {loan.incharge?.first_name} {loan.incharge?.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

{/* PAGINATION */}
<div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-900 dark:bg-slate-900/30 md:flex-row">
  {/* Left space empty or can be used for other info, now hidden to focus on buttons */}
  <div className="hidden md:block w-40"></div> 

  {/* Center: Pagination Controls */}
  <div className="flex items-center gap-2">
    <button
      disabled={currentPage === 1 || contextLoading}
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 shadow-sm"
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
              : "bg-white text-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>

    <button
      disabled={currentPage === totalPages || contextLoading}
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 shadow-sm"
    >
      Next <ChevronRight size={14} />
    </button>
  </div>

  {/* Right: Page Indicator */}
  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-40 text-right">
    Page <span className="text-[#1e40af] dark:text-[#facc15]">{currentPage}</span> of {totalPages || 1}
  </p>
</div>
        </div>
      </div>

      {/* Modal - Walang Pagbabago sa UI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 p-4 backdrop-blur-md">
          <div className="w-full max-w-md animate-in fade-in zoom-in rounded-3xl bg-white p-6 shadow-2xl duration-300 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Release Equipment</h3>
                <p className="text-xs text-slate-500">Enter the serial number to release</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-400 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="mb-8 space-y-6">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="mb-1 text-[10px] font-bold uppercase text-blue-600">Destination</div>
                <div className="break-all font-mono text-sm text-blue-900">{selectedLoan?.borrower?.laboratoryId || "General Lab"}</div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Device Serial Number</label>
                <input
                  autoFocus
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g., SN-2026-XYZ"
                  value={inputSN}
                  onChange={(e) => setInputSN(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !processingId && handleSaveSN()}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 hover:bg-slate-100" disabled={!!processingId}>
                Cancel
              </button>
              <button onClick={handleSaveSN} disabled={!!processingId} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 text-sm font-bold text-yellow-400 hover:bg-blue-800 disabled:opacity-50">
                {processingId ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirm Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestEquipment;