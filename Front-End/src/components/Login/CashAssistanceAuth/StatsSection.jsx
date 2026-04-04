import { motion, useInView, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { 
  FileText, Users, CheckCircle, BookOpen, 
  Search, Clock, Award, BarChart3 
} from "lucide-react";

// Placeholder Images for different carousels
const manuscriptImages = [
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1000",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000"
];

const collaborationImages = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000"
];

const recognitionImages = [
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000"
];

const StatsSection = () => {
  const statsData = [
    { icon: FileText, value: 1250, title: "Digitized Manuscripts", color: "from-blue-800 to-blue-950", suffix: "+" },
    { icon: CheckCircle, value: 98, title: "Review Efficiency", color: "from-yellow-500 to-yellow-600", suffix: "%" },
    { icon: Users, value: 450, title: "Active Contributors", color: "from-blue-700 to-blue-900", suffix: "" },
    { icon: BookOpen, value: 15, title: "Supported Programs", color: "from-yellow-400 to-yellow-500", suffix: "+" }
  ];

  const impactPoints = [
    { icon: Search, title: "Instant Discovery", desc: "Access BiPSU’s entire research history in seconds." },
    { icon: Clock, title: "Streamlined Review", desc: "Reduce the time from submission to approval." },
    { icon: Award, title: "Quality Assurance", desc: "Centralized feedback for superior output." },
    { icon: BarChart3, title: "Data Insights", desc: "Track research trends and university impact." },
  ];

  return (
    <section className="relative overflow-hidden py-10 md:py-14">
      {/* Background decorative elements */}



      {/* Main container with max width, centered, and rounded borders */}
      <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* Outer card with rounded borders */}
        <div className="bg-white rounded-[2rem] border border-white/30 shadow-xl p-6 md:p-8">
          
          {/* Header - mas pinanipis */}
          <SectionHeader 
            title="System Impact" 
            description="Empowering BiPSU's research community through centralized, efficient, and visual digital management."
          />

          {/* Carousel Grid - Responsive: 1 column mobile, 3 columns desktop */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10 md:mb-12">
            <ImpactCarousel images={manuscriptImages} title="Digital Library" icon={FileText} color="bg-blue-600" />
            <ImpactCarousel images={collaborationImages} title="Mentor-Mentee Flow" icon={Users} color="bg-yellow-500" />
            <ImpactCarousel images={recognitionImages} title="Research Excellence" icon={Award} color="bg-blue-700" />
          </div>

          {/* Stats & Impact Grid - Responsive stacking */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
            {/* Stats Cards - 2 columns on tablet, 1 on mobile */}
            <div className="w-full lg:w-2/3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {statsData.map((stat, index) => (
                  <StatCard key={index} stat={stat} index={index} />
                ))}
              </div>
            </div>

            {/* Impact Points Card - mas maliit na padding at text */}
            <motion.div 
              className="w-full lg:w-1/3 bg-white/90 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-blue-100 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-xl sm:text-2xl font-black text-blue-950 mb-4 tracking-tight">
                Empowering Scholars
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {impactPoints.map((point, i) => (
                  <div key={i} className="flex gap-2 sm:gap-3 items-start">
                    <div className="flex-shrink-0 p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg text-white shadow-md shadow-yellow-500/30">
                      <point.icon size={14} className="sm:h-4 sm:w-4 text-blue-950" />
                    </div>
                    <div>
                      <h5 className="font-black text-blue-950 text-sm sm:text-base tracking-tight">{point.title}</h5>
                      <p className="text-blue-900/70 text-xs sm:text-sm">{point.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div> {/* End outer card */}
      </div>
    </section>
  );
};

const ImpactCarousel = ({ images, title, icon: Icon, color }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <motion.div 
      className="relative overflow-hidden rounded-xl shadow-lg aspect-[16/10] border-2 border-white group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          alt={`${title} carousel`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent flex flex-col justify-end p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`p-1 rounded-lg ${color} text-white`}>
            <Icon size={12} className="sm:h-3.5 sm:w-3.5" />
          </div>
          <h4 className="text-white font-black text-[0.6rem] sm:text-xs uppercase tracking-wider">{title}</h4>
        </div>
        
        {/* Indicators */}
        <div className="flex gap-1 mt-1 sm:mt-1.5">
          {images.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index ? "w-3 sm:w-4 bg-yellow-400" : "w-1 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, description }) => (
  <motion.div
    className="text-center mb-8 md:mb-10"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-950 mb-2 tracking-tighter">
      {title}
    </h2>
    <div className="h-1 w-16 sm:w-20 bg-yellow-500 mx-auto mb-3 rounded-full shadow-md shadow-yellow-500/30" />
    <p className="text-xs sm:text-sm md:text-base text-blue-900/70 max-w-xl mx-auto px-2 font-medium italic">
      {description}
    </p>
  </motion.div>
);

const StatCard = ({ stat, index }) => {
  const Icon = stat.icon;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (isInView) {
      const startTime = Date.now();
      const updateCount = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 1500, 1);
        setCount(progress * stat.value);
        if (progress < 1) requestAnimationFrame(updateCount);
      };
      requestAnimationFrame(updateCount);
    }
  }, [isInView, stat.value]);

  return (
    <motion.div
      ref={ref}
      className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-blue-50 shadow-md hover:shadow-lg transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.color} mb-2 shadow-md group-hover:scale-110 transition-transform`}>
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
      </div>
      <div className="flex flex-col">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-950 flex items-center mb-0.5">
          {Math.round(count).toLocaleString()}
          <span className="text-yellow-500 ml-0.5 text-sm sm:text-base md:text-lg">{stat.suffix}</span>
        </h3>
        <p className="text-blue-900/60 text-[0.55rem] sm:text-[0.6rem] font-black uppercase tracking-wider">
          {stat.title}
        </p>
      </div>
    </motion.div>
  );
};

export default StatsSection;