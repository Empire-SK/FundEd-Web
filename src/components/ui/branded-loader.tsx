import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons';

interface BrandedLoaderProps {
  className?: string;
  fullscreen?: boolean;
}

export function BrandedLoader({ className, fullscreen = true }: BrandedLoaderProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm",
      fullscreen ? "fixed inset-0 z-50 min-h-screen" : "w-full py-12 min-h-[300px]",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <Logo className="h-16 w-16 text-primary animate-pulse" />
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary animate-fade-in">FundEd</h1>
        </div>
      </div>
      {fullscreen && (
        <div className="absolute bottom-8 text-center text-sm text-muted-foreground animate-fade-in">
          <p>A Sub Product of SKSDM</p>
        </div>
      )}
    </div>
  );
}