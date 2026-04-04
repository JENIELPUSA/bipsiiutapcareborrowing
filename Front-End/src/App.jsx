import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@/contexts/theme-context";
import PublicRoute from "./components/PublicRoute/PublicRoute";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import ResetPassword from "./components/Login/ResetPassword";
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import InventoryTable from "./components/Inventory/InventoryTable";
import CategoryRegistry from "./components/Category/CategoryTable";
import UserManagement from "./components/UserManagement/UserManagement";
import BorrowingRegistry from "./components/Borrowing/BorrowingRegiistry";
import BorrowingPunchStation from "./components/Borrowing/BorrowingPunch";
import LabManagement from "./components/Laboratory/laboratorytable";
import BorrowerTable from "./components/UserManagement/Borrowertable";
import DepartmentTable from "./components/Department/Department";
import Download from "./components/DownloadModal/DownloadModal";
import RequestEquipmentTable from "./components/RequestEquipment/RequestEquipment";
import Login from "./components/Login/Login";
function App() {
    // State to control download modal
    const [showDownload, setShowDownload] = useState(false);

    // Check first run
    useEffect(() => {
        const downloaded = localStorage.getItem("agentDownloaded");
        if (!downloaded) {
            setShowDownload(true);
        }
    }, []);

    // React Router
    const router = createBrowserRouter([
        {
            path: "/",
            element: (
                <Navigate
                    to="/login"
                    replace
                />
            ),
        },
        {
            element: <PublicRoute />,
            children: [
                { path: "login", element: <Login /> },
                { path: "reset-password/:token", element: <ResetPassword /> },
            ],
        },
        {
            element: <PrivateRoute />,
            children: [
                {
                    path: "dashboard",
                    element: <Layout />,
                    children: [
                        { index: true, element: <DashboardPage /> },
                        { path: "category", element: <CategoryRegistry /> },
                        { path: "punch-station", element: <BorrowingPunchStation /> },
                        { path: "useraccount", element: <UserManagement /> },
                        { path: "inventory", element: <InventoryTable /> },
                        { path: "laboratory", element: <LabManagement /> },
                        { path: "borrower-registry", element: <BorrowerTable /> },
                        { path: "borrower-registry", element: <BorrowerTable /> },
                        { path: "department-list", element: <DepartmentTable /> },
                        { path: "request-equipment", element: <RequestEquipmentTable /> },
                        { path: "settings", element: <h1 className="title">Settings</h1> },
                    ],
                },
            ],
        },
        {
            path: "*",
            element: (
                <Navigate
                    to="/login"
                    replace
                />
            ),
        },
    ]);

    return (
        <ThemeProvider storageKey="theme">
            {/* Download modal */}
            {showDownload && (
                <Download
                    onClose={() => {
                        setShowDownload(false);
                        localStorage.setItem("agentDownloaded", "true"); // mark as downloaded
                    }}
                />
            )}
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;
