import { createContext, useContext, useState } from "react";

export const RFIDContext = createContext();

export const RFIDProvider = ({ children }) => {
    const [rfidData, setRfidData] = useState(null);
    // Function to clear the current RFID data
    const clearRFID = () => setRfidData(null);

    return <RFIDContext.Provider value={{ rfidData, setRfidData, clearRFID }}>{children}</RFIDContext.Provider>;
};

export const useRFID = () => useContext(RFIDContext);
