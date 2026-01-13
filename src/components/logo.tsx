"use client";

import { Droplets } from "lucide-react";
import { useRef } from "react";

export function Logo() {
  return (
    <div className="logo-glass backdrop-blur flex items-center gap-3 px-5 h-[64px] rounded-full">
      <div className="rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-2">
        <Droplets className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-bold text-gray-800 dark:text-gray-100">TWR</span>
    </div>
  );
}

export function LogoExportable({ onExport }: { onExport?: (dataUrl: string) => void }) {
  const handleExport = () => {
    // Create SVG string with larger Lucide Droplets icon (no text)
    const svg = `
      <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Circle background -->
        <circle cx="40" cy="40" r="36" fill="url(#logoGradient)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
        
        <!-- Lucide Droplets icon - larger -->
        <g transform="translate(20, 20) scale(1.667)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
          <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
        </g>
      </svg>
    `.trim();

    // Convert SVG to data URL
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    if (onExport) {
      onExport(url);
    } else {
      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = "twr-logo.svg";
      link.click();
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="inline-flex items-center gap-2">
        <div className="rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-2 shadow-md">
          <Droplets className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">TWR</span>
      </div>
      <button
        onClick={handleExport}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Download Logo (SVG)
      </button>
    </div>
  );
}
