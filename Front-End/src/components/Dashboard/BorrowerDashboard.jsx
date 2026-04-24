import React, { useContext } from "react";
import { Package, CheckCircle, AlertCircle, Layers, ChevronLeft, ChevronRight, Loader2, Calendar, UserCircle } from "lucide-react";
import { LoanEquipmentContext } from "../../contexts/LoanEuipmentContext/LoanEuipmentContext";
import { AuthContext } from "../../contexts/AuthContext";

export default function EquipmentDashboard() {
    const { equipmentList, currentPage, setCurrentPage, totalPages, totalEntries, stats, loading } = useContext(LoanEquipmentContext);
    const { role } = useContext(AuthContext);

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const cards = [
        { title: "Total Records", val: stats.totalRecords, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Items on Page", val: equipmentList.length, icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50" },
        { title: "Returned Items", val: stats.returnedItems, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        { title: "Issues Found", val: stats.issuesFound, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans md:p-8">
            {/* --- WELCOME HEADER --- */}
            <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <UserCircle
                            className="text-slate-400"
                            size={20}
                        />
                        <h1 className="text-2xl font-black tracking-tight text-slate-800">
                            Welcome back, <span className="text-2xl font-bold text-blue-600">{role}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={14} />
                        <span>Today is {today}</span>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                        <Loader2
                            className="animate-spin text-blue-600"
                            size={16}
                        />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Syncing Data...</span>
                    </div>
                )}
            </header>

            {/* --- STATS CARDS --- */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((c, i) => (
                    <div
                        key={i}
                        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
                    >
                        <div
                            className={`absolute right-0 top-0 h-16 w-16 ${c.bg} rounded-bl-full opacity-50 transition-transform group-hover:scale-110`}
                        ></div>
                        <div className="relative z-10">
                            <div className={`h-10 w-10 ${c.bg} ${c.color} mb-4 flex items-center justify-center rounded-lg`}>
                                <c.icon size={20} />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.title}</p>
                            <h2 className="text-3xl font-black text-slate-800">{c.val}</h2>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- DATA TABLE --- */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-8 py-5">Asset Info</th>
                                <th className="px-8 py-5 text-center">Serial Number</th>
                                <th className="px-8 py-5 text-center">Condition</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5">Expected Return</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y divide-slate-50 ${loading ? "pointer-events-none opacity-40" : ""}`}>
                            {equipmentList.length > 0 ? (
                                equipmentList.map((item) => (
                                    <tr
                                        key={item._id}
                                        className="transition-colors hover:bg-slate-50/80"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold uppercase text-slate-700">{item.categoryName}</div>
                                            <div className="text-[10px] font-medium text-slate-400">{item.categoryDescription}</div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <code className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600">
                                                {item.serialNumber}
                                            </code>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                                                    item.condition === "Ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                <div
                                                    className={`h-1 w-1 rounded-full ${item.condition === "Ok" ? "bg-green-500" : "bg-red-500"}`}
                                                ></div>
                                                {item.condition}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-[9px] font-black uppercase text-white shadow-sm shadow-blue-200">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-xs font-bold text-slate-600">
                                            {item.returnDate ? (
                                                <span className="flex items-center gap-1.5">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                                                    {new Date(item.returnDate).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="font-normal italic text-slate-300">No date set</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-8 py-12 text-center font-medium text-slate-400"
                                    >
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Showing Page <span className="text-slate-700">{currentPage}</span> of <span className="text-slate-700">{totalPages}</span>
                    </p>

                    <div className="flex gap-3">
                        <button
                            disabled={currentPage === 1 || loading}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <button
                            disabled={currentPage === totalPages || loading}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
