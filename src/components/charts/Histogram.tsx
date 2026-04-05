import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useTranslation } from '../../hooks/useTranslation';

interface HistogramProps {
  values: number[];
  width?: number;
  height?: number;
  label: string;
  binCount?: number;
}

export const Histogram: React.FC<HistogramProps> = ({
  values,
  width = 800,
  height = 450,
  label,
  binCount,
}) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);

  // Auto-calculate optimal bin count using Sturges' rule if not specified
  const effectiveBinCount = useMemo(() => {
    if (binCount) return binCount;
    return Math.max(5, Math.ceil(1 + Math.log2(values.length)));
  }, [values.length, binCount]);

  useEffect(() => {
    if (!svgRef.current || values.length === 0) return;

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

    // Compute histogram bins
    const xExtent = d3.extent(values) as [number, number];
    const padding = (xExtent[1] - xExtent[0]) * 0.05;

    const xScale = d3
      .scaleLinear()
      .domain([xExtent[0] - padding, xExtent[1] + padding])
      .range([0, innerWidth]);

    const histogramGenerator = d3
      .bin()
      .domain(xScale.domain() as [number, number])
      .thresholds(xScale.ticks(effectiveBinCount));

    const bins = histogramGenerator(values);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length) ?? 0])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    svg
      .append('g')
      .attr('color', 'rgba(255, 255, 255, 0.05)')
      .call(
        d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '')
      )
      .select('.domain')
      .remove();

    // Draw bars
    svg
      .selectAll('.bar')
      .data(bins)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(d.x0 ?? 0) + 1)
      .attr('y', (d) => yScale(d.length))
      .attr('width', (d) => Math.max(0, xScale(d.x1 ?? 0) - xScale(d.x0 ?? 0) - 2))
      .attr('height', (d) => innerHeight - yScale(d.length))
      .attr('fill', '#5e6ad2')
      .attr('fill-opacity', 0.5)
      .attr('stroke', '#5e6ad2')
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // Normal distribution overlay curve
    const mean = d3.mean(values) ?? 0;
    const stdev = Math.sqrt(d3.sum(values, (v) => (v - mean) ** 2) / (values.length - 1));
    const binWidth = bins[0] ? (bins[0].x1 ?? 0) - (bins[0].x0 ?? 0) : 1;
    const totalArea = values.length * binWidth;

    if (stdev > 0) {
      const normalCurve = d3.range(xScale.domain()[0], xScale.domain()[1], (xScale.domain()[1] - xScale.domain()[0]) / 200).map((x) => {
        const exponent = -0.5 * ((x - mean) / stdev) ** 2;
        const y = (totalArea / (stdev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
        return { x, y };
      });

      const line = d3
        .line<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(d3.curveBasis);

      svg
        .append('path')
        .datum(normalCurve)
        .attr('fill', 'none')
        .attr('stroke', '#f87171')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8)
        .attr('d', line);

      // Legend
      svg.append('line').attr('x1', innerWidth - 110).attr('x2', innerWidth - 80).attr('y1', 10).attr('y2', 10).attr('stroke', '#f87171').attr('stroke-width', 2);
      svg.append('text').attr('x', innerWidth - 75).attr('y', 14).attr('fill', '#8a8f98').style('font-size', '11px').text(t('charts.normalFit'));
    }

    // Axes
    svg
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('color', '#8a8f98')
      .call(d3.axisBottom(xScale).ticks(effectiveBinCount))
      .select('.domain')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    svg
      .append('g')
      .attr('color', '#8a8f98')
      .call(d3.axisLeft(yScale).ticks(5))
      .select('.domain')
      .remove();

    // Axis labels
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 10)
      .attr('fill', '#8a8f98')
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text(label);

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 18)
      .attr('fill', '#8a8f98')
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text(t('charts.frequency'));

  }, [values, width, height, label, effectiveBinCount, t]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg ref={svgRef} className="w-full h-full max-w-[1000px] max-h-[600px] overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" />
    </div>
  );
};
