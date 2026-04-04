import React, { useEffect, useState } from "react";
import { Package, Users, Clock, CheckCircle, Shield, ArrowUpRight, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

// --- CHART.JS IMPORTS ---
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Card = ({ children, className = "", style = {} }) => (
  <div 
    style={style}
    className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm transition-colors ${className}`}
  >
    {children}
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [stats, setStats] = useState({ totalEquipment: 120, borrowed: 35, available: 85, users: 60 });
  const [recentBorrows, setRecentBorrows] = useState([]);

  useEffect(() => {
    setRecentBorrows([
      { id: 1, user: "Juan Dela Cruz", equipment: "Executive Laptop Pro", date: "March 14, 2026", time: "10:30 AM", status: "Borrowed" },
      { id: 2, user: "Maria Santos", equipment: "Secure Vault Access Key", date: "March 13, 2026", time: "02:15 PM", status: "Returned" },
      { id: 3, user: "Roberto Reyes", equipment: "Biometric Scanner", date: "March 13, 2026", time: "09:00 AM", status: "Borrowed" },
    ]);
  }, []);

  // --- CHART DATA CONFIGURATION (BLUE & YELLOW THEME) ---
  
  const pieData = {
    labels: ['Laptops', 'Keys/Access', 'Biometrics', 'Radios'],
    datasets: [{
      data: [40, 30, 20, 10],
      // Blue, Yellow, Light Blue, Slate colors
      backgroundColor: ['#1e40af', '#facc15', '#60a5fa', '#64748b'],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Borrowing',
      data: [45, 52, 35, 48, 61, 55],
      fill: true,
      borderColor: '#facc15', // Yellow line
      backgroundColor: 'rgba(250, 204, 21, 0.1)', // Yellow glow
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#1e40af' // Blue points
    }]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#f8fafc' : '#1e40af',
          font: { weight: 'bold', size: 10 }
        }
      }
    }
  };

  const cards = [
    { title: "Total Assets", value: stats.totalEquipment, icon: Package, accent: "text-[#1e40af]" },
    { title: "On Loan", value: stats.borrowed, icon: Clock, accent: "text-[#facc15]" },
    { title: "Secure Stock", value: stats.available, icon: CheckCircle, accent: "text-blue-600" },
    { title: "Auth. Personnel", value: stats.users, icon: Users, accent: "text-[#1e40af]" },
  ];

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300 rounded-3xl">
        
        <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#1e40af] rounded-xl shadow-lg shadow-blue-200 dark:shadow-none">
              <Shield className="w-8 h-8 text-[#facc15]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1e40af] dark:text-slate-50">Dashboard</h1>
              <p className="text-slate-400 text-[10px] font-bold tracking-[0.4em] uppercase">Enterprise Asset Intelligence</p>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="border-l-4" style={{ borderLeftColor: index % 2 === 0 ? '#1e40af' : '#facc15' }}>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
                      <Icon className={`w-5 h-5 ${card.accent}`} />
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">{card.value}</h2>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* --- CHARTS SECTION --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardContent>
                <h3 className="text-sm font-black text-[#1e40af] dark:text-slate-300 uppercase tracking-widest mb-6">Asset Distribution</h3>
                <div className="h-[300px]">
                  <Pie data={pieData} options={commonOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Line Chart */}
            <Card>
              <CardContent>
                <h3 className="text-sm font-black text-[#1e40af] dark:text-slate-300 uppercase tracking-widest mb-6">Activity Trends (Monthly)</h3>
                <div className="h-[300px]">
                  <Line 
                    data={lineData} 
                    options={{
                      ...commonOptions,
                      scales: {
                        y: { 
                          grid: { color: isDark ? '#1e293b' : '#f1f5f9' },
                          ticks: { color: '#94a3b8' }
                        },
                        x: { 
                          grid: { display: false },
                          ticks: { color: '#94a3b8' }
                        }
                      }
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Section */}
          <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="px-8 py-7 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-[#1e40af] dark:text-slate-50 tracking-tight">System Log Stream</h2>
                  <p className="text-[10px] text-[#facc15] font-black uppercase tracking-widest mt-1">Live RFID Authentication</p>
                </div>
                <button className="bg-[#1e40af] text-white px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none">
                  GENERATE REPORT <ArrowUpRight className="w-4 h-4 text-[#facc15]" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-50 dark:border-slate-800 uppercase text-[10px] font-black tracking-widest">
                      <th className="px-8 py-5">Personnel</th>
                      <th className="px-8 py-5">Asset</th>
                      <th className="px-8 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {recentBorrows.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#1e40af] flex items-center justify-center text-[#facc15] font-black">
                              {item.user.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{item.user}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-slate-600 dark:text-slate-400">{item.equipment}</td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${
                            item.status === 'Borrowed' 
                            ? 'bg-yellow-50 text-yellow-600 border-yellow-200' 
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </main>
      </div>
    </div>
  );
}