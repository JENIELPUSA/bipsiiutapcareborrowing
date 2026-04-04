import React, { useState, useEffect, useContext, useRef } from "react";
import { Search, UserCog, Trash2, X, Loader2, UserPlus, CreditCard, Activity, Scan, MapPin, Camera, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RFIDContext } from "../../contexts/RFIDContext/RfidContext";
import { LaboratoryContext } from "../../contexts/LaboratoryContext/laboratoryContext";
import { BorrowerContext } from "../../contexts/BorrowerContext/BorrowerContext";

const BorrowerManagement = () => {
    const { borrowers, setBorrowers, AddBorrower, fetchBorrowers } = useContext(BorrowerContext);
    const { laboratories } = useContext(LaboratoryContext);
    const { rfidData, clearRFID } = useContext(RFIDContext);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchBorrowers();
    }, []);

    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBorrower, setEditingBorrower] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [formData, setFormData] = useState({
        avatar: { url: "", public_id: "" },
        rfidId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        contactNumber: "",
        email: "",
        laboratoryId: "",
        address: "",
        borrowerType: "student",
        status: "active",
    });

    useEffect(() => {
        if (rfidData && isModalOpen) {
            const scannedId = typeof rfidData === "object" ? rfidData.uid : rfidData;
            setFormData((prev) => ({ ...prev, rfidId: scannedId }));
        }
    }, [rfidData, isModalOpen]);

    // --- PAGINATION LOGIC ---
    const filteredBorrowers = borrowers.filter((b) =>
        `${b.firstName} ${b.lastName} ${b.rfidId}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredBorrowers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBorrowers.slice(indexOfFirstItem, indexOfLastItem);

    // Reset page to 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({
                    ...prev,
                    avatar: {
                        url: reader.result,
                        public_id: `temp_${Date.now()}`,
                    },
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLabChange = (e) => {
        const selectedLabId = e.target.value;
        const selectedLab = laboratories.find((lab) => lab._id === selectedLabId);
        setFormData((prev) => ({
            ...prev,
            laboratoryId: selectedLabId,
            address: selectedLab ? selectedLab.laboratoryName : "",
        }));
    };

    const handleOpenEnroll = () => {
        setEditingBorrower(null);
        setFormData({
            avatar: { url: "", public_id: "" },
            rfidId: "",
            firstName: "",
            middleName: "",
            lastName: "",
            suffix: "",
            contactNumber: "",
            email: "",
            laboratoryId: "",
            address: "",
            borrowerType: "student",
            status: "active",
        });
        clearRFID();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (borrower) => {
        setEditingBorrower(borrower);
        setFormData({ ...borrower });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        clearRFID();
    };

    const handleDelete = (id) => {
        if (window.confirm("Delete this borrower?")) {
            setBorrowers(borrowers.filter((b) => b._id !== id));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = {
            ...formData,
            timestamp: new Date().toISOString(),
            action: editingBorrower ? "UPDATE" : "CREATE",
        };
        await AddBorrower(payload);
        
        setTimeout(() => {
            if (editingBorrower) {
                setBorrowers(borrowers.map((b) => (b._id === editingBorrower._id ? { ...formData, _id: b._id } : b)));
            } else {
                setBorrowers([...borrowers, { ...formData, _id: Math.random().toString(36), createdAt: new Date() }]);
            }
            setIsSubmitting(false);
            handleCloseModal();
        }, 1000);
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 text-left font-sans">
            {/* --- HEADER --- */}
            <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
                <div className="w-full space-y-1 text-left">
                    <h2 className="text-3xl font-black uppercase leading-none tracking-tighter text-[#1e40af]">
                        Borrower <span className="text-[#facc15]">Registry</span>
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Inventory Access Management</p>
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search name, RFID..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#1e40af]"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleOpenEnroll}
                        className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#1e40af] px-6 py-3 text-xs font-black text-white shadow-lg transition-all active:scale-95"
                    >
                        <UserPlus size={18} className="text-[#facc15]" /> ENROLL
                    </button>
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="border-b px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Borrower</th>
                                <th className="border-b px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">RFID ID</th>
                                <th className="border-b px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Laboratory</th>
                                <th className="border-b px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="border-b px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentItems.map((b) => (
                                <tr key={b._id} className="group transition-colors hover:bg-slate-50/50">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            {b.avatar?.url ? (
                                                <img src={b.avatar.url} className="h-9 w-9 rounded-xl border border-slate-200 object-cover" alt="profile" />
                                            ) : (
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black uppercase text-[#1e40af]">{b.firstName?.[0]}</div>
                                            )}
                                            <div className="text-left">
                                                <p className="text-sm font-bold leading-tight text-slate-800">{b.lastName}, {b.firstName}</p>
                                                <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">{b.borrowerType}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-left font-mono text-[11px] font-bold text-slate-600">
                                        <div className="flex items-center gap-2"><CreditCard size={14} className="text-[#1e40af]" /> {b.rfidId}</div>
                                    </td>
                                    <td className="px-8 py-4 text-left text-[11px] font-bold uppercase text-slate-600">
                                        <div className="flex items-center gap-1.5 font-sans"><MapPin size={14} className="text-slate-400" /> {b.address || "Unassigned"}</div>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${b.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                            <Activity size={10} /> {b.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button onClick={() => handleOpenEdit(b)} className="p-2 text-slate-400 transition-colors hover:text-blue-600"><UserCog size={16} /></button>
                                            <button onClick={() => handleDelete(b._id)} className="p-2 text-slate-400 transition-colors hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION CONTROLS --- */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-white px-8 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Showing <span className="text-[#1e40af]">{indexOfFirstItem + 1}</span> to <span className="text-[#1e40af]">{Math.min(indexOfLastItem, filteredBorrowers.length)}</span> of {filteredBorrowers.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            className="rounded-xl border border-slate-200 p-2 transition-all hover:bg-slate-50 disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`h-8 w-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-[#1e40af] text-white" : "border border-slate-100 text-slate-400 hover:bg-slate-50"}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            className="rounded-xl border border-slate-200 p-2 transition-all hover:bg-slate-50 disabled:opacity-30"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- COMPACT MODAL (UNCHANGED) --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                            <div className="flex items-center justify-between bg-[#1e40af] px-6 py-4 text-white">
                                <h3 className="text-lg font-black uppercase tracking-tighter">
                                    {editingBorrower ? "Update" : "Enroll"} <span className="text-[#facc15]">Borrower</span>
                                </h3>
                                <button onClick={handleCloseModal} className="rounded-full p-1.5 transition-colors hover:bg-white/10"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-3 p-6 text-left">
                                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                    <div className="group relative cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white transition-colors group-hover:border-[#1e40af]">
                                            {formData.avatar?.url ? (
                                                <img src={formData.avatar.url} className="h-full w-full object-cover" alt="preview" />
                                            ) : (
                                                <Camera size={20} className="text-slate-400" />
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                    </div>
                                    <div className="flex flex-1 items-center gap-3">
                                        <div className={`rounded-lg p-2.5 ${formData.rfidId ? "bg-green-500" : "animate-pulse bg-[#1e40af]"} text-white shadow-inner`}><Scan size={18} /></div>
                                        <div className="overflow-hidden text-left">
                                            <p className="mb-1 text-[9px] font-black uppercase leading-none text-slate-400">RFID Identification</p>
                                            <p className="truncate font-mono text-xs font-bold text-slate-700">{formData.rfidId || "Tap RFID Card..."}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                    <div className="col-span-3 space-y-1">
                                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400">First Name</label>
                                        <input required type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Middle</label>
                                        <input type="text" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Suffix</label>
                                        <input type="text" value={formData.suffix} onChange={(e) => setFormData({ ...formData, suffix: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                                    </div>
                                    <div className="col-span-6 space-y-1">
                                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Last Name</label>
                                        <input required type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Contact</label>
                                        <input required type="text" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Email</label>
                                        <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Borrower Type</label>
                                        <select required value={formData.borrowerType} onChange={(e) => setFormData({ ...formData, borrowerType: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]">
                                            <option value="student">Student</option>
                                            <option value="employee">Employee</option>
                                            <option value="external">External</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="ml-1 text-[9px] font-black uppercase text-slate-400">Laboratory</label>
                                        <select required value={formData.laboratoryId} onChange={handleLabChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#1e40af]">
                                            <option value="">-- Select Lab --</option>
                                            {laboratories?.map((lab) => (<option key={lab._id} value={lab._id}>{lab.laboratoryName}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.rfidId}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#facc15] py-3.5 text-[11px] font-black uppercase tracking-widest text-[#1e40af] shadow-md transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                    {isSubmitting ? "SYNCING..." : editingBorrower ? "UPDATE BORROWER" : "CONFIRM REGISTRATION"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BorrowerManagement;