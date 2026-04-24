import React, { useContext, useState } from "react";
import { UserCog, Moon, Sun, LogOut, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../contexts/AuthContext";
import UpdatePassword from "../Login/UpdatePassword.jsx";

export const ProfileDropdown = ({
    isOpen,
    dropdownRef,
    user,
    theme,
    setTheme,
    onOpenProfile,
    onLogout,
}) => {
    const { fetchUserById, linkId } = useContext(AuthContext);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const handleProfileClick = async () => {
        if (linkId) {
            const freshData = await fetchUserById(linkId);
            onOpenProfile(freshData);
        } else {
            onOpenProfile(user);
        }
    };

    const handlePasswordClick = () => {
        setIsPasswordModalOpen(true);
    };

    const handleClosePasswordModal = () => {
        setIsPasswordModalOpen(false);
    };

    const handlePasswordSuccess = () => {
        // Optional: Magdagdag ng notification dito
        console.log("Password changed successfully!");
        setIsPasswordModalOpen(false);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#1e40af] to-blue-700 px-4 py-4 text-center">
                            <p className="text-sm font-bold text-white">{user?.username || "User"}</p>
                            <p className="text-[10px] uppercase tracking-widest text-blue-100">{user?.role || "Staff"}</p>
                        </div>

                        <div className="p-2">
                            {/* My Profile */}
                            <button
                                onClick={handleProfileClick}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-all hover:bg-[#1e40af]/10 hover:text-[#1e40af] dark:text-slate-300 dark:hover:bg-[#facc15]/10 dark:hover:text-[#facc15]"
                            >
                                <UserCog size={16} />
                                <span className="font-medium">My Profile</span>
                            </button>

                            {/* Change Password */}
                            <button
                                onClick={handlePasswordClick}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-all hover:bg-[#1e40af]/10 hover:text-[#1e40af] dark:text-slate-300 dark:hover:bg-[#facc15]/10 dark:hover:text-[#facc15]"
                            >
                                <Lock size={16} />
                                <span className="font-medium">Change Password</span>
                            </button>

                            {/* Theme Toggle */}
                            <button
                                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-all hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                            >
                                <div className="flex items-center gap-3">
                                    {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                                    <span className="font-medium">Theme</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase text-slate-400">{theme === "light" ? "Dark" : "Light"}</span>
                            </button>

                            <div className="my-2 border-t border-slate-100 dark:border-slate-700"></div>

                            {/* Sign Out */}
                            <button
                                onClick={onLogout}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UpdatePassword Modal */}
            <UpdatePassword
                isOpen={isPasswordModalOpen}
                onClose={handleClosePasswordModal}
                userId={linkId || user?.id}
                onSuccess={handlePasswordSuccess}
            />
        </>
    );
};