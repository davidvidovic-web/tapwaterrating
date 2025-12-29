import { Droplet } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Droplet className="h-8 w-8 text-blue-500 fill-blue-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-xl font-bold text-gray-900">Tap Water Rating</span>
        <span className="text-xs font-medium text-gray-500 tracking-wider">TWR</span>
      </div>
    </div>
  );
}
