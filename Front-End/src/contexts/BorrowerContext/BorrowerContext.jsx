import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import axiosInstance from "../../ReusableFolder/axioxInstance"; // Assuming you have a pre-configured axios instance for auth

export const BorrowerContext = createContext();

export const BorrowerProvider = ({ children }) => {
    const [borrowers, setBorrowers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [specificBorrower, setSpecificBorrower] = useState(null);
    // PAGINATION & SEARCH STATES
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [limit] = useState(5); // Default limit per page

    // Kunin ang authToken mula sa AuthContext
    const { authToken } = useContext(AuthContext);

    // UI/Error States
    const [customError, setCustomError] = useState("");
    const [modalStatus, setModalStatus] = useState(null); // 'success', 'failed', or null
    const [showModal, setShowModal] = useState(false);

    const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/BorrowerRoute`;

    // Memoize auth headers para hindi mag-trigger ng unnecessary re-renders
    const authHeaders = useMemo(
        () => ({
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Cache-Control": "no-cache",
            },
        }),
        [authToken],
    );

    const fetchBorrowers = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        setCustomError(null);

        try {
            const res = await axiosInstance.get(API_URL, {
                params: {
                    page: currentPage,
                    limit: limit,
                    search: searchQuery,
                },
                ...authHeaders,
            });

            // I-adjust depende sa exact structure ng backend response mo
            const { data, pagination } = res.data;

            setBorrowers(data || []);
            setTotalPages(pagination?.totalPages || 1);
        } catch (error) {
            console.error("Error fetching borrowers:", error);
            setCustomError(error.response?.data?.message || "Failed to fetch borrowers.");
        } finally {
            setLoading(false);
        }
    }, [authToken, currentPage, limit, searchQuery, API_URL, authHeaders]);

    // Re-fetch kapag nagbago ang page o search
    useEffect(() => {
        fetchBorrowers();
    }, [fetchBorrowers]);

    // --- CRUD OPERATIONS ---

    const AddBorrower = async (values) => {
        try {
            const formData = new FormData();
            Object.keys(values).forEach((key) => {
                if (key !== "avatar" && values[key] !== undefined) {
                    formData.append(key, values[key]);
                }
            });

            if (values.avatar instanceof File) {
                formData.append("avatar", values.avatar);
            }

            const res = await axios.post(API_URL, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (res.status === 201 || res.data.status === "success") {
                fetchBorrowers(); // Refresh list para tama ang pagination
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || "Something went wrong.";
            setCustomError(message);
            setModalStatus("failed");
            setShowModal(true);
            return { success: false, error: message };
        }
    };

    // --- GET SPECIFIC BORROWER BY RFID ---
    const getSpecificBorrower = useCallback(
        async (rfidId) => {
            if (!authToken) {
                setCustomError("Authentication token not found");
                return { success: false, error: "Authentication required" };
            }

            if (!rfidId) {
                setCustomError("RFID ID is required");
                return { success: false, error: "RFID ID is required" };
            }

            setLoading(true);
            setCustomError(null);

            try {
                // Option 1: Using query parameter
                const res = await axiosInstance.get(`${API_URL}/getSpecificBorrower/${rfidId}`, {
                    ...authHeaders,
                });

                // Option 2: Using URL parameter (kung ganito ang route mo)
                // const res = await axiosInstance.get(`${API_URL}/rfid/${rfidId}`, authHeaders);

                // Option 3: Using POST with body (kung ganito ang route mo)
                // const res = await axiosInstance.post(`${API_URL}/get-by-rfid`,
                //     { rfidId: rfidId },
                //     authHeaders
                // );

                if (res.data.success && res.data.data) {
                    setSpecificBorrower(res.data.data);
                    return {
                        success: true,
                        data: res.data.data,
                        message: res.data.message,
                    };
                } else {
                    setSpecificBorrower(null);
                    return {
                        success: false,
                        error: res.data.message || "Borrower not found",
                    };
                }
            } catch (error) {
                console.error("Error fetching specific borrower:", error);
                const errorMessage = error.response?.data?.message || "Failed to fetch borrower details";
                setCustomError(errorMessage);
                setSpecificBorrower(null);
                setModalStatus("failed");
                setShowModal(true);
                return {
                    success: false,
                    error: errorMessage,
                    status: error.response?.status,
                };
            } finally {
                setLoading(false);
            }
        },
        [authToken, API_URL, authHeaders],
    );

    const UpdateBorrower = async (id, values) => {
        try {
            console.log("values", values);
            const formData = new FormData();
            Object.keys(values).forEach((key) => {
                if (key !== "avatar" && values[key] !== undefined) {
                    formData.append(key, values[key]);
                }
            });

            if (values.avatar instanceof File) {
                formData.append("avatar", values.avatar);
            }

            const res = await axios.patch(`${API_URL}/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (res.status === 200 || res.data.status === "success") {
                fetchBorrowers();
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || "Update error.";
            setCustomError(message);
            setModalStatus("failed");
            setShowModal(true);
            return { success: false, error: message };
        }
    };

    const DeleteBorrower = async (id) => {
        try {
            const res = await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (res.status === 204 || res.data.status === "success") {
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || "Delete failed.";
            setCustomError(message);
            setShowModal(true);
            return { success: false, error: message };
        }
    };

    return (
        <BorrowerContext.Provider
            value={{
                borrowers,
                loading,
                currentPage,
                setCurrentPage,
                totalPages,
                searchQuery,
                setSearchQuery,
                AddBorrower,
                UpdateBorrower,
                DeleteBorrower,
                customError,
                modalStatus,
                showModal,
                setShowModal,
                setCustomError,
                setModalStatus,
                fetchBorrowers,
                setBorrowers,
                getSpecificBorrower,specificBorrower
            }}
        >
            {children}
        </BorrowerContext.Provider>
    );
};
