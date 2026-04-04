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
  isProduction = false, // New prop to indicate production mode
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
      // Auto-close on success if duration is provided
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
          {/* Backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 pointer-events-none">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto relative border border-gray-200/50 dark:border-gray-700/50"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-700/50" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 hover:rotate-90 group"
                aria-label="Close modal"
              >
                <X size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* Content */}
              <div className="p-8">
                {/* Icon */}
                <motion.div
                  variants={iconVariants}
                  className={`relative mx-auto mb-6 w-28 h-28 flex items-center justify-center rounded-full
                    ${isSuccess 
                      ? "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 border-[6px] border-emerald-50 dark:border-emerald-900/20" 
                      : "bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30 border-[6px] border-rose-50 dark:border-rose-900/20"
                    }`}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-full blur-lg opacity-50 ${
                    isSuccess ? "bg-emerald-400" : "bg-rose-400"
                  }`} />
                  
                  {/* Icon container */}
                  <div className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full shadow-lg ${
                    isSuccess 
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600" 
                      : "bg-gradient-to-br from-rose-500 to-rose-600"
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
                  
                  {/* Error Display - Conditional based on production mode */}
                  {!isSuccess && safeError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.5 }}
                      className={`mt-4 p-4 rounded-lg ${
                        isProduction 
                          ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30"
                          : "bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30"
                      }`}
                    >
                      {isProduction ? (
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                              For your security
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              {safeError}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">Error details:</p>
                          <code className="text-xs text-rose-600 dark:text-rose-400 font-mono whitespace-pre-wrap break-words">
                            {safeError}
                          </code>
                          <div className="mt-2 pt-2 border-t border-rose-100 dark:border-rose-800/30">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ⓘ This detailed error is shown because you're in development mode.
                            </p>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* Action button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={onClose}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300
                      ${isSuccess
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                        : "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40"
                      }
                      hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isSuccess ? "focus:ring-emerald-500" : "focus:ring-rose-500"
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
                  
                  {/* Auto-close indicator */}
                  {isSuccess && duration && (
                    <div className="mt-4">
                      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: duration / 1000, ease: "linear" }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                        Closing automatically...
                      </p>
                    </div>
                  )}
                  
                  {/* Production mode indicator */}
                  {isProduction && !isSuccess && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                      Need immediate assistance? Call our support line.
                    </p>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}