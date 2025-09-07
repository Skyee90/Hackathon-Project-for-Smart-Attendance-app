import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  children?: React.ReactNode;
  color?: "primary" | "accent" | "secondary" | "destructive";
  animated?: boolean;
}

export function ProgressCircle({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  children,
  color = "primary",
  animated = true,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return "stroke-primary";
      case "accent":
        return "stroke-accent";
      case "secondary":
        return "stroke-secondary";
      case "destructive":
        return "stroke-destructive";
      default:
        return "stroke-primary";
    }
  };

  const getGlowColor = (color: string) => {
    switch (color) {
      case "primary":
        return "drop-shadow-[0_0_10px_hsl(195,100%,50%)]";
      case "accent":
        return "drop-shadow-[0_0_10px_hsl(142,76%,36%)]";
      case "secondary":
        return "drop-shadow-[0_0_10px_hsl(260,60%,65%)]";
      case "destructive":
        return "drop-shadow-[0_0_10px_hsl(0,62%,55%)]";
      default:
        return "drop-shadow-[0_0_10px_hsl(195,100%,50%)]";
    }
  };

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      data-testid="progress-circle"
    >
      {/* Background Circle */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.2}
        />
        
        {/* Progress track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            getColorClasses(color),
            getGlowColor(color),
            animated && "transition-all duration-1000 ease-out"
          )}
          style={{
            filter: `drop-shadow(0 0 ${strokeWidth}px currentColor)`,
          }}
        />
      </svg>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              color === "primary" && "text-primary",
              color === "accent" && "text-accent",
              color === "secondary" && "text-secondary",
              color === "destructive" && "text-destructive"
            )}>
              {Math.round(value)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressRingProps extends ProgressCircleProps {
  label?: string;
  description?: string;
}

export function ProgressRing({
  label,
  description,
  children,
  ...props
}: ProgressRingProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <ProgressCircle {...props}>
        {children}
      </ProgressCircle>
      {label && (
        <div className="text-center">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface ProgressStatsProps {
  stats: Array<{
    label: string;
    value: number;
    color?: "primary" | "accent" | "secondary" | "destructive";
    description?: string;
  }>;
  size?: number;
  className?: string;
}

export function ProgressStats({ stats, size = 80, className }: ProgressStatsProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <ProgressRing
          key={index}
          value={stat.value}
          size={size}
          color={stat.color}
          label={stat.label}
          description={stat.description}
          animated={true}
          data-testid={`progress-stat-${index}`}
        />
      ))}
    </div>
  );
}
