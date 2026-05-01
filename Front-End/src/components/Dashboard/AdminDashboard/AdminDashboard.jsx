import React, { useEffect, useState, useContext, useCallback } from "react";
import { Package, Users, Clock, CheckCircle, Shield, ArrowUpRight, X, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { EquipmentContext } from "../../../contexts/EquipmentContext/EquipmentContext";
import { LoanEquipmentContext } from "../../../contexts/LoanEuipmentContext/LoanEuipmentContext";
import { AuthContext } from "../../../contexts/AuthContext";

// --- COUNTING EFFECT COMPONENT ---
const Counter = ({ value }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = parseInt(value) || 0;
        if (end === 0) {
            setCount(0);
            return;
        }

        let duration = 1500; // Tagal ng animation (1.5 seconds)
        let stepTime = Math.max(duration / end, 10); // Minimum 10ms speed

        const timer = setInterval(() => {
            start += Math.ceil(end / 50); // Bilis ng pagtalon ng numero
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{count.toLocaleString()}</span>;
};

const Card = ({ children, className = "", style = {} }) => (
    <div
        style={style}
        className={`rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
        {children}
    </div>
);

const CardContent = ({ children, className = "" }) => <div className={`p-6 ${className}`}>{children}</div>;

const ReportFilterModal = ({ isOpen, onClose, onGenerate, isGenerating }) => {
    const [status, setStatus] = useState("All");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const filters = {};
        if (status && status !== "All") {
            let mappedStatus = status;
            if (status === "Return") mappedStatus = "Returned";
            filters.status = mappedStatus;
        }
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        onGenerate(filters);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 dark:bg-black/70">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#1e40af] dark:text-slate-100">Generate Report</h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-[#3b82f6]"
                        >
                            <option value="All">All</option>
                            <option value="Missing">Missing</option>
                            <option value="Return">Returned</option>
                            <option value="Damage">Damage</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700 focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-[#3b82f6]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700 focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-[#3b82f6]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                            Cancel
                        </button>
                        <button type="submit" disabled={isGenerating} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1e40af] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50 dark:bg-[#1e3a8a] dark:hover:bg-[#1e40af]">
                            {isGenerating ? <Loader2 className="animate-spin h-4 w-4" /> : "Download PDF"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default function App() {
    const [isDark, setIsDark] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { role } = useContext(AuthContext);

    const { latestEquipment, fetchLatestEquipment, downloadEnchargeBorrowReport } = useContext(LoanEquipmentContext);
    const { dashboardCounts, fetchDashboardCounts } = useContext(EquipmentContext);

    // Stable fetch function using useCallback
    const fetchDashboardData = useCallback(async () => {
        console.log("Fetching dashboard data...");
        
        // Fetch both data sets in parallel
        const promises = [];
        
        if (fetchDashboardCounts) {
            promises.push(fetchDashboardCounts());
        }
        
        if (fetchLatestEquipment) {
            promises.push(fetchLatestEquipment());
        } else {
            console.warn("fetchLatestEquipment is not available");
        }
        
        if (promises.length > 0) {
            await Promise.all(promises);
            console.log("Dashboard data fetch completed");
        }
    }, [fetchDashboardCounts, fetchLatestEquipment]);

    // Manual refresh handler
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchDashboardData();
        setIsRefreshing(false);
    };

    // 1. INITIAL LOAD - Fetch data when component mounts
    useEffect(() => {
        console.log("Dashboard mounted - initial fetch");
        fetchDashboardData();
    }, [fetchDashboardData]);

    // 2. REFETCH WHEN PAGE BECOMES VISIBLE (e.g., switching tabs, returning to page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log("Page became visible - refetching data");
                fetchDashboardData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchDashboardData]);

    // 3. REFETCH WHEN WINDOW GETS FOCUS (e.g., clicking back to the tab)
    useEffect(() => {
        const handleWindowFocus = () => {
            console.log("Window focused - refetching data");
            fetchDashboardData();
        };

        window.addEventListener('focus', handleWindowFocus);
        
        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [fetchDashboardData]);

    // 4. REFETCH WHEN NAVIGATING BACK/FORWARD USING BROWSER BUTTONS
    useEffect(() => {
        const handlePageShow = (event) => {
            // persisted property is true when page is loaded from bfcache (back/forward cache)
            if (event.persisted) {
                console.log("Page restored from bfcache - refetching data");
                fetchDashboardData();
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        
        return () => {
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [fetchDashboardData]);

    console.log("Rendering dashboard with counts:", dashboardCounts);

    const getCards = () => {
        const baseCards = [
            { title: "Total Assets", value: dashboardCounts?.totalAssets || 0, icon: Package, accent: "text-[#1e40af] dark:text-[#3b82f6]" },
            { title: "On Loan", value: dashboardCounts?.totalReleased || 0, icon: Clock, accent: "text-[#facc15] dark:text-[#fbbf24]" },
            { title: "Pending", value: dashboardCounts?.totalPending || 0, icon: CheckCircle, accent: "text-blue-600 dark:text-blue-400" },
        ];
        
        // Only add Total Admins card if role is admin
        if (role === "admin") {
            baseCards.push({ 
                title: "Total Admin", 
                value: dashboardCounts?.totalAdmins || 0, 
                icon: Users, 
                accent: "text-[#1e40af] dark:text-[#3b82f6]" 
            });
        }
        
        return baseCards;
    };

    const cards = getCards();
    
    // Determine grid layout based on number of cards
    const getGridClass = () => {
        if (cards.length === 3) {
            return "grid grid-cols-1 gap-6 md:grid-cols-3"; // 3 columns for 3 cards
        }
        return "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"; // 4 columns for 4 cards
    };

    const handleGenerateReport = async (filters) => {
        setIsDownloading(true);
        const success = await downloadEnchargeBorrowReport(filters);
        setIsDownloading(false);
        if (success) setShowModal(false);
    };

    return (
        <div className={`${isDark ? "dark" : ""}`}>
            <div className="min-h-screen rounded-3xl bg-slate-50 p-4 font-sans dark:bg-slate-950 md:p-8">
                <header className="mx-auto mb-10 flex max-w-7xl flex-col justify-between gap-6 border-b border-slate-200 pb-8 dark:border-slate-800 md:flex-row md:items-center">
                    <div className="flex items-center gap-5">
                        <div className="rounded-xl bg-[#1e40af] p-4 shadow-lg dark:bg-[#1e3a8a]">
                            <Shield className="h-8 w-8 text-[#facc15] dark:text-[#fbbf24]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-[#1e40af] dark:text-slate-100">Dashboard</h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">Enterprise Asset Intelligence</p>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl space-y-8">
                    {/* STATS CARDS WITH COUNTING EFFECT */}
                    <div className={getGridClass()}>
                        {cards.map((card, index) => {
                            const Icon = card.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="h-full"
                                >
                                    <Card className="border-l-4 h-full" style={{ borderLeftColor: index % 2 === 0 ? "#1e40af" : "#facc15" }}>
                                        <CardContent className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{card.title}</p>
                                                <Icon className={`h-5 w-5 ${card.accent}`} />
                                            </div>
                                            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">
                                                <Counter value={card.value} />
                                            </h2>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* TABLE AREA */}
                    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-7 dark:border-slate-800">
                            <div>
                                <h2 className="text-xl font-bold text-[#1e40af] dark:text-[#3b82f6]">Equipment Borrow</h2>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#facc15] dark:text-[#fbbf24]">Recent Transactions</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(true)} 
                                className="flex items-center gap-2 rounded-xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white transition-all hover:bg-[#1e3a8a] dark:bg-[#1e3a8a] dark:hover:bg-[#1e40af]"
                            >
                                GENERATE REPORT <ArrowUpRight className="h-4 w-4 text-[#facc15] dark:text-[#fbbf24]" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500">
                                        <th className="px-8 py-5">Personnel</th>
                                        <th className="px-8 py-5">Asset / Serial</th>
                                        <th className="px-8 py-5">Date</th>
                                        <th className="px-8 py-5 text-center">Status</th>
                                     </tr>
                                </thead>
                                <tbody>
                                    {latestEquipment?.length > 0 ? (
                                        latestEquipment.map((log) =>
                                            log.equipmentIds.map((item) => (
                                                <tr key={item._id} className="border-b border-slate-50 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50">
                                                    <td className="px-8 py-6">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200">{log.borrower?.fullName || "N/A"}</div>
                                                        <div className="text-[9px] text-slate-400 dark:text-slate-500">RFID: {log.borrower?.rfidId}</div>
                                                     </td>
                                                    <td className="px-8 py-6">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200">{item.categoryName}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.serialNumber}</div>
                                                     </td>
                                                    <td className="px-8 py-6 text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(log.createdAt).toLocaleDateString()}
                                                     </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={`inline-block w-24 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase ${
                                                            item.status === "Release" 
                                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" 
                                                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                        }`}>
                                                            {item.status === "Release" ? "Borrowed" : item.status}
                                                        </span>
                                                     </td>
                                                 </tr>
                                            ))
                                        )
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-20 text-center text-slate-400 italic dark:text-slate-500">
                                                No recent transactions.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>

                <ReportFilterModal 
                    isOpen={showModal} 
                    onClose={() => setShowModal(false)} 
                    onGenerate={handleGenerateReport} 
                    isGenerating={isDownloading} 
                />
            </div>
        </div>
    );
}