"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Cloud, FileText, Share2, Users, Zap, Infinity, Folder } from "lucide-react"
import { Footer } from "@/components/footer"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

export default function Home() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleCreateClick = () => {
    // Mock auth check - in real app, check token/session
    const isAuthenticated = false // Set to true to test redirection

    // Start transition animation
    setIsNavigating(true)

    // Navigate after short animation delay
    setTimeout(() => {
      if (isAuthenticated) {
        router.push("/admin/dashboard")
      } else {
        router.push("/admin/login")
      }
    }, 300)
  }

  return (
    <AnimatePresence mode="wait">
      {!isNavigating && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="min-h-screen bg-white text-gray-900 font-sans"
        >
          {/* Simple Background */}
          <div className="absolute inset-0 -z-10 h-full w-full" style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--primary-50) 30%, transparent), white)' }}>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb0a_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb0a_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          </div>

          {/* Clean Navigation */}
          <div className="px-4 sm:px-6 lg:px-8 pt-3 z-50 relative">
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm mx-auto max-w-5xl"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                {/* Logo + Brand (left) */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                    style={{ background: 'linear-gradient(to bottom right, var(--primary-600), var(--primary-700))' }}
                  >
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">File Uploader Pro</span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                  <Link
                    href="/contact"
                    className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/contact"
                    className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Contact
                  </Link>
                  <Button
                    size="sm"
                    onClick={handleCreateClick}
                    className="h-10 px-6 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                    style={{ background: 'linear-gradient(to right, var(--primary-500), var(--primary-700))' }}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </nav>

                {/* Mobile Get Started (Right) */}
                <div className="md:hidden">
                  <Button
                    size="sm"
                    onClick={handleCreateClick}
                    className="h-9 px-4 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(to right, var(--primary-500), var(--primary-700))' }}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.header>
          </div>

          {/* Hero Section - Simple & Clear */}
          <main className="px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-10 max-w-7xl mx-auto w-full relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                  Collect Files from Anyone,<br className="hidden sm:block" />
                  <span style={{ color: 'var(--primary-600)' }}>Anytime</span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto px-4">
                  Automate file collection with a simple link and get files to your Google Drive directly.
                </p>

                {/* Tags */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-wrap items-center justify-center gap-3 mb-10 px-4"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-full text-xs sm:text-sm font-medium text-primary-700">
                    <Infinity className="w-4 h-4" />
                    No Size Limits
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-full text-xs sm:text-sm font-medium text-primary-700">
                    <Folder className="w-4 h-4" />
                    Support Folder Uploads
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <Button
                  size="lg"
                  onClick={handleCreateClick}
                  className="w-full sm:w-auto h-14 px-8 text-lg text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(to right, var(--primary-500), var(--primary-700))' }}
                >
                  Get Started for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </div>

            {/* How It Works - 3 Simple Steps */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 mb-20 px-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 max-w-6xl mx-auto">
                {/* Step 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-center group"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-primary-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <FileText className="w-10 h-10 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Create Your Form</h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Set up your file collection form in just 2 minutes. Choose colors, add your logo, and customize it your way.
                  </p>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-center group"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-primary-50 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                      <Share2 className="w-10 h-10 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Share the Link</h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Send your form link to anyone. They don't need to create an account or login. Just click and upload.
                  </p>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-center group"
                >
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-primary-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Cloud className="w-10 h-10 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Get Files in Drive</h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    All uploaded files automatically save to your Google Drive folder. You can access them anytime, anywhere.
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Features - Simple & Clear */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-24 mb-20 px-4"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4 tracking-tight">
                Why Choose Us?
              </h2>
              <p className="text-lg text-gray-600 text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
                Everything you need to collect files easily and safely
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {[
                  {
                    icon: Users,
                    title: "No Account Needed",
                    desc: "People can upload files without creating any account. Just click and upload.",
                    color: "bg-blue-50 text-blue-600"
                  },
                  {
                    icon: Shield,
                    title: "Safe & Secure",
                    desc: "Your files are protected with password options and secure storage.",
                    color: "bg-green-50 text-green-600"
                  },
                  {
                    icon: Cloud,
                    title: "Google Drive",
                    desc: "Files automatically save to your Google Drive. No extra storage needed.",
                    color: "bg-purple-50 text-purple-600"
                  },
                  {
                    icon: Zap,
                    title: "Fast & Easy",
                    desc: "Set up in 2 minutes. Works on phone, tablet, and computer.",
                    color: "bg-orange-50 text-orange-600"
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300"
                  >
                    <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </main>

          <Footer />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
