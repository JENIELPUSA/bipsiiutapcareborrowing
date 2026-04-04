import React, { useState } from "react";
import { 
  ClipboardList, 
  Search, 
  PlusCircle, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  X,
  ArrowRightLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BorrowingRegistry = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [transactions] = useState([
    { id: "BRW-2024-001", asset: "Solar Power Hub", borrower: "Juan Dela Cruz", dateBorrowed: "2024-03-10", dueDate: "2024-03-15", status: "Borrowed" },
    { id: "BRW-2024-002", asset: "LoRa Gateway", borrower: "Maria Santos", dateBorrowed: "2024-03-12", dueDate: "2024-03-14", status: "Returned" },
    { id: "BRW-2024-003", asset: "Rainfall Sensor", borrower: "Mark Reyes", dateBorrowed: "2024-03-14", dueDate: "2024-03-20", status: "Pending" },
  ]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-2">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#1e40af] dark:text-slate-50 tracking-tighter">
            ASSET <span className="text-[#facc15]">BORROWING</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="h-1 w-8 bg-[#facc15] rounded-full"></span>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">
              Equipment Lending & Return Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e40af] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search borrower or asset..." 
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-[#1e40af] outline-none transition-all shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95 group"
          >
            <PlusCircle size={18} className="text-[#facc15] group-hover:rotate-90 transition-transform" /> 
            BORROW ASSET
          </button>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900">Transaction ID</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900">Asset Name</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900">Borrower</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900">Date Borrowed</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900">Status</th>
                <th className="px-6 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
              {transactions.map((tr) => (
                <motion.tr 
                  key={tr.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group hover:bg-[#1e40af]/[0.03] transition-all"
                >
                  <td className="px-6 py-5">
                    <span className="font-mono text-xs font-bold text-[#1e40af] dark:text-[#facc15] bg-blue-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      {tr.id}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft size={14} className="text-[#1e40af]" />
                      {tr.asset}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      {tr.borrower}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {tr.dateBorrowed}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className={`mx-auto w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      tr.status === 'Returned'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : tr.status === 'Borrowed'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {tr.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-[10px] font-black text-[#1e40af] hover:underline uppercase tracking-widest">
                      View Details
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- BORROW MODAL (Simplified) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-[#1e40af] dark:text-[#facc15] uppercase tracking-tighter">New Borrow Request</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Asset</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#1e40af]">
                    <option>Solar Power Hub</option>
                    <option>LoRa Gateway</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Borrower Name</label>
                  <input type="text" placeholder="Full Name" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#1e40af]" />
                </div>
                <button className="w-full py-4 bg-[#facc15] text-[#1e40af] font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg hover:brightness-110 transition-all mt-4">
                  Confirm Borrowing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BorrowingRegistry;