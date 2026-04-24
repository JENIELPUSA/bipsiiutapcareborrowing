import React, { useContext } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Footer } from "@/layouts/footer";

import AdminDashboard from "../../components/Dashboard/AdminDashboard/AdminDashboard";
import BorrowerDashboard from "../../components/Dashboard/BorrowerDashboard";
import { AuthContext } from "../../contexts/AuthContext";

const DashboardPage = () => {
    const { theme } = useTheme();
    const { role } = useContext(AuthContext);

    return (
        <div className="flex flex-col gap-y-4">

            {role === "admin" && <AdminDashboard />}
             {role === "in-charge" && <AdminDashboard />}

            {role === "borrower" && <BorrowerDashboard />}

            <Footer />
        </div>
    );
};

export default DashboardPage;