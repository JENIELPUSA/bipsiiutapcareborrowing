import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../AuthContext";

export const EquipmentContext = createContext();
export const useEquipment = () => useContext(EquipmentContext);

export const EquipmentProvider = ({ children }) => {
  const { authToken } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);

  const [equipments, setEquipments] = useState([]);
  const [totalEquipmentCount, setTotalEquipmentCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const backendURL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

  // FETCH EQUIPMENTS
  const fetchEquipments = useCallback(async () => {
    if (!authToken) return;

    setIsLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        search: searchQuery,
      };

      const res = await axios.get(`${backendURL}/api/v1/Equipment`, {
        params,
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Cache-Control": "no-cache",
        },
      });

      const equipmentData = res.data.data;
      const pagination = res.data.pagination;

      setEquipments(equipmentData);
      setTotalEquipmentCount(pagination.totalEquipments);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error("Error fetching equipments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, currentPage, rowsPerPage, searchQuery, backendURL]);

  // CREATE EQUIPMENT
  const createEquipment = useCallback(
    async (data) => {
      if (!authToken) return { success: false, error: "No authentication token" };

      setIsLoading(true);

      try {
        const res = await axios.post(`${backendURL}/api/v1/Equipment`, data, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (res.data.success) {
          return { success: true };
        }

        return { success: false, error: res.data.message };
      } catch (error) {
        const errorMsg = error.response?.data?.message || "Failed to create equipment";
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [authToken, backendURL],
  );

  // UPDATE EQUIPMENT
  const updateEquipment = useCallback(
    async (id, data) => {
      if (!authToken) return { success: false, error: "No authentication token" };

      setIsLoading(true);

      try {
        const res = await axios.put(`${backendURL}/api/v1/Equipment/${id}`, data, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (res.data.success) {
          setEquipments((prev) =>
            prev.map((eq) => (eq._id === id ? res.data.data : eq)),
          );
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

  // DELETE EQUIPMENT
  const deleteEquipment = useCallback(
    async (id) => {
      if (!authToken) return { success: false, error: "No authentication token" };

      setIsLoading(true);

      try {
        const res = await axios.delete(`${backendURL}/api/v1/Equipment/${id}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.data.success) {
          setEquipments((prev) => prev.filter((eq) => eq._id !== id));
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
    if (authToken) fetchEquipments();
  }, [currentPage, searchQuery, authToken]);

  const contextValue = useMemo(
    () => ({
      equipments,
      isLoading,
      fetchEquipments,
      createEquipment,
      updateEquipment,
      deleteEquipment,
      setEquipments,
      currentPage,
      setCurrentPage,
      totalPages,
      totalEquipmentCount,
      setSearchQuery,
    }),
    [equipments, isLoading, fetchEquipments, createEquipment, updateEquipment, deleteEquipment],
  );

  return <EquipmentContext.Provider value={contextValue}>{children}</EquipmentContext.Provider>;
};