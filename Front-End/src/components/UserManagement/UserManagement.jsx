import React, { useContext, useState, useEffect, useCallback } from "react";
import { Search, ShieldCheck, UserCog, Trash2, Fingerprint, Mail, X, Loader2, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminDisplayContext } from "../../contexts/AdminContext/AdminContext";
import { AuthContext } from "../../contexts/AuthContext";
import StatusModal from "../../ReusableFolder/SuccessandField";
import { LaboratoryContext } from "../../contexts/LaboratoryContext/laboratoryContext";

const UserManagement = () => {
    // --- CONTEXTS ---
    const { AddAdmin, UpdateAdmin } = useContext(AdminDisplayContext);
    const { users, fetchAllUsers, isLoading, currentPage, setCurrentPage, totalPages, totalUsers } = useContext(AuthContext);
    const { laboratories } = useContext(LaboratoryContext);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [limit] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalProps, setStatusModalProps] = useState({
        status: "success",
        error: null,
        title: "",
        message: "",
        onRetry: null,
    });

    const showStatusMessage = useCallback((status, error = null, customProps = {}) => {
        setStatusModalProps({
            status,
            error,
            title: customProps.title || "",
            message: customProps.message || "",
            onRetry: customProps.onRetry || null,
        });
        setShowStatusModal(true);
    }, []);

    console.log("Users:", users);

    // --- FORM STATE (may laboratoryId para sa in-charge) ---
    const [formData, setFormData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        email: "",
        role: "admin",
        password: "",
        confirmPassword: "",
        status: "Active",
        laboratoryId: "",
    });

    // --- DEBOUNCE SEARCH ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, setCurrentPage]);

    // --- FETCH USERS ---
    useEffect(() => {
        fetchAllUsers(currentPage, limit, debouncedSearch);
    }, [currentPage, limit, debouncedSearch, fetchAllUsers]);

    // --- HANDLERS ---
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleOpenEnroll = () => {
        setEditingUser(null);
        setFormData({
            first_name: "",
            middle_name: "",
            last_name: "",
            suffix: "",
            email: "",
            role: "admin",
            password: "",
            confirmPassword: "",
            status: "Active",
            laboratoryId: "",
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setFormData({
            first_name: user.first_name || "",
            middle_name: user.middle_name || "",
            last_name: user.last_name || "",
            suffix: user.suffix || "",
            email: user.username || "",
            role: user.role === "admin" ? "admin" : "in-charge",
            status: user.status || "Active",
            password: "",
            confirmPassword: "",
            // Para sa in-charge, gamitin ang existing lab ID; para sa admin, empty string (hindi isasama sa submit)
            laboratoryId: user.role === "in-charge" ? user.laboratoryId || "" : "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Password match check (para sa bagong user)
        if (!editingUser && formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Validation para sa in-charge – kailangang may napiling laboratory
        if (formData.role === "in-charge" && !formData.laboratoryId) {
            alert("Please select a laboratory for the in-charge user.");
            return;
        }

        try {
            setIsSubmitting(true);

            // ✅ BUUIN ANG PAYLOAD – hindi direktang ginagamit ang formData
            const payload = {
                first_name: formData.first_name,
                middle_name: formData.middle_name,
                last_name: formData.last_name,
                suffix: formData.suffix,
                email: formData.email,
                role: formData.role,
                status: formData.status,
            };

            // Para sa bagong user, isama ang password fields
            if (!editingUser) {
                payload.password = formData.password;
                payload.confirmPassword = formData.confirmPassword;
            }

            // ✅ KONDISYONAL NA PAGSASAMA NG laboratoryId – para sa in-charge LANG
            if (formData.role === "in-charge") {
                payload.laboratoryId = formData.laboratoryId;
            }
            // Kung admin, walang laboratoryId property – hindi ito isasama sa request

            // 🔍 I-CONSOLE LOG PARA I-VERIFY – tingnan sa browser console
            console.log("Submitting payload:", payload);

            const result = editingUser ? await UpdateAdmin(editingUser._id, payload) : await AddAdmin(payload);

            if (result?.success) {
                showStatusMessage("success", null, {
                    title: editingUser ? "Updated Successfully!" : "Successfully Created!",
                    message: editingUser ? "Account details updated." : "New personnel added to directory.",
                });
                setIsModalOpen(false);
                e.target.reset();
            } else {
                showStatusMessage("error", null, {
                    title: "Action Failed",
                    message: result?.message || "Something went wrong.",
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-2">
            {/* HEADER */}
            <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter text-[#1e40af] dark:text-slate-50">
                        PERSONNEL <span className="text-[#facc15]">DIRECTORY</span>
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Master List & Access Control</p>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <button
                        onClick={handleOpenEnroll}
                        className="flex items-center gap-2 rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg transition-all hover:bg-[#1e3a8a] active:scale-95"
                    >
                        <UserPlus
                            size={18}
                            className="text-[#facc15]"
                        />{" "}
                        ENROLL NEW
                    </button>
                </div>
            </div>

            {/* TABLE CONTAINER */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl dark:border-slate-900 dark:bg-slate-950">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="border-b border-slate-100 px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Personnel Name
                                </th>
                                <th className="border-b border-slate-100 px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Account / Email
                                </th>
                                <th className="border-b border-slate-100 px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Designation
                                </th>
                                <th className="border-b border-slate-100 px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Status
                                </th>
                                <th className="border-b border-slate-100 px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="py-20 text-center"
                                    >
                                        <Loader2
                                            className="mx-auto animate-spin text-[#1e40af]"
                                            size={30}
                                        />
                                    </td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="group transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e40af] to-blue-500 font-black uppercase text-[#facc15] shadow-md">
                                                    {user.first_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">
                                                        {user.last_name}, {user.first_name} {user.suffix}
                                                    </p>
                                                    <p className="text-[9px] font-bold uppercase text-slate-400">ID: {user._id?.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                <Mail
                                                    size={14}
                                                    className="text-[#1e40af]"
                                                />{" "}
                                                {user.username}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] font-black uppercase ${user.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                                            >
                                                {user.role === "admin" ? <ShieldCheck size={12} /> : <UserCog size={12} />}
                                                {user.role}
                                            </div>
                                            {/* ✅ Ipinapakita ang laboratory name para sa in-charge – gamit ang nested laboratory object */}
                                            {user.role === "in-charge" && user.laboratory?.laboratoryName && (
                                                <div className="mt-1 text-[8px] font-bold uppercase text-slate-400">
                                                    Lab: {user.laboratory.laboratoryName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span
                                                className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${user.status === "Active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                                            >
                                                {user.status || "Active"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="p-2 text-slate-400 transition-colors hover:text-blue-600"
                                                >
                                                    <UserCog size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 transition-colors hover:text-red-500">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="py-20 text-center font-bold uppercase tracking-widest text-slate-400"
                                    >
                                        No personnel found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-900 dark:bg-slate-900/30 md:flex-row">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Showing <span className="text-[#1e40af] dark:text-[#facc15]">{users?.length || 0}</span> of{" "}
                        <span className="text-slate-800 dark:text-slate-100">{totalUsers || 0}</span> Entries
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1 || isLoading}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>

                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`h-10 w-10 rounded-xl text-[10px] font-black transition-all ${
                                        currentPage === i + 1
                                            ? "bg-[#1e40af] text-white shadow-lg shadow-blue-200 dark:shadow-none"
                                            : "bg-white text-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={currentPage === totalPages || isLoading}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Page <span className="text-[#1e40af] dark:text-[#facc15]">{currentPage}</span> of {totalPages || 1}
                    </p>
                </div>
            </div>

            {/* MODAL (ENROLL/EDIT) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isSubmitting && setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center justify-between bg-[#1e40af] p-8 text-white">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">
                                        {editingUser ? "Update" : "Enroll"} <span className="text-[#facc15]">Personnel</span>
                                    </h3>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                                        Fill out all required credentials
                                    </p>
                                </div>
                                <button
                                    onClick={() => !isSubmitting && setIsModalOpen(false)}
                                    className="rounded-full p-2 hover:bg-white/10"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-4 p-8"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[10px] font-black uppercase text-slate-400">First Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Last Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Middle Name</label>
                                        <input
                                            type="text"
                                            value={formData.middle_name}
                                            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Suffix</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Jr, III"
                                            value={formData.suffix}
                                            onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                                            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Email Address (Username)</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="admin">Administrator</option>
                                            <option value="in-charge">In-Charge</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Account Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Laboratories dropdown – para sa in-charge lang */}
                                {formData.role === "in-charge" && (
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[10px] font-black uppercase text-slate-400">
                                            Assigned Laboratory <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.laboratoryId}
                                            onChange={(e) => setFormData({ ...formData, laboratoryId: e.target.value })}
                                            className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="">-- Select a laboratory --</option>
                                            {laboratories.map((lab) => (
                                                <option
                                                    key={lab._id}
                                                    value={lab._id}
                                                >
                                                    {lab.laboratoryName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {!editingUser && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Password</label>
                                            <input
                                                required
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Confirm Password</label>
                                            <input
                                                required
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#facc15] py-4 text-xs font-black uppercase tracking-widest text-[#1e40af] shadow-lg hover:brightness-105 active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2
                                            className="animate-spin"
                                            size={16}
                                        />
                                    ) : (
                                        <Fingerprint size={16} />
                                    )}
                                    {isSubmitting ? "PROCESSING..." : editingUser ? "UPDATE ACCOUNT" : "ENROLL PERSONNEL"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <StatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                {...statusModalProps}
            />
        </div>
    );
};

export default UserManagement;