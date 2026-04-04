import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { AdminDisplayProvider } from "./contexts/AdminContext/AdminContext.jsx";
import { CategoryProvider } from "./contexts/CategoryContext/categoryContext.jsx";
import SocketListener from "./SocketListener/SocketListener.jsx";
import { LaboratoryProvider } from "./contexts/LaboratoryContext/laboratoryContext.jsx";
import { DepartmentProvider } from "./contexts/DepartmentContext/DepartmentContext.jsx";
import { RFIDProvider } from "./contexts/RFIDContext/RfidContext.jsx";
import { BorrowerProvider } from "./contexts/BorrowerContext/BorrowerContext.jsx";
import { LoanEquipmentProvider } from "./contexts/LoanEuipmentContext/LoanEuipmentContext.jsx";
import { NotificationDisplayProvider } from "./contexts/NotificationContext/NotificationContext.jsx";
import { EquipmentProvider } from "./contexts/EquipmentContext/EquipmentContext.jsx";

createRoot(document.getElementById("root")).render(
    <AuthProvider>
        <RFIDProvider>
            <EquipmentProvider>
                <NotificationDisplayProvider>
                    <LoanEquipmentProvider>
                        <BorrowerProvider>
                            <CategoryProvider>
                                <LaboratoryProvider>
                                    <DepartmentProvider>
                                        <AdminDisplayProvider>
                                            <App />
                                            <SocketListener />
                                        </AdminDisplayProvider>
                                    </DepartmentProvider>
                                </LaboratoryProvider>
                            </CategoryProvider>
                        </BorrowerProvider>
                    </LoanEquipmentProvider>
                </NotificationDisplayProvider>
            </EquipmentProvider>
        </RFIDProvider>
    </AuthProvider>,
);
