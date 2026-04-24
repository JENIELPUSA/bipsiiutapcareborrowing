import { createContext, useContext, useCallback, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem("token") || null);
    const [role, setRole] = useState(localStorage.getItem("role") || null);
    const [email, setEmail] = useState(localStorage.getItem("email") || null);
    const [first_name, setfirst_name] = useState(localStorage.getItem("first_name") || null);
    const [last_name, setlast_name] = useState(localStorage.getItem("last_name") || null);
    const [contact_number, setcontact_number] = useState(localStorage.getItem("contact_number") || null);
    const [userId, setUserID] = useState(localStorage.getItem("userId") || null);
    const [linkId, setlinkId] = useState(localStorage.getItem("linkId") || null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [Designatedzone, setDesignatedzone] = useState(localStorage.getItem("Designatedzone") || null);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [CustomError, setCustomError] = useState();
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (authToken) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    }, [authToken]);

    const login = async (inputEmail, password) => {
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/login`,
                { email: inputEmail, password },
                { withCredentials: true },
            );

            if (res.data.status === "Success") {
                const { token, role, email: serverEmail, first_name, last_name, contact_number, userId, linkId, Designatedzone, theme } = res.data;

                localStorage.setItem("token", token);
                localStorage.setItem("role", role);
                localStorage.setItem("email", serverEmail);
                localStorage.setItem("first_name", first_name);
                localStorage.setItem("last_name", last_name);
                localStorage.setItem("contact_number", contact_number);
                localStorage.setItem("userId", userId);
                localStorage.setItem("linkId", linkId);
                localStorage.setItem("Designatedzone", Designatedzone);
                localStorage.setItem("authToken", token);
                localStorage.setItem("theme", theme);
                setAuthToken(token);
                setRole(role);
                setEmail(serverEmail);
                setfirst_name(first_name);
                setlast_name(last_name);
                setcontact_number(contact_number);
                setUserID(userId);
                setlinkId(linkId);
                setDesignatedzone(Designatedzone);
                setTheme(theme);

                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

                return { success: true, role, userId };
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Login failed",
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("first_name");
        localStorage.removeItem("last_name");
        localStorage.removeItem("contact_number");
        localStorage.removeItem("userId");
        localStorage.removeItem("linkId");
        localStorage.removeItem("Designatedzone");
        localStorage.removeItem("authToken");

        setAuthToken(null);
        setRole(null);
        setEmail(null);
        setfirst_name(null);
        setlast_name(null);
        setcontact_number(null);
        setUserID(null);
        setlinkId(null);
        setDesignatedzone(null);

        delete axios.defaults.headers.common["Authorization"];

        window.location.href = "/login";
    };

    const fetchAllUsers = useCallback(
        async (page = 1, limit = 10, search = "") => {
            if (!authToken) return;

            try {
                setIsLoading(true);

                const params = { page, limit };
                if (search?.trim()) params.search = search.trim();

                console.log("Fetching users with params:", params);

                const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/getAllUsers`, {
                    params,
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Cache-Control": "no-cache",
                    },
                });

                const { data, totalUser, totalPages: resTotalPages, currentPage: resCurrentPage } = res.data;

                setUsers(data || []);
                setTotalUsers(totalUser || 0);
                setTotalPages(resTotalPages || 1);
                setCurrentPage(resCurrentPage || 1);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [authToken],
    );

    // ✅ AUTO-FETCH USERS kapag nagbago ang authToken, currentPage, limit, o search
    useEffect(() => {
        if (authToken) {
            fetchAllUsers(currentPage, limit, search);
        }
    }, [authToken, currentPage, limit, search, fetchAllUsers]); // kasama ang fetchAllUsers para safe

    const fetchUserById = useCallback(async () => {
        if (!authToken) return;

        try {
            setIsLoading(true);

            const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/getUserById`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                withCredentials: true,
            });

            if (res.data?.status) {
                setSelectedUser(res.data.data);
                return res.data.data;
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [authToken]);

    const UpdateUser = async (id, values) => {
        try {
            console.log("Values received in UpdateUser:", values);

            const payload = values instanceof FormData ? values : new FormData();

            if (!(values instanceof FormData)) {
                Object.keys(values).forEach((key) => {
                    if (key !== "avatar" && values[key] !== undefined && values[key] !== null) {
                        payload.append(key, values[key]);
                    }
                });
                if (values.avatar instanceof File) {
                    payload.append("avatar", values.avatar);
                }
            }

            const res = await axios.patch(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/updateUser/${id}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                },
            );

            if (res.status === 200 || res.data.status === "success") {
                if (typeof fetchBorrowers === "function") fetchBorrowers();
                return { success: true };
            }
        } catch (error) {
            console.error("Update Error Context:", error);
            const message = error.response?.data?.message || "Update error.";
            if (typeof setCustomError === "function") setCustomError(message);
            return { success: false, error: message };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                authToken,
                role,
                email,
                first_name,
                last_name,
                contact_number,
                userId,
                linkId,
                Designatedzone,
                login,
                logout,
                users,
                fetchAllUsers,
                isLoading,
                currentPage,
                setUsers,
                totalPages,
                totalUsers,
                setCurrentPage,
                selectedUser,
                fetchUserById,
                UpdateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);