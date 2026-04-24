import { forwardRef, useContext, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { navbarLinks } from "@/constants";
import { cn } from "@/utils/cn";
import PropTypes from "prop-types";
import { Shield, X } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

export const Sidebar = forwardRef(({ collapsed, setCollapsed }, ref) => {
    const { role } = useContext(AuthContext);

    console.log("User role in Sidebar:", role); // Debug log para makita ang role

    const rolePermissions = useMemo(
        () => ({
            admin: [
                "/dashboard",
                "/dashboard/useraccount",
                "/dashboard/punch-station",
                "/dashboard/borrower-registry",
                "/dashboard/category",
                "/dashboard/laboratory",
                "/dashboard/department-list",
                "/dashboard/request-equipment",
            ],
            "in-charge": ["/dashboard", "/dashboard/request-equipment", "/dashboard/inventory"],
        }),
        [],
    );

    const allowedPaths = rolePermissions[role] || [];

    return (
        <>
            {/* 1. Mobile Overlay */}
            {!collapsed && (
                <div
                    className="fixed inset-0 z-[90] bg-black/50 transition-opacity md:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}

            <aside
                ref={ref}
                className={cn(
                    "fixed left-0 top-0 z-[100] flex h-screen flex-col overflow-x-hidden border-r transition-all duration-300 ease-in-out",
                    "border-blue-700 bg-[#1e40af] dark:border-blue-900 dark:bg-[#111827]",

                    // Desktop behavior
                    collapsed ? "w-[70px]" : "w-[240px]",

                    // Mobile behavior
                    collapsed ? "-left-full md:left-0" : "left-0 w-[280px] md:w-[240px]",
                )}
            >
                {/* Logo & Close Button */}
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-x-3">
                        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#facc15] shadow-lg shadow-yellow-900/20">
                            <Shield
                                size={24}
                                className="text-[#1e40af]"
                            />
                        </div>
                        {!collapsed && (
                            <p className="text-lg font-black tracking-tight text-white">
                                BiPSU <span className="text-[#facc15]">EBS</span>
                            </p>
                        )}
                    </div>

                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className="text-blue-200 hover:text-white md:hidden"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Navigation Links */}
                <div className="flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:_thin]">
                    {navbarLinks.map((section) => {
                        const filteredLinks = section.links.filter((link) => allowedPaths.includes(link.path));
                        if (filteredLinks.length === 0) return null;

                        return (
                            <nav
                                key={section.title}
                                className={cn("flex flex-col gap-y-1", collapsed && "md:items-center")}
                            >
                                {!collapsed && (
                                    <p className="px-3 text-[10px] font-black uppercase tracking-widest text-blue-200/60">{section.title}</p>
                                )}

                                {filteredLinks.map((link) => (
                                    <NavLink
                                        key={link.label}
                                        to={link.path}
                                        /** * FIX: Nilagay ang 'end' prop.
                                         * Kapag ang path ay exactly "/dashboard",
                                         * hindi ito magiging active kung nasa sub-route ka.
                                         */
                                        end={link.path === "/dashboard"}
                                        onClick={() => window.innerWidth < 768 && setCollapsed(true)}
                                        className={({ isActive }) =>
                                            cn(
                                                "flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                                                "text-blue-50 hover:bg-white/10 hover:text-white",
                                                isActive && "bg-[#facc15] text-[#1e40af] shadow-lg shadow-blue-900/40",
                                                collapsed && "md:w-[45px] md:justify-center",
                                            )
                                        }
                                    >
                                        <link.icon
                                            size={22}
                                            className="flex-shrink-0"
                                        />
                                        {!collapsed && <span className="whitespace-nowrap">{link.label}</span>}
                                    </NavLink>
                                ))}
                            </nav>
                        );
                    })}
                </div>
            </aside>
        </>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool.isRequired,
    setCollapsed: PropTypes.func.isRequired,
};
