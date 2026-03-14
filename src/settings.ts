"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class TabsCard extends FormattingSettingsCard {
    tabCount = new formattingSettings.NumUpDown({
        name: "tabCount",
        displayName: "Number of tabs",
        value: 3,
    });

    tab1Label = new formattingSettings.TextInput({
        name: "tab1Label",
        displayName: "Tab 1 label",
        value: "Tab 1",
        placeholder: "Tab 1",
    });

    tab1ChartType = new formattingSettings.ItemDropdown({
        name: "tab1ChartType",
        displayName: "Tab 1 chart type",
        items: [
            { displayName: "Line", value: "line" },
            { displayName: "Bar", value: "bar" },
            { displayName: "Donut", value: "donut" },
            { displayName: "Area", value: "area" },
            { displayName: "Scatter", value: "scatter" },
            { displayName: "Table", value: "table" },
        ],
        value: { displayName: "Line", value: "line" },
    });

    tab2Label = new formattingSettings.TextInput({
        name: "tab2Label",
        displayName: "Tab 2 label",
        value: "Tab 2",
        placeholder: "Tab 2",
    });

    tab2ChartType = new formattingSettings.ItemDropdown({
        name: "tab2ChartType",
        displayName: "Tab 2 chart type",
        items: [
            { displayName: "Line", value: "line" },
            { displayName: "Bar", value: "bar" },
            { displayName: "Donut", value: "donut" },
            { displayName: "Area", value: "area" },
            { displayName: "Scatter", value: "scatter" },
            { displayName: "Table", value: "table" },
        ],
        value: { displayName: "Bar", value: "bar" },
    });

    tab3Label = new formattingSettings.TextInput({
        name: "tab3Label",
        displayName: "Tab 3 label",
        value: "Tab 3",
        placeholder: "Tab 3",
    });

    tab3ChartType = new formattingSettings.ItemDropdown({
        name: "tab3ChartType",
        displayName: "Tab 3 chart type",
        items: [
            { displayName: "Line", value: "line" },
            { displayName: "Bar", value: "bar" },
            { displayName: "Donut", value: "donut" },
            { displayName: "Area", value: "area" },
            { displayName: "Scatter", value: "scatter" },
            { displayName: "Table", value: "table" },
        ],
        value: { displayName: "Donut", value: "donut" },
    });

    name: string = "tabs";
    displayName: string = "Tabs Configuration";
    slices: Array<FormattingSettingsSlice> = [
        this.tabCount,
        this.tab1Label, this.tab1ChartType,
        this.tab2Label, this.tab2ChartType,
        this.tab3Label, this.tab3ChartType,
    ];
}

class TabStyleCard extends FormattingSettingsCard {
    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Tab background",
        value: { value: "#f0f0f0" },
    });

    activeColor = new formattingSettings.ColorPicker({
        name: "activeColor",
        displayName: "Active tab color",
        value: { value: "#4a90d9" },
    });

    textColor = new formattingSettings.ColorPicker({
        name: "textColor",
        displayName: "Tab text color",
        value: { value: "#333333" },
    });

    borderRadius = new formattingSettings.NumUpDown({
        name: "borderRadius",
        displayName: "Border radius",
        value: 6,
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font size",
        value: 11,
    });

    name: string = "tabStyle";
    displayName: string = "Tab Style";
    slices: Array<FormattingSettingsSlice> = [
        this.backgroundColor, this.activeColor, this.textColor,
        this.borderRadius, this.fontSize,
    ];
}

class ChartStyleCard extends FormattingSettingsCard {
    showGridlines = new formattingSettings.ToggleSwitch({
        name: "showGridlines",
        displayName: "Show gridlines",
        value: true,
    });

    showLabels = new formattingSettings.ToggleSwitch({
        name: "showLabels",
        displayName: "Show data labels",
        value: false,
    });

    animationDuration = new formattingSettings.NumUpDown({
        name: "animationDuration",
        displayName: "Animation duration (ms)",
        value: 400,
    });

    maxDataPoints = new formattingSettings.NumUpDown({
        name: "maxDataPoints",
        displayName: "Max data points (0 = all)",
        value: 0,
    });

    labelFontSize = new formattingSettings.NumUpDown({
        name: "labelFontSize",
        displayName: "Label font size",
        value: 9,
    });

    showTooltip = new formattingSettings.ToggleSwitch({
        name: "showTooltip",
        displayName: "Show tooltip on hover",
        value: true,
    });

    name: string = "chartStyle";
    displayName: string = "Chart Style";
    slices: Array<FormattingSettingsSlice> = [
        this.showGridlines, this.showLabels, this.labelFontSize,
        this.maxDataPoints, this.showTooltip, this.animationDuration,
    ];
}

class TabColorsCard extends FormattingSettingsCard {
    color1 = new formattingSettings.ColorPicker({
        name: "color1",
        displayName: "Color 1",
        value: { value: "#4a90d9" },
    });
    color2 = new formattingSettings.ColorPicker({
        name: "color2",
        displayName: "Color 2",
        value: { value: "#e74c3c" },
    });
    color3 = new formattingSettings.ColorPicker({
        name: "color3",
        displayName: "Color 3",
        value: { value: "#2ecc71" },
    });
    color4 = new formattingSettings.ColorPicker({
        name: "color4",
        displayName: "Color 4",
        value: { value: "#f39c12" },
    });

    name: string = "tabColors";
    displayName: string = "Tab Colors";
    slices: Array<FormattingSettingsSlice> = [this.color1, this.color2, this.color3, this.color4];

    setIdentity(n: string, dn: string): this {
        this.name = n;
        this.displayName = dn;
        return this;
    }
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    tabsCard = new TabsCard();
    tabStyleCard = new TabStyleCard();
    chartStyleCard = new ChartStyleCard();
    tab1ColorsCard = new TabColorsCard().setIdentity("tab1Colors", "Tab 1 — Colors");
    tab2ColorsCard = new TabColorsCard().setIdentity("tab2Colors", "Tab 2 — Colors");
    tab3ColorsCard = new TabColorsCard().setIdentity("tab3Colors", "Tab 3 — Colors");
    cards = [
        this.tabsCard, this.tabStyleCard, this.chartStyleCard,
        this.tab1ColorsCard, this.tab2ColorsCard, this.tab3ColorsCard,
    ];
}
