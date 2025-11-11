export async function validateTabsAndNavigate(options) {
	const {
		requiredFields,
		fieldTabMap,
		tabLabelMap,
		trigger,
		getValues,
		setActiveTab,
		showAlert,
	} = options;

	// Validate required fields across all tabs
	const isValid = await trigger(requiredFields, { shouldFocus: false });
	if (isValid) return true;

	// Collect missing fields
	const missing = [];
	for (const field of requiredFields) {
		const value = getValues(field);
		if (
			value === undefined ||
			value === null ||
			value === "" ||
			(typeof value === "string" && value.trim() === "")
		) {
			missing.push(field);
		}
	}

	if (missing.length === 0) return false;

	// Navigate to first tab with a missing field
	const firstMissingField = missing[0];
	const firstMissingTab = fieldTabMap[firstMissingField];
	if (firstMissingTab) setActiveTab(firstMissingTab);

	const tabLabel = tabLabelMap?.[firstMissingTab];
	const alertMessage = tabLabel
		? `Please correct errors in the ${tabLabel} tab.`
		: `Please fill required fields: ${missing.join(", ")}`;

	showAlert(alertMessage, "danger");

	// Scroll into view after tab switch
	setTimeout(() => {
		const el =
			document.getElementById(firstMissingField) ||
			document.querySelector(`[name="${firstMissingField}"]`);
		if (el && typeof el.scrollIntoView === "function") {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			if (typeof el.focus === "function") el.focus();
		}
	}, 150);

	return false;
}


