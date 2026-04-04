import { useEffect, useContext } from "react";
import socket from "../socket.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { CategoryContext } from "../contexts/CategoryContext/categoryContext.jsx";
import { LaboratoryContext } from "../contexts/LaboratoryContext/laboratoryContext.jsx";
import { DepartmentContext } from "../contexts/DepartmentContext/DepartmentContext.jsx";
import { RFIDContext } from "../contexts/RFIDContext/RfidContext.jsx";
import { NotificationDisplayContext } from "../contexts/NotificationContext/NotificationContext.jsx";

const SocketListener = () => {
    const { setCategories } = useContext(CategoryContext);
    const { setLaboratories } = useContext(LaboratoryContext);
    const { role, linkId, setUsers } = useAuth();
    const { setDepartments } = useContext(DepartmentContext);
    const { setRfidData } = useContext(RFIDContext);
    const { setNotify } = useContext(NotificationDisplayContext);

    useEffect(() => {
        if (!linkId || !role) return;
        socket.emit("register-user", linkId, role);
    }, [linkId, role]);

    useEffect(() => {
        if (!linkId || !role) return;

        const handlecategory = (payload) => {
            console.log("payload", payload);
            setCategories((prev) => [payload, ...prev]);
        };

        const handlelaboratory = (payload) => {
            console.log("payload", payload);
            setLaboratories((prev) => [payload, ...prev]);
        };

        const handleuser = (payload) => {
            console.log("payload", payload);
            setUsers((prev) => [payload, ...prev]);
        };

        const handledepartment = (payload) => {
            console.log("payload", payload);
            setDepartments((prev) => [payload, ...prev]);
        };

        const handlerfidScanned = async (data) => {
            console.log("RFID Scanned:", data);
            await setRfidData(data);
        };

        const handleBorrowRequest = async (payload) => {
            console.log("New Borrow Request Payload:", payload);

            // I-update ang Notifications state
            setNotify((prev) => {
                // Siguraduhin na ang notification object ay nag-eexist sa payload
                if (payload.notification) {
                    // Idagdag ang bagong notification sa unahan ng array (newest first)
                    return [payload.notification, ...prev];
                }
                return prev;
            });

            // Option: Kung may hiwalay ka ring state para sa Loans, pwede mo rin itong i-update dito
            // setLoans((prev) => [payload.loan, ...prev]);
        };

        const handleupdatestatuseuipment = (payloads) => {
            console.log("SubmittedPayloads", payloads);
        };
        
        socket.on("category:created", handlecategory);
        socket.on("user:created", handleuser);

        socket.on("laboratory:created", handlelaboratory);
        socket.on("department:created", handledepartment);
        socket.on("department:created", handledepartment);
        socket.on("rfid-scanned", handlerfidScanned);
        socket.on("borrowrequest:created", handleBorrowRequest);
        socket.on("updatestatusequipment:update", handleupdatestatuseuipment);

        return () => {
            socket.off("borrowrequest:created", handleBorrowRequest);
            socket.off("category:created", handlecategory);
            socket.off("rfid-scanned", handlerfidScanned);
            socket.off("user:created", handleuser);
            socket.off("laboratory:created", handlelaboratory);
            socket.off("department:created", handledepartment);
            socket.off("updatestatusequipment:update", handleupdatestatuseuipment);
        };
    }, [linkId, role]);

    return null;
};

export default SocketListener;
