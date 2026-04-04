import React from "react";

export default function Download({ onClose }) {
    const downloadAgent = () => {
        const link = document.createElement("a");
        // Using your VITE environment variable for the backend URL
        link.href = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/DownloadAgent`;
        link.download = "RFID-Bridge.exe";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Header Section - Professional Deep Blue */}
                <div className="relative bg-[#1e40af] p-6 text-white">
                    <div className="absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-orange-500/10"></div>
                    <h2 className="flex items-center gap-2 text-xl font-bold">RFID Bridge Setup Guide</h2>
                    <p className="mt-1 text-xs text-blue-100 opacity-80">Follow these steps to enable your scanner</p>
                </div>

                <div className="p-8">
                    <div className="space-y-6 text-gray-700">
                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-orange-500 font-bold text-white shadow-sm shadow-orange-200">
                                1
                            </div>
                            <div>
                                <p className="text-sm font-bold italic text-slate-800">Download & Relocate</p>
                                <p className="text-xs leading-relaxed text-slate-500">
                                    Download the file and move it to your <strong>Desktop</strong> or a dedicated folder for easy access.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#1e40af] font-bold text-white shadow-sm">
                                2
                            </div>
                            <div>
                                <p className="text-sm font-bold italic text-slate-800">Launch the Agent</p>
                                <p className="text-xs leading-relaxed text-slate-500">
                                    Double-click <strong>RFID-Bridge.exe</strong>. Keep this program running in the background while using the
                                    website.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-orange-500 font-bold text-white shadow-sm shadow-orange-200">
                                3
                            </div>
                            <div>
                                <p className="text-sm font-bold italic text-slate-800">Start Scanning</p>
                                <p className="text-xs leading-relaxed text-slate-500">
                                    Once the console window shows <span className="font-mono font-bold text-green-600">"Connected"</span>, your RFID
                                    scanner is ready for use.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative my-8 border-t border-dashed border-slate-200">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Deployment Ready
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={downloadAgent}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-4 font-black uppercase tracking-wider text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 active:scale-95"
                        >
                            Download Agent
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-2 text-xs font-semibold uppercase tracking-tight text-slate-400 transition-colors hover:text-[#1e40af]"
                        >
                            Return to Dashboard
                        </button>
                    </div>

                    {/* Security Instruction Box */}
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50 p-4">
                        <span className="text-lg text-orange-500">⚠️</span>
                        <p className="text-[10px] leading-tight text-orange-800">
                            <strong>SECURITY NOTE:</strong> If Windows prompts "Windows protected your PC", click <u>More info</u> and then{" "}
                            <u>Run anyway</u>. This is standard for custom hardware bridges.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
