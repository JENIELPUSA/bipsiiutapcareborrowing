import React from "react";
import logo from "../../../assets/bipsulogo.png";
import { Mail, Phone, MapPin, Globe, ExternalLink } from "lucide-react";

const FooterQuickAccess = ({ onNavigateToSection }) => {
    const bipsulinks = [
        { name: "BiPSU Official Website", url: "https://bipsu.edu.ph" },
        { name: "CHED Portal", url: "https://ched.gov.ph" },
        { name: "DOST Research", url: "https://www.dost.gov.ph" },
        { name: "PhilGEPS", url: "https://www.philgeps.gov.ph" },
        { name: "GOV.PH", url: "https://www.gov.ph" },
    ];

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const top = element.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: "smooth" });
        }
    };

    const handleNavigate = (pageId) => {
        if (onNavigateToSection) {
            onNavigateToSection(pageId);
            return;
        }
        scrollToSection(pageId);
    };

    return (
        <footer className="bg-blue-950 border-t border-white/10 pt-16 pb-8 text-blue-100">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                    
                    {/* COLUMN 1: BRANDING */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <img src={logo} alt="BiPSU Logo" className="h-16 w-16 object-contain" />
                            <div>
                                <h3 className="text-xl font-black tracking-tighter text-white">
                                    BiPSU <span className="text-yellow-500">EBS</span>
                                </h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                                    Equipment Borrowing System
                                </p>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-blue-200/60 font-medium italic">
                            The official system for managing, tracking, and borrowing university equipment for students and staff.
                        </p>
                    </div>

                    {/* COLUMN 2: QUICK NAV */}
                    <div>
                        <h4 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-yellow-500">
                            Quick Navigation
                        </h4>
                        <ul className="space-y-4 text-sm font-semibold">
                            {["home", "about", "equipment", "borrow"].map((id) => (
                                <li key={id}>
                                    <button 
                                        onClick={() => handleNavigate(id)}
                                        className="hover:text-yellow-500 transition-colors capitalize flex items-center gap-2"
                                    >
                                        <span className="h-1 w-1 rounded-full bg-blue-500" />
                                        {id}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* COLUMN 3: CONTACT INFO */}
                    <div>
                        <h4 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-yellow-500">
                            Contact Us
                        </h4>
                        <ul className="space-y-4 text-sm text-blue-200/80">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-blue-400 shrink-0" />
                                <span>P.I. Garcia St., Naval, Province of Biliran, 6560</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-blue-400 shrink-0" />
                                <span>(053) 500-9035</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-blue-400 shrink-0" />
                                <span>research@bipsu.edu.ph</span>
                            </li>
                        </ul>
                    </div>

                    {/* COLUMN 4: EXTERNAL LINKS */}
                    <div>
                        <h4 className="mb-6 text-sm font-black uppercase tracking-[0.2em] text-yellow-500">
                            External Resources
                        </h4>
                        <ul className="space-y-3">
                            {bipsulinks.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-blue-200/60 hover:text-white flex items-center gap-2 group transition-all"
                                    >
                                        <ExternalLink size={12} className="group-hover:text-yellow-500" />
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* BOTTOM BAR */}
                <div className="mt-16 border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <p className="text-[10px] font-bold text-blue-200/40 uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} Biliran Island State University.
                        </p>
                        <p className="text-[9px] text-blue-200/20 uppercase tracking-tighter">
                            Designed & Developed as Capstone Project Implementation
                        </p>
                    </div>
                    
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-blue-200/40">
                        <span className="hover:text-yellow-500 cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="hover:text-yellow-500 cursor-pointer transition-colors">Terms of Use</span>
                        <span className="hover:text-yellow-500 cursor-pointer transition-colors">University Ethics</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterQuickAccess;