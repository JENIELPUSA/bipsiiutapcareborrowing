import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/hooks/use-theme";
import { Footer } from "@/layouts/footer";

import AdminDashboard from "../../components/Dashboard/AdminDashboard/AdminDashboard";

const DashboardPage = () => {
    const { theme } = useTheme();

    return (
        <div className="flex flex-col gap-y-4"> 
           <AdminDashboard/>
            <Footer />
        </div>
    );
};

export default DashboardPage;
