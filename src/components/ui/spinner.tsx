import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Spinner({ className }: { className?: string }) {
  return <Loader2Icon className={cn('size-4 animate-spin', className)} aria-hidden />;
}

export { Spinner };
