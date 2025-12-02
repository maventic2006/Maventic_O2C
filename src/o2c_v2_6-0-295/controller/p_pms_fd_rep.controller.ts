import { FileLoaderUtils } from "kloBo/Utils/FileLoaderUtils";
import { KloController } from "kloTouch/jspublic/KloController";
declare let KloUI5: any;
let isTableInitialized = false;
let originalMatrixData;
@KloUI5("o2c_v2.controller.p_pms_fd_rep")
export default class p_pms_fd_rep extends KloController {
	public attributeList: [];
	public model_name;
	public aColumns;
	public empData;
	public async onPageEnter() {
		let busyDialog = new sap.m.BusyDialog({});
		busyDialog.open();
		let oTable: sap.ui.table.Table = <sap.ui.table.Table>this.getActiveControlById("table", "section01");
		oTable.setSelectionMode(sap.ui.table.SelectionMode.None);
		if (oTable.getColumns()?.length) oTable.removeAllColumns();

		await this.tm.getTN("rating_list").setData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		//getting feedback records data for current login manager
		let allRecords = await this.transaction.getExecutedQuery("d_pms_feedback", { loadAll: true, assessor: this.transaction.getUserID() });
		let skillData = await this.transaction.getExecutedQuery("d_pms_feedback_skill", { loadAll: true });
		let skilledUsedByEmp = this.getUsedSkills(skillData);
		this.aColumns = await this.transaction.getExecutedQuery("d_pms_attribute", { attribute_id: skilledUsedByEmp, loadAll: true });
		this.empData = this.transformEmpData(allRecords, skillData);
		await this.tm.getTN("empData").setData(this.empData);

		const skills = this.aColumns.map((e) => e.attribute_text);
		const matrixData = this.getMatrixData(skills);
		originalMatrixData = JSON.parse(JSON.stringify(matrixData));
		await this.tm.getTN("matrixData").setData(matrixData);

		this.model_name = this.s.model_name;

		// Skill Column with Search Filter

		oTable.addColumn(
			new sap.ui.table.Column({
				width: "auto", // or omit this completely
				resizable: true,
				autoResizable: true,
				hAlign: "Center",
				label: new sap.m.VBox({
					alignItems: sap.m.FlexAlignItems.Center,
					items: [
						new sap.m.Label({ text: "Skills", design: "Bold" }).addStyleClass("compactLabel"),
						new sap.m.SearchField({
							placeholder: "Search skill...",
							liveChange: (oEvent) => {
								const sQuery = oEvent.getSource().getValue();
								const oBinding = oTable.getBinding("rows");
								const oFilter = new sap.ui.model.Filter("skill", sap.ui.model.FilterOperator.Contains, sQuery);
								oBinding.filter(sQuery ? [oFilter] : []);
							},
							width: "100%",
						}).addStyleClass("sapUiTinyMarginTop"),
					],
				}),
				template: new sap.m.Text({ text: `{${this.model_name}>skill}` }),
				// width: "12em",
			})
		);

		this.empData.forEach((emp, index) => {
			const empKey = this.getName(emp.name);
			oTable.addColumn(
				new sap.ui.table.Column({
					width: "auto",
					resizable: true,
					autoResizable: true,
					hAlign: "Center",
					// label: new sap.m.VBox({
					// 	items: [new sap.m.Label({ text: emp.name, design: "Bold" }), new sap.m.Label({ text: emp.des, design: "Standard" }).addStyleClass("lightDesignation")],
					// 	alignItems: "Center",
					// }),
					label: new sap.m.VBox({
						items: [
							new sap.m.Label({
								text: emp.name,
								design: "Bold",
								class: "noCardLabel",
							}),
							new sap.m.Label({
								text: emp.des,
								design: "Standard",
								class: "noCardSubLabel",
							}),
						],
						alignItems: "Center",
						// class: "noCardHeader"
					}).addStyleClass("noCardHeader"),
					template: new sap.m.VBox("vBox_" + index, {
						alignItems: sap.m.FlexAlignItems.Center,
						items: [
							new sap.m.ComboBox({
								textAlign: "Center",
								width: "5em",
								items: {
									path: this.model_name + ">/rating_list",
									template: new sap.ui.core.Item({
										key: `{${this.model_name}>}`,
										text: `{${this.model_name}>}`,
									}),
								},
								selectedKey: `{${this.model_name}>${empKey}/rating}`,
								editable: `{= \${${this.model_name}>${empKey}/editable} }`,
								// change: this.handelChange.bind(this),
							}),
							new sap.m.Text({
								text: {
									parts: [{ path: `${this.model_name}>${empKey}/expected` }],
									formatter: function (expected) {
										return "Expected: " + expected;
									},
								},
							}).addStyleClass("expectedLabel"),

							// new sap.m.RatingIndicator({
							// 	value: `{${this.model_name}>${empKey}/rating}`,
							// 	maxValue: 5,
							// 	iconSize: "1rem",
							// 	visualMode: "Half",
							// 	editable: `{= \${${this.model_name}>${empKey}/editable} }`,
							// }),
						],
						customData: [
							new sap.ui.core.CustomData({
								key: "dynamicStyleClass",
								value: {
									parts: [{ path: `${this.model_name}>${empKey}/rating` }, { path: `${this.model_name}>${empKey}/expected` }],
									formatter: function (rating, expected) {
										if (rating == 0 || rating == null || rating == undefined) {
											return "noRating";
										}
										if (rating == expected) return "matchRating";
										if (rating < expected) return "lowRating";
										return "highRating";
									},
								},
								writeToDom: true,
							}),
						],
					}),
					// Apply class after rendering
					afterRendering: function () {
						const domRef = this.getDomRef();
						const dataClass = this.data("dynamicStyleClass");
						if (domRef && dataClass) {
							domRef.classList.add(dataClass);
						}
					},
				})
			);
		});

		oTable.bindRows(this.model_name + ">/matrixData");
		// oTable.setFixedColumnCount(1);
		oTable.setVisibleRowCount(10);
		oTable.setVisibleRowCountMode("Fixed");
		isTableInitialized = true;

		await FileLoaderUtils.loadCSSFile(this.getFlavor(), this.getFlavorVersion(), "pms_feedback_report");
		busyDialog.close();
	}

	// public getMatrixData(skills: any) {
	// 	let matrixData = skills.map((skill) => {
	// 		let row = { skill };
	// 		this.empData.forEach((emp) => {
	// 			let empKey = this.getName(emp.name);
	// 			row[empKey] = {
	// 				rating: emp[empKey][0][this.getName(skill.toLowerCase())],
	// 				expected: 4, // Or pull from some config
	// 			};
	// 		});
	// 		return row;
	// 	});
	// 	return matrixData;
	// }
	public getMatrixData(skills: any) {
		let matrixData = skills.map((skill) => {
			let row = { skill };
			this.empData.forEach((emp) => {
				let empKey = this.getName(emp.name);
				const empSkills = emp[empKey][0]; // skill key-value object
				const skillKey = this.getName(skill.toLowerCase());
				const isEditable = empSkills[skillKey]?.editable ? true : false;

				row[empKey] = {
					rating: empSkills[skillKey]?.rating || 0,
					expected: empSkills[skillKey]?.expected ?? "NA",
					editable: isEditable,
				};
			});
			return row;
		});
		return matrixData;
	}

	public async createNewColumn(oEvent) {
		let selectedValue = this.tm.getTN("selectedAttribute").getData();
		let oTable: sap.ui.table.Table = <sap.ui.table.Table>await this.getActiveControlById("table", "section01");
		oTable.addColumn(
			new sap.ui.table.Column({
				label: new sap.m.Label({ text: selectedValue }),
				template: new sap.m.VBox({
					alignItems: sap.m.FlexAlignItems.Center, // This centers all children horizontally
					items: [
						new sap.m.ComboBox({
							textAlign: "Center",
							width: "5em",
							items: {
								path: "comboModel>/options",
								template: new sap.ui.core.Item({
									key: "{comboModel>key}",
									text: "{comboModel>text}",
								}),
							},
							selectedKey: "{yourModel>selectedKey}",
							editable: "{= ${viewModel>/mode} === 'edit' }",
						}),
						new sap.m.Text({
							text: "Expected: 4",
						}),
						new sap.m.RatingIndicator({
							value: 3,
							maxValue: 5,
							iconSize: "1rem",
							visualMode: "Half",
							editable: "{= ${viewModel>/mode} === 'edit' }",
						}),
					],
				}),
				width: "12em",
				// sortProperty: col.template,
				// filterProperty: col.template,
			})
		);
	}
	public getName(name) {
		// let key = "";
		// name.split(" ").forEach((element) => {
		// 	key += element + "_";
		// });
		// return key;
		return name.replace(/\s+/g, "_");
	}
	public async onSubmit() {
		const updatedData = [];
		const currentMatrix = this.tm.getTN("matrixData").getData();

		currentMatrix.forEach((row, rowIndex) => {
			const originalRow = originalMatrixData[rowIndex];
			const skill = row.skill;
			const changedEntries = {};

			Object.keys(row).forEach((key) => {
				if (key === "skill") return; // Skip skill name

				const currentEntry = row[key];
				const originalEntry = originalRow[key];
				// Skip non-editable skills
				if (!currentEntry.editable) return;

				if (currentEntry.rating !== originalEntry.rating || currentEntry.expected !== originalEntry.expected) {
					changedEntries[key] = currentEntry;
				}
			});

			if (Object.keys(changedEntries).length > 0) {
				updatedData.push({
					skill,
					updatedBy: this.transaction.getUserID(), // or however you get user
					entries: changedEntries,
				});
			}
		});

		if (updatedData.length > 0) {
			console.log("Records to submit:", updatedData);

			// Call backend API or DB insert function
			// await this.transaction.insert("d_pms_fd_submit", updatedData); // sample table
			sap.m.MessageToast.show("Changes saved successfully.");
		} else {
			sap.m.MessageToast.show("No changes to save.");
		}
	}
	public transformEmpData(rawData, skillData) {
		return rawData.map((emp) => {
			const nameKey = emp.assessee_name.replace(/\s+/g, "_");
			let skills = skillData.filter((skill) => skill.feedback_id == emp.feedback_id);
			const skillsObject = {};
			for (const skill of skills) {
				const kpi = this.aColumns.filter((e) => e.attribute_id == skill.kpi_skill);
				const skillKey = kpi[0].attribute_text.toLowerCase().replace(/\s+/g, "_");
				skillsObject[skillKey] = {
					expected: skill.rating ?? 0,
					rating: skill.given_rating ?? 0,
					editable: true,
				};
			}

			return {
				name: emp.assessee_name,
				des: emp.designation ?? "Developer",
				[nameKey]: [skillsObject],
			};
		});
	}
	public getUsedSkills(skills_assigned_to_emps) {
		const usedSkillSet = new Set();

		skills_assigned_to_emps.forEach((entry) => {
			if (entry.kpi_skill) {
				usedSkillSet.add(entry.kpi_skill);
			}
		});

		return Array.from(usedSkillSet);
	}
}
