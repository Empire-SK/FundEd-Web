import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'gradient' | 'bordered'
    blur?: 'sm' | 'md' | 'lg' | 'xl'
    gradient?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = 'default', blur = 'md', gradient = false, children, ...props }, ref) => {
        const blurClasses = {
            sm: 'backdrop-blur-sm',
            md: 'backdrop-blur-md',
            lg: 'backdrop-blur-lg',
            xl: 'backdrop-blur-xl',
        }

        const variantClasses = {
            default: 'glass-card',
            gradient: 'glass-card gradient-primary text-white',
            bordered: 'glass-card border-2 border-primary/30',
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-lg",
                    variantClasses[variant],
                    blurClasses[blur],
                    gradient && "gradient-animated",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
