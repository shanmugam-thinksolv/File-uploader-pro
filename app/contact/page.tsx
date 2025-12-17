"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react"
import { Footer } from "@/components/footer"

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-primary-100 flex flex-col">
            {/* Background */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
            </div>

            {/* Header */}
            <div className="px-4 pt-4 z-20">
                <header className="bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-lg mx-auto max-w-7xl">
                    <div className="px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-primary-200 shadow-md">
                                    <span className="text-white font-bold text-lg">F</span>
                                </div>
                                <span className="font-bold text-lg text-gray-900 tracking-tight">File Uploader Pro</span>
                            </Link>
                        </div>

                        <nav className="hidden md:flex items-center gap-8">
                            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                                Home
                            </Link>
                            <Link href="/admin/login">
                                <Button className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
                                    Get Started
                                </Button>
                            </Link>
                        </nav>
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-7xl mx-auto w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Have questions about File Uploader Pro? We're here to help.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 w-full max-w-5xl">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Email Us</p>
                                        <p className="text-gray-600">support@fileuploaderpro.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 shrink-0">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Call Us</p>
                                        <p className="text-gray-600">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Visit Us</p>
                                        <p className="text-gray-600">123 Innovation Drive<br />Tech City, TC 90210</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <form className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="first-name" className="text-sm font-medium text-gray-700">First name</label>
                                    <Input id="first-name" placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="last-name" className="text-sm font-medium text-gray-700">Last name</label>
                                    <Input id="last-name" placeholder="Doe" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                                <Input id="email" type="email" placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-gray-700">Message</label>
                                <Textarea id="message" placeholder="How can we help you?" className="min-h-[120px]" />
                            </div>
                            <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white h-11 rounded-lg">
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
