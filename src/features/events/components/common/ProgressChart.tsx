import React, { useState, useEffect, useRef } from 'react';
import { ProgressMetric } from '@features/events/types/user.types';
import { ChartSeries, ChartDataPoint, statisticsService } from '@features/events/services/statisticsService';

interface ProgressChartProps {
  userId: string;
  metrics: ProgressMetric[];
  days?: number;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  className?: string;
  onDataPointClick?: (point: ChartDataPoint, metric: ProgressMetric) => void;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  userId,
  metrics,
  days = 30,
  height = 300,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  className = '',
  onDataPointClick
}) => {
  const [chartData, setChartData] = useState<{ [key in ProgressMetric]?: ChartSeries }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: ChartDataPoint;
    metric: ProgressMetric;
    x: number;
    y: number;
  } | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChartData();
  }, [userId, metrics, days]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsService.getProgressChartData(userId, metrics, days);
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const getChartDimensions = () => {
    const width = containerRef.current?.clientWidth || 600;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    
    return {
      width,
      height,
      padding,
      chartWidth: width - padding.left - padding.right,
      chartHeight: height - padding.top - padding.bottom
    };
  };

  const getScales = () => {
    const allData = Object.values(chartData).flatMap(series => series?.data || []);
    if (allData.length === 0) return null;

    const dates = allData.map(d => d.date.getTime());
    const values = allData.map(d => d.value);

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const minValue = Math.min(0, Math.min(...values));
    const maxValue = Math.max(...values);

    const { chartWidth, chartHeight } = getChartDimensions();

    return {
      xScale: (date: Date) => ((date.getTime() - minDate) / (maxDate - minDate)) * chartWidth,
      yScale: (value: number) => chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight,
      minDate: new Date(minDate),
      maxDate: new Date(maxDate),
      minValue,
      maxValue
    };
  };

  const generatePath = (data: ChartDataPoint[], scales: any): string => {
    if (data.length === 0) return '';

    const pathCommands = data.map((point, index) => {
      const x = scales.xScale(point.date);
      const y = scales.yScale(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    return pathCommands.join(' ');
  };

  const generateAreaPath = (data: ChartDataPoint[], scales: any): string => {
    if (data.length === 0) return '';

    const { chartHeight } = getChartDimensions();
    const linePath = generatePath(data, scales);
    
    if (!linePath) return '';

    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];
    
    const startX = scales.xScale(firstPoint.date);
    const endX = scales.xScale(lastPoint.date);
    
    return `${linePath} L ${endX} ${chartHeight} L ${startX} ${chartHeight} Z`;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const { padding } = getChartDimensions();
    const chartX = x - padding.left;
    const chartY = y - padding.top;

    const scales = getScales();
    if (!scales) return;

    // Find closest data point
    let closestPoint: { point: ChartDataPoint; metric: ProgressMetric; distance: number } | null = null;

    Object.entries(chartData).forEach(([metric, series]) => {
      if (!series) return;

      series.data.forEach(point => {
        const pointX = scales.xScale(point.date);
        const pointY = scales.yScale(point.value);
        const distance = Math.sqrt(Math.pow(chartX - pointX, 2) + Math.pow(chartY - pointY, 2));

        if (distance < 20 && (!closestPoint || distance < closestPoint.distance)) {
          closestPoint = {
            point,
            metric: metric as ProgressMetric,
            distance
          };
        }
      });
    });

    if (closestPoint) {
      setHoveredPoint({
        point: closestPoint.point,
        metric: closestPoint.metric,
        x: event.clientX,
        y: event.clientY
      });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!onDataPointClick || !hoveredPoint) return;
    onDataPointClick(hoveredPoint.point, hoveredPoint.metric);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  if (loading) {
    return (
      <div className={`progress-chart loading ${className}`}>
        <div className="chart-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`progress-chart error ${className}`}>
        <div className="chart-error">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            className="retry-button"
            onClick={fetchChartData}
            aria-label="Retry loading chart"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dimensions = getChartDimensions();
  const scales = getScales();

  if (!scales || Object.keys(chartData).length === 0) {
    return (
      <div className={`progress-chart empty ${className}`}>
        <div className="chart-empty">
          <span className="empty-icon" aria-hidden="true">📊</span>
          <span className="empty-message">No data available</span>
          <span className="empty-subtitle">Start participating to see your progress!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`progress-chart ${className}`} ref={containerRef}>
      <div className="chart-header">
        <h4 className="chart-title">Progress Over Time</h4>
        <span className="chart-period">{days} days</span>
      </div>

      <div className="chart-container" style={{ height: `${height}px` }}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="chart-svg"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="chart-grid">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = dimensions.padding.top + ratio * dimensions.chartHeight;
                const value = scales.minValue + (scales.maxValue - scales.minValue) * (1 - ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={dimensions.padding.left}
                      y1={y}
                      x2={dimensions.padding.left + dimensions.chartWidth}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                    <text
                      x={dimensions.padding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#6b7280"
                    >
                      {formatValue(value)}
                    </text>
                  </g>
                );
              })}

              {/* Vertical grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const x = dimensions.padding.left + ratio * dimensions.chartWidth;
                const date = new Date(
                  scales.minDate.getTime() + 
                  (scales.maxDate.getTime() - scales.minDate.getTime()) * ratio
                );
                return (
                  <g key={ratio}>
                    <line
                      x1={x}
                      y1={dimensions.padding.top}
                      x2={x}
                      y2={dimensions.padding.top + dimensions.chartHeight}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={dimensions.padding.top + dimensions.chartHeight + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#6b7280"
                    >
                      {formatDate(date)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Chart data */}
          <g className="chart-data" transform={`translate(${dimensions.padding.left}, ${dimensions.padding.top})`}>
            {Object.entries(chartData).map(([metric, series]) => {
              if (!series || series.data.length === 0) return null;

              const path = generatePath(series.data, scales);
              const areaPath = series.type === 'area' ? generateAreaPath(series.data, scales) : '';

              return (
                <g key={metric} className={`chart-series series-${metric}`}>
                  {/* Area fill */}
                  {areaPath && (
                    <path
                      d={areaPath}
                      fill={series.color}
                      fillOpacity="0.1"
                    />
                  )}

                  {/* Line */}
                  <path
                    d={path}
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data points */}
                  {series.data.map((point, index) => (
                    <circle
                      key={index}
                      cx={scales.xScale(point.date)}
                      cy={scales.yScale(point.value)}
                      r="4"
                      fill={series.color}
                      stroke="white"
                      strokeWidth="2"
                      className="chart-point"
                    />
                  ))}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {showTooltip && hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{
              position: 'fixed',
              left: hoveredPoint.x + 10,
              top: hoveredPoint.y - 10,
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            <div className="tooltip-content">
              <div className="tooltip-metric">
                {statisticsService['getMetricDisplayName'](hoveredPoint.metric)}
              </div>
              <div className="tooltip-value">
                {formatValue(hoveredPoint.point.value)}
              </div>
              <div className="tooltip-date">
                {formatDate(hoveredPoint.point.date)}
              </div>
              {hoveredPoint.point.label && (
                <div className="tooltip-label">
                  {hoveredPoint.point.label}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="chart-legend">
          {Object.entries(chartData).map(([metric, series]) => {
            if (!series) return null;
            
            return (
              <div key={metric} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: series.color }}
                  aria-hidden="true"
                ></div>
                <span className="legend-label">{series.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};