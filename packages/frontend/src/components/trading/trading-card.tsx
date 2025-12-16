import * as React from "react"
import { cn, formatCurrency, formatPercentage, getPnLColor } from "../../lib/utils"

export interface TradingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  change?: number
  changeType?: "currency" | "percentage"
  status?: "active" | "paused" | "stopped" | "error"
  icon?: React.ReactNode
  loading?: boolean
}

const TradingCard = React.forwardRef<HTMLDivElement, TradingCardProps>(
  ({ 
    className, 
    title, 
    value, 
    change, 
    changeType = "percentage",
    status,
    icon,
    loading = false,
    ...props 
  }, ref) => {
    const formatChange = (change: number) => {
      if (changeType === "currency") {
        return formatCurrency(change)
      }
      return formatPercentage(change / 100)
    }

    const getStatusIndicator = (status: string) => {
      const colors = {
        active: "bg-green-500",
        paused: "bg-yellow-500", 
        stopped: "bg-gray-500",
        error: "bg-red-500"
      }
      return colors[status as keyof typeof colors] || "bg-gray-500"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
          className
        )}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
            <div className="flex items-center space-x-2">
              {icon && (
                <div className="text-muted-foreground">
                  {icon}
                </div>
              )}
              {status && (
                <div className="flex items-center space-x-1">
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      getStatusIndicator(status)
                    )}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {status}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {typeof value === "number" ? formatCurrency(value) : value}
            </div>
            
            {change !== undefined && (
              <div className="flex items-center space-x-1">
                <span className={cn("text-sm font-medium", getPnLColor(change))}>
                  {change > 0 ? "+" : ""}{formatChange(change)}
                </span>
                <span className="text-xs text-muted-foreground">
                  from last period
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

TradingCard.displayName = "TradingCard"

export { TradingCard }