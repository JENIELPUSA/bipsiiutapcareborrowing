import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import SuccessFailed from "../../ReusableFolder/SuccessandField";
import axiosInstance from "../../ReusableFolder/axioxInstance";

export const AdminDisplayContext = createContext();

export const AdminDisplayProvider = ({ children }) => {
    const [customError, setCustomError] = useState("");
    const { authToken, linkId } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalStatus, setModalStatus] = useState("success");
    const [admins, setAdmins] = useState([]);
    const [adminProfile, setAdminProfile] = useState([]);
    const [totalAdminCount, setTotalAdminCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10); // Added missing state
    // Fetch admin data with useCallback
    const FetchAdminData = useCallback(async () => {
        if (!authToken) return;

        try {
            const params = {
                page: currentPage,
                limit: rowsPerPage,
                search: searchQuery,
            };

            const res = await axiosInstance.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/Admin`, {
                params: params,
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Cache-Control": "no-cache",
                },
            });

            const adminData = res.data.data;
            const pagination = res.data.pagination;

            setAdmins(adminData);
            setTotalAdminCount(pagination.totalAdmin);
            setTotalPages(pagination.totalPages);
            setCurrentPage(pagination.currentPage);
            setRowsPerPage(pagination.limit);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [authToken, currentPage, rowsPerPage, searchQuery]);

    // Fetch profile data with useCallback
    const FetchProfileData = useCallback(async () => {
        if (!authToken || !linkId) {
            console.warn("Missing token or linkId");
            return;
        }
        try {
            const response = await axiosInstance.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/Admin/profile/${linkId}`, {
                // Added /profile/${linkId}
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Cache-Control": "no-cache",
                },
            });

            if (response.data?.status === "success") {
                setAdminProfile(response.data.data);
            } else {
                console.warn("Unexpected response:", response.data);
            }
        } catch (error) {
            if (error.response) {
                console.error("Server Error:", error.response.status, error.response.data);
            } else if (error.request) {
                console.error("No response received:", error.request);
            } else {
                console.error("Error setting up request:", error.message);
            }
        }
    }, [authToken, linkId]);

    // Delete admin with useCallback
    const DeleteAdmin = useCallback(
        async (officerID) => {
            try {
                const response = await axios.delete(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/Admin/${officerID}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (response.data.status === "success") {
                    setAdmins((prevUsers) => prevUsers.filter((user) => user._id !== officerID));
                    setModalStatus("success");
                    setShowModal(true);
                } else {
                    setModalStatus("failed");
                    setShowModal(true);
                    return { success: false, error: "Unexpected response from server." };
                }
            } catch (error) {
                console.error("Error deleting user:", error);
                setCustomError(error.response?.data?.message || "Failed to delete user.");
                setModalStatus("failed");
                setShowModal(true);
            }
        },
        [authToken],
    );

    // Update admin with useCallback
    const UpdateAdmin = useCallback(
        async (dataID, values) => {
            try {
                const formData = new FormData();
                formData.append("first_name", values.first_name || "");
                formData.append("last_name", values.last_name || "");
                formData.append("middle_name", values.middle_name || "");
                formData.append("email", values.email || "");
                formData.append("role", values.role || "");
                formData.append("laboratoryId", values.laboratoryId || "");
                if (values.avatar) formData.append("avatar", values.avatar);

                const response = await axios.patch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/Admin/${dataID}`, formData, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (response.data?.status === "success") {
                    FetchAdminData();
                    return { success: true, data: response.data.data };
                } else {
                    setModalStatus("failed");
                    setShowModal(true);
                    return { success: false, error: "Unexpected response from server." };
                }
            } catch (error) {
                const message = error.response?.data?.message || error.response?.data?.error || error.message || "Something went wrong.";

                setCustomError(message);
                setModalStatus("failed");
                setShowModal(true);

                return { success: false, error: message };
            }
        },
        [authToken, FetchAdminData],
    );

    // Add admin with useCallback
    const AddAdmin = useCallback(
        async (values) => {
            console.log("Adding admin with values:", values);
            try {
                const formData = new FormData();
                formData.append("first_name", values.first_name || "");
                formData.append("last_name", values.last_name || "");
                formData.append("email", values.email || "");
                formData.append("suffix", values.suffix || "");
                formData.append("gender", values.gender || "");
                formData.append("role", values.role || "");
                formData.append("password", values.password || "");
                formData.append("confirmPassword", values.confirmPassword || "");
                formData.append("laboratoryId", values.laboratoryId || "");

                if (values.middle_name) {
                    formData.append("middle_name", values.middle_name);
                }
                if (values.address) {
                    formData.append("address", values.address);
                }
                if (values.borrowerType) {
                    formData.append("borrowerType", values.borrowerType);
                }
                if (values.rfidId) {
                    formData.append("rfidId", values.rfidId);
                }
                if (values.contactNumber) {
                    formData.append("contactNumber", values.contactNumber);
                }

                if (values.avatar) formData.append("avatar", values.avatar);

                const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/signup`, formData, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                });

                const status = res.data?.status || res.data?.data?.status;

                if (status === true) {
                    return { success: true };
                }

                setCustomError("Failed to Add Admin.");
                return { success: false };
            } catch (error) {
                const message = error.response?.data?.message || error.response?.data?.error || "Something went wrong.";
                setCustomError(message);
                setModalStatus("failed");
                setShowModal(true);

                return { success: false, error: message };
            }
        },
        [authToken, FetchAdminData],
    );

    const UpdateUserStatus = async (userId) => {
        if (!authToken) return;

        setLoading(true);
        try {
            const res = await axios.patch(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/Admin/updateStatus/${userId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                },
            );
            setLoading(false);

            console.log("Update status response:", res.data);
            if (res.data.status) {
                return { success: true };
            }
        } catch (err) {
            setLoading(false);
            console.error("Update status error:", err.response?.data || err.message);
            throw err;
        }
    };

    // Handle search
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page when searching
    }, []);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // Fetch all data on initial mount and when authToken changes
    useEffect(() => {
        if (!authToken) return;

        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([FetchAdminData()]);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [authToken, FetchAdminData]);

    // Fetch data when pagination or search changes
    useEffect(() => {
        if (authToken) {
            FetchAdminData();
        }
    }, [currentPage, searchQuery, authToken, FetchAdminData]);

    // Close modal handler
    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setCustomError("");
    }, []);

    return (
        <AdminDisplayContext.Provider
            value={{
                admins,
                DeleteAdmin,
                UpdateAdmin,
                totalAdminCount,
                adminProfile,
                FetchAdminData,
                AddAdmin,
                loading,
                searchQuery,
                setSearchQuery: handleSearch,
                currentPage,
                totalPages,
                setCurrentPage: handlePageChange,
                rowsPerPage,
                setRowsPerPage,
                handleSearch,
                handlePageChange,
                UpdateUserStatus,
            }}
        >
            {children}
            <SuccessFailed
                isOpen={showModal}
                onClose={handleCloseModal}
                status={modalStatus}
                errorMessage={customError}
            />
        </AdminDisplayContext.Provider>
    );
};
