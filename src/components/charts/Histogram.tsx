import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useTranslation } from '../../hooks/useTranslation';
import { CapabilityConfig } from '../../types';

interface HistogramProps {
  values: number[];
  width?: number;
  height?: number;
  label: string;
  binCount?: number;
  capabilityConfig?: CapabilityConfig;
}

export const Histogram: React.FC<HistogramProps> = React.memo(({
  values,
  width = 800,
  height = 450,
  label,
  binCount,
  capabilityConfig,
}) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);

  // Auto-calculate optimal bin count using Sturges' rule if not specified
  const effectiveBinCount = useMemo(() => {
    if (binCount) return binCount;
    return Math.max(5, Math.ceil(1 + Math.log2(values.length)));
  }, [values.length, binCount]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear the SVG if there are no values
    if (values.length === 0) {
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    const margin = { top: 30, right: 40, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svgElement = d3.select(svgRef.current);
    svgElement.attr('width', width).attr('height', height);
    
    // Ensure the main container exists
    let mainG = svgElement.select<SVGGElement>('g.main-container');
    if (mainG.empty()) {
      mainG = svgElement.append('g').attr('class', 'main-container');
    }
    mainG.attr('transform', `translate(${margin.left},${margin.top})`);

    // Compute histogram bins
    let xMin = d3.min(values) as number;
    let xMax = d3.max(values) as number;

    if (capabilityConfig) {
      if (capabilityConfig.lsl != null && capabilityConfig.lsl < xMin) xMin = capabilityConfig.lsl;
      if (capabilityConfig.usl != null && capabilityConfig.usl > xMax) xMax = capabilityConfig.usl;
    }

    const padding = Math.max((xMax - xMin) * 0.05, 1);
    const xScale = d3.scaleLinear().domain([xMin - padding, xMax + padding]).range([0, innerWidth]);

    const histogramGenerator = d3
      .bin()
      .domain(xScale.domain() as [number, number])
      .thresholds(xScale.ticks(effectiveBinCount));

    const bins = histogramGenerator(values);
    const yScale = d3.scaleLinear().domain([0, d3.max(bins, (d) => d.length) ?? 0]).range([innerHeight, 0]).nice();

    // ─── Data Join for Grid lines ───
    let gridG = mainG.select<SVGGElement>('g.grid');
    if (gridG.empty()) gridG = mainG.append('g').attr('class', 'grid').attr('color', 'rgba(255, 255, 255, 0.05)');
    gridG.call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '')).select('.domain').remove();

    // ─── Data Join for Bars ───
    mainG.selectAll<SVGRectElement, d3.Bin<number, number>>('rect.bar')
      .data(bins)
      .join('rect')
      .attr('class', 'bar')
      .transition().duration(500)
      .attr('x', (d) => xScale(d.x0 ?? 0) + 1)
      .attr('y', (d) => yScale(d.length))
      .attr('width', (d) => Math.max(0, xScale(d.x1 ?? 0) - xScale(d.x0 ?? 0) - 2))
      .attr('height', (d) => innerHeight - yScale(d.length))
      .attr('fill', '#5e6ad2')
      .attr('fill-opacity', 0.5)
      .attr('stroke', '#5e6ad2')
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // ─── Data Join for Normal Curve ───
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

      const line = d3.line<{ x: number; y: number }>().x((d) => xScale(d.x)).y((d) => yScale(d.y)).curve(d3.curveBasis);

      mainG.selectAll('path.normal-curve')
        .data([normalCurve])
        .join('path')
        .attr('class', 'normal-curve')
        .attr('fill', 'none')
        .attr('stroke', '#f87171')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8)
        .transition().duration(500)
        .attr('d', line);
    } else {
      mainG.select('path.normal-curve').remove();
    }

    // ─── Data Join for Spec Lines ───
    const specs = [];
    if (capabilityConfig) {
      if (capabilityConfig.lsl !== null) specs.push({ val: capabilityConfig.lsl, color: '#ef4444', label: 'LSL' });
      if (capabilityConfig.usl !== null) specs.push({ val: capabilityConfig.usl, color: '#ef4444', label: 'USL' });
      if (capabilityConfig.target !== null) specs.push({ val: capabilityConfig.target, color: '#10b981', label: 'Target' });
    }

    mainG.selectAll('line.spec-line')
      .data(specs)
      .join('line')
      .attr('class', 'spec-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .transition().duration(500)
      .attr('x1', (d) => xScale(d.val))
      .attr('x2', (d) => xScale(d.val));

    mainG.selectAll('text.spec-label')
      .data(specs)
      .join('text')
      .attr('class', 'spec-label')
      .attr('y', 10)
      .attr('fill', (d) => d.color)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text((d) => d.label)
      .transition().duration(500)
      .attr('x', (d) => xScale(d.val) + 4);

    // ─── Axes ───
    let xAxisG = mainG.select<SVGGElement>('g.x-axis');
    if (xAxisG.empty()) xAxisG = mainG.append('g').attr('class', 'x-axis');
    xAxisG.attr('transform', `translate(0,${innerHeight})`)
      .attr('color', '#8a8f98')
      .transition().duration(500)
      .call(d3.axisBottom(xScale).ticks(effectiveBinCount))
      .select('.domain')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    let yAxisG = mainG.select<SVGGElement>('g.y-axis');
    if (yAxisG.empty()) yAxisG = mainG.append('g').attr('class', 'y-axis');
    yAxisG.attr('color', '#8a8f98')
      .transition().duration(500)
      .call(d3.axisLeft(yScale).ticks(5))
      .select('.domain').remove();

    // ─── Labels ───
    if (mainG.select('text.x-label').empty()) {
      mainG.append('text').attr('class', 'x-label').attr('text-anchor', 'middle').attr('fill', '#8a8f98').style('font-size', '12px').style('font-weight', '500');
    }
    mainG.select('text.x-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 10)
      .text(label);

    if (mainG.select('text.y-label').empty()) {
      mainG.append('text').attr('class', 'y-label').attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('fill', '#8a8f98').style('font-size', '12px').style('font-weight', '500');
    }
    mainG.select('text.y-label')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 18)
      .text(t('charts.frequency'));

  }, [values, width, height, label, effectiveBinCount, t, capabilityConfig]);


  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg ref={svgRef} className="w-full h-full max-w-[1000px] max-h-[600px] overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" />
    </div>
  );
});
