import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { GraduationCap } from "lucide-react";
import background from "../../../assets/background.png";
import logo from "../../../assets/bipsulogo.png";
import LoginForm from "../CashAssistanceAuth/LoginForm";
import LoginStatusModal from "../../../ReusableFolder/LogInStatusModal";
import { AuthContext } from "../../../contexts/AuthContext";

const HeroSection = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const ref = useRef(null);
    const [showLogin, setShowLogin] = useState(false);
    const [formValues, setFormValues] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [loginStatus, setLoginStatus] = useState({ show: false, status: "", message: "" });

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0px", "200px"]);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const response = await login(formValues.email, formValues.password);
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
        if (loginStatus.status === "success") {
            navigate("/dashboard");
        }
    };

    const handleLoginClick = () => {
        setShowLogin(true);
        window.scrollTo(0, 0);
    };

    return (
        <section
            ref={ref}
            className="relative flex min-h-screen items-center overflow-hidden bg-[#020617]"
        >
            {/* BACKGROUND */}
            <motion.div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    y: bgY,
                }}
            >
                <div className="absolute inset-0 bg-blue-950/90"></div>
            </motion.div>

            <div className="container relative z-10 mx-auto px-6 py-8 md:py-12">
                <div
                    className={`flex min-h-[600px] flex-col items-stretch transition-all duration-700 lg:flex-row ${
                        showLogin ? "justify-between lg:gap-24 xl:gap-32" : "justify-center"
                    }`}
                >
                    {/* LEFT SIDE - HERO CONTENT */}
                    <motion.div
                        layout
                        className={`w-full ${
                            showLogin
                                ? "mb-8 text-left lg:mb-0 lg:w-1/3 lg:pl-16"
                                : "text-center lg:max-w-xl"
                        }`}
                    >
                        <div className={`flex ${showLogin ? "justify-start" : "justify-center"} mb-8`}>
                            <motion.img
                                src={logo}
                                alt="logo"
                                className="h-32 w-32 md:h-44 md:w-44"
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                        </div>

                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-bold uppercase text-yellow-500">
                            <GraduationCap size={18} />
                            Smart Equipment Management
                        </div>

                        {/* SYSTEM TITLE */}
                        <h1 className="mb-4 text-6xl font-black text-white md:text-8xl">
                            BISU<span className="text-yellow-500">EBS</span>
                        </h1>

                        {/* SUBTITLE */}
                        <h2 className="mb-8 text-xl font-bold text-white md:text-3xl">
                            Equipment Borrowing System of{" "}
                            <span className="text-yellow-400">BiPSU</span>
                        </h2>

                        {/* TAGLINE */}
                        <p className="mb-12 italic text-blue-100/60">
                            "Simplifying the borrowing, tracking, and management of university equipment."
                        </p>

                        {!showLogin && (
                            <button
                                onClick={handleLoginClick}
                                className="rounded-lg bg-yellow-500 px-8 py-3 font-bold text-black transition hover:bg-yellow-400"
                            >
                                Login
                            </button>
                        )}
                    </motion.div>

                    {/* Login Status Modal */}
                    <LoginStatusModal
                        isOpen={loginStatus.show}
                        onClose={handleModalClose}
                        status={loginStatus.status}
                        customMessage={loginStatus.message}
                    />

                    {/* RIGHT SIDE - LOGIN FORM */}
                    {showLogin && (
                        <div className="flex w-full items-center lg:w-3/5">
                            <div className="mx-auto w-full max-w-md lg:ml-auto">
                                <LoginForm
                                    show={showLogin}
                                    values={formValues}
                                    handleInput={handleInput}
                                    handleLoginSubmit={handleLoginSubmit}
                                    isLoading={isLoading}
                                    handleBackToHome={() => setShowLogin(false)}
                                    position="right"
                                    loginStatus={loginStatus}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;