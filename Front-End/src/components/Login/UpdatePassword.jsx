import React, { useContext, useState } from "react";
import { FaLock, FaTimes } from "react-icons/fa"; // Nagdagdag ng close icon
import { motion, AnimatePresence } from "framer-motion";
import { UpdateDisplayContext } from "../../contexts/UpdatePassword/UpdatePassword";

const UpdatePassword = ({ isOpen, onClose }) => {
    const { UpdatePasswordData, customError, setCustomError } = useContext(UpdateDisplayContext);

    const [values, setValues] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState("");

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
        if (localError) setLocalError("");
        if (customError) setCustomError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (values.newPassword !== values.confirmNewPassword) {
            setLocalError("New password and confirm password do not match.");
            return;
        }

        setLoading(true);

        try {
            if (typeof UpdatePasswordData === "function") {
                await UpdatePasswordData(values);
            }
            
            // I-clear ang form at isara ang modal pagkatapos ng success
            setValues({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
            });
            onClose(); // Auto-close sa success
            
        } catch (error) {
            // Handle error
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop / Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose} // Isasara ang modal pag clinick sa labas
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl sm:p-8"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <FaTimes />
                        </button>

                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <FaLock className="text-xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Update Password</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Please enter your details to continue.</p>
                        </div>

                        {(localError || customError) && (
                            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                {localError || customError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={values.currentPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={values.newPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmNewPassword"
                                    value={values.confirmNewPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        "Update Password"
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UpdatePassword;