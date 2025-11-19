import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, UploadCloud } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            File Uploader
          </h1>
          <p className="text-muted-foreground">
            Secure, fast, and reliable file uploads.
          </p>
        </div>

        <div className="grid gap-4">
          <Link href="/upload">
            <Button size="lg" className="w-full h-14 text-lg gap-2 shadow-lg hover:shadow-xl transition-all">
              <UploadCloud className="w-6 h-6" />
              Upload a File
              <ArrowRight className="w-5 h-5 ml-auto" />
            </Button>
          </Link>

          <Link href="/admin/login">
            <Button variant="outline" size="lg" className="w-full h-14 text-lg gap-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ShieldCheck className="w-6 h-6" />
              Admin Panel
            </Button>
          </Link>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>Protected by enterprise-grade security.</p>
        </div>
      </div>
    </div>
  )
}
