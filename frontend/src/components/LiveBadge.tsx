import { motion } from 'framer-motion';
import { Wifi, Loader2, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '@/types';

export function LiveBadge({ status }: { status: ConnectionStatus }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-up/10 border border-up/30">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-up opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-up" />
        </span>
        <span className="text-xs font-semibold text-up">LIVE</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/10 border border-muted/30">
        <Loader2 size={12} className="animate-spin text-muted" />
        <span className="text-xs font-semibold text-muted">Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-down/10 border border-down/30">
      <WifiOff size={12} className="text-down" />
      <span className="text-xs font-semibold text-down">Disconnected</span>
    </div>
  );
}
