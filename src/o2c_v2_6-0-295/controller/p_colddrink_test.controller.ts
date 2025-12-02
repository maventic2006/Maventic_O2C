import { KloController } from 'kloTouch/jspublic/KloController'
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_colddrink_test")
export default class p_colddrink_test extends KloController {

    public async onPageEnter(oEvent) {

        const tn = this.tm;

        // Clear existing data from test modules
        tn.getTN("hedonic_scale_other").setData({});
        tn.getTN("expression_binding_other").setData({});
        tn.getTN("line_scale_other").setData({});
        tn.getTN("paired_comparison_other").setData({});
        tn.getTN("paired_comparison_dropdown").setData({});
        tn.getTN("just_about_right_other").setData({});
        tn.getTN("header_other").setData({});
        tn.getTN("information_header_other").setData({});

        const searchGuid = oEvent?.navToParams?.AD;

        if (searchGuid) {
            const testItemTN = tn.getTN("test_item_list");
            const list = await testItemTN.getData();

            const index = list.findIndex(item => item.my_key === searchGuid);
            if (index !== -1) {
                await testItemTN.setActive(index);
            }
        }

        // Fetch panelist item list to calculate completion percentage
        const listData = await tn.getTN("panalist_item_list").getData();

        if (listData && listData.length > 0) {
            const totalItems = listData.length;
            const completedItems = listData.filter(item => item.test_status === "Completed").length;
            const percentageCompleted = Math.round((completedItems / totalItems) * 100);

            // Set completion progress
            await tn.getTN("information_header_other").setData(percentageCompleted);
        }

    }

    public async onNavToDifferentSections(oEvent) {

        let path = this.getPathFromEvent(oEvent);
        let index = parseInt(path.replace("/panalist_item_list/", ''));

        const list = await this.tm.getTN("panalist_item_list").getData();
        await this.tm.getTN("panalist_item_list").setActive(index)
        const selected = list[index];

        if (selected.beverages_tests === "Hedonic Scale") {
            const fetchedHedonicData = await selected.r_panalist_hedonic.fetch();
            let hedonicData;

            if (fetchedHedonicData.length > 0) {
                // Map fetched data to hedonicData, ensuring rating is a float
                hedonicData = fetchedHedonicData.map(item => ({
                    rating_parameter: item.rating_parameter,
                    rating: parseFloat(item.rating),
                    rating_value: item.rating_value
                }));
            } else {
                // Provide default rating parameters with no rating values
                hedonicData = [
                    { rating_parameter: "Flavor", rating: 0 },
                    { rating_parameter: "Appearance / Color", rating: 0 },
                    { rating_parameter: "Mouthfeel / Texture", rating: 0 },
                    { rating_parameter: "Aroma", rating: 0 },
                    { rating_parameter: "Taste While Drinking", rating: 0 },
                    { rating_parameter: "Aftertaste / Lingering Flavor", rating: 0 }
                ];
            }

            this.tm.getTN("expression_binding_other").setData("Hedonic Scale");
            this.tm.getTN("hedonic_scale_other").setData(hedonicData);
            await this.navTo({ SS: "s_hedonic_scale" });
        }

        if (selected.beverages_tests === "Line Scales") {
            this.tm.getTN("expression_binding_other").setData("Line Scales");

            const fetchedLineScaleData = await selected.r_panalist_line.fetch();
            let ratingData;

            if (fetchedLineScaleData.length > 0) {
                ratingData = fetchedLineScaleData.map(item => ({
                    rating_parameter: item.rating_parameter,
                    rating: parseFloat(item.rating) || 0,
                    rating_value: parseFloat(item.rating_value) || 0
                }));
            } else {
                // Default parameters with empty rating and 0 value
                ratingData = [
                    { rating_parameter: "Ingredients Quality", rating: 0, rating_value: 0 },
                    { rating_parameter: "Originality/Uniqueness", rating: 0, rating_value: 0 },
                    { rating_parameter: "Cultural or Regional Relevance", rating: 0, rating_value: 0 },
                    { rating_parameter: "Health/Nutritional Value", rating: 0, rating_value: 0 },
                    { rating_parameter: "Packaging and Branding", rating: 0, rating_value: 0 }
                ];
            }

            this.tm.getTN("line_scale_other").setData(ratingData);

            await this.navTo({ SS: "s_line_scale" });
        }


        if (selected.beverages_tests === "Just About Right (JAR)") {
            this.tm.getTN("expression_binding_other").setData("Just About Right (JAR)");

            const fetchedJarData = await selected.r_panalist_just_abt_right.fetch();
            let jarParameters;

            if (fetchedJarData.length > 0) {
                jarParameters = fetchedJarData.map(item => ({
                    parameter: item.abt_parameter,
                    one: item.one === true,
                    two: item.two === true,
                    three: item.three === true,
                    four: item.four === true,
                    five: item.five === true
                }));
            } else {
                // Default values with empty boolean ratings
                jarParameters = [
                    { parameter: "Sweetness Level", one: false, two: false, three: false, four: false, five: false },
                    { parameter: "Bitterness", one: false, two: false, three: false, four: false, five: false },
                    { parameter: "Temperature Perception", one: false, two: false, three: false, four: false, five: false },
                    { parameter: "Carbonation Intensity", one: false, two: false, three: false, four: false, five: false },
                    { parameter: "Balance", one: false, two: false, three: false, four: false, five: false }
                ];
            }

            this.tm.getTN("just_about_right_other").setData(jarParameters);

            await this.navTo({ SS: "s_line_scale" });
        }

        if (selected.beverages_tests === "Paired Comparison") {
            this.tm.getTN("expression_binding_other").setData("Paired Comparison");

            // Fetch existing paired comparison data from relation
            const fetchedPairedData = await selected.r_panalist_paired.fetch();
            let pairedComparisonQuestions;

            if (fetchedPairedData.length > 0) {
                // Populate from existing data
                pairedComparisonQuestions = fetchedPairedData.map(item => ({
                    question_text: item.questions,
                    response: item.response || "",
                    one: item.one === true,
                    two: item.two === true
                }));
            } else {
                // Default set of questions
                pairedComparisonQuestions = [
                    { question_text: "Which beverage has a better overall taste?", response: "" },
                    { question_text: "Which beverage feels more refreshing?", response: "" },
                    { question_text: "Which beverage has a more appealing color?", response: "" },
                    { question_text: "Which beverage would you prefer on a hot day?", response: "" },
                    { question_text: "Which beverage do you think smells better?", response: "" }
                ];
            }

            this.tm.getTN("paired_comparison_other").setData(pairedComparisonQuestions);

            // Load parent entity data
            const parentTable = await this.transaction.getExecutedQuery('d_colddrink_research', {
                loadAll: true,
                my_key: selected.colddrink_guid
            });

            const descriptionMap = {
                pep: "Pepsi",
                coc: "Coca-Cola",
                spr: "Sprite",
                fan: "Fanta",
                mtd: "Mountain Dew",
                "7up": "7Up"
            };

            const parentItem = parentTable[0];
            const sample1 = parentItem.colddrink_samples;
            const sample2 = parentItem.colddrink_comparison_samples;

            this.tm.getTN("paired_comparison_dropdown").setProperty('one', descriptionMap[sample1]);
            this.tm.getTN("paired_comparison_dropdown").setProperty('two', descriptionMap[sample2]);

            await this.navTo({ SS: "s_line_scale" });
        }

    }

    public async onChangeOfLineScale() {
        const linsScaleData = this.tm.getTN("line_scale_other").getData()

        this.tm.getTN("line_scale_other").setProperty('line_scale_change', linsScaleData.line_scale)
    }

    public async onChangeOfHeader() {
        const selectedPanelist = this.tm.getTN("header_other").getData();

        if (selectedPanelist?.selected_panalist != null && selectedPanelist?.selected_panalist != "" && selectedPanelist?.selected_panalist != undefined) {
            await this.tm.getTN("colddrink_test_search").setProperty("selected_panalist", selectedPanelist.selected_panalist);
            await this.tm.getTN("colddrink_test_search").executeP();
        }
    }

    public async onSubmitHedonicScale() {
        const index = await this.tm.getTN("panalist_item_list").getActiveIndex();
        const listData = await this.tm.getTN("panalist_item_list").getData();
        const selectedList = listData[index];
        const itemTestDetail = await this.tm.getTN("test_item_detail").getData();
        const hedonicSubmittedData = await this.tm.getTN("hedonic_scale_other").getData();

        for (const item of hedonicSubmittedData) {
            await this.tm.getTN("hedonic_lists").createEntityP({
                rating_parameter: item.rating_parameter,
                rating: item.rating,
                rating_value: item.rating_value,
                parent_guid: selectedList.my_key
            }, "Created Successfully", "Creation Failed", null, "First", true, true);
        }

        selectedList.test_status = "Completed";

        // Calculate progress
        const totalItems = listData.length;
        const completedItems = listData.filter(item => item.test_status === "Completed").length;
        const percentageCompleted = Math.round((completedItems / totalItems) * 100);

        // Update item test detail status
        if (completedItems === totalItems) {
            itemTestDetail.test_status = "Completed";
        } else {
            itemTestDetail.test_status = "InProgress";
        }

        // Update progress in information_header_other
        await this.tm.getTN("information_header_other").setData(percentageCompleted);

        await this.tm.commitP("Saved Successfully", "Save Failed");

        // await this.navTo({ SS: "s_colddri_list" });
    }

    public async onSubmitPairedComparison() {
        const index = await this.tm.getTN("panalist_item_list").getActiveIndex();
        const listData = await this.tm.getTN("panalist_item_list").getData();
        const selectedList = listData[index];

        const pairedComparisonData = await this.tm.getTN("paired_comparison_other").getData();

        for (const item of pairedComparisonData) {
            await this.tm.getTN("paired_comp_lists").createEntityP({
                questions: item.question_text,
                one: item.one === true,
                two: item.two === true,
                parent_guid: selectedList.my_key
            }, "Created Successfully", "Creation Failed", null, "First", true, true);
        }

        selectedList.test_status = "Completed";

        // Get test item detail
        const itemTestDetail = await this.tm.getTN("test_item_detail").getData();

        // Count completed and total items
        const totalItems = listData.length;
        const completedItems = listData.filter(item => item.test_status === "Completed").length;
        const percentageCompleted = Math.round((completedItems / totalItems) * 100);

        // Update test status
        if (completedItems === totalItems) {
            itemTestDetail.test_status = "Completed";
        } else {
            itemTestDetail.test_status = "InProgress";
        }

        // Set progress percentage directly
        await this.tm.getTN("information_header_other").setData(percentageCompleted);

        await this.tm.commitP("Saved Successfully", "Save Failed");

        // await this.navTo({ SS: "s_colddri_list" });
    }

    public async onSubmitJustAboutRightData() {
        const index = await this.tm.getTN("panalist_item_list").getActiveIndex();
        const listData = await this.tm.getTN("panalist_item_list").getData();
        const selectedList = listData[index];

        const justAboutRightData = await this.tm.getTN("just_about_right_other").getData();

        for (const item of justAboutRightData) {
            await this.tm.getTN("just_abt_rgt_lists").createEntityP({
                abt_parameter: item.parameter,
                one: item.one === true,
                two: item.two === true,
                three: item.three === true,
                four: item.four === true,
                five: item.five === true,
                parent_guid: selectedList.my_key
            }, "Created Successfully", "Creation Failed", null, "First", true, true);
        }

        selectedList.test_status = "Completed";

        // Fetch test item detail
        const itemTestDetail = await this.tm.getTN("test_item_detail").getData();

        // Count completed and total items
        const totalItems = listData.length;
        const completedItems = listData.filter(item => item.test_status === "Completed").length;
        const percentageCompleted = Math.round((completedItems / totalItems) * 100);

        // Update test item status
        if (completedItems === totalItems) {
            itemTestDetail.test_status = "Completed";
        } else {
            itemTestDetail.test_status = "InProgress";
        }

        // Set percentage in information_header_other
        await this.tm.getTN("information_header_other").setData(percentageCompleted);

        await this.tm.commitP("Saved Successfully", "Save Failed");

        // await this.navTo({ SS: "s_colddri_list" });
    }

    public async onSubmitLineScale() {
        const index = await this.tm.getTN("panalist_item_list").getActiveIndex();
        const listData = await this.tm.getTN("panalist_item_list").getData();
        const selectedList = listData[index];

        const lineScaleSubmittedData = await this.tm.getTN("line_scale_other").getData();

        for (const item of lineScaleSubmittedData) {
            await this.tm.getTN("line_scale_lists").createEntityP({
                rating_parameter: item.rating_parameter,
                rating: item.rating,
                rating_value: item.rating_value,
                parent_guid: selectedList.my_key
            }, "Created Successfully", "Creation Failed", null, "First", true, true);
        }

        selectedList.test_status = "Completed";

        // Fetch test item detail
        const itemTestDetail = await this.tm.getTN("test_item_detail").getData();

        // Count completed and total items
        const totalItems = listData.length;
        const completedItems = listData.filter(item => item.test_status === "Completed").length;
        const percentageCompleted = Math.round((completedItems / totalItems) * 100);

        // Update test item status
        if (completedItems === totalItems) {
            itemTestDetail.test_status = "Completed";
        } else {
            itemTestDetail.test_status = "InProgress";
        }

        // Set percentage in information_header_other
        await this.tm.getTN("information_header_other").setData(percentageCompleted);

        await this.tm.commitP("Saved Successfully", "Save Failed");

        // await this.navTo({ SS: "s_colddri_list" });
    }


}