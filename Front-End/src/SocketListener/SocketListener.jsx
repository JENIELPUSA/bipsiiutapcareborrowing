import { useEffect, useContext } from "react";
import socket from "../socket.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { CategoryContext } from "../contexts/CategoryContext/categoryContext.jsx";
import { LaboratoryContext } from "../contexts/LaboratoryContext/laboratoryContext.jsx";
import { DepartmentContext } from "../contexts/DepartmentContext/DepartmentContext.jsx";
import { RFIDContext } from "../contexts/RFIDContext/RfidContext.jsx";
import { NotificationDisplayContext } from "../contexts/NotificationContext/NotificationContext.jsx";
import { LoanEquipmentContext } from "../contexts/LoanEuipmentContext/LoanEuipmentContext.jsx";
import { BorrowerContext } from "../contexts/BorrowerContext/BorrowerContext.jsx";
import { EquipmentContext } from "../contexts/EquipmentContext/EquipmentContext.jsx";

const SocketListener = () => {
    const { setEquipments, fetchEquipments } = useContext(EquipmentContext);
    const { setCategories } = useContext(CategoryContext);
    const { setLaboratories } = useContext(LaboratoryContext);
    const { role, linkId, setUsers } = useAuth();
    const { setDepartments } = useContext(DepartmentContext);
    const { setRfidData } = useContext(RFIDContext);
    const { setNotify } = useContext(NotificationDisplayContext);
    const { setLoans } = useContext(LoanEquipmentContext);
    const { setBorrowers } = useContext(BorrowerContext);

    useEffect(() => {
        if (!linkId || !role) return;
        socket.emit("register-user", linkId, role);
    }, [linkId, role]);

    useEffect(() => {
        if (!linkId || !role) return;

        const handlecategory = (payload) => {
            setCategories((prev) => [payload, ...prev]);
        };

        const handlelaboratory = (payload) => {
            setLaboratories((prev) => [payload, ...prev]);
        };

        const handleuser = (payload) => {
            setUsers((prev) => [payload, ...prev]);
        };

        const handledepartment = (payload) => {
            setDepartments((prev) => [payload, ...prev]);
        };

        const handlerfidScanned = async (data) => {
            await setRfidData(data);
        };

        const handleBorrowRequest = async (payload) => {
            if (payload.loans) {
                setLoans((prev) => [...payload.loans, ...prev]);
            } else if (payload.loan) {
                setLoans((prev) => [payload.loan, ...prev]);
            }
            setNotify((prev) => {
                if (!payload.notification) return prev;
                return [payload.notification, ...prev];
            });
        };

        const handleborrowupdate = (updatedBorrower) => {
            setBorrowers((prevBorrowers) => prevBorrowers.map((b) => (b._id === updatedBorrower._id ? updatedBorrower : b)));
        };
        const handleAdminUpdate = (updatedAdmin) => {
            setUsers((prevUsers) => prevUsers.map((user) => (user._id === updatedAdmin.payloads._id ? updatedAdmin.payloads : user)));
        };
        const handleupdatestatuseuipment = (payloads) => {
            fetchEquipments();
            if (payloads.loan) {
                setLoans((prev) => {
                    const index = prev.findIndex((l) => l._id === payloads.loan._id);
                    if (index !== -1) {
                        // Update existing loan
                        const updated = [...prev];
                        updated[index] = payloads.loan;
                        return updated;
                    }
                    // If not exists, add as new
                    return [payloads.loan, ...prev];
                });
            } else if (payloads.loans) {
                // Multiple loans: merge with existing loans based on _id
                setLoans((prev) => {
                    const loansMap = new Map(prev.map((l) => [l._id, l]));
                    payloads.loans.forEach((l) => loansMap.set(l._id, l));
                    return Array.from(loansMap.values());
                });
            }

            // 🔹 Update Notifications dynamically (newest first)
            setNotify((prev) => {
                if (!payloads.notification) return prev;

                const viewers = payloads.notification.viewers || [];
                const isForCurrentUser = viewers.some((v) => v.user === linkId);
                if (!isForCurrentUser) return prev;

                return [payloads.notification, ...prev];
            });
        };

        const handleAddEquipment = (payloads) => {
            console.log("New Equipment Payload:", payloads);

            setEquipments((prev) => [payloads.equipment, ...prev]);
        };

        socket.on("category:created", handlecategory);
        socket.on("user:created", handleuser);

        socket.on("laboratory:created", handlelaboratory);
        socket.on("department:created", handledepartment);
        socket.on("rfid-scanned", handlerfidScanned);
        socket.on("borrowrequest:created", handleBorrowRequest);
        socket.on("updatestatusequipment:update", handleupdatestatuseuipment);
        socket.on("borrowerUpdated", handleborrowupdate);
        socket.on("adminUpdated", handleAdminUpdate);
        socket.on("equipment:added", handleAddEquipment);

        return () => {
            socket.off("borrowrequest:created", handleBorrowRequest);
            socket.off("category:created", handlecategory);
            socket.off("borrowerUpdated", handleborrowupdate);
            socket.off("rfid-scanned", handlerfidScanned);
            socket.off("equipment:added", handleAddEquipment);
            socket.off("user:created", handleuser);
            socket.off("adminUpdated", handleAdminUpdate);
            socket.off("laboratory:created", handlelaboratory);
            socket.off("department:created", handledepartment);
            socket.off("updatestatusequipment:update", handleupdatestatuseuipment);
        };
    }, [linkId, role]);

    return null;
};

export default SocketListener;
