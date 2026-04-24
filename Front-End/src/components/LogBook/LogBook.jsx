import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  X,
  Printer,
  FileText,
  Calendar as CalendarIcon,
  Globe,
  Mail,
  Phone
} from 'lucide-react';

const App = () => {
  const [logs, setLogs] = useState([
    {
      id: 1,
      date: '2023-10-25',
      time: '08:00 AM',
      equipment: 'Projector A-12',
      borrower: 'Juan Dela Cruz',
      purpose: 'Department Meeting',
      status: 'Returned',
      returnDate: '2023-10-25'
    },
    {
      id: 2,
      date: '2023-10-26',
      time: '10:30 AM',
      equipment: 'Logitech Webcam',
      borrower: 'Maria Clara',
      purpose: 'Online Interview',
      status: 'Borrowed',
      returnDate: 'Pending'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [newLog, setNewLog] = useState({
    equipment: '',
    borrower: '',
    purpose: '',
    status: 'Borrowed'
  });

  const addLog = () => {
    if (!newLog.equipment || !newLog.borrower) return;
    
    const now = new Date();
    const entry = {
      ...newLog,
      id: Date.now(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      returnDate: 'Pending'
    };

    setLogs([entry, ...logs]);
    setNewLog({ equipment: '', borrower: '', purpose: '', status: 'Borrowed' });
    setIsModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = filterDate === '' || log.date === filterDate;
    
    return matchesSearch && matchesDate;
  });

  // BiPSU Inspired SVG Logo - Blue and Yellow
  const BipsuLogo = () => (
    <svg width="85" height="85" viewBox="0 0 100 100" className="drop-shadow-sm">
      <circle cx="50" cy="50" r="48" fill="#1e3a8a" stroke="#fbbf24" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="white" />
      <path d="M30 35 L50 20 L70 35 L70 70 L50 85 L30 70 Z" fill="#1e3a8a" />
      <path d="M45 40 L55 40 L55 65 L45 65 Z" fill="#fbbf24" />
      <path d="M40 45 L60 45 L60 50 L40 50 Z" fill="#fbbf24" />
      <text x="50" y="94" fontSize="5.5" textAnchor="middle" fontWeight="black" fill="#1e3a8a" className="font-sans">BiPSU</text>
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-10 font-serif text-slate-900 print:bg-white print:p-0">
      {/* Action Bar - Hidden in Print */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden font-sans">
        <div className="flex gap-2 text-nowrap">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded shadow hover:bg-blue-950 transition-all text-sm font-bold border-b-2 border-yellow-400"
          >
            <Plus size={16} /> New Entry
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded shadow-sm hover:bg-slate-50 transition-all text-sm"
          >
            <Printer size={16} /> Print Official Report
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="date" 
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded shadow-sm text-sm outline-none focus:ring-1 focus:ring-blue-800 w-full md:w-44"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search database..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded shadow-sm text-sm outline-none focus:ring-1 focus:ring-blue-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Document (A4 Container) */}
      <div className="max-w-5xl mx-auto bg-white shadow-xl min-h-[1050px] p-8 md:p-12 border-t-[12px] border-blue-900 print:shadow-none print:border-t-0 print:p-0">
        
        {/* BiPSU Header Section */}
        <div className="flex justify-between items-center mb-8 border-b-2 border-blue-900 pb-6">
          <div className="flex items-center gap-4">
            <BipsuLogo />
            <div>
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Republic of the Philippines</h2>
              <h1 className="text-xl md:text-2xl font-black text-blue-900 leading-none mb-1">BILIRAN PROVINCE STATE UNIVERSITY</h1>
              <p className="text-[10px] font-sans text-slate-400 italic font-bold">"A State University for Advanced Learning, Research, and Service"</p>
              <div className="flex gap-4 mt-2 text-[9px] font-sans text-slate-600 uppercase font-bold">
                <span className="flex items-center gap-1"><Globe size={10} className="text-blue-900"/> www.bipsu.edu.ph</span>
                <span className="flex items-center gap-1"><Mail size={10} className="text-blue-900"/> info@bipsu.edu.ph</span>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-sans font-black text-slate-300 uppercase">Document Control</div>
            <div className="text-sm font-mono font-bold text-slate-800 tracking-tighter">BIPSU-PRO-LOG-{new Date().getFullYear()}</div>
            <div className="text-[9px] font-sans bg-blue-50 text-blue-800 px-2 py-0.5 rounded mt-1 font-bold inline-block border border-blue-100">ISO 9001:2015 CERTIFIED</div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h3 className="text-lg font-black uppercase underline decoration-yellow-400 decoration-4 underline-offset-8 text-slate-800 tracking-tight">
            Equipment Tracking & Accountability Report
          </h3>
          <p className="mt-4 text-[11px] font-sans text-slate-500 uppercase font-bold tracking-widest">Property & Supply Management Office</p>
        </div>

        {/* Report Meta Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-[10px] font-sans uppercase font-bold tracking-tight bg-slate-50 p-4 border border-slate-200 rounded">
          <div className="border-l-2 border-yellow-400 pl-2">
            <span className="text-slate-400 block mb-0.5">Date of Report</span>
            <span className="text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="border-l-2 border-yellow-400 pl-2">
            <span className="text-slate-400 block mb-0.5">Total Records</span>
            <span className="text-slate-900">{logs.length} Entries</span>
          </div>
          <div className="border-l-2 border-yellow-400 pl-2">
            <span className="text-slate-400 block mb-0.5">Campus Location</span>
            <span className="text-slate-900">Main Campus - Naval</span>
          </div>
          <div className="border-l-2 border-yellow-400 pl-2">
            <span className="text-slate-400 block mb-0.5">Classification</span>
            <span className="text-blue-900 italic">Property Clearance</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full">
          <table className="w-full border-collapse border border-slate-300">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest border border-blue-950">Reference Date</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest border border-blue-950">Particulars / Equipment</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest border border-blue-950">Accountable Person</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest border border-blue-950">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 align-top w-32 border border-slate-200">
                    <div className="text-xs font-bold font-sans">{log.date}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.time}</div>
                  </td>
                  <td className="py-4 px-4 align-top border border-slate-200">
                    <div className="text-sm font-bold text-slate-900 leading-tight mb-1">{log.equipment}</div>
                    <div className="text-[11px] text-slate-500 italic leading-snug">{log.purpose}</div>
                  </td>
                  <td className="py-4 px-4 align-top border border-slate-200">
                    <div className="text-sm text-slate-700 font-medium">{log.borrower}</div>
                  </td>
                  <td className="py-4 px-4 align-top w-32 border border-slate-200">
                    <div className={`text-[10px] font-black uppercase mb-1 ${log.status === 'Returned' ? 'text-blue-700' : 'text-amber-600'}`}>
                      {log.status === 'Returned' ? '✓ CLEARED' : '⚠ OUTSTANDING'}
                    </div>
                    {log.status === 'Returned' ? (
                      <div className="text-[9px] text-slate-400">Returned: {log.returnDate}</div>
                    ) : (
                      <div className="text-[9px] text-amber-500 font-bold italic">In Possession</div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 italic text-sm border border-slate-200">
                    No active records found in the BiPSU accountability database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PDF Footer / Signatures */}
        <div className="mt-24 grid grid-cols-2 gap-20 px-10">
          <div className="text-center">
            <div className="border-b-2 border-slate-900 mb-2 h-10"></div>
            <div className="text-[10px] font-black uppercase text-slate-900">Property Custodian</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-tighter italic">Official Signature Over Printed Name</div>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-slate-900 mb-2 h-10"></div>
            <div className="text-[10px] font-black uppercase text-slate-900">Head of Office / Dean</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-tighter italic">Approval Authority Signature</div>
          </div>
        </div>

        <div className="mt-16 pt-4 border-t-2 border-yellow-400 text-[8px] text-slate-500 flex justify-between items-center uppercase tracking-widest font-sans font-bold">
          <div>Biliran Province State University • Property Office © {new Date().getFullYear()}</div>
          <div className="bg-blue-900 text-white px-3 py-1 rounded-sm shadow-sm">OFFICIAL COPY</div>
        </div>
      </div>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden font-sans">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-yellow-400">
            <div className="bg-blue-900 p-4 flex justify-between items-center text-white">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={16} className="text-yellow-400" /> BiPSU Accountability Entry
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-yellow-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Equipment / Property Particulars</label>
                <input 
                  type="text" 
                  className="w-full p-2 text-sm border-b-2 border-slate-100 focus:border-blue-900 outline-none transition-all font-sans"
                  placeholder="Hal: Epson Projector EB-S41"
                  value={newLog.equipment}
                  onChange={(e) => setNewLog({...newLog, equipment: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Full Name of Borrower</label>
                <input 
                  type="text" 
                  className="w-full p-2 text-sm border-b-2 border-slate-100 focus:border-blue-900 outline-none transition-all font-sans"
                  placeholder="Dela Cruz, Juan A."
                  value={newLog.borrower}
                  onChange={(e) => setNewLog({...newLog, borrower: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">Purpose of Use</label>
                <textarea 
                  rows="2" 
                  className="w-full p-2 text-sm border-b-2 border-slate-100 focus:border-blue-900 outline-none resize-none transition-all font-sans"
                  placeholder="Saan at bakit ito gagamitin?"
                  value={newLog.purpose}
                  onChange={(e) => setNewLog({...newLog, purpose: e.target.value})}
                ></textarea>
              </div>
              <button 
                onClick={addLog}
                className="w-full bg-blue-900 text-white py-3 rounded text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-md active:scale-95 mt-2 border-b-4 border-blue-950"
              >
                File Record & Secure Clearance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;