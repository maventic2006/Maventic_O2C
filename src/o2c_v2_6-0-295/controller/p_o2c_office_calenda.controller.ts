import { ValidationError } from 'kloBo/_BoRestricted/query/QueryVars';
import { KloController } from 'kloTouch/jspublic/KloController';
import { calendarworkingdays } from 'o2c_v2/util/calendarworkingdays';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_o2c_office_calenda")
export default class p_o2c_office_calenda extends KloController {
    public onInit() {
    }
    public onBeforeRendering() {
    }
    public onAfterRendering() {
    }
    public onExit() {
    }
    public async onPageEnter() {
        this.setMode("REVIEW");
    }
    public async onScreenEnter(screenIds: string[]) {
        this.setMode("REVIEW");
    }


    public async createOffice() {
        await this.tm.getTN("o2c_office_calendar_hdr_list").createEntityP({}, null, "Creation Failed", null, "First", true, true);
        await this.tm.getTN("o2c_office_calendar_hdr_det/r_office_calendar").createEntityP({ s_object_type: -1 }, null, "Creation Failed", null, "First", true, true);

    }
    public async onChange(oEvent: sap.ui.base.Event) {
        //duplication holiday ID
        let entity = this.tm.getTN('o2c_office_calendar_hdr_det').getData();
        let q = await this.transaction.getExecutedQuery('d_o2c_office_calendar_hdr', { loadAll: true, 'office_calendar_id': entity.office_calendar_id })
        if (q.length) {
            //sap.m.MessageToast.show("This Holiday ID is already exist",{duration:400});
            sap.m.MessageBox.error("This Calendar ID is already exist", { title: "Error", duration: 400 })
            entity.office_calendar_id = null;
        }
        //set the id for the relation entity
        if (entity.office_calendar_id != null) {
            let o_value = entity.office_calendar_id;
            let index = this.tm.getTN("o2c_office_calendar_hdr_list").getActiveIndex();
            this.tm.getTN("o2c_office_calendar_hdr_det/r_office_calendar").getData()[index].office_calendar_id = o_value;
        }
    }

    public async onChangetoYear() {
        //let temp: ValidationError[] = await this.tm.getTN("/r_office_calendar_del").getData().OnValidate();
        // await this.tm.getTN("r_office_calendar_del").getData().validateP();
    }
    public onChangeDate(oEvent: sap.ui.base.Event) {
        let index = this.tm.getTN("o2c_office_calendar_hdr_list").getActiveIndex();
        let ob = this.tm.getTN("o2c_office_calendar_hdr_det/r_office_calendar").getData();
        let from_year = ob[0].fis_year_from;
        let to_year = ob[0].fiscal_year_to;
        let date = oEvent.getParameters().newValue;
        let date_time = new Date(date)
        if ((from_year > date_time) || (to_year < date_time)) {
            this.tm.getTN("o2c_office_calendar_hdr_det/r_list").getData()[0].office_da = null;
            sap.m.MessageToast.show("Please enter the date between from date and to date", { duration: 800 });
        }

    }
    public async onChangeYear(oEvent: sap.ui.base.Event) {
        let index = this.tm.getTN("o2c_office_calendar_hdr_list").getActiveIndex();
        let ob = this.tm.getTN("o2c_office_calendar_hdr_det/r_office_calendar").getData();
        let year1 = (ob[0].fis_year_from).getFullYear();
        let year2 = (ob[0].fiscal_year_to).getFullYear();
        let year = oEvent.getParameters().newValue;
        if ((year1 > year) || (year2 < year)) {
            this.tm.getTN("o2c_office_calendar_hdr_det/r_list").getData()[0].year = null;
            sap.m.MessageToast.show("Please enter the year between from date and to date", { duration: 800 });
        }

    }
    public async onSave() {

        await this.tm.getTN("o2c_office_calendar_hdr_det").getData().validateP();
        await this.tm.commitP("Successfully Saved", "Save failed", true, true);
        //await this.tm.getTN('o2c_office_calendar_hdr_det').commitP()
        if (this.getMode() == "DISPLAY") {
            sap.m.MessageBox.confirm("Are you sure you want to stay in this page", {
                title: "Confirm",
                actions: [sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO],
                onClose: (oAction) => {
                    if (oAction == "YES") {

                        this.navTo(({ S: "p_o2c_office_calenda", SS: 'pa_details_page' }));
                    }
                    if (oAction == "NO") {

                        this.navTo(({ S: 'p_calendar' }));
                    }

                }
            })
        }



    }

    public async cancel() {
        //let mode=this.getMode();
        //if(mode=="EDIT" || mode=="CREATE"){
        //await this.tm.getTN('/o2c_office_calendar_hdr_list').Refresh();
        await this.transaction.rollback();
        await this.tm.getTN("o2c_office_calendar_hdr_det").refresh()

        await this.navTo(({ S: 'p_o2c_office_calenda', SS: 'pa_button' }));
        this.setMode("REVIEW");
    }
    public async onEdit(oEvent: sap.ui.base.Event) {
        //await this.navTo(({ S: 'p_o2c_office_calenda', SS: 'pa_detail' }));
        await this.navTo(({ SS: 'pa_detail' }), oEvent)
        await this.setMode("EDIT");
        await this.holidayIDEditable();
    }
    public async detail_Edit() {
        this.setMode("EDIT");
    }

    public async onDisplay(oEvent: sap.ui.base.Event) {
        this.setMode("DISPLAY");
        // await this.navTo(({ S: 'p_o2c_office_calenda', SS: 'pa_detail' }));
        await this.navTo(({ SS: 'pa_detail' }), oEvent)

    }
    public async Delete() {
        // deleting the above data
        let index = this.tm.getTN("o2c_office_calendar_hdr_list").getActiveIndex()
        await this.tm.getTN("o2c_office_calendar_hdr_list").getData()[index].deleteP()

        // let data=this.tm.getTN('o2c_office_calendar_hdr_det/r_office_calendar').getData();

        let data_delete = await this.tm.getTN('o2c_office_calendar_hdr_det/r_office_calendar').getData()[0].deleteP()
        console.log(data_delete);
        /*
        for(let i=0;i<total_row;i++){
        await this.tm.getTN("/relation_holiday").getData()[i].deleteP()
        }*/
        await this.tm.commitP("Deleted Successfully", "Save failed", true, true);
        this.setMode("REVIEW")
        await this.navTo(({ S: 'p_o2c_office_calenda', SS: 'pa_button' }));

    }
    public async onDelete() {
        sap.m.MessageBox.confirm("Are you sure you want to delete this calendar", {
            title: "Confirm",
            actions: [sap.m.MessageBox.Action.YES,
            sap.m.MessageBox.Action.NO],
            onClose: (oAction) => {
                if (oAction == "YES") {

                    this.Delete();
                }
                if (oAction == "NO") {
                    this.navTo(({ S: "p_o2c_office_calenda", SS: 'pa_details_page' }));

                }

            }
        })

    }
    public async homepage() {
        await this.navTo(({ S: 'p_o2c_office_calenda', SS: 'pa_button' }));
        this.setMode("REVIEW");

    }
    public async dashboard() {
        this.navTo(({ S: 'p_calendar' }));
    }
    public async holidayIDEditable() {
        let date = new Date();
        let date1 = "1/1/2024";
        let x = new Date(date1)
        let date2 = "1/10/2024";
        let y = new Date(date2)
        if (date >= x && date <= y) {
            await this.tm.getTN("other").setData({ editable: "True" })
            console.log("IF")
        }
        else {
            await this.tm.getTN("other").setData({ editable: "False" })
            console.log("ELSE")
        }

    }
    public async addOffice() {
        let office_id = await this.tm.getTN("o2c_office_calendar_hdr_det").getData().office_calendar_id;
        if (office_id)
            await this.tm.getTN("o2c_office_calendar_hdr_det/r_list").createEntityP({ s_object_type: -1 }, "Created Successfully", "Created Failed", null, "First", true, true);
        else
            sap.m.MessageBox.warning("Please first enter the office calendar detail", {
                title: "Warning"
            })
    }
    
    public async onCalculatingMonthlyWorkingDays() {
        const holidayList = await this.transaction.getExecutedQuery('d_o2c_holiday_calendar', {
            loadAll: true,
            holiday_calender_id: "MBLR",
            partialSelect: ['holiday_date']
        });

        const holidays = holidayList.map((holiday: any) => new Date(holiday.holiday_date).toDateString());

        const monthWorkingDays: Record<string, number> = {
            january: 0,
            february: 0,
            march: 0,
            april: 0,
            may: 0,
            june: 0,
            july: 0,
            august: 0,
            september: 0,
            october: 0,
            november: 0,
            december: 0,
        };

        const currentYear = new Date().getFullYear();

        for (let month = 0; month < 12; month++) {
            const firstDayOfMonth = new Date(currentYear, month, 1);
            const lastDayOfMonth = new Date(currentYear, month + 1, 0);

            for (let day = firstDayOfMonth; day <= lastDayOfMonth; day.setDate(day.getDate() + 1)) {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isHoliday = holidays.includes(day.toDateString());

                if (!isWeekend && !isHoliday) {
                    const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long' }).toLowerCase();
                    monthWorkingDays[monthName]++;
                }
            }
        }

        const listData = await this.tm.getTN("r_office_calendar_list").getData();

        listData[0].january_working_days = monthWorkingDays.january;
        listData[0].february_working_days = monthWorkingDays.february;
        listData[0].march_working_days = monthWorkingDays.march;
        listData[0].april_working_days = monthWorkingDays.april;
        listData[0].may_working_days = monthWorkingDays.may;
        listData[0].june_working_days = monthWorkingDays.june;
        listData[0].july_working_days = monthWorkingDays.july;
        listData[0].august_working_days = monthWorkingDays.august;
        listData[0].september_working_days = monthWorkingDays.september;
        listData[0].october_working_days = monthWorkingDays.october;
        listData[0].november_working_days = monthWorkingDays.november;
        listData[0].december_working_days = monthWorkingDays.december;
    }

}
//loadAll true
