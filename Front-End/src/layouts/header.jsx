import { useContext, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { 
    Bell, ChevronsLeft, Moon, Search, Sun, User, 
    Settings, LogOut, Package, Clock, X, Mail, Shield 
} from "lucide-react";
import profileImg from "@/assets/profile-image.jpg";
import PropTypes from "prop-types";
import { AuthContext } from "../contexts/AuthContext";
import { NotificationDisplayContext } from "../contexts/NotificationContext/NotificationContext.jsx";

export const Header = ({ collapsed, setCollapsed }) => {
    const { logout, user } = useContext(AuthContext); // Kinuha ang 'user' info dito
    const { notify } = useContext(NotificationDisplayContext);
    const { theme, setTheme } = useTheme();
    
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // State para sa Modal

    const currentNotifications = notify || [];

    return (
        <header className="relative z-10 flex h-[60px] items-center justify-between border-b-2 border-yellow-400 bg-white px-4 shadow-sm transition-colors dark:border-blue-700 dark:bg-slate-900">
            {/* LEFT SECTION */}
            <div className="flex items-center gap-x-3">
                <button
                    className="flex size-10 items-center justify-center rounded-full text-blue-700 hover:bg-blue-50 dark:text-yellow-400 dark:hover:bg-slate-800"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronsLeft className={collapsed ? "rotate-180" : "transition-transform"} />
                </button>

                <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                    <Search size={18} className="text-blue-700 dark:text-yellow-400" />
                    <input
                        type="text"
                        placeholder="Search equipment..."
                        className="w-40 bg-transparent text-sm outline-0 dark:text-white md:w-64"
                    />
                </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-x-4">
                {/* Notification Dropdown (Same as your code) */}
                <div className="relative">
                    <button
                        className="flex size-10 items-center justify-center rounded-full text-blue-700 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => {
                            setIsNotificationOpen(!isNotificationOpen);
                            setIsProfileOpen(false);
                        }}
                    >
                        <Bell size={20} />
                        {currentNotifications.length > 0 && (
                            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                                {currentNotifications.length}
                            </span>
                        )}
                    </button>

                    {isNotificationOpen && (
                        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 mt-3 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl duration-200 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center justify-between bg-blue-700 px-4 py-3 dark:bg-slate-950">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-400">Inventory Requests</h3>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {currentNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-slate-400">No pending requests</div>
                                ) : (
                                    currentNotifications.map((notif) => (
                                        <div key={notif._id} className="border-b border-slate-50 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-slate-700">
                                                    <Package size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{notif.message}</p>
                                                    <div className="mt-2 flex w-fit items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                        <Clock size={12} />
                                                        {new Date(notif.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar / Profile Dropdown */}
                <div className="relative">
                    <button
                        className="flex items-center gap-2 rounded-full border border-slate-200 p-0.5 pr-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={() => {
                            setIsProfileOpen(!isProfileOpen);
                            setIsNotificationOpen(false);
                        }}
                    >
                        <div className="size-8 overflow-hidden rounded-full border-2 border-yellow-400">
                            <img src={profileImg} alt="user" className="size-full object-cover" />
                        </div>
                        <span className="hidden text-sm font-bold text-slate-700 dark:text-slate-200 md:block">
                            {user?.username || "Borrower Admin"}
                        </span>
                    </button>

                    {isProfileOpen && (
                        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl duration-200 dark:border-slate-700 dark:bg-slate-800">
                            <div className="bg-slate-50 p-4 text-center dark:bg-slate-700/30">
                                <p className="text-sm font-bold text-blue-900 dark:text-white">{user?.role || "Admin Officer"}</p>
                                <p className="text-[10px] text-slate-500">{user?.email || "Inventory Management"}</p>
                            </div>
                            <div className="p-1">
                                {/* DITO ANG PAG-CLICK PARA SA MODAL */}
                                <button 
                                    onClick={() => {
                                        setIsModalOpen(true);
                                        setIsProfileOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    <User size={16} /> Profile Info
                                </button>

                                <button
                                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                                    className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    <div className="flex items-center gap-3">
                                        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                                        <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                                    </div>
                                    <div className="h-4 w-8 rounded-full bg-slate-200 p-0.5 dark:bg-blue-600">
                                        <div className={`h-3 w-3 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`} />
                                    </div>
                                </button>

                                <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                                <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-50">
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- USER INFO POPUP MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="animate-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                        {/* Modal Header */}
                        <div className="relative h-24 bg-blue-700 dark:bg-blue-900">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="absolute right-3 top-3 rounded-full bg-black/20 p-1 text-white hover:bg-black/40"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute -bottom-10 left-6">
                                <div className="size-20 overflow-hidden rounded-2xl border-4 border-white bg-slate-200 dark:border-slate-900">
                                    <img src={profileImg} alt="User" className="size-full object-cover" />
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 pb-6 pt-12">
                            <div className="mb-4">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {user?.username || "Admin Officer"}
                                </h2>
                                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    {user?.role || "System Administrator"}
                                </span>
                            </div>

                            <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Mail size={18} className="text-blue-600" />
                                    <span>{user?.email || "admin@system.com"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Shield size={18} className="text-blue-600" />
                                    <span>Access Level: <b className="text-slate-800 dark:text-slate-200">Full Access</b></span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="mt-6 w-full rounded-xl bg-blue-700 py-2.5 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};