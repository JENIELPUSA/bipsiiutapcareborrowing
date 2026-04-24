import { Outlet } from "react-router-dom";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useClickOutside } from "@/hooks/use-click-outside";
import { Sidebar } from "@/layouts/sidebar";
import { Header } from "@/layouts/header";
import { cn } from "@/utils/cn";
import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const Layout = () => {
    const isDesktopDevice = useMediaQuery("(min-width: 768px)");
    const [collapsed, setCollapsed] = useState(!isDesktopDevice);

    const sidebarRef = useRef(null);
    const { role } = useContext(AuthContext);
    const isBorrower = role === "borrower";

    // auto collapse on device change
    useEffect(() => {
        setCollapsed(!isDesktopDevice);
    }, [isDesktopDevice]);

    // force collapse if borrower
    useEffect(() => {
        if (isBorrower) {
            setCollapsed(true);
        }
    }, [isBorrower]);

    // click outside sidebar (desktop/mobile behavior)
    useClickOutside([sidebarRef], () => {
        if (!isDesktopDevice && !collapsed) {
            setCollapsed(true);
        }
    });

    return (
        <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">

            {/* BACKDROP (mobile sidebar overlay) */}
            {!isBorrower && (
                <div
                    className={cn(
                        "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
                        !collapsed &&
                            "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30"
                    )}
                />
            )}

            {/* SIDEBAR (HIDE IF BORROWER) */}
            {!isBorrower && (
                <Sidebar ref={sidebarRef} collapsed={collapsed} />
            )}

            {/* MAIN CONTENT */}
            <div
                className={cn(
                    "transition-[margin] duration-300",
                    isBorrower
                        ? "md:ml-0"
                        : collapsed
                            ? "md:ml-[70px]"
                            : "md:ml-[240px]"
                )}
            >
                <Header collapsed={collapsed} setCollapsed={setCollapsed} />

                <div className="h-[calc(100vh-60px)] overflow-y-auto overflow-x-hidden p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;