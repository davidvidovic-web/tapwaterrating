import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Glass Card */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] rounded-2xl border border-white/20 dark:border-gray-700/50 p-12">
          {/* 404 Number */}
          <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-6">
            404
          </h1>

          {/* Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you're looking for doesn't exist.
          </p>

          {/* Home Button */}
          <Link href="/">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 px-8 py-6 text-lg rounded-xl">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
