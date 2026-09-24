"use client";

import { forwardRef, HTMLAttributes } from "react";

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps extends HTMLAttributes<HTMLDivElement> {
  data: BarChartData[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

export const BarChart = forwardRef<HTMLDivElement, BarChartProps>(
  ({ data, maxValue, height = 200, showValues = true, className = "", ...props }, ref) => {
    const max = maxValue || Math.max(...data.map((d) => d.value), 1);
    const barWidth = 100 / data.length;

    return (
      <div ref={ref} className={`flex items-end justify-center gap-2 h-[${height}px] ${className}`} {...props} role="img" aria-label="Bar chart">
        {data.map((item, index) => {
          const barHeight = (item.value / max) * 100;
          return (
            <div key={index} className="flex flex-col items-center w-full" style={{ maxWidth: `${barWidth}%` }}>
              {showValues && (
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {item.value}
                </div>
              )}
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: item.color || "var(--primary-600)",
                  minHeight: barHeight > 0 ? "4px" : "0",
                }}
              />
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center whitespace-nowrap">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

BarChart.displayName = "BarChart";

export interface LineChartData {
  label: string;
  value: number;
}

export interface LineChartProps extends HTMLAttributes<HTMLDivElement> {
  data: LineChartData[];
  height?: number;
  color?: string;
  showPoints?: boolean;
  showArea?: boolean;
}

export const LineChart = forwardRef<HTMLDivElement, LineChartProps>(
  ({ data, height = 200, color = "var(--primary-600)", showPoints = true, showArea = true, className = "", ...props }, ref) => {
    if (data.length === 0) return <div ref={ref} className={className} {...props} />;

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const minValue = Math.min(...data.map((d) => d.value), 0);
    const range = maxValue - minValue || 1;

    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((item.value - minValue) / range) * 100;
      return { x, y, value: item.value };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaPathData = [
      `M ${points[0].x} 100`,
      ...points.map((p) => `L ${p.x} ${p.y}`),
      `L ${points[points.length - 1].x} 100`,
      "Z",
    ].join(" ");

    return (
      <div ref={ref} className={`relative h-[${height}px] ${className}`} {...props} role="img" aria-label="Line chart">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {showArea && (
            <path
              d={areaPathData}
              fill="url(#areaGradient)"
              opacity="0.3"
            />
          )}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={pathData}
            stroke={color}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />
          {showPoints &&
            points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill={color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200 hover:r-5"
              />
            ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 dark:text-slate-400 px-1 -translate-y-1">
          {data.map((item, index) => (
            <div key={index} style={{ width: index === data.length - 1 ? 0 : `${100 / (data.length - 1)}%` }} className="text-center">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

LineChart.displayName = "LineChart";

export interface DoughnutChartProps extends HTMLAttributes<HTMLDivElement> {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}

export const DoughnutChart = forwardRef<HTMLDivElement, DoughnutChartProps>(
  ({ data, size = 160, strokeWidth = 12, showLegend = true, className = "", ...props }, ref) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90;

    const segments = data.map((item) => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const largeArcFlag = angle > 180 ? 1 : 0;
      const radius = (size - strokeWidth) / 2;
      const center = size / 2;

      const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

      return {
        path: `M ${center} ${center - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        percentage: Math.round(percentage * 100),
      };
    });

    return (
      <div ref={ref} className={`flex items-center justify-center gap-6 ${className}`} {...props} role="img" aria-label="Doughnut chart">
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.path}
                stroke={data[index].color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{total}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
            </div>
          </div>
        </div>
        {showLegend && (
          <div className="flex flex-col gap-2 text-sm">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                <span className="font-medium text-slate-900 dark:text-white ml-auto">{item.value}</span>
                <span className="text-slate-500 dark:text-slate-400">({segments[index].percentage}%)</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

DoughnutChart.displayName = "DoughnutChart";