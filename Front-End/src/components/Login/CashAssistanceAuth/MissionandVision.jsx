import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Eye, ShieldCheck, Award, ChevronLeft, ChevronRight, HardHat } from "lucide-react";

// Palitan ang mga ito ng actual paths ng pictures ng equipment/campus niyo
const carouselImages = [
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1000", // Sample Lab Equipment
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000", // Sample Facility
  "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=1000", // Sample Tech
];

const MissionAndVision = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play for carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);

  return (
    <section id="about" className="relative py-20 overflow-hidden ">
      <div className="container relative z-10 mx-auto px-6 sm:px-16 lg:px-24">
        
        {/* Header Title */}
        <div className="mb-16 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20"
          >
            <ShieldCheck size={16} className="text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 tracking-[0.2em] uppercase">Equipment Management System</span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            Our <span className="text-yellow-500">Commitment</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Mission & Vision */}
          <motion.div 
            className="order-2 lg:order-1 space-y-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Vision Card */}
            <div className="group p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all duration-500 backdrop-blur-md">
              <div className="flex items-start gap-5">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg group-hover:rotate-6 transition-transform">
                  <Eye className="text-blue-950" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-500 mb-2 uppercase tracking-wider">Vision</h3>
                  <p className="text-blue-100/70 leading-relaxed italic">
                    "A premier State University in the Region of Eastern Visayas, weaving quality research and innovation."
                  </p>
                </div>
              </div>
            </div>

            {/* Mission Card */}
            <div className="group p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-500 backdrop-blur-md">
              <div className="flex items-start gap-5">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg group-hover:-rotate-6 transition-transform">
                  <Target className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-2 uppercase tracking-wider">Mission</h3>
                  <p className="text-blue-100/70 leading-relaxed italic">
                    "BiPSU shall primarily provide advanced education, higher technological, professional instruction and training in various fields."
                  </p>
                </div>
              </div>
            </div>

            {/* Core Values / Goal for Equipment Monitoring */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
                <HardHat className="text-yellow-500" />
                <p className="text-sm text-yellow-200/60 font-medium">Ensuring accountability and efficiency in every resource.</p>
            </div>
          </motion.div>

          {/* Right Side: Picture Carousel */}
          <motion.div 
            className="order-1 lg:order-2 relative group"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative h-[350px] md:h-[450px] w-full rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={carouselImages[currentIndex]}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent" />

              {/* Carousel Controls */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                <button onClick={prevSlide} className="p-2 rounded-full bg-white/10 hover:bg-yellow-500 transition-colors backdrop-blur-md">
                  <ChevronLeft className="text-white" size={20} />
                </button>
                <button onClick={nextSlide} className="p-2 rounded-full bg-white/10 hover:bg-yellow-500 transition-colors backdrop-blur-md">
                  <ChevronRight className="text-white" size={20} />
                </button>
              </div>

              {/* Image Indicators */}
              <div className="absolute bottom-8 left-8 flex gap-2">
                {carouselImages.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "w-8 bg-yellow-500" : "w-2 bg-white/30"}`} 
                  />
                ))}
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-yellow-500 text-blue-950 font-black px-6 py-2 rounded-2xl rotate-12 shadow-xl">
              BiPSU PRIDE
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default MissionAndVision;