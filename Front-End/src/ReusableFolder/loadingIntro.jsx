import { motion } from "framer-motion";
import { Loader2 } from "lucide-react"; 

const FileArchivingLoading = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4 text-white">
        
        {/* Animated Spinner Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
        >
          <Loader2 size={48} className="text-blue-500" />
        </motion.div>

        {/* Loading Text */}
        <motion.p
          className="text-lg font-medium tracking-wide"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
        Please wait...
        </motion.p>
        
      </div>
    </div>
  );
};

export default FileArchivingLoading;