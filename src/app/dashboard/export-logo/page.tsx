"use client";

import { LogoExportable } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardNav } from "@/components/dashboard-nav";

export default function ExportLogoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Export Logo</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Download the TWR logo as a high-resolution PNG</p>
        </div>

        {/* Navigation */}
        <DashboardNav />

        {/* Logo Export Card */}
        <Card className="border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px]">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Logo Assets</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Click the button below to download the logo as a PNG image</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <LogoExportable />
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 rounded-lg border border-white/40 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[3px] p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About the export</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• High resolution (3x scale)</li>
            <li>• Transparent background</li>
            <li>• PNG format</li>
            <li>• Ready for web and print use</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
