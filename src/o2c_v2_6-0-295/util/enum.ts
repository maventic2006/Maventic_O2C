export const Status = {
	submitted: "Submitted",
	notSubmitted: "Not Submitted",
	started: "Started",
	completed: "Completed",
	notStarted: "Not Started",
	statusEmp: ["Planned", "Planned Pending", "Waiting For Manager", "NA"],
	statusMgr: ["Planned", "Planned Pending", "NA"],
	agreedStatus: ["Pending", "Finalized", "Missed by MGR", "Missed by EMP", "Under Review"],
	reviewStatus: ["In-progress", "Not Started", "Not Completed", "Completed"],
} as const;

export const appraisalYear = {
	years: [new Date().getFullYear(), new Date().setFullYear(new Date().getFullYear() - 1), new Date().setFullYear(new Date().getFullYear() - 1)],
};
