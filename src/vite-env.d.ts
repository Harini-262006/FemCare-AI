/// <reference types="vite/client" />

declare module 'recharts' {
  import React from 'react';

  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    children?: React.ReactNode;
    className?: string;
    aspect?: number;
    minWidth?: number;
    minHeight?: number;
    debounce?: number;
    id?: string;
  }

  export const ResponsiveContainer: React.ComponentType<ResponsiveContainerProps>;

  export interface LineChartProps {
    data?: any[];
    children?: React.ReactNode;
    className?: string;
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    syncId?: string | number;
    syncMethod?: 'index' | 'value';
    onClick?: (e: any) => void;
  }

  export const LineChart: React.ComponentType<LineChartProps>;

  export interface AreaChartProps {
    data?: any[];
    children?: React.ReactNode;
    className?: string;
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    syncId?: string | number;
  }

  export const AreaChart: React.ComponentType<AreaChartProps>;

  export interface BarChartProps {
    data?: any[];
    children?: React.ReactNode;
    className?: string;
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
  }

  export const BarChart: React.ComponentType<BarChartProps>;

  export interface LineProps {
    type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter' | string;
    dataKey?: string | number | ((obj: any) => any);
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string | number;
    fill?: string;
    dot?: boolean | any;
    activeDot?: boolean | any;
    animationDuration?: number;
    animationEasing?: string;
    yAxisId?: string | number;
    xAxisId?: string | number;
    name?: string;
  }

  export const Line: React.ComponentType<LineProps>;

  export interface AreaProps {
    type?: 'monotone' | 'linear' | 'step' | string;
    dataKey?: string | number | ((obj: any) => any);
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string | number;
    fill?: string;
    dot?: boolean | any;
    activeDot?: boolean | any;
    animationDuration?: number;
    animationEasing?: string;
    yAxisId?: string | number;
    xAxisId?: string | number;
    name?: string;
  }

  export const Area: React.ComponentType<AreaProps>;

  export interface BarProps {
    dataKey?: string | number | ((obj: any) => any);
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    radius?: number | [number, number, number, number];
    yAxisId?: string | number;
    xAxisId?: string | number;
    name?: string;
  }

  export const Bar: React.ComponentType<BarProps>;

  export interface XAxisProps {
    dataKey?: string | number;
    tick?: any;
    tickLine?: boolean;
    axisLine?: boolean;
    interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd' | string;
    stroke?: string;
    allowDecimals?: boolean;
    domain?: any[];
    type?: 'category' | 'number';
    height?: number;
    width?: number;
    yAxisId?: string | number;
    label?: any;
    ticks?: any[];
  }

  export const XAxis: React.ComponentType<XAxisProps>;

  export interface YAxisProps {
    dataKey?: string | number;
    tick?: any;
    tickLine?: boolean;
    axisLine?: boolean;
    stroke?: string;
    allowDecimals?: boolean;
    domain?: any[];
    type?: 'category' | 'number';
    height?: number;
    width?: number;
    orientation?: 'left' | 'right';
    yAxisId?: string | number;
    label?: any;
    ticks?: any[];
  }

  export const YAxis: React.ComponentType<YAxisProps>;

  export interface CartesianGridProps {
    strokeDasharray?: string | number;
    stroke?: string;
    vertical?: boolean;
    horizontal?: boolean;
  }

  export const CartesianGrid: React.ComponentType<CartesianGridProps>;

  export interface TooltipProps {
    contentStyle?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    itemStyle?: React.CSSProperties;
    formatter?: any;
    labelFormatter?: any;
    content?: any;
    cursor?: any;
  }

  export const Tooltip: React.ComponentType<TooltipProps>;

  export interface LegendProps {
    wrapperStyle?: React.CSSProperties;
    iconType?: 'circle' | 'rect' | 'line' | 'square' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye' | string;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'bottom' | 'middle';
    layout?: 'horizontal' | 'vertical';
  }

  export const Legend: React.ComponentType<LegendProps>;

  export interface ReferenceLineProps {
    x?: any;
    y?: any;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string | number;
    label?: string | any;
    yAxisId?: string | number;
  }

  export const ReferenceLine: React.ComponentType<ReferenceLineProps>;

  export const ComposedChart: React.ComponentType<any>;
  export const PieChart: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Cell: React.ComponentType<any>;
  export const Brush: React.ComponentType<any>;
  export const CartesianAxis: React.ComponentType<any>;
}

declare module 'pdf-parse' {
  function pdfParse(dataBuffer: Buffer, options?: any): Promise<{ text: string; numpages: number; info: any; metadata: any; version: string }>;
  export = pdfParse;
}

declare module 'mammoth' {
  export function extractRawText(options: { buffer: Buffer }): Promise<{ value: string; messages: any[] }>;
}

