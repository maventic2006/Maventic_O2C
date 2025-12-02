import { d_colddrink_research as d_colddrink_research_gen } from "o2c_v2/entity_gen/d_colddrink_research"
export class d_colddrink_research extends d_colddrink_research_gen {
    public get transient_status(): string {
        const testData = this.r_research_items;

        if (!testData || testData.length === 0) {
            return "No test data available";
        }

        const completedCount = testData.filter((item: any) => item.test_status === "Completed").length;
        const totalCount = testData.length;

        return `Test completed by ${completedCount} of ${totalCount} panelists`;
    }

}