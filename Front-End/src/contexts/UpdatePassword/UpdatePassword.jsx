import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import SuccessFailed from "../../ReusableFolder/SuccessandField";
import axiosInstance from "../../ReusableFolder/axioxInstance";

export const UpdateDisplayContext = createContext();

export const UpdateDisplayProvider = ({ children }) => {
    const { authToken } = useContext(AuthContext);
    const [customError, setCustomError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalStatus, setModalStatus] = useState("success");

    // Timer para kusa mawala ang customError text matapos ang 5 segundo
    useEffect(() => {
        if (customError) {
            const timer = setTimeout(() => {
                setCustomError("");
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [customError]);

    const UpdatePasswordData = async (payload) => {
        // I-reset muna ang error state bago mag-request
        setCustomError("");

        try {
            const response = await axiosInstance.patch(
                `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/updatePassword`,
                {
                    currentPassword: payload.currentPassword,
                    password: payload.newPassword,
                    confirmPassword: payload.confirmNewPassword,
                },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            if (response.data && response.data.status === "success") {
                setModalStatus("success");
                setShowModal(true);
            } else {
                // Para sa mga kasong hindi nag-throw ng error ang axios pero hindi rin 'success'
                setModalStatus("failed");
                setShowModal(true);
            }
        } catch (error) {
            setModalStatus("failed");
            setShowModal(true);

            // Pag-extract ng error message mula sa server response
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                const message = typeof errorData === "string" 
                    ? errorData 
                    : errorData.message || errorData.error || "Something went wrong.";
                setCustomError(message);
            } else if (error.request) {
                setCustomError("No response from the server.");
            } else {
                setCustomError(error.message || "Unexpected error occurred.");
            }
        }
    };

    return (
        <UpdateDisplayContext.Provider
            value={{
                customError,
                setCustomError,
                UpdatePasswordData,
            }}
        >
            {children}
            {/* Ito na ang nagsisilbing fallback mo sa toastify */}
            <SuccessFailed
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                status={modalStatus}
            />
        </UpdateDisplayContext.Provider>
    );
};