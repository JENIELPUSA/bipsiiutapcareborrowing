import { createContext, useContext, useState, useEffect, useRef } from "react";

export const RFIDContext = createContext();

export const RFIDProvider = ({ children }) => {
    const [rfidData, setRfidData] = useState(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const wsRef = useRef(null);
    const eventListenerRef = useRef(null);

    // Function to clear the current RFID data
    const clearRFID = () => setRfidData(null);
    
    // Enable RFID scanning
    const enableRFID = () => {
        console.log("RFID Scanning Enabled");
        setIsEnabled(true);
    };
    
    // Disable RFID scanning
    const disableRFID = () => {
        console.log("RFID Scanning Disabled");
        setIsEnabled(false);
        setRfidData(null);
    };

    // Set up RFID listener when enabled
    useEffect(() => {
        if (!isEnabled) return;

        // Option 1: If using WebSocket
        const setupWebSocket = () => {
            // Example WebSocket connection
            // const ws = new WebSocket('ws://your-rfid-server');
            // ws.onmessage = (event) => {
            //     const data = JSON.parse(event.data);
            //     setRfidData(data);
            // };
            // wsRef.current = ws;
        };

        // Option 2: If using keyboard/serial input (common for USB RFID readers)
        const handleKeyPress = (event) => {
            // Many USB RFID readers act like keyboards
            // They scan and then press Enter
            if (!isEnabled) return;
            
            // Accumulate characters until Enter is pressed
            if (event.key === 'Enter') {
                const uid = window._rfidBuffer || '';
                if (uid) {
                    setRfidData({ uid, timestamp: new Date().toISOString() });
                    window._rfidBuffer = '';
                }
            } else {
                if (!window._rfidBuffer) window._rfidBuffer = '';
                window._rfidBuffer += event.key;
                
                // Clear buffer after 100ms of no input
                clearTimeout(window._rfidTimeout);
                window._rfidTimeout = setTimeout(() => {
                    window._rfidBuffer = '';
                }, 100);
            }
        };

        // Option 3: If using a custom event from a hardware bridge
        const handleCustomRFIDEvent = (event) => {
            if (!isEnabled) return;
            setRfidData(event.detail);
        };

        // Add event listeners based on your RFID hardware
        window.addEventListener('keypress', handleKeyPress);
        window.addEventListener('rfid-scan', handleCustomRFIDEvent);
        
        // Store for cleanup
        eventListenerRef.current = { handleKeyPress, handleCustomRFIDEvent };

        return () => {
            window.removeEventListener('keypress', handleKeyPress);
            window.removeEventListener('rfid-scan', handleCustomRFIDEvent);
            if (wsRef.current) {
                wsRef.current.close();
            }
            clearTimeout(window._rfidTimeout);
            window._rfidBuffer = '';
        };
    }, [isEnabled]);

    return (
        <RFIDContext.Provider 
            value={{ 
                rfidData, 
                setRfidData, 
                clearRFID, 
                enableRFID, 
                disableRFID,
                isEnabled 
            }}
        >
            {children}
        </RFIDContext.Provider>
    );
};

export const useRFID = () => useContext(RFIDContext);