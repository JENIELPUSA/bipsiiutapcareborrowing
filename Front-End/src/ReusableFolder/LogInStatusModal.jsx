import { motion, AnimatePresence } from "framer-motion";

export default function LoginStatusModal({ 
  isOpen, 
  onClose, 
  status = "success",
  customMessage 
}) {
  const isSuccess = status === "success";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[999] p-4 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full relative text-center border border-orange-100"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-orange-600 transition-colors duration-200 text-2xl"
              aria-label="Close modal"
            >
              ✕
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                transition: { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15 
                }
              }}
              className={`mx-auto mb-6 w-24 h-24 flex items-center justify-center rounded-full
                ${isSuccess 
                  ? "bg-gradient-to-br from-orange-100 to-orange-50 border-4 border-orange-200" 
                  : "bg-gradient-to-br from-red-100 to-red-50 border-4 border-red-200"
                } shadow-lg`}
            >
              <motion.span
                animate={{ 
                  scale: [0.8, 1.1, 1],
                  transition: { delay: 0.2 }
                }}
                className={`text-5xl ${isSuccess ? "text-orange-600" : "text-red-500"}`}
              >
                {isSuccess ? "🔓" : "⚠️"}
              </motion.span>
            </motion.div>

            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { delay: 0.3 }
              }}
              className="text-3xl font-bold mb-3 text-gray-900"
            >
              {isSuccess ? "Login Successful!" : "Login Failed!"}
            </motion.h2>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { delay: 0.4 }
              }}
              className="text-gray-600 text-base mb-8 leading-relaxed"
            >
              {customMessage || (
                isSuccess
                  ? "You've successfully accessed your account. Welcome back!"
                  : "Invalid credentials or connection issue. Please check your details and try again."
              )}
            </motion.p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`w-full py-3 px-6 rounded-full text-white font-semibold text-lg
                ${isSuccess 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" 
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                } transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50
                ${isSuccess 
                  ? "focus:ring-orange-300/70" 
                  : "focus:ring-red-300/70"
                } shadow-md`}
            >
              {isSuccess ? "Continue to Dashboard" : "Try Again"}
            </motion.button>
            
            {/* Decorative orange elements */}
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-400 rounded-full opacity-20"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-300 rounded-full opacity-20"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}