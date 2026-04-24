import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const CategoryContext = createContext();
export const useCategory = () => useContext(CategoryContext);

export const CategoryProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [categoriesDropdown, setCategoriesDropdown] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalCategoryCount, setTotalCategoryCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [Equipments, setEquipments] = useState("");

    const backendURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

    const fetchCategories = useCallback(async () => {
        if (!authToken) return;
        setIsLoading(true); // I-set ang loading sa true tuwing tatawag

        try {
            const params = {
                page: currentPage,
                limit: rowsPerPage,
                search: searchQuery,
            };

            const res = await axios.get(`${backendURL}/api/v1/Category`, {
                params: params,
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Cache-Control": "no-cache",
                },
            });

            const categoryData = res.data.data;
            const pagination = res.data.pagination;

            setCategories(categoryData);
            setTotalCategoryCount(pagination.totalCategories);
            setTotalPages(pagination.totalPages);
            // Huwag i-set ang setCurrentPage dito galing sa API para hindi mag-loop
            // Maliban na lang kung ang API ang nagde-desisyon ng page logic
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setIsLoading(false);
        }
    }, [authToken, currentPage, rowsPerPage, searchQuery, backendURL]);
    const createCategory = useCallback(
        async (data) => {
            if (!authToken) return { success: false, error: "No authentication token" };

            setIsLoading(true);
            try {
                const res = await axios.post(`${backendURL}/api/v1/Category`, data, {
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

                setCustomError("Failed to Add Category.");
                return { success: false };
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Failed to create category";
                return { success: false, error: errorMsg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, backendURL],
    );

    const fetchcategorydropdown = useCallback(
        async (showAll = "true") => {
            if (!authToken) return;
            setIsLoading(true);

            try {
                // Ang kailangan lang natin dito ay ang "all" param
                const params = {
                    all: showAll,
                };

                const res = await axios.get(`${backendURL}/api/v1/Category/dropdown`, {
                    params: params,
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                });

                const categoryData = res.data.data;

                setCategoriesDropdown(categoryData);
            } catch (error) {
                console.error("Error fetching category dropdown:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, backendURL],
    );

    const updateCategory = useCallback(
        async (id, data) => {
            if (!authToken) return { success: false, error: "No authentication token" };

            setIsLoading(true);
            try {
                const res = await axios.patch(`${backendURL}/api/v1/Category/${id}`, data, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (res.data.success) {
                    setCategories((prev) => prev.map((cat) => (cat._id === id ? res.data.category : cat)));
                    return { success: true };
                }
                return { success: false, error: res.data.message };
            } catch (error) {
                const errorMsg = error.response?.data?.message || "Update failed";
                return { success: false, error: errorMsg };
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, backendURL],
    );

    const deleteCategory = useCallback(
        async (id) => {
            if (!authToken) return { success: false, error: "No authentication token" };

            setIsLoading(true);
            try {
                const res = await axios.delete(`${backendURL}/api/v1/Category/${id}`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (res.data.success) {
                    setCategories((prev) => prev.filter((cat) => cat._id !== id));
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

    const fetchEquipmentByCategory = useCallback(
        async (categoryId, showAll = false) => {
            if (!authToken || !categoryId) return;
            setIsLoading(true);

            try {
                const params = {};

                // Default: limit = rowsPerPage; showAll=true overrides
                if (!showAll) params.limit = rowsPerPage;
                if (!showAll) params.page = currentPage;
                params.showAll = showAll;

                const res = await axios.get(
                    `${backendURL}/api/v1/equipment/${categoryId}`,
                    {
                        params,
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );

                const data = res.data.data;
                setEquipments(data || []);
                setTotalCount(res.data.count || data.length);
                if (!showAll) {
                    setTotalPages(Math.ceil((res.data.total || data.length) / rowsPerPage));
                }
            } catch (error) {
                console.error("Error fetching equipments:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, backendURL, currentPage, rowsPerPage]
    );


    // --- CRITICAL FIX ---
    // Tuwing magbabago ang currentPage o searchQuery, dapat tumakbo ito.
    useEffect(() => {
        if (authToken) {
            fetchCategories();
        }
    }, [currentPage, searchQuery, authToken]); // Tanggalin ang Ref blocking logic dito

    const contextValue = useMemo(
        () => ({
            categories,
            isLoading,
            fetchCategories,
            createCategory,
            updateCategory,
            deleteCategory,
            setCategories,
            currentPage,
            setCurrentPage,
            totalPages,
            totalCategoryCount,
            setSearchQuery,
            fetchCategories,
            fetchcategorydropdown,
            categoriesDropdown, fetchEquipmentByCategory, Equipments, setEquipments
        }),
        [categories, isLoading, fetchCategories, createCategory, updateCategory, deleteCategory, setCategories, fetchEquipmentByCategory, Equipments],
    );

    return <CategoryContext.Provider value={contextValue}>{children}</CategoryContext.Provider>;
};
