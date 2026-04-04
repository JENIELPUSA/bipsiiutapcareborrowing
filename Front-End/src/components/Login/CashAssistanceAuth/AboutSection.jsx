import { motion } from "framer-motion";
import { BookOpen, Code, Lightbulb, Settings, Microscope, Briefcase } from "lucide-react";

const StudentDocumentation = () => {
  const departments = [
    {
      id: 1,
      name: "School of Technology",
      description: "Innovative software solutions and hardware integrations developed by IT and CS students.",
      icon: Code,
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop", 
      count: "450+ Thesis",
      color: "border-blue-500"
    },
    {
      id: 2,
      name: "School of Engineering",
      description: "Mechanical, Civil, and Electrical research projects focused on sustainable infrastructure.",
      icon: Settings,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop",
      count: "320+ Projects",
      color: "border-yellow-500"
    },
    {
      id: 3,
      name: "School of Nursing",
      description: "Clinical studies and community health research papers focused on rural healthcare.",
      icon: Microscope,
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop",
      count: "280+ Studies",
      color: "border-blue-400"
    },
    {
      id: 4,
      name: "School of Management",
      description: "Strategic business models and feasibility studies for local Biliran entrepreneurs.",
      icon: Briefcase,
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop",
      count: "210+ Papers",
      color: "border-yellow-600"
    },
    {
      id: 5,
      name: "School of Education",
      description: "Pedagogical research and innovative teaching modules for modern classrooms.",
      icon: BookOpen,
      image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop",
      count: "380+ Manuscripts",
      color: "border-blue-600"
    },
    {
      id: 6,
      name: "School of Arts & Sciences",
      description: "Socio-cultural research and scientific discoveries from various liberal arts disciplines.",
      icon: Lightbulb,
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop",
      count: "190+ Researches",
      color: "border-yellow-400"
    }
  ];

  return (
    <section className="overflow-hidden py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - mas pinanipis */}
        <div className="mb-8 text-center md:mb-12 lg:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-3 text-2xl font-black tracking-tighter text-white sm:text-3xl md:text-4xl lg:text-5xl"
          >
            Academic <span className="text-yellow-500">Departments</span>
          </motion.h2>
          <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-yellow-500 sm:w-20 md:mb-6 md:w-24 lg:w-28" />
          <p className="mx-auto max-w-xl px-2 text-xs italic text-blue-100/60 sm:text-sm md:text-base lg:max-w-2xl">
            Explore the diverse research contributions of BiPSU students across different academic disciplines.
          </p>
        </div>

        {/* Departments Grid - mas maliit na gaps at card heights */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {departments.map((dept, index) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative h-[300px] overflow-hidden rounded-2xl border-2 ${dept.color}/30 transition-all duration-500 hover:${dept.color} sm:h-[320px] md:h-[340px] lg:h-[360px]`}
            >
              {/* Background Image */}
              <img 
                src={dept.image} 
                alt={dept.name} 
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-blue-950 via-blue-950/80 to-blue-900/50" />

              {/* Content - mas maliit na padding */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-5 md:p-6">
                <div className="mb-2 sm:mb-3">
                  <div className={`mb-2 inline-flex rounded-xl bg-white/10 p-2 backdrop-blur-md border border-white/20 transition-all duration-300 group-hover:bg-yellow-500 group-hover:text-blue-950`}>
                    <dept.icon size={16} className="sm:h-[18px] sm:w-[18px] md:h-5 md:w-5" />
                  </div>
                  <h3 className="mb-1 text-base font-black text-white transition-colors group-hover:text-yellow-400 sm:text-lg md:text-xl">
                    {dept.name}
                  </h3>
                  <p className="text-[0.7rem] leading-relaxed text-blue-100/80 sm:text-xs md:text-sm">
                    {dept.description}
                  </p>
                </div>

                {/* Footer - mas nipis na padding */}
                <div className="flex items-center justify-between border-t border-white/10 pt-2 sm:pt-3">
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest text-yellow-500 sm:text-xs">
                    {dept.count}
                  </span>
                  <button className="text-[0.6rem] font-black uppercase tracking-widest text-white transition-colors hover:text-yellow-400 sm:text-xs">
                    View Archives →
                  </button>
                </div>
              </div>

              {/* Decorative Glow - mas maliit */}
              <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-yellow-500/5 blur-2xl transition-all group-hover:bg-yellow-500/10 sm:h-20 sm:w-20 md:h-24 md:w-24" />
            </motion.div>
          ))}
        </div>

        {/* Summary - mas nipis */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm sm:mt-12 sm:p-6 md:mt-16 md:p-8 lg:mt-20 lg:rounded-3xl"
        >
          <p className="text-[0.65rem] text-blue-200/50 sm:text-xs md:text-sm">
            Total System Capacity: <span className="font-bold text-yellow-500">2,500+ Verified Manuscripts</span> across all departments.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default StudentDocumentation;