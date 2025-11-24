"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Globe, FileText, Cloud, Lock } from "lucide-react"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"

export default function Home() {
  const router = useRouter()

  const handleCreateClick = () => {
    // Mock auth check - in real app, check token/session
    const isAuthenticated = false // Set to true to test redirection

    if (isAuthenticated) {
      router.push("/admin/dashboard")
    } else {
      router.push("/admin/login")
    }
  }

  // Animation variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const floatVariants: any = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100 overflow-hidden">
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-400 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-purple-400 opacity-20 blur-[100px]"></div>
      </div>

      {/* Navigation - Floating Island Design */}
      <div className="px-4 pt-4 z-50 relative">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-sm mx-auto max-w-7xl sticky top-4"
        >
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-md">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="font-bold text-lg text-gray-900 tracking-tight">File Uploader Pro</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Product
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Security
              </Link>
              <Link href="#" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Pricing
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Contact
              </Link>
              <div className="h-4 w-px bg-gray-200"></div>
              <Link href="/admin/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Log in
              </Link>
              <Link href="/admin/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </motion.header>
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-between px-4 pt-16 pb-24 max-w-7xl mx-auto w-full relative z-10 gap-12">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start text-left md:w-1/2"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: Google Drive Integration
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
            File collection, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">
              reimagined.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
            The secure, professional way to receive files from anyone.
            No account required for your clients. Direct to your storage.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 mb-20">
            <Button
              size="lg"
              onClick={handleCreateClick}
              className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              Create Your Upload Page
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all">
              View Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Animated Hero Graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative w-full md:w-1/2 h-[400px] md:h-[500px] mb-20 md:mb-0"
        >
          {/* Central Hub */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-2xl shadow-2xl flex items-center justify-center z-20 border border-gray-100"
            animate={{ boxShadow: ["0px 10px 30px rgba(79, 70, 229, 0.1)", "0px 10px 50px rgba(79, 70, 229, 0.2)", "0px 10px 30px rgba(79, 70, 229, 0.1)"] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Cloud className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Orbiting Files */}
          {[
            { icon: FileText, color: "text-blue-500", bg: "bg-blue-50", delay: 0, x: -140, y: -80 },
            { icon: Shield, color: "text-green-500", bg: "bg-green-50", delay: 1, x: 140, y: -60 },
            { icon: Lock, color: "text-orange-500", bg: "bg-orange-50", delay: 2, x: -100, y: 100 },
            { icon: Zap, color: "text-yellow-500", bg: "bg-yellow-50", delay: 3, x: 120, y: 90 },
          ].map((item, index) => (
            <motion.div
              key={index}
              className={`absolute left-1/2 top-1/2 w-16 h-16 ${item.bg} rounded-2xl shadow-lg flex items-center justify-center border border-white z-10`}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: item.x,
                y: item.y,
                opacity: 1,
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                delay: 0.5 + (index * 0.1),
                duration: 0.8,
                rotate: {
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut",
                  delay: index
                }
              }}
            >
              <item.icon className={`w-8 h-8 ${item.color}`} />

              {/* Connection Line */}
              <motion.div
                className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-200 to-transparent origin-left -z-10"
                style={{
                  width: Math.sqrt(item.x * item.x + item.y * item.y),
                  transform: `rotate(${Math.atan2(-item.y, -item.x) * (180 / Math.PI)}deg) translate(0, -50%)`
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 1 + (index * 0.2), duration: 0.5 }}
              />
            </motion.div>
          ))}

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-indigo-400 rounded-full opacity-30"
              style={{
                left: `${50 + (Math.random() * 60 - 30)}%`,
                top: `${50 + (Math.random() * 60 - 30)}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>
      </main>

      {/* Feature Grid */}
      <div className="px-4 pb-24 max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-8 w-full text-left">
          {[
            { icon: Zap, title: "Lightning Fast", desc: "Drag, drop, done. We handle large files with ease so you don't have to.", color: "blue" },
            { icon: Shield, title: "Bank-Grade Security", desc: "Password protection and encryption ensure your data stays private.", color: "green" },
            { icon: Globe, title: "Global Access", desc: "Share your link with anyone, anywhere. No login barriers for uploaders.", color: "purple" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-indigo-100 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`w-14 h-14 bg-${feature.color}-50 rounded-2xl flex items-center justify-center mb-6 text-${feature.color}-600`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>

      <Footer />
    </div>
  )
}
