export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-auto">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-12 mb-12">
                    {/* Brand & Links */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-md">
                                <span className="text-white font-bold text-lg">F</span>
                            </div>
                            <span className="font-bold text-xl text-gray-900 tracking-tight">File Uploader Pro</span>
                        </div>
                        <p className="text-gray-500 max-w-sm leading-relaxed">
                            The secure, professional way to receive files from anyone. No account required for your clients.
                        </p>
                        <div className="flex gap-6 text-sm font-medium text-gray-600">
                            <a href="#" className="hover:text-indigo-600 transition-colors">Home</a>
                            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                        </div>
                    </div>

                    {/* Find Us Section */}
                    <div className="space-y-6 md:pl-12">
                        <h3 className="text-lg font-bold text-gray-900">Find us</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 min-w-5">
                                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-900">Our Location</p>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        Thinksolv Technologies Pvt Ltd, 1st Floor, Covai Tech Park, Saravanampatti, Coimbatore - 641 049, India.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 min-w-5">
                                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-900">Email Address</p>
                                    <a href="mailto:vikram@thinksolv.com" className="text-indigo-600 hover:text-indigo-700 transition-colors text-sm">
                                        vikram@thinksolv.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 text-center">
                    <p className="text-sm text-gray-400">© {new Date().getFullYear()} File Uploader Pro. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
