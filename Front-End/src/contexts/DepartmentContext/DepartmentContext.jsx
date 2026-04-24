import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const DepartmentContext = createContext();
export const useDepartment = () => useContext(DepartmentContext);

export const DepartmentProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [totalDepartmentCount, setTotalDepartmentCount] = useState(0);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const backendURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

    // FETCH DEPARTMENTS
    const fetchDepartments = useCallback(async () => {
        if (!authToken) return;

        setIsLoading(true);

        try {
            const params = {
                page: currentPage,
                limit: rowsPerPage,
                search: searchQuery,
            };

            const res = await axios.get(`${backendURL}/api/v1/Department`, {
                params,
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Cache-Control": "no-cache",
                },
            });

            const departmentData = res.data.data;
            const pagination = res.data.pagination;

            setDepartments(departmentData);
            setTotalDepartmentCount(pagination.totalDepartments);
            setTotalPages(pagination.totalPages);
        } catch (error) {
            console.error("Error fetching departments:", error);
        } finally {
            setIsLoading(false);
        }
    }, [authToken, currentPage, rowsPerPage, searchQuery, backendURL]);

    // CREATE DEPARTMENT
    const createDepartment = useCallback(
        async (data) => {
            if (!authToken) return { success: false, error: "No authentication token" };

            setIsLoading(true);

            try {
                const res = await axios.post(`${backendURL}/api/v1/Department`, data, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                });

                const status = res.data?.status || res.data?.data?.status;

                if (status === true) {
                    return { success: true };
                }

                return { success: false };
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Failed to create department";
                return { success: false, error: errorMsg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, backendURL],
    );

    // UPDATE DEPARTMENT
    const updateDepartment = useCallback(
        async (id, formData) => {
            if (!authToken) return { success: false, error: "No authentication token" };
            if (!id) return { success: false, error: "Department ID is undefined" };

            setIsLoading(true);
            try {
                const res = await axios.patch(
                    `${backendURL}/api/v1/Department/${id}`,
                    formData,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.data.success && res.data.data) {
                    const updatedDept = res.data.data;

                    setDepartments((prev) =>
                        prev.map((dept) =>
                            String(dept._id) === String(updatedDept._id) ? updatedDept : dept
                        )
                    );

                    return { success: true };
                }

                return { success: false, error: res.data.message || "Update failed" };
            } catch (err) {
                const errorMsg = err.response?.data?.message || "Update failed";
                console.error("Update Department Error:", errorMsg);
                return { success: false, error: errorMsg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, backendURL]
    );
    // DELETE DEPARTMENT
    const deleteDepartment = useCallback(
        async (id) => {
            if (!authToken) return { success: false, error: "No authentication token" };

            setIsLoading(true);

            try {
                const res = await axios.delete(`${backendURL}/api/v1/Department/${id}`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (res.data.success) {
                    setDepartments((prev) => prev.filter((dept) => dept._id !== id));
                    return { success: true };
                }

                return { success: false, error: res.data.message };
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Delete failed";
                return { success: false, error: errorMsg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, backendURL],
    );

    // AUTO FETCH
    useEffect(() => {
        if (authToken) {
            fetchDepartments();
        }
    }, [currentPage, searchQuery, authToken]);

    const contextValue = useMemo(
        () => ({
            departments,
            isLoading,
            fetchDepartments,
            createDepartment,
            updateDepartment,
            deleteDepartment,
            setDepartments,
            currentPage,
            setCurrentPage,
            totalPages,
            totalDepartmentCount,
            setSearchQuery,
        }),
        [departments, isLoading, fetchDepartments, createDepartment, updateDepartment, deleteDepartment],
    );

    return <DepartmentContext.Provider value={contextValue}>{children}</DepartmentContext.Provider>;
};
