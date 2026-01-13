"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, FileQuestion } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen bg-gray-950 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900 dark:bg-gray-900 border border-gray-800 dark:border-gray-800 rounded-xl p-8 md:p-12 text-center">
          <div className="mb-6">
            <FileQuestion className="w-24 h-24 mx-auto text-gray-600 dark:text-gray-600" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            404
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-300 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or you don't have permission to access it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-6 text-lg">
                <Home className="w-5 h-5 mr-2" />
                Dashboard Home
              </Button>
            </Link>
            <Link href="/">
              <Button 
                variant="outline" 
                className="border-gray-700 text-gray-300 hover:bg-gray-800 px-6 py-6 text-lg"
              >
                Go to Site
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
