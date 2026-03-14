"use strict";

import powerbi from "powerbi-visuals-api";
import * as d3 from "d3";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;

import { VisualFormattingSettingsModel } from "./settings";

type ChartType = "line" | "bar" | "donut" | "area" | "scatter" | "table";

interface DataPoint {
    category: string;
    value: number;
}

interface TabConfig {
    label: string;
    chartType: ChartType;
    data: DataPoint[];
    colors: string[];
}

const DEFAULT_COLORS = ["#4a90d9", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#34495e"];

export class Visual implements IVisual {
    private target: HTMLElement;
    private container: HTMLDivElement;
    private tabBar: HTMLDivElement;
    private chartArea: HTMLDivElement;
    private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private tableContainer: HTMLDivElement;

    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private activeTab = 0;
    private tabs: TabConfig[] = [];
    private tooltip: HTMLDivElement;

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;

        this.container = document.createElement("div");
        this.container.className = "multi-chart-container";
        this.target.appendChild(this.container);

        this.tabBar = document.createElement("div");
        this.tabBar.className = "tab-bar";
        this.container.appendChild(this.tabBar);

        this.chartArea = document.createElement("div");
        this.chartArea.className = "chart-area";
        this.container.appendChild(this.chartArea);

        this.svg = d3.select(this.chartArea)
            .append("svg")
            .attr("class", "chart-svg");

        this.tableContainer = document.createElement("div");
        this.tableContainer.className = "data-table";
        this.chartArea.appendChild(this.tableContainer);

        // Tooltip
        this.tooltip = document.createElement("div");
        this.tooltip.className = "chart-tooltip";
        this.target.appendChild(this.tooltip);
    }

    public update(options: VisualUpdateOptions) {
        if (!options.dataViews || !options.dataViews[0]) return;

        this.formattingSettings = this.formattingSettingsService
            .populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

        this.parseAllData(options.dataViews[0]);
        this.renderTabs();
        this.renderChart(options.viewport.width, options.viewport.height);
    }

    // ── Parse data per tab from separate data roles ─────────
    private parseAllData(dataView: DataView): void {
        const s = this.formattingSettings.tabsCard;
        const count = Math.max(1, Math.min(3, s.tabCount.value));

        const labels = [s.tab1Label.value, s.tab2Label.value, s.tab3Label.value];
        const types = [
            s.tab1ChartType.value?.value as ChartType || "line",
            s.tab2ChartType.value?.value as ChartType || "bar",
            s.tab3ChartType.value?.value as ChartType || "donut",
        ];

        const categorical = dataView.categorical;
        this.tabs = [];

        for (let t = 0; t < count; t++) {
            const data: DataPoint[] = [];

            if (categorical && categorical.categories && categorical.values) {
                const role = `axis${t + 1}`;
                const valRole = `values${t + 1}`;

                // Find ALL category columns for this role (hierarchy = multiple columns)
                const catIndices = this.findAllRoleIndices(categorical.categories, role);
                const valIndex = this.findValueRoleIndex(categorical.values, valRole);

                if (catIndices.length > 0 && valIndex >= 0) {
                    const vals = categorical.values[valIndex];
                    const len = categorical.categories[catIndices[0]].values.length;

                    for (let i = 0; i < len; i++) {
                        // Concatenate all hierarchy levels: "2024 > Q1 > Enero > 15"
                        const parts: string[] = [];
                        for (const ci of catIndices) {
                            const raw = categorical.categories[ci].values[i];
                            parts.push(this.formatCategory(raw));
                        }
                        const label = parts.length > 1 ? parts.join(" > ") : parts[0];

                        data.push({
                            category: label,
                            value: Number(vals.values[i]) || 0,
                        });
                    }
                }
            }

            // Get per-tab colors
            const colorCards = [
                this.formattingSettings.tab1ColorsCard,
                this.formattingSettings.tab2ColorsCard,
                this.formattingSettings.tab3ColorsCard,
            ];
            const cc = colorCards[t];
            const tabColors = [
                cc.color1.value.value,
                cc.color2.value.value,
                cc.color3.value.value,
                cc.color4.value.value,
            ];

            this.tabs.push({
                label: labels[t] || `Tab ${t + 1}`,
                chartType: types[t],
                data,
                colors: tabColors,
            });
        }

        if (this.activeTab >= this.tabs.length) {
            this.activeTab = 0;
        }
    }

    private formatCategory(val: powerbi.PrimitiveValue): string {
        if (val instanceof Date) {
            const d = val as Date;
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yy = d.getFullYear();
            return `${dd}/${mm}/${yy}`;
        }
        if (typeof val === "number" && val > 946684800000 && val < 4102444800000) {
            // Looks like a timestamp in ms (between 2000 and 2100)
            const d = new Date(val);
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yy = d.getFullYear();
            return `${dd}/${mm}/${yy}`;
        }
        return String(val);
    }

    private showTooltip(x: number, y: number, category: string, value: number): void {
        this.tooltip.style.display = "block";
        this.tooltip.style.left = `${x + 12}px`;
        this.tooltip.style.top = `${y - 10}px`;
        while (this.tooltip.firstChild) this.tooltip.removeChild(this.tooltip.firstChild);
        const catLine = document.createElement("div");
        catLine.className = "tooltip-cat";
        catLine.textContent = category;
        const valLine = document.createElement("div");
        valLine.className = "tooltip-val";
        valLine.textContent = value.toLocaleString();
        this.tooltip.appendChild(catLine);
        this.tooltip.appendChild(valLine);
    }

    private hideTooltip(): void {
        this.tooltip.style.display = "none";
    }

    /** Attach tooltip events to chart elements */
    private attachTooltip(
        sel: d3.Selection<any, DataPoint, any, unknown>,
        x: d3.ScaleBand<string>,
        y: d3.ScaleLinear<number, number>,
        marginLeft: number,
        marginTop: number,
    ): void {
        if (!this.formattingSettings.chartStyleCard.showTooltip.value) return;
        sel
            .on("mouseenter", (event: MouseEvent, d: DataPoint) => {
                this.showTooltip(event.offsetX, event.offsetY, d.category, d.value);
            })
            .on("mousemove", (event: MouseEvent, d: DataPoint) => {
                this.showTooltip(event.offsetX, event.offsetY, d.category, d.value);
            })
            .on("mouseleave", () => this.hideTooltip());
    }

    /** Build X axis with smart label thinning */
    private drawXAxis(g: d3.Selection<SVGGElement, unknown, null, undefined>, x: d3.ScaleBand<string>, h: number, w: number): void {
        const domain = x.domain();
        const labelWidth = 55; // approx width per label in px
        const maxLabels = Math.max(1, Math.floor(w / labelWidth));
        const skip = Math.max(1, Math.ceil(domain.length / maxLabels));

        const axis = d3.axisBottom(x)
            .tickValues(domain.filter((_, i) => i % skip === 0));

        g.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(axis)
            .selectAll("text")
            .attr("transform", "rotate(-40)")
            .style("text-anchor", "end")
            .style("font-size", "10px");
    }

    /** Build Y axis with clean number formatting */
    private drawYAxis(g: d3.Selection<SVGGElement, unknown, null, undefined>, y: d3.ScaleLinear<number, number>, w: number, grid: boolean): void {
        const fmt = (d: d3.NumberValue) => {
            const n = Number(d);
            if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
            if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
            if (Number.isInteger(n)) return String(n);
            return n.toFixed(2);
        };

        if (grid) {
            g.append("g").attr("class", "grid")
                .call(d3.axisLeft(y).tickSize(-w).tickFormat(() => ""))
                .selectAll("line").attr("stroke", "#e0e0e0");
        }

        g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(fmt))
            .selectAll("text").style("font-size", "10px");
    }

    private findAllRoleIndices(categories: powerbi.DataViewCategoryColumn[], role: string): number[] {
        const indices: number[] = [];
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].source && categories[i].source.roles && categories[i].source.roles[role]) {
                indices.push(i);
            }
        }
        return indices;
    }

    private findValueRoleIndex(values: powerbi.DataViewValueColumn[], role: string): number {
        for (let i = 0; i < values.length; i++) {
            if (values[i].source && values[i].source.roles && values[i].source.roles[role]) {
                return i;
            }
        }
        return -1;
    }

    // ── Tabs ────────────────────────────────────────────────
    private renderTabs(): void {
        const style = this.formattingSettings.tabStyleCard;
        while (this.tabBar.firstChild) this.tabBar.removeChild(this.tabBar.firstChild);

        this.tabs.forEach((tab, i) => {
            const btn = document.createElement("button");
            btn.className = `tab-btn ${i === this.activeTab ? "active" : ""}`;
            btn.textContent = tab.label;
            btn.style.fontSize = `${style.fontSize.value}px`;
            btn.style.borderRadius = `${style.borderRadius.value}px`;
            btn.style.color = style.textColor.value.value;

            if (i === this.activeTab) {
                btn.style.backgroundColor = style.activeColor.value.value;
                btn.style.color = "#ffffff";
            } else {
                btn.style.backgroundColor = style.backgroundColor.value.value;
            }

            btn.addEventListener("click", () => {
                this.activeTab = i;
                this.renderTabs();
                this.renderChart(this.target.clientWidth, this.target.clientHeight);
            });

            this.tabBar.appendChild(btn);
        });
    }

    // ── Chart dispatch ──────────────────────────────────────
    private renderChart(viewWidth: number, viewHeight: number): void {
        const tabBarH = this.tabBar.offsetHeight || 32;
        const width = viewWidth;
        const height = viewHeight - tabBarH - 8;
        const margin = { top: 20, right: 20, bottom: 80, left: 60 };
        const chartW = width - margin.left - margin.right;
        const chartH = height - margin.top - margin.bottom;

        // Reset
        this.svg.attr("width", width).attr("height", height).selectAll("*").remove();
        while (this.tableContainer.firstChild) this.tableContainer.removeChild(this.tableContainer.firstChild);
        this.tableContainer.style.display = "none";
        this.svg.style("display", "block");

        const tab = this.tabs[this.activeTab];
        if (!tab || tab.data.length === 0) {
            this.showEmpty(width, height);
            return;
        }

        const cs = this.formattingSettings.chartStyleCard;
        const dur = cs.animationDuration.value;
        const showGrid = cs.showGridlines.value;
        const showLabels = cs.showLabels.value;
        const maxPts = cs.maxDataPoints.value;
        const colors = [...tab.colors, ...DEFAULT_COLORS];

        // Density filter
        let data = tab.data;
        if (maxPts > 0 && data.length > maxPts) {
            const step = Math.ceil(data.length / maxPts);
            data = data.filter((_, i) => i % step === 0);
        }

        switch (tab.chartType) {
            case "line": this.drawLine(data, chartW, chartH, margin, dur, showGrid, showLabels, colors); break;
            case "bar": this.drawBar(data, chartW, chartH, margin, dur, showGrid, showLabels, colors); break;
            case "donut": this.drawDonut(data, width, height, dur, showLabels, colors); break;
            case "area": this.drawArea(data, chartW, chartH, margin, dur, showGrid, showLabels, colors); break;
            case "scatter": this.drawScatter(data, chartW, chartH, margin, dur, showGrid, showLabels, colors); break;
            case "table": this.drawTable(data, height); break;
        }
    }

    private showEmpty(w: number, h: number): void {
        this.svg.append("text")
            .attr("x", w / 2).attr("y", h / 2)
            .attr("text-anchor", "middle")
            .style("fill", "#999").style("font-size", "13px")
            .text("Arrastra campos a Tab " + (this.activeTab + 1) + " Axis y Values");
    }

    // ── Line ────────────────────────────────────────────────
    private drawLine(data: DataPoint[], w: number, h: number, m: any, dur: number, grid: boolean, labels: boolean, colors: string[]): void {
        const g = this.svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
        const x = d3.scaleBand().domain(data.map(d => d.category)).range([0, w]).padding(0.1);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.1]).range([h, 0]);

        this.drawYAxis(g, y, w, grid);
        this.drawXAxis(g, x, h, w);

        const line = d3.line<DataPoint>().x(d => x(d.category) + x.bandwidth() / 2).y(d => y(d.value)).curve(d3.curveMonotoneX);
        const path = g.append("path").datum(data).attr("fill", "none").attr("stroke", colors[0]).attr("stroke-width", 2.5).attr("d", line);
        const totalLen = path.node().getTotalLength();
        path.attr("stroke-dasharray", totalLen).attr("stroke-dashoffset", totalLen).transition().duration(dur).attr("stroke-dashoffset", 0);

        const dots = g.selectAll(".dot").data(data).join("circle").attr("cx", d => x(d.category) + x.bandwidth() / 2).attr("cy", d => y(d.value)).attr("r", 3.5).attr("fill", colors[0]).attr("opacity", 0);
        dots.transition().delay(dur).duration(200).attr("opacity", 1);
        this.attachTooltip(dots, x, y, m.left, m.top);

        const lfs = this.formattingSettings.chartStyleCard.labelFontSize.value;
        if (labels) g.selectAll(".lbl").data(data).join("text").attr("x", d => x(d.category) + x.bandwidth() / 2).attr("y", d => y(d.value) - 8).attr("text-anchor", "middle").style("font-size", `${lfs}px`).style("fill", "#666").text(d => d.value.toLocaleString());
    }

    // ── Bar ─────────────────────────────────────────────────
    private drawBar(data: DataPoint[], w: number, h: number, m: any, dur: number, grid: boolean, labels: boolean, colors: string[]): void {
        const g = this.svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
        const x = d3.scaleBand().domain(data.map(d => d.category)).range([0, w]).padding(0.25);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.1]).range([h, 0]);

        this.drawYAxis(g, y, w, grid);
        this.drawXAxis(g, x, h, w);

        const bars = g.selectAll(".bar").data(data).join("rect")
            .attr("x", d => x(d.category)).attr("width", x.bandwidth())
            .attr("y", h).attr("height", 0)
            .attr("fill", (_, i) => colors[i % colors.length]).attr("rx", 3);
        bars.transition().duration(dur)
            .attr("y", d => y(d.value)).attr("height", d => h - y(d.value));
        this.attachTooltip(bars, x, y, m.left, m.top);

        const lfs = this.formattingSettings.chartStyleCard.labelFontSize.value;
        if (labels) g.selectAll(".lbl").data(data).join("text").attr("x", d => x(d.category) + x.bandwidth() / 2).attr("y", d => y(d.value) - 5).attr("text-anchor", "middle").style("font-size", `${lfs}px`).style("fill", "#666").text(d => d.value.toLocaleString());
    }

    // ── Donut ───────────────────────────────────────────────
    private drawDonut(data: DataPoint[], w: number, h: number, dur: number, labels: boolean, colors: string[]): void {
        const radius = Math.min(w, h) / 2 - 20;
        const g = this.svg.append("g").attr("transform", `translate(${w / 2},${h / 2})`);

        const pie = d3.pie<DataPoint>().value(d => d.value).sort(null);
        const arc = d3.arc<d3.PieArcDatum<DataPoint>>().innerRadius(radius * 0.55).outerRadius(radius);
        const arcLabel = d3.arc<d3.PieArcDatum<DataPoint>>().innerRadius(radius * 0.75).outerRadius(radius * 0.75);

        const self = this;
        const arcs = g.selectAll(".arc").data(pie(data)).join("g").attr("class", "arc");
        const paths = arcs.append("path").attr("fill", (_, i) => colors[i % colors.length]);
        paths.transition().duration(dur)
            .attrTween("d", function (d) {
                const interp = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return (t) => arc(interp(t));
            });

        if (this.formattingSettings.chartStyleCard.showTooltip.value) {
            paths
                .on("mouseenter", function(event: MouseEvent, d: d3.PieArcDatum<DataPoint>) {
                    self.showTooltip(event.offsetX, event.offsetY, d.data.category, d.data.value);
                })
                .on("mousemove", function(event: MouseEvent, d: d3.PieArcDatum<DataPoint>) {
                    self.showTooltip(event.offsetX, event.offsetY, d.data.category, d.data.value);
                })
                .on("mouseleave", () => self.hideTooltip());
        }

        const lfs = this.formattingSettings.chartStyleCard.labelFontSize.value;
        if (labels) {
            arcs.append("text").attr("transform", d => `translate(${arcLabel.centroid(d)})`).attr("text-anchor", "middle").style("font-size", `${lfs}px`).style("fill", "#666").text(d => d.data.category);
        }
    }

    // ── Area ────────────────────────────────────────────────
    private drawArea(data: DataPoint[], w: number, h: number, m: any, dur: number, grid: boolean, labels: boolean, colors: string[]): void {
        const g = this.svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
        const x = d3.scaleBand().domain(data.map(d => d.category)).range([0, w]).padding(0.1);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.1]).range([h, 0]);

        this.drawYAxis(g, y, w, grid);
        this.drawXAxis(g, x, h, w);

        const area = d3.area<DataPoint>().x(d => x(d.category) + x.bandwidth() / 2).y0(h).y1(d => y(d.value)).curve(d3.curveMonotoneX);
        g.append("path").datum(data).attr("fill", colors[0]).attr("fill-opacity", 0.3).attr("d", area).attr("opacity", 0).transition().duration(dur).attr("opacity", 1);

        const line = d3.line<DataPoint>().x(d => x(d.category) + x.bandwidth() / 2).y(d => y(d.value)).curve(d3.curveMonotoneX);
        g.append("path").datum(data).attr("fill", "none").attr("stroke", colors[0]).attr("stroke-width", 2).attr("d", line);

        // Invisible dots for tooltip hover
        const dots = g.selectAll(".hover-dot").data(data).join("circle")
            .attr("cx", d => x(d.category) + x.bandwidth() / 2).attr("cy", d => y(d.value))
            .attr("r", 6).attr("fill", "transparent").style("cursor", "pointer");
        this.attachTooltip(dots, x, y, m.left, m.top);

        const lfs = this.formattingSettings.chartStyleCard.labelFontSize.value;
        if (labels) g.selectAll(".lbl").data(data).join("text").attr("x", d => x(d.category) + x.bandwidth() / 2).attr("y", d => y(d.value) - 8).attr("text-anchor", "middle").style("font-size", `${lfs}px`).style("fill", "#666").text(d => d.value.toLocaleString());
    }

    // ── Scatter ─────────────────────────────────────────────
    private drawScatter(data: DataPoint[], w: number, h: number, m: any, dur: number, grid: boolean, labels: boolean, colors: string[]): void {
        const g = this.svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
        const x = d3.scaleBand().domain(data.map(d => d.category)).range([0, w]).padding(0.1);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.1]).range([h, 0]);

        this.drawYAxis(g, y, w, grid);
        this.drawXAxis(g, x, h, w);

        const dots = g.selectAll(".dot").data(data).join("circle")
            .attr("cx", d => x(d.category) + x.bandwidth() / 2).attr("cy", h)
            .attr("r", 5).attr("fill", (_, i) => colors[i % colors.length]).attr("opacity", 0.8);
        dots.transition().duration(dur).attr("cy", d => y(d.value));
        this.attachTooltip(dots, x, y, m.left, m.top);

        const lfs = this.formattingSettings.chartStyleCard.labelFontSize.value;
        if (labels) g.selectAll(".lbl").data(data).join("text").attr("x", d => x(d.category) + x.bandwidth() / 2).attr("y", d => y(d.value) - 10).attr("text-anchor", "middle").style("font-size", `${lfs}px`).style("fill", "#666").text(d => d.value.toLocaleString());
    }

    // ── Table ───────────────────────────────────────────────
    private drawTable(data: DataPoint[], height: number): void {
        this.svg.style("display", "none");
        this.tableContainer.style.display = "block";
        this.tableContainer.style.maxHeight = `${height - 40}px`;
        this.tableContainer.style.overflow = "auto";

        const tbl = document.createElement("table");
        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        const th1 = document.createElement("th"); th1.textContent = "Categoria";
        const th2 = document.createElement("th"); th2.textContent = "Valor";
        headRow.appendChild(th1); headRow.appendChild(th2);
        thead.appendChild(headRow); tbl.appendChild(thead);

        const tbody = document.createElement("tbody");
        for (const dp of data) {
            const row = document.createElement("tr");
            const td1 = document.createElement("td"); td1.textContent = dp.category;
            const td2 = document.createElement("td"); td2.textContent = dp.value.toLocaleString();
            row.appendChild(td1); row.appendChild(td2);
            tbody.appendChild(row);
        }
        tbl.appendChild(tbody);
        this.tableContainer.appendChild(tbl);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
