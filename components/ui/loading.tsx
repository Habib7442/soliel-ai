import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "primary" | "secondary"
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, text, size = "md", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "size-4",
      md: "size-8",
      lg: "size-12",
    }

    const variantClasses = {
      default: "text-muted-foreground",
      primary: "text-primary",
      secondary: "text-secondary",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          className
        )}
        {...props}
      >
        <div className="relative">
          <div
            className={cn(
              "animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
              sizeClasses[size],
              variantClasses[variant]
            )}
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
        </div>
        {text && (
          <p className={cn("text-sm", variantClasses[variant])}>{text}</p>
        )}
      </div>
    )
  }
)

Loading.displayName = "Loading"

export { Loading }