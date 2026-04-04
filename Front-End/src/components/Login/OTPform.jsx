import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import SuccessFailed from "../../ReusableFolder/SuccessandField";

function OTPform({ isOpen, onClose, userId, setUserId }) {
    // 1. Change the array length from 6 to 4
    const [otpDigits, setOtpDigits] = useState(Array(4).fill("")); // CHANGED TO 4
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendError, setResendError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalStatus, setModalStatus] = useState("success");

    const inputRefs = useRef([]);

    useEffect(() => {
        if (!isOpen) {
            setOtpDigits(Array(4).fill(""));
            setLoading(false);
            setError("");
            setSuccessMessage("");
            setResendCooldown(0);
            setResendError("");
        } else {
            const storedUserId = localStorage.getItem("userIdForVerification");
            if (storedUserId) {
                setUserId(storedUserId);
            } else {
                setError("User ID not found. Please sign up or login again.");
            }
        }
    }, [isOpen]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleInputChange = (e, index) => {
        const { value } = e.target;

        if (value.match(/^\d?$/)) {
            const newOtpDigits = [...otpDigits];
            newOtpDigits[index] = value;
            setOtpDigits(newOtpDigits);

            // 2. Adjust auto-focus logic for 4 digits (index < 3)
            if (value && index < 3 && inputRefs.current[index + 1]) {
                // CHANGED FROM index < 5 TO index < 3
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        const pasteData = e.clipboardData.getData("text");
        // 3. Adjust paste data length check (if expecting 4 digits)
        if (pasteData.length === 4 && /^\d+$/.test(pasteData)) {
            // CHANGED FROM 6 TO 4
            const newOtpDigits = pasteData.split("");
            setOtpDigits(newOtpDigits);
            inputRefs.current[3].focus(); // Focus on the last input (index 3 for 4 digits)
        }
        e.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        const fullOtp = otpDigits.join("");

        if (fullOtp.length !== 4) {
            return setError("Please enter a complete 4-digit OTP.");
        }
        if (!userId) {
            return setError("User ID is missing. Cannot verify.");
        }

        setLoading(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/mail-verification`, {
                otp: fullOtp,
                userId: userId,
            });

            setModalStatus("success");
            setShowModal(true);
            setLoading(false);
            localStorage.removeItem("userIdForVerification");
            onClose();
            navigate("/dashboard");
        } catch (err) {
            setLoading(false);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Verification failed. Please try again or check your network.");
            }
            console.error("OTP Verification Error:", err);
        }
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white px-6 pb-9 pt-10 shadow-xl"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:hover:bg-gray-600"
                        >
                            <svg
                                className="h-6 w-6 text-gray-600 dark:text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        <div className="mx-auto flex w-full max-w-md flex-col space-y-16">
                            <div className="flex flex-col items-center justify-center space-y-2 text-center">
                                <div className="text-3xl font-semibold">
                                    <p>Email Verification</p>
                                </div>
                                <div className="flex flex-row text-sm font-medium text-gray-400">
                                    <p>
                                        We have sent a code to your email <span className="font-bold">ba**@dipainhouse.com</span>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <form onSubmit={handleSubmit}>
                                    <div className="flex flex-col space-y-16">
                                        <div className="mx-auto flex w-full max-w-xs flex-row items-center justify-between">
                                            {/* This part automatically renders 4 input boxes because otpDigits has 4 elements */}
                                            {otpDigits.map((digit, index) => (
                                                <div
                                                    className="h-16 w-16"
                                                    key={index}
                                                >
                                                    <input
                                                        className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-center text-lg outline-none ring-blue-700 focus:bg-gray-50 focus:ring-1"
                                                        type="text"
                                                        maxLength="1"
                                                        value={digit}
                                                        onChange={(e) => handleInputChange(e, index)}
                                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                                        onPaste={index === 0 ? handlePaste : undefined}
                                                        ref={(el) => (inputRefs.current[index] = el)}
                                                        id={`otp-input-${index}`}
                                                        name={`otp-input-${index}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
                                        {successMessage && <p className="mt-4 text-center text-sm text-green-500">{successMessage}</p>}

                                        <div className="flex flex-col space-y-5">
                                            <div>
                                                <button
                                                    type="submit"
                                                    className="flex w-full flex-row items-center justify-center rounded-xl border border-none bg-blue-700 py-5 text-center text-sm text-white shadow-sm outline-none"
                                                    disabled={loading}
                                                >
                                                    {loading ? "Verifying..." : "Verify Account"}
                                                </button>
                                            </div>
                                            {resendError && <p className="mt-2 text-center text-sm text-red-500">{resendError}</p>}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            <SuccessFailed
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                status={modalStatus}
            />
        </AnimatePresence>
    );
}

export default OTPform;
