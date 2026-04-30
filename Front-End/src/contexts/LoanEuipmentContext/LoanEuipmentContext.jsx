import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import SuccessFailed from "../../ReusableFolder/SuccessandField";
export const LoanEquipmentContext = createContext();

export const LoanEquipmentProvider = ({ children }) => {
    const { authToken, linkId } = useContext(AuthContext);
    const backendURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
    const [showModal, setShowModal] = useState(false);
    const [modalStatus, setModalStatus] = useState("success");
    const [customError, setCustomError] = useState("");
    // --- States ---
    const [equipmentList, setEquipmentList] = useState([]); // Pangunahing listahan para sa Dashboard
    const [latestEquipment, setLatestEquipment] = useState([]);
    const [rfidLoans, setRfidLoans] = useState([]);
    const [RfidLoansAll, setRfidLoansAll] = useState([]);

    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(5);



    const [pagination, setPagination] = useState({
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 0,
    });

    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [stats, setStats] = useState({ totalRecords: 0, returnedItems: 0, issuesFound: 0 });

    // Close modal handler
    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setCustomError("");
    }, []);
    // --- Helpers ---
    const authHeaders = useMemo(
        () => ({
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            withCredentials: true,
        }),
        [authToken],
    );

    // --- Actions ---

    // 1. FETCH: Specific Equipment Data (Dashboard with Pagination & Stats)
    const fetchEquipmentData = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const { data } = await axios.get(`${backendURL}/api/v1/EnchargeBorrowRoute/getSpecificData`, {
                params: { page: currentPage, limit: 5, status: statusFilter },
                ...authHeaders,
            });

            if (data.success) {
                setEquipmentList(data.data || []);
                setTotalPages(data.totalPages || 1);
                setTotalEntries(data.totalEntries || 0);
                setStats(data.stats || { totalRecords: 0, returnedItems: 0, issuesFound: 0 });
            }
        } catch (err) {
            console.error("Fetch Equipment Error:", err);
            setCustomError(err.response?.data?.message || "Failed to fetch equipment data");
        } finally {
            setLoading(false);
        }
    }, [authToken, currentPage, statusFilter, backendURL, authHeaders]);

    // 2. FETCH: Latest Equipment
    const fetchLatestEquipment = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const res = await axios.get(`${backendURL}/api/v1/EnchargeBorrowRoute/getLatestEquipment`, {
                params: {
                    page: currentPage,
                    limit: limit,
                    search: searchQuery || undefined,
                    linkId
                },
                ...authHeaders,
            });
            if (res.data.success) {
                setLatestEquipment(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error("Error fetching latest equipment:", err);
        } finally {
            setLoading(false);
        }
    }, [authToken, backendURL, authHeaders, currentPage, limit, searchQuery]);
    const fetchRFIDLoans = useCallback(
        async (rfidId, fetchAll = false) => {
            if (!authToken || !rfidId) return { success: false, error: "Missing auth token or RFID ID" };

            setLoading(true);
            setCustomError(null);

            try {
                const query = fetchAll ? "?all=true" : `?page=${currentPage}&limit=5${statusFilter ? `&status=${statusFilter}` : ""}`;

                const url = `${backendURL}/api/v1/EnchargeBorrowRoute/rfidData/${rfidId}${query}`;
                const res = await axios.get(url, authHeaders);

                console.log("RFID API RESPONSE:", res.data);

                if (res.data?.success == true) {
                    console.log("Fetched RFID Loans:", res.data.data);
                    if (fetchAll) {
                        setRfidLoansAll(res.data.allData || []);
                    } else {
                        setRfidLoans(res.data.data || []);
                        setTotalEntries(res.data.totalEntries || 0);
                        setTotalPages(res.data.totalPages || 1);
                    }
                    return { success: true, data: res.data.data };
                } else {
                    setModalStatus("failed");
                    setShowModal(true);
                    return { success: false, error: "Unexpected response from server." };
                }
            } catch (err) {
                console.error("🔥 RFID Fetch Error FULL:", err);

                const errorMessage = err.response?.data?.message || err.response?.data?.error?.message || err.message || "RFID data error";

                console.error("Message:", errorMessage);
                console.error("Status:", err.response?.status);
                console.error("Data:", err.response?.data);

                setCustomError(errorMessage);
                return { success: false, error: errorMessage }; // ✅ Added return
            } finally {
                setLoading(false);
            }
        },
        [
            authToken,
            backendURL,
            authHeaders,
            currentPage,
            statusFilter,
            setLoading,
            setCustomError,
            setRfidLoans,
            setRfidLoansAll,
            setTotalEntries,
            setTotalPages,
            setModalStatus,
            setShowModal,
        ], // ✅ Added missing dependencies
    );
    // 4. CRUD Actions
    const createLoan = async (loanData) => {
        if (!authToken) return { success: false, error: "No token" };
        setLoading(true);
        try {
            const res = await axios.post(`${backendURL}/api/v1/EnchargeBorrowRoute`, loanData, authHeaders);
            await fetchEquipmentData();
            await fetchLatestEquipment();
            return { success: true, data: res.data };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateLoan = async (id, updatedData, isReturn = false) => {
        if (!authToken) return;
        const endpoint = isReturn ? `${backendURL}/api/v1/EnchargeBorrowRoute/ReturnLoan/${id}` : `${backendURL}/api/v1/EnchargeBorrowRoute/${id}`;

        try {
            const response = await axios.patch(endpoint, updatedData, authHeaders);

            // Check HTTP status code
            if (response.status === 200 || response.status === 201) {
                // Check response success flag
                if (response.data?.success === true) {
                    await fetchEquipmentData();
                    await fetchLatestEquipment();

                    console.log("Loan updated successfully:", response.data);
                    return { success: true, data: response.data.data };
                } else {
                    return { success: false, error: response.data?.message || "Unexpected response from server." };
                }
            } else {
                return { success: false, error: `HTTP ${response.status}: Request failed` };
            }
        } catch (err) {
            // Handle network errors and server errors
            const errorMessage = err.response?.data?.message || err.message;
            setCustomError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const deleteLoan = async (id) => {
        if (!authToken) return;
        try {
            await axios.delete(`${backendURL}/api/v1/EnchargeBorrowRoute/${id}`, authHeaders);
            await fetchEquipmentData();
            await fetchLatestEquipment();
        } catch (err) {
            setCustomError(err.message);
            throw err;
        }
    };

    // Download report function (inayos para gumamit ng auth token at iwas alert)
    const downloadEnchargeBorrowReport = useCallback(
        async (filters = {}) => {
            if (!authToken) {
                setCustomError("Authentication required to download report");
                return false;
            }
            try {
                const params = new URLSearchParams();
                if (filters.status && filters.status !== "All") {
                    params.append("status", filters.status);
                }
                if (filters.dateFrom) {
                    params.append("dateFrom", filters.dateFrom);
                }
                if (filters.dateTo) {
                    params.append("dateTo", filters.dateTo);
                }

                const queryString = params.toString();
                const url = `${backendURL}/api/v1/EnchargeBorrowRoute/generateReport${queryString ? `?${queryString}` : ""}`;

                // Gamitin ang auth headers para sa authorization
                const response = await axios({
                    url: url,
                    method: "GET",
                    responseType: "blob",
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                    withCredentials: true,
                });

                const blob = new Blob([response.data], { type: "application/pdf" });
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                const filename = `Encharge_Borrow_Report_${Date.now()}.pdf`;
                link.setAttribute("download", filename);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
                return true;
            } catch (err) {
                console.error("PDF Download Error:", err);
                let message = "Hindi ma-download ang report. Pakisubukan muli.";
                if (err.response && err.response.status === 404) {
                    message = "Walang nakitang loan records para sa napiling filter.";
                } else if (err.response && err.response.status === 400) {
                    message = "Invalid na date format. Pakisigurado ang petsa.";
                }
                setCustomError(message);
                return false;
            }
        },
        [authToken, backendURL],
    );

    // --- Effects ---
    useEffect(() => {
        fetchEquipmentData();
        fetchLatestEquipment();
    }, [fetchEquipmentData, fetchLatestEquipment]);

    return (
        <LoanEquipmentContext.Provider
            value={{
                equipmentList,
                latestEquipment,
                rfidLoans,
                RfidLoansAll,
                customError,
                totalEntries,
                totalPages,
                currentPage,
                setCurrentPage,
                statusFilter,
                setStatusFilter,
                searchQuery,
                setRfidLoans,
                setSearchQuery,
                stats,
                fetchEquipmentData,
                fetchRFIDLoans,
                fetchLatestEquipment,
                createLoan,
                updateLoan,
                returnLoan: (id, data) => updateLoan(id, data, true),
                deleteLoan,
                downloadEnchargeBorrowReport,
                loading,
                pagination,

                limit,
                setLimit,
                updateLoan,
            }}
        >
            {children}
            <SuccessFailed
                isOpen={showModal}
                onClose={handleCloseModal}
                status={modalStatus}
                errorMessage={customError}
            />
        </LoanEquipmentContext.Provider>
    );
};
