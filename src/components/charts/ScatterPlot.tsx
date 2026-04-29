import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTranslation } from '../../hooks/useTranslation';
import { RegressionResult } from '../../types';

interface ScatterPlotProps {
  points: { x: number; y: number }[];
  regression: RegressionResult | null;
  width?: number;
  height?: number;
  xLabel: string;
  yLabel: string;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = React.memo(({
  points,
  regression,
  width = 800,
  height = 450,
  xLabel,
  yLabel,
}) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 30, right: 40, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Extents & Padding
    const xExtent = d3.extent(points, (d) => d.x) as [number, number];
    const yExtent = d3.extent(points, (d) => d.y) as [number, number];

    const xPadding = Math.max((xExtent[1] - xExtent[0]) * 0.05, 1);
    const yPadding = Math.max((yExtent[1] - yExtent[0]) * 0.05, 1);

    const xScale = d3
      .scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([innerHeight, 0]);

    // Grid lines
    svg
      .append('g')
      .attr('color', 'rgba(255, 255, 255, 0.05)')
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''))
      .select('.domain')
      .remove();

    svg
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .attr('color', 'rgba(255, 255, 255, 0.05)')
      .call(d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(() => ''))
      .select('.domain')
      .remove();

    // Draw Scatter Points
    svg
      .selectAll('.point')
      .data(points)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('r', 3.5)
      .attr('fill', '#5e6ad2')
      .attr('fill-opacity', 0.6)
      .attr('stroke', '#5e6ad2')
      .attr('stroke-width', 1);

    // Draw Regression Line
    if (regression) {
      const lineX1 = xScale.domain()[0];
      const lineY1 = regression.slope * lineX1 + regression.intercept;
      const lineX2 = xScale.domain()[1];
      const lineY2 = regression.slope * lineX2 + regression.intercept;

      // Draw the line, clipped to the SVG view area implicitly via domains
      svg
        .append('line')
        .attr('x1', xScale(lineX1))
        .attr('y1', yScale(lineY1))
        .attr('x2', xScale(lineX2))
        .attr('y2', yScale(lineY2))
        .attr('stroke', '#f87171') // red-400
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
        
      // Legend / Equation display inside chart
      const legendGroup = svg.append('g').attr('transform', `translate(${innerWidth - 200}, 10)`);
      legendGroup.append('line').attr('x1', 0).attr('x2', 30).attr('y1', 0).attr('y2', 0).attr('stroke', '#f87171').attr('stroke-width', 2).attr('stroke-dasharray', '5,5');
      legendGroup.append('text').attr('x', 35).attr('y', 4).attr('fill', '#8a8f98').style('font-size', '11px').text('回归直线 (Fitted Line)');
    }

    // Axes
    svg
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('color', '#8a8f98')
      .call(d3.axisBottom(xScale).ticks(10))
      .select('.domain')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    svg
      .append('g')
      .attr('color', '#8a8f98')
      .call(d3.axisLeft(yScale).ticks(8))
      .select('.domain')
      .remove();

    // Axis Labels
    svg
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 10)
      .attr('fill', '#8a8f98')
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text(xLabel);

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 18)
      .attr('fill', '#8a8f98')
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text(yLabel);

  }, [points, regression, width, height, xLabel, yLabel, t]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg ref={svgRef} className="w-full h-full max-w-[1000px] max-h-[600px] overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" />
    </div>
  );
});