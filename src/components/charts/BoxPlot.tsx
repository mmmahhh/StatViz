import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { BoxPlotStats } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

export interface StatsOverlayOptions {
  showMean: boolean;
  showMedian: boolean;
  showMin: boolean;
  showMax: boolean;
  showQ1Q3: boolean;
  showOutliers: boolean;
}

const defaultOverlayOptions: StatsOverlayOptions = {
  showMean: true,
  showMedian: true,
  showMin: true,
  showMax: true,
  showQ1Q3: true,
  showOutliers: true,
};

interface BoxPlotProps {
  data: BoxPlotStats[];
  compareData?: BoxPlotStats[];   // Optional second dataset for comparison
  compareLabel?: string;          // Label for the comparison dataset
  primaryLabel?: string;          // Label for the primary dataset
  width?: number;
  height?: number;
  xAxisLabel: string;
  yAxisLabel: string;
  overlayOptions?: StatsOverlayOptions;
}

// Palette
const COLORS = {
  primary: '#5e6ad2',       // Indigo brand
  compare: '#f59e0b',       // Amber
  whisker: '#e0e2e8',
  outlierFill: '#f87171',
  outlierStroke: '#b91c1c',
  meanLine: '#22d3ee',      // Cyan for mean
  labelText: '#8a8f98',
};

function drawBoxGroup(
  selection: d3.Selection<SVGGElement, BoxPlotStats, SVGGElement, unknown>,
  xOffset: number,
  boxWidth: number,
  yScale: d3.ScaleLinear<number, number>,
  color: string,
  opts: StatsOverlayOptions
) {
  const half = boxWidth / 2;
  const cap = boxWidth / 4;

  selection.each(function(d) {
    const g = d3.select(this);

    // Center whisker line
    g.append('line')
      .attr('x1', xOffset + half).attr('x2', xOffset + half)
      .attr('y1', yScale(d.min || 0)).attr('y2', yScale(d.max || 0))
      .attr('stroke', COLORS.whisker).attr('stroke-width', 1.5).attr('stroke-opacity', 0.45);

    // IQR box
    g.append('rect')
      .attr('x', xOffset)
      .attr('y', yScale(d.q3 || 0))
      .attr('height', Math.max(0, yScale(d.q1 || 0) - yScale(d.q3 || 0)))
      .attr('width', boxWidth)
      .attr('stroke', color).attr('stroke-width', 1.5)
      .attr('fill', color).attr('fill-opacity', 0.2)
      .attr('rx', 3);

    // Q1 / Q3 labels
    if (opts?.showQ1Q3) {
      g.append('text')
        .attr('x', xOffset + boxWidth + 3).attr('y', yScale(d.q3 || 0) + 4)
        .style('font-size', '9px').attr('fill', color).attr('fill-opacity', 0.8)
        .text((d.q3 || 0).toFixed(2));
      g.append('text')
        .attr('x', xOffset + boxWidth + 3).attr('y', yScale(d.q1 || 0) + 4)
        .style('font-size', '9px').attr('fill', color).attr('fill-opacity', 0.8)
        .text((d.q1 || 0).toFixed(2));
    }

    // Median line
    if (opts?.showMedian) {
      g.append('line')
        .attr('x1', xOffset).attr('x2', xOffset + boxWidth)
        .attr('y1', yScale(d.q2 || 0)).attr('y2', yScale(d.q2 || 0))
        .attr('stroke', COLORS.whisker).attr('stroke-width', 2.5);
    }

    // Min/Max caps & labels
    if (opts?.showMin) {
      g.append('line')
        .attr('x1', xOffset + half - cap).attr('x2', xOffset + half + cap)
        .attr('y1', yScale(d.min || 0)).attr('y2', yScale(d.min || 0))
        .attr('stroke', COLORS.whisker).attr('stroke-width', 1.5);
      
      g.append('text')
        .attr('x', xOffset + half + cap + 4).attr('y', yScale(d.min || 0) + 4)
        .style('font-size', '9px').attr('fill', COLORS.labelText).attr('fill-opacity', 0.8)
        .text((d.min || 0).toFixed(2));
    }
    if (opts?.showMax) {
      g.append('line')
        .attr('x1', xOffset + half - cap).attr('x2', xOffset + half + cap)
        .attr('y1', yScale(d.max || 0)).attr('y2', yScale(d.max || 0))
        .attr('stroke', COLORS.whisker).attr('stroke-width', 1.5);

      g.append('text')
        .attr('x', xOffset + half + cap + 4).attr('y', yScale(d.max || 0) + 4)
        .style('font-size', '9px').attr('fill', COLORS.labelText).attr('fill-opacity', 0.8)
        .text((d.max || 0).toFixed(2));
    }

    // Mean diamond
    if (opts?.showMean && Number.isFinite(d.mean)) {
      const cx = xOffset + half;
      const cy = yScale(d.mean);
      const r = 5;
      g.append('path')
        .attr('d', `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`)
        .attr('fill', COLORS.meanLine).attr('stroke', COLORS.meanLine);
    }

    // Outliers
    if (opts?.showOutliers && Array.isArray(d.outliers)) {
      const validOutliers = d.outliers.filter(v => Number.isFinite(v));
      g.selectAll('circle.outlier')
        .data(validOutliers)
        .enter().append('circle')
        .attr('class', 'outlier')
        .attr('cx', xOffset + half)
        .attr('cy', (v) => yScale(v))
        .attr('r', 3)
        .attr('fill', COLORS.outlierFill).attr('stroke', COLORS.outlierStroke);
    }
  });
}

export const BoxPlot: React.FC<BoxPlotProps> = ({
  data,
  compareData,
  compareLabel,
  primaryLabel,
  width = 800,
  height = 520,
  xAxisLabel,
  yAxisLabel,
  overlayOptions = defaultOverlayOptions,
}) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const isComparison = !!compareData && compareData.length > 0;

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Always clear previous render
    const svgSelection = d3.select(svgRef.current);
    svgSelection.selectAll('*').remove();

    if (data.length === 0) {
      console.log("BoxPlot: No data to render");
      return;
    }

    console.log("BoxPlot: Rendering with", data.length, "primary groups and", compareData?.length, "compare groups");

    const margin = { top: 40, right: 60, bottom: 70, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Collect all values for Y scale (including compare data)
    const allStats = isComparison ? [...data, ...(compareData || [])] : data;
    const yMin = d3.min(allStats, (d) => d3.min([d.min, ...(d.outliers || [])])) ?? 0;
    const yMax = d3.max(allStats, (d) => d3.max([d.max, ...(d.outliers || [])])) ?? 0;
    let yPad = (yMax - yMin) * 0.12;
    if (!Number.isFinite(yPad) || yPad === 0) yPad = Math.abs(yMin) * 0.1 || 1;

    // Build unified group domain
    const allGroups = [...new Set([...data.map((d) => d.groupName), ...(compareData ?? []).map((d) => d.groupName)])];

    const xScale = d3.scaleBand()
      .domain(allGroups)
      .range([0, innerWidth])
      .paddingInner(0.35)
      .paddingOuter(0.15);

    const yScale = d3.scaleLinear()
      .domain([yMin - yPad, yMax + yPad])
      .range([innerHeight, 0]).nice();

    // ── Grid ──
    svg.append('g').attr('color', 'rgba(255,255,255,0.05)')
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''))
      .select('.domain').remove();

    // ── X Axis ──
    svg.append('g').attr('transform', `translate(0,${innerHeight})`).attr('color', '#8a8f98')
      .call(
        d3.axisBottom(xScale)
          .tickSize(0)
          .tickPadding(12)
          .tickFormat((d) => {
            if (d === 'Total') return xAxisLabel ? t('charts.total') : '';
            return d;
          })
      )
      .select('.domain').attr('stroke', 'rgba(255,255,255,0.1)');

    // ── Y Axis ──
    svg.append('g').attr('color', '#8a8f98')
      .call(d3.axisLeft(yScale).tickSize(0).tickPadding(12))
      .select('.domain').remove();

    // ── Axis Labels ──
    svg.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + margin.bottom - 20)
      .attr('fill', '#8a8f98').attr('text-anchor', 'middle').style('font-size', '12px').style('font-weight', '500')
      .text(xAxisLabel);
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -innerHeight / 2).attr('y', -margin.left + 18)
      .attr('fill', '#8a8f98').attr('text-anchor', 'middle').style('font-size', '12px').style('font-weight', '500')
      .text(yAxisLabel);

    // ── Draw boxes ──
    const bandWidth = xScale.bandwidth();
    // In comparison mode, each band is split in half for A/B
    const primaryWidth = isComparison ? bandWidth * 0.46 : bandWidth;
    const compareWidth = bandWidth * 0.46;
    const gapBetween = bandWidth * 0.08;

    // Primary data
    const primaryGroups = svg.selectAll<SVGGElement, BoxPlotStats>('.boxGroupPrimary')
      .data(data).enter().append('g').attr('class', 'boxGroupPrimary')
      .attr('transform', (d) => `translate(${xScale(d.groupName) ?? 0},0)`);

    drawBoxGroup(primaryGroups, 0, primaryWidth, yScale, COLORS.primary, overlayOptions);

    // Compare data
    if (isComparison && compareData) {
      const compareGroups = svg.selectAll<SVGGElement, BoxPlotStats>('.boxGroupCompare')
        .data(compareData).enter().append('g').attr('class', 'boxGroupCompare')
        .attr('transform', (d) => `translate(${xScale(d.groupName) ?? 0},0)`);

      drawBoxGroup(compareGroups, primaryWidth + gapBetween, compareWidth, yScale, COLORS.compare, overlayOptions);
    }

    // ── Legend ──
    const legendY = -25;
    const legendItems = [
      { color: COLORS.primary, label: primaryLabel ?? 'Dataset A' },
      ...(isComparison ? [{ color: COLORS.compare, label: compareLabel ?? 'Dataset B' }] : []),
      ...(overlayOptions.showMean ? [{ color: COLORS.meanLine, label: `◆ ${t('charts.showMean')}`, isDiamond: true }] : []),
      ...(overlayOptions.showOutliers ? [{ color: COLORS.outlierFill, label: `● ${t('charts.showOutliers')}`, isDot: true }] : []),
    ];

    const legendGroup = svg.append('g').attr('transform', `translate(0, ${legendY})`);
    let legendX = 0;
    legendItems.forEach((item) => {
      legendGroup.append('rect').attr('x', legendX).attr('y', -5).attr('width', 12).attr('height', 12)
        .attr('fill', item.color).attr('rx', 2);
      legendGroup.append('text').attr('x', legendX + 16).attr('y', 5)
        .attr('fill', '#a0a8b8').style('font-size', '11px').text(item.label);
      legendX += 16 + item.label.length * 6.5 + 24;
    });

  }, [data, compareData, compareLabel, primaryLabel, width, height, xAxisLabel, yAxisLabel, overlayOptions, isComparison, t]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg ref={svgRef} className="w-full h-full max-w-[1100px] max-h-[600px] overflow-visible"
        viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" />
    </div>
  );
};
