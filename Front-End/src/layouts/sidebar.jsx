import { forwardRef, useContext, useMemo } from "react"; // Added useMemo
import { NavLink } from "react-router-dom";
import { navbarLinks } from "@/constants";
import { cn } from "@/utils/cn";
import PropTypes from "prop-types";
import { Shield } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

export const Sidebar = forwardRef(({ collapsed }, ref) => {
    const { role } = useContext(AuthContext);

    // Define role permissions
    const rolePermissions = useMemo(
        () => ({
            admin: [
                "/dashboard",
                "/dashboard/useraccount",
                "/dashboard/Borrowing-list",
                "/dashboard/punch-station",
                "/dashboard/borrower-registry",
                "/dashboard/category", // Added leading slash for consistency
                "/dashboard/laboratory",
                "/dashboard/department-list",
            ],
            "in-charge": [ // Kept as string key for hyphenated roles
                "/dashboard",
                "/dashboard/Borrowing-list",
                "/dashboard/request-equipment",
                "/dashboard/inventory",
            ],
        }),
        []
    );

    // Helper to check if a link is allowed for the current role
    const allowedPaths = rolePermissions[role] || [];

    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-[100] flex h-full flex-col overflow-x-hidden border-r transition-all duration-300",
                "border-blue-700 bg-[#1e40af] dark:border-blue-900 dark:bg-[#111827]",
                collapsed ? "w-[70px] md:items-center" : "w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0",
            )}
        >
            {/* Logo Section */}
            <div className="flex items-center gap-x-3 p-4">
                <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#facc15] shadow-lg shadow-yellow-900/20">
                    <Shield size={24} className="text-[#1e40af]" />
                </div>
                {!collapsed && (
                    <p className="text-lg font-black tracking-tight text-white transition-colors">
                        FOREST<span className="text-[#facc15]">GUARD</span>
                    </p>
                )}
            </div>

            {/* Navigation Links */}
            <div className="flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:_thin]">
                {navbarLinks.map((section) => {
                    // Filter the links within this section based on role
                    const filteredLinks = section.links.filter(link => 
                        allowedPaths.includes(link.path)
                    );

                    // Don't render the section at all if it has no allowed links
                    if (filteredLinks.length === 0) return null;

                    return (
                        <nav
                            key={section.title}
                            className={cn("flex flex-col gap-y-1", collapsed && "md:items-center")}
                        >
                            {!collapsed && (
                                <p className="px-3 text-[10px] font-black uppercase tracking-widest text-blue-200/60">
                                    {section.title}
                                </p>
                            )}

                            {filteredLinks.map((link) => (
                                <NavLink
                                    key={link.label}
                                    to={link.path}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                                            "text-blue-50 hover:bg-white/10 hover:text-white",
                                            isActive && "bg-[#facc15] text-[#1e40af] shadow-lg shadow-blue-900/40",
                                            collapsed && "md:w-[45px] md:justify-center",
                                        )
                                    }
                                >
                                    <link.icon size={22} className="flex-shrink-0" />
                                    {!collapsed && <span className="whitespace-nowrap">{link.label}</span>}
                                </NavLink>
                            ))}
                        </nav>
                    );
                })}
            </div>
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
};