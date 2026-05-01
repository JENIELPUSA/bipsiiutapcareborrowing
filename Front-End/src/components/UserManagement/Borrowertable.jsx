import React, { useState, useEffect, useContext } from "react";
import { Search, UserCog, Trash2, CreditCard, Activity, MapPin, ChevronLeft, ChevronRight, UserPlus, AlertCircle, Home } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { RFIDContext } from "../../contexts/RFIDContext/RfidContext";
import { LaboratoryContext } from "../../contexts/LaboratoryContext/laboratoryContext";
import { BorrowerContext } from "../../contexts/BorrowerContext/BorrowerContext";
import BorrowerForm from "./BorrowerForm";
import { AdminDisplayContext } from "../../contexts/AdminContext/AdminContext";

const BorrowerManagement = () => {
    // Contexts
    const { borrowers, setBorrowers, fetchBorrowers, UpdateBorrower, DeleteBorrower } = useContext(BorrowerContext);
    const { AddAdmin } = useContext(AdminDisplayContext);
    const { laboratories } = useContext(LaboratoryContext);
    const { rfidData, clearRFID } = useContext(RFIDContext);

    // States
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBorrower, setEditingBorrower] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Initial Form State - Siguraduhin na nandito ang email at address
    const initialFormState = {
        rfidId: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        contactNumber: "",
        email: "", // Isinama sa initial state
        address: "", // Isinama sa initial state
        laboratoryId: "",
        borrowerType: "student",
        status: "active",
        role: "borrower",
        password: "",
        confirmPassword: "",
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchBorrowers();
    }, []);

    console.log("Borrowers Data:", borrowers); // 🔥 DEBUG: Tingnan ang structure ng borrowers data

    // RFID Logic
    useEffect(() => {
        if (rfidData && isModalOpen) {
            const scannedId = typeof rfidData === "object" ? rfidData.uid : rfidData;
            setFormData((prev) => ({ ...prev, rfidId: scannedId }));
        }
    }, [rfidData, isModalOpen]);

    // Search Logic
    const filteredBorrowers = borrowers.filter((b) =>
        `${b.first_name} ${b.last_name} ${b.rfidId} ${b.email} ${b.address}`.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredBorrowers.length / itemsPerPage);
    const currentItems = filteredBorrowers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Handlers
    const handleOpenEnroll = () => {
        setEditingBorrower(null);
        setFormData(initialFormState);
        clearRFID();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (borrower) => {
        setEditingBorrower(borrower);
        setFormData({
            ...borrower,
            middle_name: borrower.middle_name || "",
            suffix: borrower.suffix || "",
            email: borrower.email || "",
            address: borrower.address || "",
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        clearRFID();
    };

    // --- SUBMIT LOGIC WITH PAYLOAD ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // I-construct ang payload para sigurado ang structure
        const payload = {
            rfidId: formData.rfidId,
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            last_name: formData.last_name,
            suffix: formData.suffix,
            contactNumber: formData.contactNumber,
            confirmPassword: formData.confirmPassword,
            email: formData.email, // KASAMA SA PAYLOAD
            address: formData.address, // KASAMA SA PAYLOAD
            laboratoryId: formData.laboratoryId,
            borrowerType: formData.borrowerType,
            status: formData.status || "active",
            role: "borrower",
            password: formData.password,
        };

        try {
            if (editingBorrower) {
                const result = await UpdateBorrower(formData._id, payload);
                if (result.success == true) {
                    setBorrowers((prev) => prev.map((b) => (b._id === formData._id ? result : b)));
                }
            } else {
                await AddAdmin(payload);
                await fetchBorrowers();
            }

            setTimeout(() => {
                setIsSubmitting(false);
                handleCloseModal();
            }, 600);
        } catch (error) {
            console.error("Payload Error:", error);
            setIsSubmitting(false);
        }
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;
        setIsSubmitting(true);
        try {
            await DeleteBorrower(itemToDelete._id);
            setBorrowers((prev) => prev.filter((b) => b._id !== itemToDelete._id));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Delete Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 text-left font-sans">
            {/* TOP BAR */}
            <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                <div className="w-full space-y-1 text-left">
                    <h2 className="text-3xl font-black uppercase leading-none tracking-tighter text-[#1e40af] dark:text-slate-100">
                        Borrower <span className="text-[#facc15] dark:text-[#fbbf24]">Registry</span>
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Inventory Access Management</p>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search name, RFID, email..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#1e40af] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-[#3b82f6]"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleOpenEnroll}
                        className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg transition-all active:scale-95 dark:bg-[#1e3a8a]"
                    >
                        <UserPlus
                            size={18}
                            className="text-[#facc15] dark:text-[#fbbf24]"
                        />{" "}
                        ENROLL
                    </button>
                </div>
            </div>

            {/* MAIN TABLE */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-[#1e40af] dark:bg-[#1e3a8a]">
                                <th className="border border-[#1e3a8a] dark:border-[#1e3a8a] px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white">
                                    Borrower
                                </th>
                                <th className="border border-[#1e3a8a] dark:border-[#1e3a8a] px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white">
                                    Contact & Email
                                </th>
                                <th className="border border-[#1e3a8a] dark:border-[#1e3a8a] px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white">
                                    Address
                                </th>
                                <th className="border border-[#1e3a8a] dark:border-[#1e3a8a] px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-white">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {currentItems.map((b) => (
                                <tr
                                    key={b._id}
                                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <td className="border border-slate-200 px-6 py-4 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black uppercase text-[#1e40af] dark:bg-slate-800 dark:text-[#3b82f6]">
                                                {b.last_name?.[0]}
                                                {b.first_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold uppercase text-slate-800 dark:text-slate-200">
                                                    {b.first_name} {b.middleName},{b.last_name} {b.suffix}
                                                </p>
                                                <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{b.rfidId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="border border-slate-200 px-6 py-4 dark:border-slate-700">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                <Activity
                                                    size={12}
                                                    className="text-[#1e40af] dark:text-[#3b82f6]"
                                                />{" "}
                                                {b.contactNumber}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] italic text-slate-400 dark:text-slate-500">{b.email || "No email"}</div>
                                        </div>
                                    </td>
                                    <td className="border border-slate-200 px-6 py-4 dark:border-slate-700">
                                        <div className="flex max-w-[200px] items-start gap-2">
                                            <MapPin
                                                size={12}
                                                className="mt-0.5 text-slate-400 dark:text-slate-500"
                                            />
                                            <p className="line-clamp-2 text-[10px] font-medium uppercase leading-tight text-slate-600 dark:text-slate-400">
                                                {b.address || "No address provided"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="border border-slate-200 px-6 py-4 text-center dark:border-slate-700">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(b)}
                                                className="p-2 text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                                            >
                                                <UserCog size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setItemToDelete(b);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 transition-colors hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/30">
                    <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                        Page {currentPage} of {totalPages || 1}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-black uppercase disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        >
                            <ChevronLeft size={12} /> Prev
                        </button>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-black uppercase disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        >
                            Next <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* FORM MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <BorrowerForm
                        isModalOpen={isModalOpen}
                        handleCloseModal={handleCloseModal}
                        handleSubmit={handleSubmit}
                        formData={formData}
                        setFormData={setFormData}
                        editingBorrower={editingBorrower}
                        isSubmitting={isSubmitting}
                        laboratories={laboratories}
                        handleLabChange={(e) => setFormData({ ...formData, laboratoryId: e.target.value })}
                    />
                )}
            </AnimatePresence>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="absolute inset-0 bg-[#1e40af]/20 backdrop-blur-md dark:bg-black/50"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-slate-900"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 text-[#facc15] dark:text-[#fbbf24]">
                                    <AlertCircle size={48} />
                                </div>
                                <h3 className="text-xl font-black uppercase text-[#1e40af] dark:text-slate-100">Confirm Delete</h3>
                                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                                    Delete record for{" "}
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {itemToDelete?.first_name} {itemToDelete?.last_name}
                                    </span>
                                    ?
                                </p>
                                <div className="flex w-full gap-2">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 rounded-xl bg-slate-100 py-3 text-[10px] font-black uppercase text-slate-400 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executeDelete}
                                        disabled={isSubmitting}
                                        className="flex-1 rounded-xl bg-[#1e40af] py-3 text-[10px] font-black uppercase text-white shadow-lg transition-colors hover:bg-[#1e3a8a] dark:bg-[#1e3a8a] dark:hover:bg-[#1e40af]"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BorrowerManagement;