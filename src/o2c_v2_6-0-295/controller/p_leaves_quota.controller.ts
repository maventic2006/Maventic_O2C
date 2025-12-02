import { KloTransaction } from 'kloBo/KloTransaction';
import { KloEntitySet } from 'kloBo/KloEntitySet';
import { KloController } from 'kloTouch/jspublic/KloController'
import { d_o2c_leave_category } from 'o2c_v2/entity_gen/d_o2c_leave_category';
import { d_o2c_emp_leave_quota } from 'o2c_v2/entity_gen/d_o2c_emp_leave_quota';
import { d_o2c_employee } from 'o2c_v2/entity_gen/d_o2c_employee';
declare let KloUI5: any;
@KloUI5("o2c_v2.controller.p_leaves_quota")
export default class p_leaves_quota extends KloController {
	public onInit() {
	}
	public onBeforeRendering() {
	}
	public onAfterRendering() {
	}
	public onExit() {
	}

	public async onPageEnter() {
		let roleid = (await this.transaction.get$Role()).role_id;
		await this.tm.getTN("role_other").setData({ role: roleid });
		if (!window['XLSX']) {//
			// await clientGlobalObj.loadScriptFile('closedmodules/kloExternal/xlsx.bundle.js');
			let path = "kloExternal/xlsx.bundle"
			let data = await import(path)
		}
	}
	public async download_excel_file() {
		let t_node = await this.tm.getTN('o2c_emp_leave_quota_list').getData();
		let lv_data = new Set();
		for (let i = 0; i < t_node.length; i++) {
			let employee_table = { employee_id: t_node[i].employee_id, category_description: t_node[i].category_description, no_of_days: t_node[i].no_of_days, used_leave: t_node[i].used_leave, unused_leave: t_node[i].unused_leave, earned_leave: t_node[i].earned_leave, allegiant_leave: t_node[i].allegiant_leave, company_code: t_node[i].company_code, business_area: t_node[i].business_area, carry_forward: t_node[i].carry_forward, used_carry_forward: t_node[i].used_carry_forward, rem_carry_forward: t_node[i].rem_carry_forward, requested_leave: t_node[i].requested_leave, valid_to: t_node[i].valid_to, valid_from: t_node[i].valid_from, category_id: t_node[i].category_id, assign_quota: t_node[i].assign_quota, carry_forward_till: t_node[i].carry_forward_till, extended: t_node[i].extended, leave_types: t_node[i].leave_types, line_manager: t_node[i].lmi, quota_id: t_node[i].quota_id }
			lv_data.add(employee_table);
		}
		let download_data = Array.from(lv_data);
		console.log(t_node)
		let file_name = "Leave Quota".concat(".xlsx");
		//console.log(file_name);
		var ws = XLSX.utils.json_to_sheet(download_data);
		var wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Leave Quota sheet");
		XLSX.writeFile(wb, file_name, { compression: true });
		//XLSX.writeFile(wb, "TimeSheetReport.xlsx", { compression: true }).
	}


	public async onQsave() {
		let roleid = (await this.transaction.get$Role()).role_id;
		console.log(roleid)

		await this.tm.commitP("Save Successfully", "Save Failed", true, true);
	}
	public onEdidLv() {
		this.setMode('EDIT');
	}


	public on_monthly_sch() {
		sap.m.MessageBox.confirm("Are You Sure You want to add monthly earned leave ", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: async (oAction) => {
				if (oAction == "OK") {
					let oBusyDailog = new sap.m.BusyDialog();
					oBusyDailog.open();
					await this.one_month_sch();
					oBusyDailog.close()
				}
			}
		})

	}
	public async one_month_sch() {
		let txn: KloTransaction = this.transaction;
		let earnerLeave = <KloEntitySet<d_o2c_leave_category>>await txn.getExecutedQuery('d_o2c_leave_category', { is_earned_leave: true, loadAll: true })
		for (let i = 0; i < earnerLeave.length; i++) {
			let quotaData = <KloEntitySet<d_o2c_emp_leave_quota>>await txn.getExecutedQuery('d_o2c_emp_leave_quota', { company_code: earnerLeave[i].company_code, business_area: earnerLeave[i].business_area, leave_types: earnerLeave[i].leave_types,valid_to:new Date(new Date().getFullYear(),11,31).setHours(0,0,0,0),loadAll: true });
			for (let j = 0; j < quotaData.length; j++) {
				quotaData[j].no_of_days = parseFloat(quotaData[j].no_of_days) + parseFloat(earnerLeave[i].quota / 12)
				quotaData[j].earned_leave = parseFloat(quotaData[j].earned_leave) + parseFloat(earnerLeave[i].quota / 12)
				if (parseFloat(quotaData[j].extended) == 0) {
					quotaData[j].unused_leave = parseFloat(quotaData[j].unused_leave) + parseFloat(earnerLeave[i].quota / 12)
				} else if (parseFloat(quotaData[j].extended) > 0) {
					let tempextended = parseFloat(quotaData[j].extended)
					quotaData[j].extended = parseFloat(quotaData[j].extended) - parseFloat(earnerLeave[i].quota / 12)
					if (parseFloat(quotaData[j].extended) >= 0) {
						quotaData[j].used_leave = parseFloat(quotaData[j].used_leave) + parseFloat(earnerLeave[i].quota / 12)
					} else if (parseFloat(quotaData[j].extended) <= 0) {
						quotaData[j].used_leave = parseFloat(quotaData[j].used_leave) + tempextended
						quotaData[j].unused_leave = parseFloat(quotaData[j].unused_leave) + (parseFloat(quotaData[j].no_of_days) - parseFloat(quotaData[j].used_leave))
						quotaData[j].extended = parseFloat("0")
					}
				}
			}
		}
		sap.m.MessageBox.success("Please click on save button for save the changes.", {
			title: "success"
		})

	}

	public async march_sch_confirm() {
		sap.m.MessageBox.confirm("Are You Sure You want to deactivate carry forward leave ", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: async (oAction) => {
				if (oAction == "OK") {
					let oBusyDailog = new sap.m.BusyDialog();
					oBusyDailog.open();
					await this.march_sch();
					oBusyDailog.close()
				}
			}
		})

	}

	public async march_sch() {
		let txn: KloTransaction = this.transaction;
		let data = <KloEntitySet<d_o2c_emp_leave_quota>>await txn.getExecutedQuery('d_o2c_emp_leave_quota', { loadAll: true });
		for (let i = 0; i < data.length; i++) {
			if (data[i].rem_carry_forward > 0) {

				data[i].no_of_days = parseFloat(data[i].no_of_days) - parseFloat(data[i].rem_carry_forward);
				data[i].unused_leave = parseFloat(data[i].unused_leave) - parseFloat(data[i].rem_carry_forward)
				data[i].rem_carry_forward = 0;

			}
		}
		await txn.commitP();

	}

	// leave Calculate

	public async onLeaveCalculateConfirm() {
		sap.m.MessageBox.confirm("Are you sure want to recalculate leaves ", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: async (oAction) => {
				if (oAction == "OK") {
					let oBusyDailog = new sap.m.BusyDialog();
					oBusyDailog.open();
					await this.onLeaveCalculate();
					oBusyDailog.close()
				}
			}
		})

	}
	public async onLeaveCalculate() {

		// this code should run only one time // after run it commented 
		// let data = 	<KloEntitySet<d_o2c_emp_leave_quota>>await this.transaction.getExecutedQuery('d_o2c_emp_leave_quota', { leave_types:"Casual" ,loadAll:true})


		// let oBusyDailog = new sap.m.BusyDialog();
		// oBusyDailog.open();
		// for (let i = 0; i < data.length; i++) {
		// 	if (parseFloat(data[i].used_carry_forward) > parseFloat("0") && parseFloat(data[i].rem_carry_forward) == parseFloat("0")) {
		// 		data[i].no_of_days = parseFloat(data[i].no_of_days) - parseFloat(data[i].used_carry_forward);
		// 		data[i].used_leave = parseFloat(data[i].used_leave) - parseFloat(data[i].used_carry_forward);
		// 		data[i].carry_forward_till = new Date(2024,2,31);
		// 	}
		// }
		// oBusyDailog.close();
		// sap.m.MessageBox.success("Please verify the data once before clicking on the save button to save the changes.Please reload if you do not want changes.", {
		// 	title: "success"
		// })


	}




	// Yearly scheduler 

	public async yearlySch() {
		//let txn: KloTransaction = event.getTxn();
		let txn: KloTransaction = this.transaction;
		let leaveType = ["Casual", "Sick"]
		let alligentLeave = 0, qtaData, empData;
		let previous_year = this.getPreviousYearDates();

		let leaveCategory = <KloEntitySet<d_o2c_leave_category>>await txn.getExecutedQuery('q_category_yearly_sch', { loadAll: true })

		let employeeData = <KloEntitySet<d_o2c_employee>>await txn.getExecutedQuery('d_o2c_employee', { loadAll: true });

		let quotaData = <KloEntitySet<d_o2c_emp_leave_quota>>await txn.getExecutedQuery('q_quota_yearly_sch', { loadAll: true, s_date: previous_year.startDate.getTime(), e_date: previous_year.endDate.getTime() });


		for (let i = 0; i < leaveCategory.length; i++) {

			if (leaveCategory[i].leave_types != "Allegiant") {

				qtaData = quotaData.filter((item) => (item.category_id == leaveCategory[i].category_id));

				for (let j = 0; j < qtaData.length; j++) {
					empData = employeeData.filter((item) => (item.employee_id.toLowerCase() == qtaData[j].employee_id.toLowerCase()));
					if (empData.length && empData[0].s_status == "Approved") {
						let newQuota = await txn.createEntityP('d_o2c_emp_leave_quota', {
							s_object_type: -1,
							valid_to: new Date(new Date().getFullYear(), 11, 31),
							valid_from: new Date(new Date().getFullYear(), 0, 1),
							used_leave: parseFloat("0"),
							unused_leave: parseFloat(leaveCategory[i].quota),
							seq_id: qtaData[j].employee_id,
							no_of_days: parseFloat(leaveCategory[i].quota),
							lmi: qtaData[j].lmi,
							employee_id: qtaData[j].employee_id,
							company_code: leaveCategory[i].company_code,
							category_id: leaveCategory[i].category_id,
							business_area: leaveCategory[i].business_area,
							category_description: leaveCategory[i].category_description,
							leave_types: leaveCategory[i].leave_types,
							extended: parseFloat("0"),
							requested_leave: parseFloat("0"),
							allegiant_leave: alligentLeave,
							earned_leave: parseFloat("0"),
							carry_forward: parseFloat("0"),
							rem_carry_forward: parseFloat("0"),
							used_carry_forward: parseFloat("0"),
							assign_quota: parseFloat(leaveCategory[i].quota)
						});

						//Calculate Allegiant Leave
						if (leaveCategory[i].leave_types == "Casual") {

							newQuota.carry_forward = parseFloat(parseFloat(qtaData[j].unused_leave) - parseFloat(qtaData[j].requested_leave) > 0 ? (parseFloat(qtaData[j].unused_leave) - parseFloat(qtaData[j].requested_leave)) : "0");
							newQuota.rem_carry_forward = parseFloat(parseFloat(qtaData[j].unused_leave) - parseFloat(qtaData[j].requested_leave) > 0 ? (parseFloat(qtaData[j].unused_leave) - parseFloat(qtaData[j].requested_leave)) : "0");
							newQuota.used_carry_forward = parseFloat("0");
							newQuota.carry_forward_till = new Date(new Date().getFullYear(), 2, 31)
							//let joiningDate = employeeData.filter((item) => (item.employee_id.toLocaleLowerCase() == qtaData[j].employee_id.toLowerCase()));

							let diffTime = Math.abs(new Date().getTime() - empData[0].joining_date.getTime());
							let days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
							const exprience = Math.floor(days / 365);


							let alligent = leaveCategory.filter((item) => (item.company_code.toLowerCase() == leaveCategory[i].company_code.toLowerCase() && item.business_area.toLowerCase() == leaveCategory[i].business_area.toLowerCase() && item.leave_types == "Allegiant"));

							if (exprience <= 3) {
								for (let k = 1; k < exprience; k++) {
									alligentLeave = alligentLeave + parseFloat(alligent[0].quota / 3);
								}
							} else {
								alligentLeave = alligent[0].quota;
							}

							newQuota.allegiant_leave = parseFloat(alligentLeave);
							newQuota.no_of_days = parseFloat(leaveCategory[i].quota) + parseFloat(alligentLeave);
							newQuota.unused_leave = parseFloat(newQuota.no_of_days);
							alligentLeave = 0;
						}

					}
				}

			}

		}

		await txn.commitP();


	}


	public getPreviousYearDates() {
		// Get the current date
		const currentDate = new Date();

		// Get the previous year
		const previousYear = currentDate.getFullYear() - 1;

		// Start date (January 1st of the previous year)
		const startDate = new Date(previousYear, 0, 1);

		// End date (December 31st of the previous year)
		const endDate = new Date(previousYear, 11, 31);

		return {
			startDate: startDate,
			endDate: endDate
		};
	}


	public on_yearly_sch() {
		sap.m.MessageBox.confirm("Are You Sure You want to add yearly leave ", {
			title: "Confirm",
			actions: [sap.m.MessageBox.Action.OK,
			sap.m.MessageBox.Action.CANCEL],
			onClose: async (oAction) => {
				if (oAction == "OK") {
					let oBusyDailog = new sap.m.BusyDialog();
					oBusyDailog.open();
					await this.yearlySch();
					oBusyDailog.close()
				}
			}
		})

	}




}