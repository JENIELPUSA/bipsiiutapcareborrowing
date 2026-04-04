import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const LoanEquipmentContext = createContext();

export const LoanEquipmentProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);
    const backendURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

    // --- States ---
    const [loans, setLoans] = useState([]);
    const [rfidLoans, setRfidLoans] = useState([]);
    const [RfidLoansAll, setRfidLoansAll] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Pagination & Filter States
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Helpers ---
    const authHeaders = useMemo(() => ({
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
        withCredentials: true,
    }), [authToken]);

    // --- Actions ---

    // FETCH: General Loans
    const fetchLoans = useCallback(async () => {
        if (!authToken) return;
        setLoading(true);
        setError(null);

        try {
            const res = await axios.get(`${backendURL}/api/v1/EnchargeBorrowRoute`, {
                params: {
                    page: currentPage,
                    limit: rowsPerPage,
                    search: searchQuery,
                },
                ...authHeaders,
                headers: { ...authHeaders.headers, "Cache-Control": "no-cache" }
            });

            const { data, pagination } = res.data;
            setLoans(data || []);
            setTotalEntries(pagination?.total || 0);
            setTotalPages(pagination?.totalPages || 1);
        } catch (err) {
            console.error("Error fetching loans:", err);
            setError(err.response?.data?.message || "Failed to fetch loans");
        } finally {
            setLoading(false);
        }
    }, [authToken, currentPage, rowsPerPage, searchQuery, backendURL, authHeaders]);

    // FETCH: RFID Specific Loans
    const fetchRFIDLoans = useCallback(async (rfidId, fetchAll = false) => {
        if (!authToken || !rfidId) return;
        setLoading(true);
        setError(null);

        try {
            const query = fetchAll
                ? "?all=true"
                : `?page=${currentPage}&limit=5${statusFilter ? `&status=${statusFilter}` : ""}`;

            const response = await axios.get(
                `${backendURL}/api/v1/EnchargeBorrowRoute/rfidData/${rfidId}${query}`, 
                authHeaders
            );

            if (response.data.success) {
                if (fetchAll) {
                    setRfidLoansAll(response.data.allData || []);
                } else {
                    setRfidLoans(response.data.data || []);
                    setTotalEntries(response.data.totalEntries || 0);
                    setTotalPages(response.data.totalPages || 1);
                }
            }
        } catch (err) {
            console.error("RFID Fetch Error:", err);
            setError(err.response?.data?.message || "RFID data error");
        } finally {
            setLoading(false);
        }
    }, [authToken, backendURL, authHeaders, currentPage, statusFilter]);

    // CREATE: New Loan
    const createLoan = async (loanData) => {
        if (!authToken) return { success: false, error: "No token" };
        setLoading(true);
        try {
            const res = await axios.post(`${backendURL}/api/v1/EnchargeBorrowRoute`, loanData, authHeaders);
            await fetchLoans(); // Refresh list
            return { success: true, data: res.data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // UPDATE: Status or Return
    const updateLoan = async (id, updatedData, isReturn = false) => {
        if (!authToken) return;
        const endpoint = isReturn 
            ? `${backendURL}/api/v1/EnchargeBorrowRoute/ReturnLoan/${id}`
            : `${backendURL}/api/v1/EnchargeBorrowRoute/${id}`;
        
        try {
            const response = await axios.patch(endpoint, updatedData, authHeaders);
            setLoans((prev) => prev.map((loan) => (loan._id === id ? response.data.data : loan)));
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // DELETE: Loan
    const deleteLoan = async (id) => {
        if (!authToken) return;
        try {
            await axios.delete(`${backendURL}/loan-equipment/${id}`, authHeaders);
            setLoans((prev) => prev.filter((loan) => loan._id !== id));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // --- Effects ---
    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    return (
        <LoanEquipmentContext.Provider
            value={{
                loans,
                rfidLoans,
                RfidLoansAll,
                loading,
                error,
                totalEntries,
                totalPages,
                currentPage,
                setCurrentPage,
                statusFilter,
                setStatusFilter,
                searchQuery,
                setSearchQuery,
                fetchLoans,
                fetchRFIDLoans,
                createLoan,
                updateLoan,
                returnLoan: (id, data) => updateLoan(id, data, true), // Pinagsama ko ang logic
                deleteLoan,
            }}
        >
            {children}
        </LoanEquipmentContext.Provider>
    );
};