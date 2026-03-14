# Multi Chart Visual for Power BI

A custom Power BI visual that combines up to 3 independent charts in a single visual with tabbed navigation. Each tab has its own data fields, chart type, and color palette — eliminating the need for stacked visuals, bookmarks, or workarounds.

## Features

### 3 Independent Tabs
Each tab operates as its own chart with dedicated data bindings:
- **Tab 1 Axis + Values** — First chart's data
- **Tab 2 Axis + Values** — Second chart's data
- **Tab 3 Axis + Values** — Third chart's data

This means Tab 1 can show Sales by Month while Tab 2 shows Products by Region and Tab 3 shows a detail table — all in the same visual space.

### 6 Chart Types
- **Line** — Smooth curves with animated draw-in and data points
- **Bar** — Vertical bars with rounded corners and grow animation
- **Donut** — Animated ring chart with labels
- **Area** — Filled area with line overlay
- **Scatter** — Animated dot plot
- **Table** — Sortable data grid with sticky headers

### Customization

#### Tab Configuration
| Setting | Description | Default |
|---------|-------------|---------|
| Number of tabs | 1 to 3 | 3 |
| Tab N label | Custom text for each tab button | Tab 1, Tab 2, Tab 3 |
| Tab N chart type | Chart type per tab | Line, Bar, Donut |

#### Tab Style
| Setting | Description | Default |
|---------|-------------|---------|
| Tab background | Inactive tab color | #f0f0f0 |
| Active tab color | Selected tab highlight | #4a90d9 |
| Tab text color | Label color | #333333 |
| Border radius | Tab button rounding (px) | 6 |
| Font size | Tab label size (px) | 11 |

#### Chart Style
| Setting | Description | Default |
|---------|-------------|---------|
| Show gridlines | Horizontal reference lines | ON |
| Show data labels | Value labels on data points | OFF |
| Label font size | Data label size (px) | 9 |
| Max data points | Limit visible points (0 = all) | 0 |
| Show tooltip | Hover tooltip | ON |
| Animation duration | Transition speed (ms) | 400 |

#### Per-Tab Colors
Each tab has 4 customizable colors that apply to bars, donut segments, lines, dots, and area fills. Colors cycle for datasets with more than 4 categories.

### Smart Axis Handling
- **X axis** auto-thins labels based on available width — no more overlapping dates
- **Y axis** auto-formats large numbers: 1,500 becomes 1.5K, 2,300,000 becomes 2.3M
- **Dates** display as dd/mm/yyyy instead of raw timestamps
- **Date hierarchy** levels are concatenated with " > " separator

### Tooltips
Hover over any data element (bar, dot, donut slice, area) to see a styled tooltip with the category name and formatted value.

## Installation

### From .pbiviz file

1. Download the latest `.pbiviz` file from [Releases](https://github.com/cardo991/multi-chart-visual/releases) or build it yourself
2. In Power BI Desktop, go to the Visualizations pane
3. Click the `...` menu and select **Import a visual from a file**
4. Select the `.pbiviz` file
5. The visual appears as a new icon in your visualizations panel

### Build from source

Prerequisites: [Node.js](https://nodejs.org/) 18+

```bash
git clone https://github.com/cardo991/multi-chart-visual.git
cd multi-chart-visual
npm install
```

**Package the visual:**
```bash
npx pbiviz package
```

The `.pbiviz` file is generated in the `dist/` folder.

**Run in development mode:**
```bash
npx pbiviz start
```

This starts a dev server at `https://localhost:8080`. Enable Developer Visual in Power BI Desktop (File > Options > Security > Allow any extensions to load) to see live changes.

## Usage

1. Add the visual to your Power BI canvas
2. Drag fields to the data wells:
   - **Tab 1 — Axis**: Category field (dates, names, regions, etc.)
   - **Tab 1 — Values**: Measure field (sales, quantity, amount, etc.)
   - Repeat for Tab 2 and Tab 3
3. Click the format pane (paint brush icon) to customize:
   - **Tabs Configuration**: Set number of tabs, labels, and chart types
   - **Tab Style**: Customize button appearance
   - **Chart Style**: Toggle gridlines, labels, tooltips, density
   - **Tab N — Colors**: Set colors per tab

### Tips
- Use the **Max data points** setting to improve performance with large datasets
- Set **Animation duration** to 0 for instant tab switching
- Combine different chart types for effective data storytelling: Line for trends, Bar for comparison, Donut for composition
- When using dates, drag the date field directly (not the date hierarchy) for best results

## Tech Stack

- TypeScript
- D3.js 7.x
- Power BI Visuals SDK 7.x
- LESS (styling)

## License

MIT
