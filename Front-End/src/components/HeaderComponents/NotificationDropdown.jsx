import {
    Bell,
    Package,
    CheckCircle,
    AlertCircle,
    Info,
    Clock,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const NotificationDropdown = ({
    isOpen,
    dropdownRef,
    notifications = [],
    linkId,
    markNotificationAsRead,
    setNotify,
}) => {

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    className="absolute right-0 mt-3 w-[380px] rounded-2xl bg-white shadow-2xl"
                >

                    {/* HEADER */}
                    <div className="p-4 font-bold bg-blue-700 text-white">
                        Notifications
                    </div>

                    {/* LIST */}
                    <div className="max-h-[400px] overflow-y-auto">

                        {/* 🔥 EMPTY STATE */}
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Bell size={28} className="text-slate-300 mb-2" />
                                <p className="text-sm font-bold text-slate-500">
                                    No Notifications
                                </p>
                                <p className="text-xs text-slate-400">
                                    You're all caught up
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => {

                                // INLINE VIEWER LOGIC
                                const viewer = notif.viewers?.find(
                                    (v) => v.user?.toString() === linkId?.toString()
                                );

                                const isRead = viewer ? viewer.isRead : false;

                                const handleClick = async (e) => {
                                    e.stopPropagation();

                                    await markNotificationAsRead(notif._id);

                                    setNotify((prev) =>
                                        prev.map((n) => {
                                            if (n._id !== notif._id) return n;

                                            return {
                                                ...n,
                                                viewers: n.viewers?.map((v) =>
                                                    v.user?.toString() === linkId?.toString()
                                                        ? { ...v, isRead: true }
                                                        : v
                                                ),
                                            };
                                        })
                                    );
                                };

                                return (
                                    <div
                                        key={notif._id}
                                        onClick={handleClick}
                                        className={`p-4 cursor-pointer border-b ${
                                            !isRead ? "bg-blue-50" : ""
                                        }`}
                                    >
                                        <div className="flex gap-3">

                                            <div className="w-9 h-9 flex items-center justify-center">
                                                {notif.type === "borrow" && <Package size={16} />}
                                                {notif.type === "return" && <CheckCircle size={16} />}
                                                {notif.type === "warning" && <AlertCircle size={16} />}
                                                {!notif.type && <Info size={16} />}
                                            </div>

                                            <div className="flex-1">

                                                <p className={`text-sm ${
                                                    isRead
                                                        ? "text-gray-500"
                                                        : "font-bold text-black"
                                                }`}>
                                                    {notif.message}
                                                </p>

                                                <div className="text-xs flex items-center gap-1 mt-2">
                                                    <Clock size={10} />
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </div>

                                            </div>

                                            {!isRead && (
                                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                            )}

                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                );
                            })
                        )}

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};