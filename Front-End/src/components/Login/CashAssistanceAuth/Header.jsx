// Header.jsx

import { motion, AnimatePresence } from "framer-motion";
import { Home, Info, Contact, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "../../../assets/bipsulogo.png";

const Header = ({ scrollToSection, mobileMenuOpen, setMobileMenuOpen }) => {
    return (
        <motion.header
            className="relative z-40 bg-blue-950/95 backdrop-blur-lg border-b border-yellow-500/30 shadow-2xl"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="container mx-auto px-6 sm:px-12 lg:px-20 py-4">
                <div className="flex items-center justify-between">
                    <LogoSection />
                    <DesktopNav scrollToSection={scrollToSection} />
                    <MobileMenuButton 
                        mobileMenuOpen={mobileMenuOpen} 
                        setMobileMenuOpen={setMobileMenuOpen} 
                    />
                </div>

                <MobileMenu 
                    mobileMenuOpen={mobileMenuOpen}
                    scrollToSection={scrollToSection}
                    setMobileMenuOpen={setMobileMenuOpen}
                />
            </div>
        </motion.header>
    );
};

const LogoSection = () => (
    <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        <img 
            src={logo} 
            alt="BiPSU Logo" 
            className="h-12 w-12 object-contain drop-shadow-md" 
        />

        <div className="flex flex-col leading-tight">
            <h1 className="text-[10px] md:text-xs font-bold text-blue-200 uppercase tracking-wider opacity-80">
                Republic of the Philippines
            </h1>

            {/* Updated System Title */}
            <p className="text-yellow-400 font-black text-base md:text-xl tracking-tighter uppercase">
                BiPSU <span className="text-white font-light text-sm md:text-lg tracking-normal">EBS</span>
            </p>

            {/* Updated Subtitle */}
            <p className="hidden md:block text-[9px] text-blue-300/60 uppercase tracking-[0.3em] font-medium">
                Equipment Borrowing System
            </p>
        </div>
    </motion.div>
);

const DesktopNav = ({ scrollToSection }) => {
    const [activeNav, setActiveNav] = useState('home');
    
    const handleNavClick = (section) => {
        setActiveNav(section);
        scrollToSection(section);
    };

    return (
        <nav className="hidden md:flex items-center gap-8">
            <NavItem text="Home" isActive={activeNav === 'home'} onClick={() => handleNavClick('home')} />
            <NavItem text="About" isActive={activeNav === 'about'} onClick={() => handleNavClick('about')} />
            <NavItem text="Contact" isActive={activeNav === 'contact'} onClick={() => handleNavClick('contact')} />
        </nav>
    );
};

const NavItem = ({ text, onClick, isActive }) => (
    <motion.div
        onClick={onClick}
        className={`relative cursor-pointer flex items-center gap-2 py-2 transition-colors ${
            isActive ? "text-yellow-400" : "text-blue-100 hover:text-yellow-200"
        }`}
        whileHover={{ y: -2 }}
    >
        <span className="font-bold tracking-widest text-xs uppercase">{text}</span>
        {isActive && (
            <motion.div 
                layoutId="underline" 
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-yellow-500" 
            />
        )}
    </motion.div>
);

const MobileMenuButton = ({ mobileMenuOpen, setMobileMenuOpen }) => (
    <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-yellow-500 p-2 rounded-lg bg-blue-900/50 border border-blue-700 shadow-inner"
    >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
);

const MobileMenu = ({ mobileMenuOpen, scrollToSection, setMobileMenuOpen }) => {
    const [activeNav, setActiveNav] = useState('home');
    
    const handleMobileNavClick = (section) => {
        setActiveNav(section);
        scrollToSection(section);
        setMobileMenuOpen(false);
    };

    return (
        <AnimatePresence>
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden mt-4 bg-blue-950 border border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl"
                >
                    <div className="p-4 flex flex-col gap-2">
                        <MobileNavItem icon={Home} text="Home" isActive={activeNav === 'home'} onClick={() => handleMobileNavClick('home')} />
                        <MobileNavItem icon={Info} text="About" isActive={activeNav === 'about'} onClick={() => handleMobileNavClick('about')} />
                        <MobileNavItem icon={Contact} text="Contact" isActive={activeNav === 'contact'} onClick={() => handleMobileNavClick('contact')} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const MobileNavItem = ({ icon: Icon, text, onClick, isActive }) => (
    <div 
        onClick={onClick}
        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
            isActive ? "bg-blue-900 text-yellow-400 border border-yellow-500/20" : "text-blue-100 hover:bg-blue-900/50"
        }`}
    >
        <Icon size={20} className={isActive ? "text-yellow-400" : "text-blue-400"} />
        <span className="font-bold uppercase text-xs tracking-[0.2em]">{text}</span>
    </div>
);

export default Header;