import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Import Components
import LoadingIntro from "../../ReusableFolder/loadingIntro";
import LoginStatusModal from "../../ReusableFolder/LogInStatusModal";
import Header from "../Login/CashAssistanceAuth/Header";
import HeroSection from "../Login/CashAssistanceAuth/HeroSection";
import StatsSection from "../Login/CashAssistanceAuth/StatsSection";
import AboutSection from "../Login/CashAssistanceAuth/AboutSection";
import ContactSection from "../Login/CashAssistanceAuth/ContactSection";
import LoginForm from "../Login/CashAssistanceAuth/LoginForm";
import Footer from "../Login/CashAssistanceAuth/Footer";
import MissionandVision from "./CashAssistanceAuth/MissionandVision";

// Assets
import logo from "../../assets/bipsulogo.png";
import image4 from "../../assets/background.png";

export default function CashAssistanceAuthForm() {
    const [showLogin, setShowLogin] = useState(false);
    const [loginStatus, setLoginStatus] = useState({ show: false, status: "success", message: "" });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [values, setValues] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    // Handlers
    const handleInput = useCallback((event) => {
        const { name, value } = event.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const response = await login(values.email, values.password);
        setIsLoading(false);

        if (response.success) {
            setLoginStatus({ show: true, status: "success", message: "Login successful!" });
        } else {
            setLoginStatus({
                show: true,
                status: "error",
                message: response.message || "Login failed. Check your credentials.",
            });
        }
    };

    const handleModalClose = () => {
        setLoginStatus((prev) => ({ ...prev, show: false }));
        if (loginStatus.status === "success") navigate("/dashboard");
    };

    const handleLoginClick = () => {
        setShowLogin(true);
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleBackToHome = () => {
        setShowLogin(false);
        setValues({ email: "", password: "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const scrollToSection = (sectionId) => {
        if (showLogin) {
            handleBackToHome();
            setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 300);
        } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-blue-950 text-white selection:bg-blue-500/30">
            {/* Global Background Effects */}
            <BackgroundDecorations />

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
                    >
                        <LoadingIntro />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Login Status Modal */}
            <LoginStatusModal
                isOpen={loginStatus.show}
                onClose={handleModalClose}
                status={loginStatus.status}
                customMessage={loginStatus.message}
            />

            {/* Header - Mobile responsive na (menu toggle at navigation) */}
            <Header
                showLogin={showLogin}
                scrollToSection={scrollToSection}
                handleLoginClick={handleLoginClick}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            {/* Main Content */}
            <main className="relative z-10 flex min-h-screen flex-col">
                <AnimatePresence mode="wait">
                    {!showLogin ? (
                        /* LANDING PAGE */
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="w-full"
                        >
                            {/* Hero Section - dapat responsive na rin internally */}
                            <HeroSection handleLoginClick={handleLoginClick} />

                            {/* Content Sections Container */}
                            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <div className="space-y-16 py-12 md:space-y-24 md:py-20 lg:space-y-32">
                                    <MissionandVision />
    
                                    <ContactSection />
                                </div>
                            </div>

                            <Footer />
                        </motion.div>
                    ) : (
                        /* LOGIN VIEW */
                        <motion.div
                            key="login-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-grow flex-col lg:flex-row"
                        >
                            {/* Left Side - Branding (hidden on mobile) */}
                            <LoginBackgroundSide />

                            {/* Right Side - Login Form (full width on mobile) */}
                            <div className="flex w-full items-center justify-center p-4 lg:w-1/2 lg:p-8 xl:p-12">
                                <div className="w-full max-w-md">
                                    <LoginForm
                                        show={showLogin}
                                        values={values}
                                        handleInput={handleInput}
                                        handleLoginSubmit={handleLoginSubmit}
                                        isLoading={isLoading}
                                        handleBackToHome={handleBackToHome}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

/* ==================== BACKGROUND DECORATIONS ==================== */
const BackgroundDecorations = () => (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950" />

        {/* Responsive grid pattern */}
        <div
            className="absolute inset-0"
            style={{
                backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
            }}
        />

        {/* Animated blobs - mas maliit sa mobile, lumalaki sa desktop */}
        <div
            className="absolute -left-[10%] -top-[10%] h-64 w-64 animate-pulse rounded-full bg-blue-600/10 blur-[80px] sm:h-80 sm:w-80 md:h-[30vw] md:w-[30vw] md:blur-[120px] lg:h-[40vw] lg:w-[40vw]"
            style={{ maxWidth: "600px", maxHeight: "600px" }}
        />
        <div
            className="absolute -bottom-[10%] -right-[10%] h-64 w-64 animate-pulse rounded-full bg-blue-400/10 blur-[80px] sm:h-80 sm:w-80 md:h-[30vw] md:w-[30vw] md:blur-[120px] lg:h-[40vw] lg:w-[40vw]"
            style={{ maxWidth: "600px", maxHeight: "600px", animationDelay: "2s" }}
        />
    </div>
);

/* ==================== LOGIN SIDE BRANDING ==================== */
const LoginBackgroundSide = () => (
    <div className="relative hidden w-full flex-col items-center justify-center overflow-hidden bg-cover bg-center p-8 lg:flex lg:w-1/2">
        {/* Background image with overlay */}
        <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${image4})` }}
        >
            <div className="absolute inset-0 bg-blue-900/90 backdrop-blur-sm" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
            <motion.img
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src={logo}
                alt="Biliran Provincial Logo"
                className="mb-6 h-24 w-24 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-48 lg:w-48"
            />
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white sm:text-3xl md:text-4xl">
                Biliran <span className="text-blue-400">Province</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm text-blue-100/70 sm:text-base md:text-lg">
                Providing secure and transparent financial support for Biliranons.
            </p>
        </div>
    </div>
);