import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X, AlertTriangle } from "lucide-react";

export default function StatusModal({
  isOpen,
  onClose,
  status = "success",
  error = null,
  title = null,
  message = null,
  duration = null,
  isProduction = false,
}) {
  const isSuccess = status === "success";
  
  // Default titles and messages
  const defaultTitle = isSuccess ? "Operation Successful!" : "Operation Failed";
  const defaultMessage = isSuccess 
    ? "Your request has been processed successfully. You can now proceed with the next steps."
    : "We encountered an issue while processing your request. Please try again or contact support if the problem persists.";
  
  // Safe error message for production
  const getSafeErrorMessage = () => {
    if (!error) return null;
    
    if (isProduction) {
      return "An unexpected error occurred. Please try again later. If the problem persists, contact our support team.";
    }
    
    return error;
  };
  
  const safeError = getSafeErrorMessage();

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.2,
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      }
    },
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (isSuccess && duration) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => (document.body.style.overflow = 'unset');
  }, [isOpen, duration, isSuccess, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - neutral/simplified background */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 pointer-events-none">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto relative"
            >
              {/* BIPSU Decorative top bar - Blue and Yellow */}
              <div className="absolute top-0 left-0 right-0 h-2 rounded-t-2xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-blue-600 via-yellow-500 to-blue-600" />
              </div>
              
              {/* Close button - BIPSU Blue theme */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 hover:text-blue-800 dark:hover:text-blue-300 transition-all duration-200 hover:rotate-90 group"
                aria-label="Close modal"
              >
                <X size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* Content */}
              <div className="p-8">
                {/* Icon - BIPSU themed */}
                <motion.div
                  variants={iconVariants}
                  className={`relative mx-auto mb-6 w-28 h-28 flex items-center justify-center rounded-full
                    ${isSuccess 
                      ? "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 border-[6px] border-blue-50 dark:border-blue-900/20" 
                      : "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 border-[6px] border-yellow-50 dark:border-yellow-900/20"
                    }`}
                >
                  {/* Glow effect - BIPSU colors */}
                  <div className={`absolute inset-0 rounded-full blur-lg opacity-50 ${
                    isSuccess ? "bg-blue-400" : "bg-yellow-500"
                  }`} />
                  
                  {/* Icon container - BIPSU colors */}
                  <div className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full shadow-lg ${
                    isSuccess 
                      ? "bg-gradient-to-br from-blue-600 to-blue-700" 
                      : "bg-gradient-to-br from-yellow-500 to-yellow-600"
                  }`}>
                    {isSuccess ? (
                      <CheckCircle size={48} className="text-white" strokeWidth={1.5} />
                    ) : (
                      <XCircle size={48} className="text-white" strokeWidth={1.5} />
                    )}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-3 text-gray-900 dark:text-white text-center"
                >
                  {title || defaultTitle}
                </motion.h2>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed"
                >
                  <p className="mb-4">{message || defaultMessage}</p>
                  
                  {/* Error Display - BIPSU themed */}
                  {!isSuccess && safeError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.5 }}
                      className={`mt-4 p-4 rounded-lg ${
                        isProduction 
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30"
                          : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30"
                      }`}
                    >
                      {isProduction ? (
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                              For your security
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {safeError}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Error details:</p>
                          <code className="text-xs text-yellow-600 dark:text-yellow-400 font-mono whitespace-pre-wrap break-words">
                            {safeError}
                          </code>
                          <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800/30">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ⓘ This detailed error is shown because you're in development mode.
                            </p>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* Action button - BIPSU Blue/Yellow theme */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={onClose}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300
                      ${isSuccess
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                        : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40"
                      }
                      hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isSuccess ? "focus:ring-blue-500" : "focus:ring-yellow-500"
                      }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSuccess ? (
                        <>
                          Continue
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          {isProduction ? "Contact Support" : "Try Again"}
                        </>
                      )}
                    </span>
                  </button>
                  
                  {/* Auto-close indicator - BIPSU theme */}
                  {isSuccess && duration && (
                    <div className="mt-4">
                      <div className="h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: duration / 1000, ease: "linear" }}
                          className="h-full bg-gradient-to-r from-blue-600 to-yellow-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                        Closing automatically...
                      </p>
                    </div>
                  )}
                  
                  {/* Production mode indicator - BIPSU theme */}
                  {isProduction && !isSuccess && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 text-center mt-4">
                      Need immediate assistance? Call our support line.
                    </p>
                  )}
                </motion.div>

                {/* BIPSU Footer with Blue and Yellow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800/30 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Biliran Province State University
                    </p>
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}