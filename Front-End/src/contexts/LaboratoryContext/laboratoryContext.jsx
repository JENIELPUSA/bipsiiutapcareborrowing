import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const LaboratoryContext = createContext();
export const useLaboratory = () => useContext(LaboratoryContext);

export const LaboratoryProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(false);
    const [laboratories, setLaboratories] = useState([]);
    const [totalLaboratoryCount, setTotalLaboratoryCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [laboratoriesDropdown, setLaboratoriesDropdown] = useState([]);
    const [Categories, setCategories] = useState("");

    const backendURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

    // Helper for Common Headers
    const getHeaders = useCallback(
        () => ({
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
            withCredentials: true,
        }),
        [authToken],
    );

    // FETCH LABORATORIES (Table view with Pagination & Search)
    const fetchLaboratories = useCallback(async () => {
        if (!authToken) return;
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: rowsPerPage,
                search: searchQuery,
            };
            const res = await axios.get(`${backendURL}/api/v1/Laboratory`, {
                params,
                ...getHeaders(),
            });

            // Siniguro nating safe ang pag-access sa nested data
            setLaboratories(res.data?.data || []);
            setTotalLaboratoryCount(res.data?.pagination?.totalLaboratories || 0);
            setTotalPages(res.data?.pagination?.totalPages || 1);
        } catch (error) {
            console.error("Error fetching laboratories:", error);
        } finally {
            setIsLoading(false);
        }
    }, [authToken, currentPage, rowsPerPage, searchQuery, backendURL, getHeaders]);

    // FETCH DROPDOWN
    const fetchLaboratoriesDropdown = useCallback(async () => {
        if (!authToken) return;
        try {
            const res = await axios.get(`${backendURL}/api/v1/Laboratory/getAllLaboratorydropdown`, getHeaders());
            setLaboratoriesDropdown(res.data?.data || []);
        } catch (err) {
            console.error("Error fetching dropdown:", err);
        }
    }, [authToken, backendURL, getHeaders]);

    const fetchcategorydropdown = useCallback(
        async ({ laboratoryId }) => {
            console.log("inchargeId", laboratoryId);
            if (!authToken || !laboratoryId) return;

            try {
                const res = await axios.get(`${backendURL}/api/v1/Laboratory/getAllCategoryDropdown`, {
                    ...getHeaders(),
                    params: { laboratoryId },
                });

                setCategories(res.data?.data || []);
            } catch (err) {
                console.error("Error fetching category dropdown:", err);
            }
        },
        [authToken, backendURL, getHeaders],
    );

    // CREATE LABORATORY
    const createLaboratory = useCallback(
        async (labData) => {
            if (!authToken) return { success: false, error: "Unauthorized" };
            setIsLoading(true);
            try {
                const res = await axios.post(`${backendURL}/api/v1/Laboratory`, labData, getHeaders());
                if (res.data.success) {
                    await fetchLaboratories(); // Refresh list
                    await fetchLaboratoriesDropdown(); // Refresh dropdown
                    return { success: true, message: res.data.message };
                }
            } catch (error) {
                return { success: false, error: error.response?.data?.message || "Server Error" };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, backendURL, getHeaders, fetchLaboratories, fetchLaboratoriesDropdown],
    );

    // UPDATE LABORATORY
    const updateLaboratory = useCallback(
        async (id, updatedData) => {
            if (!authToken) return { success: false };
            try {
                const res = await axios.put(`${backendURL}/api/v1/Laboratory/${id}`, updatedData, getHeaders());
                if (res.data.success) {
                    await fetchLaboratories();
                    return { success: true };
                }
            } catch (error) {
                return { success: false, error: error.response?.data?.message };
            }
        },
        [authToken, backendURL, getHeaders, fetchLaboratories],
    );

    // DELETE LABORATORY
    const deleteLaboratory = useCallback(
        async (id) => {
            if (!authToken) return { success: false };
            try {
                const res = await axios.delete(`${backendURL}/api/v1/Laboratory/${id}`, getHeaders());
                if (res.data.success) {
                    await fetchLaboratories();
                    return { success: true };
                }
            } catch (error) {
                return { success: false, error: error.response?.data?.message };
            }
        },
        [authToken, backendURL, getHeaders, fetchLaboratories],
    );

    // AUTO FETCH
    useEffect(() => {
        fetchLaboratories();
    }, [fetchLaboratories]);

    const contextValue = useMemo(
        () => ({
            laboratories,
            isLoading,
            fetchLaboratories,
            createLaboratory,
            updateLaboratory,
            deleteLaboratory,
            setLaboratories,
            currentPage,
            setCurrentPage,
            totalPages,
            totalLaboratoryCount,
            searchQuery, // Idinagdag para ma-control ang input
            setSearchQuery,
            laboratoriesDropdown,
            fetchLaboratoriesDropdown,
            rowsPerPage,
            setRowsPerPage,
            fetchcategorydropdown,
            Categories,
        }),
        [
            laboratories,
            isLoading,
            fetchLaboratories,
            createLaboratory,
            updateLaboratory,
            deleteLaboratory,
            currentPage,
            totalPages,
            totalLaboratoryCount,
            searchQuery,
            laboratoriesDropdown,
            fetchLaboratoriesDropdown,
            rowsPerPage,
            fetchcategorydropdown,
            Categories,
        ],
    );

    return <LaboratoryContext.Provider value={contextValue}>{children}</LaboratoryContext.Provider>;
};
