import { KloController } from 'kloTouch/jspublic/KloController';
declare let KloUI5: any;

@KloUI5("o2c_v2.controller.p_colddrink_checker")
export default class p_colddrink_checker extends KloController {

    public async onPageEnter(oEvent) {
        this.tm.getTN("panelist_screen_other").setData({});
        this.tm.getTN("hedonic_scale_other").setData({});
        this.tm.getTN("aroma_chart_other").setData(null);
        this.tm.getTN("flavor_chart_other").setData(null);
        this.tm.getTN("paired_comparison_one").setData(null);
        this.tm.getTN("show_pie_chart").setData(null);
        this.tm.getTN("show_line_graph").setData(false);
        this.tm.getTN("selected_panalist_data").setData(null);
        this.setMode("DISPLAY");

        const listData = await this.tm.getTN("cold_drink_list").getData();

        for (const item of listData) {
            const researchItems = await item.r_research_items.fetch();

            let hasInProgress = false;
            let hasCompleted = false;
            let hasOpen = false;

            for (const ri of researchItems) {
                const status = ri.test_status;

                if (status === "InProgress") {
                    hasInProgress = true;
                } else if (status === "Completed") {
                    hasCompleted = true;
                } else if (status === "Open") {
                    hasOpen = true;
                }
            }

            if (hasInProgress) {
                item.test_status = "InProgress";
            } else if (hasCompleted && hasOpen) {
                item.test_status = "InProgress";
            } else if (hasCompleted && !hasOpen && !hasInProgress) {
                item.test_status = "Completed";
            } else if (hasOpen && !hasCompleted && !hasInProgress) {
                item.test_status = "Open";
            }
        }
    }

    public async onCreate() {
        await this.navTo({ SS: "s_colddrink_details" })
        await this.tm.getTN("cold_drink_list").createEntityP(
            {
                s_object_type: -1,
                test_status: "Open",
            },
            "Creation Successful",
            "Creation Failed",
            null,
            "First",
            false,
            true,
            false
        );
        this.tm.getTN("show_line_graph").setData(false)
        this.tm.getTN("show_pie_chart").setData(false)
        
    }

    public async onEdit() {
        await this.setMode("EDIT");
    }

    public async onSave() {
        // await this.tm.commitP();
        // this.setMode("DISPLAY");

        const oDialog = new sap.m.Dialog({
            title: "Confirmation",
            type: "Message",
            content: new sap.m.Text({
                text: "Thank you for submitting the data."
            }),
            beginButton: new sap.m.Button({
                text: "Yes",
                press: async () => {
                    // await this.navToPanelistScreen();
                    const detail = await this.tm.getTN("cold_drink_details").getData();
                    detail.number_of_panalist = detail.panalists ? detail.panalists.split(',').length : 0;
                    await this.tm.commitP("Save Successfully", "Save Failed");
                    await this.creationOnPanelistScreen()
                    await this.navTo({ SS: "s_colddrink_list" });
                    this.setMode("DISPLAY");
                    oDialog.close();
                }
            }),
            endButton: new sap.m.Button({
                text: "No",
                press: () => {
                    oDialog.close();
                }
            }),
            afterClose: () => {
                oDialog.destroy();
            }
        });

        oDialog.open();
    }

    public async creationOnPanelistScreen() {
        const detail = await this.tm.getTN("cold_drink_details").getData();
        const login_id = (await this.transaction.get$User()).login_id;

        const panelistIds = detail.panalists
            ? detail.panalists.split(',').map(id => id.trim()).filter(id => id)
            : [];

        for (const panelistId of panelistIds) {
            const commonData = {
                s_object_type: -1,
                panalists: panelistId,
                researcher_id: login_id.toUpperCase(),
                test_status: "Open",
                test_title: detail.test_title,
                test_id: detail.test_id,
                colddrink_samples: detail.colddrink_samples
            };

            const testItemTable = await this.tm.getTN('cold_drink_details/r_research_items').createEntityP({
                ...commonData,
            }, "Created Successfully", "Creation Failed", null, "First", true, true);

            if (detail.hedonic_scale) {
                await this.tm.getTN('cold_drink_details/r_research_tests').createEntityP({
                    ...commonData,
                    beverages_tests: "Hedonic Scale",
                    test_item_guid: testItemTable.my_key
                }, "Created Successfully", "Creation Failed", null, "First", true, true);
            }

            if (detail.just_about_rights) {
                await this.tm.getTN('cold_drink_details/r_research_tests').createEntityP({
                    ...commonData,
                    beverages_tests: "Just About Right (JAR)",
                    test_item_guid: testItemTable.my_key
                }, "Created Successfully", "Creation Failed", null, "First", true, true);
            }

            if (detail.line_scales) {
                await this.tm.getTN('cold_drink_details/r_research_tests').createEntityP({
                    ...commonData,
                    beverages_tests: "Line Scales",
                    test_item_guid: testItemTable.my_key
                }, "Created Successfully", "Creation Failed", null, "First", true, true);
            }

            if (detail.paired_comparisons) {
                await this.tm.getTN('cold_drink_details/r_research_tests').createEntityP({
                    ...commonData,
                    beverages_tests: "Paired Comparison",
                    test_item_guid: testItemTable.my_key
                }, "Created Successfully", "Creation Failed", null, "First", true, true);
            }
        }

        await this.tm.commitP("Saved Successfully", "Save Failed");
    }

    public async fillingDataInAromaGraph(oEvent) {
        const path = this.getPathFromEvent(oEvent);
        const index = parseInt(path.replace("/cold_drink_list/", ''));

        await this.tm.getTN("cold_drink_list").setActive(index);
        const selectedData = (await this.tm.getTN("cold_drink_list").getData())[index];

        const aromaRatingsData = [];
        const flavorRatingsData = [];
        const allPanalists = new Set();
        let showLineGraph = false;

        if (selectedData.hedonic_scale) {
            const researchItems = await selectedData.r_research_items.fetch();

            for (const researchItem of researchItems) {
                const panalistId = researchItem.panalists;
                if (panalistId) allPanalists.add(panalistId);

                const itemTests = await researchItem.r_item_test.fetch();

                for (const itemTest of itemTests) {
                    if (itemTest.beverages_tests !== "Hedonic Scale") continue;

                    const hedonicData = await itemTest.r_panalist_hedonic.fetch();

                    if (hedonicData.length > 0) {
                        showLineGraph = true;
                    }

                    for (const hedonic of hedonicData) {
                        const rating = parseFloat(hedonic.rating);
                        if (hedonic.rating_parameter === "Aroma") {
                            aromaRatingsData.push({
                                [panalistId]: rating,
                                rating: rating,
                            });
                        } else if (hedonic.rating_parameter === "Flavor") {
                            flavorRatingsData.push({
                                [panalistId]: rating,
                                rating: rating,
                            });
                        }
                    }
                }
            }
        }

        if (showLineGraph) {
            this.tm.getTN("show_line_graph").setData(true);
        }
        else {
            this.tm.getTN("show_line_graph").setData(false);
        }

        await this.tm.getTN("aroma_chart_other").setData(aromaRatingsData);
        await this.tm.getTN("flavor_chart_other").setData(flavorRatingsData);
        await this.tm.getTN("selected_panalist_data").setData(Array.from(allPanalists));

        await this.navTo({ SS: "s_colddrink_details" });
    }

    public async fillingDataForColdDrinkAnalysis(oEvent) {
        const path = this.getPathFromEvent(oEvent);
        const index = parseInt(path.replace("/cold_drink_list/", ''));
    
        await this.tm.getTN("cold_drink_list").setActive(index);
        const selectedData = (await this.tm.getTN("cold_drink_list").getData())[index];
    
        const aromaRatingsData = [];
        const flavorRatingsData = [];
        const pairedComparisonOneData = [];
        const allPanalists = new Set();
    
        let showLineGraph = false;
        let showPieChart = false;
    
        const beverageDescriptions = {
            pep: "Pepsi",
            coc: "Coca-Cola",
            spr: "Sprite",
            fan: "Fanta",
            mtd: "Mountain Dew",
            "7up": "7Up"
        };
    
        const promises = [];
    
        if (selectedData.hedonic_scale || selectedData.paired_comparisons) {
            promises.push(
                (async () => {
                    const researchItems = await selectedData.r_research_items.fetch();
    
                    for (const researchItem of researchItems) {
                        const panalistId = researchItem.panalists;
                        if (panalistId) allPanalists.add(panalistId);
    
                        const itemTests = await researchItem.r_item_test.fetch();
    
                        for (const itemTest of itemTests) {
                            if (selectedData.hedonic_scale && itemTest.beverages_tests === "Hedonic Scale") {
                                const hedonicData = await itemTest.r_panalist_hedonic.fetch();
    
                                if (hedonicData.length > 0) {
                                    showLineGraph = true;
                                }
    
                                for (const hedonic of hedonicData) {
                                    const rating = parseFloat(hedonic.rating);
                                    if (hedonic.rating_parameter === "Aroma") {
                                        aromaRatingsData.push({
                                            [panalistId]: rating,
                                            rating: rating
                                        });
                                    } else if (hedonic.rating_parameter === "Flavor") {
                                        flavorRatingsData.push({
                                            [panalistId]: rating,
                                            rating: rating
                                        });
                                    }
                                }
                            }
    
                            if (selectedData.paired_comparisons && itemTest.beverages_tests === "Paired Comparison") {
                                const pairedComparisonData = await itemTest.r_panalist_paired.fetch();
    
                                if (pairedComparisonData.length > 0) {
                                    showPieChart = true;
                                }
    
                                for (const paired of pairedComparisonData) {
                                    if (paired.questions === "Which beverage has a more appealing color?") {
                                        let selectedBeverage = null;
                                        if (paired.one === true) selectedBeverage = selectedData.colddrink_samples;
                                        else if (paired.two === true) selectedBeverage = selectedData.colddrink_comparison_samples;
    
                                        if (selectedBeverage) {
                                            const beverageDesc = beverageDescriptions[selectedBeverage] || selectedBeverage;
                                            pairedComparisonOneData.push({
                                                panelists: panalistId,
                                                beverages: beverageDesc
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                })()
            );
        }
    
        await Promise.all(promises);
    
        const uiPromises = [];
    
        uiPromises.push(this.tm.getTN("show_line_graph").setData(showLineGraph));
        uiPromises.push(this.tm.getTN("aroma_chart_other").setData(aromaRatingsData));
        uiPromises.push(this.tm.getTN("flavor_chart_other").setData(flavorRatingsData));
    
        const beverageCountMap = new Map();
        for (const entry of pairedComparisonOneData) {
            const bev = entry.beverages;
            beverageCountMap.set(bev, (beverageCountMap.get(bev) || 0) + 1);
        }
    
        const beverageCountsArray = Array.from(beverageCountMap.entries()).map(([selectedBeverage, count]) => ({
            selectedBeverage,
            count
        }));
    
        uiPromises.push(this.tm.getTN("show_pie_chart").setData(showPieChart));
        uiPromises.push(this.tm.getTN("paired_comparison_one").setData([]));
        uiPromises.push(this.tm.getTN("paired_comparison_one").setData(beverageCountsArray));
        uiPromises.push(this.tm.getTN("selected_panalist_data").setData(Array.from(allPanalists)));
    
        await Promise.all(uiPromises);
    
        await this.navTo({ SS: "s_colddrink_details" });
    }
    

}
