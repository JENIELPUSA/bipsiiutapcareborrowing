import {
    useContext,
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
} from "react";
import { useTheme } from "@/hooks/use-theme";
import { Bell, ChevronsLeft, ChevronRight, Sun, Moon, UserCircle } from "lucide-react";
import profileImg from "@/assets/profile-image.jpg";

import { AuthContext } from "../contexts/AuthContext";
import { NotificationDisplayContext } from "../contexts/NotificationContext/NotificationContext";

import { NotificationDropdown } from "../components/HeaderComponents/NotificationDropdown.jsx";
import { ProfileDropdown } from "../components/HeaderComponents/ProfileDropdown.jsx";
import { ProfileModal } from "../components/HeaderComponents/ProfileModal.jsx";

export const Header = ({ collapsed, setCollapsed }) => {
    const {
        logout,
        role,
        linkId,
        selectedUser,
        fetchUserById,
        user, // Sinisiguradong kinuha ang user mula sa context
    } = useContext(AuthContext);

    const { theme, setTheme } = useTheme();
    const { notify, markNotificationAsRead, setNotify } =
        useContext(NotificationDisplayContext);

    const notificationsArray = Array.isArray(notify) ? notify : [];

    // 🔥 ROLE CHECK
    const isBorrower = role === "borrower";

    // 🔄 AUTO FETCH USER
    useEffect(() => {
        if (fetchUserById) {
            fetchUserById();
        }
    }, [fetchUserById]);

    const profileUser = selectedUser || user;

    // 🔔 UNREAD COUNT
    const unreadCount = useMemo(() => {
        if (!linkId) return 0;

        return notificationsArray.filter((n) => {
            const viewer = n.viewers?.find(
                (v) => v.user?.toString() === linkId?.toString()
            );
            return viewer ? viewer.isRead === false : false;
        }).length;
    }, [notificationsArray, linkId]);

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);

    const notificationRef = useRef(null);
    const notificationButtonRef = useRef(null);
    const profileRef = useRef(null);
    const profileButtonRef = useRef(null);

    // 🔔 TOGGLE NOTIFICATIONS
    const handleNotificationToggle = useCallback(async () => {
        const nextState = !isNotificationOpen;
        setIsNotificationOpen(nextState);
        setIsProfileOpen(false);

        if (nextState && linkId) {
            const unreadIds = notificationsArray
                .filter((n) => {
                    const viewer = n.viewers?.find(
                        (v) => v.user?.toString() === linkId?.toString()
                    );
                    return viewer ? viewer.isRead === false : false;
                })
                .map((n) => n._id);

            if (unreadIds.length > 0) {
                await Promise.all(
                    unreadIds.map((id) => markNotificationAsRead(id))
                );
            }
        }
    }, [
        isNotificationOpen,
        notificationsArray,
        linkId,
        markNotificationAsRead,
    ]);

    // 👤 PROFILE MODAL
    const handleOpenProfileModal = useCallback(() => {
        setSelectedProfile(profileUser);
        setIsModalOpen(true);
        setIsProfileOpen(false);
    }, [profileUser]);

    // 🚪 OUTSIDE CLICK
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(e.target) &&
                notificationButtonRef.current &&
                !notificationButtonRef.current.contains(e.target)
            ) {
                setIsNotificationOpen(false);
            }

            if (
                profileRef.current &&
                !profileRef.current.contains(e.target) &&
                profileButtonRef.current &&
                !profileButtonRef.current.contains(e.target)
            ) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // HELPERS
    const getFullName = () => profileUser?.first_name || "User";
    const getAvatarUrl = () =>
        profileUser?.avatar?.url || profileImg;
    const getRole = () => profileUser?.role || "Staff";

    return (
        <header className="relative z-20 flex h-[70px] items-center justify-between border-b-[3px] border-[#facc15] bg-white px-6 shadow-md dark:bg-slate-900">

            {/* LEFT SECTION */}
            <div className="flex items-center gap-x-4">

                {/* COLLAPSE BUTTON (HIDDEN IF BORROWER) */}
                {!isBorrower && (
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1e40af] transition-colors hover:bg-[#1e40af]/10 dark:text-[#facc15]"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        <ChevronsLeft
                            className={`h-5 w-5 transition-transform duration-300 ${
                                collapsed ? "rotate-180" : ""
                            }`}
                        />
                    </button>
                )}

                <div className="hidden md:block">
                    <h1 className="text-sm font-black uppercase tracking-wider text-slate-400">
                        Equipment{" "}
                        <span className="text-[#1e40af] dark:text-blue-400">
                            Borrowing System
                        </span>
                    </h1>
                </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center gap-x-3">
                
                {/* NOTIFICATION BELL (HIDDEN IF BORROWER) */}
                {!isBorrower && (
                    <div className="relative">
                        <button
                            ref={notificationButtonRef}
                            onClick={handleNotificationToggle}
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            <Bell size={20} />

                            {unreadCount > 0 && (
                                <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-slate-800"></span>
                                </span>
                            )}
                        </button>

                        <NotificationDropdown
                            isOpen={isNotificationOpen}
                            dropdownRef={notificationRef}
                            notifications={notificationsArray}
                            linkId={linkId}
                            markNotificationAsRead={markNotificationAsRead}
                            setNotify={setNotify}
                        />
                    </div>
                )}

                {/* PROFILE SECTION */}
                <div className="relative">
                    <button
                        ref={profileButtonRef}
                        onClick={() => {
                            setIsProfileOpen(!isProfileOpen);
                            setIsNotificationOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2 py-1 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    >
                        <div className="h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-[#1e40af] to-blue-600 p-0.5">
                            <div className="h-full w-full overflow-hidden rounded-md bg-white">
                                <img
                                    src={getAvatarUrl()}
                                    className="h-full w-full object-cover"
                                    alt="Profile"
                                />
                            </div>
                        </div>

                        <div className="hidden text-left md:block">
                            <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">
                                {getFullName()}
                            </p>
                            <p className="text-[9px] font-medium uppercase text-slate-400">
                                {getRole()}
                            </p>
                        </div>

                        <ChevronRight
                            size={14}
                            className={`text-slate-400 transition-transform duration-300 ${
                                isProfileOpen ? "rotate-90" : ""
                            }`}
                        />
                    </button>

                    <ProfileDropdown
                        isOpen={isProfileOpen}
                        dropdownRef={profileRef}
                        user={profileUser}
                        theme={theme}
                        setTheme={setTheme}
                        onOpenProfile={handleOpenProfileModal}
                        onLogout={logout}
                    />
                </div>
            </div>

            {/* PROFILE MODAL */}
            <ProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedProfile}
            />
        </header>
    );
};