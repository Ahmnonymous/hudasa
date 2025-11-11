const DEFAULT_ALERT = "Please correct the highlighted errors.";
const ERROR_HIGHLIGHT_CLASS = "form-error-focus";
const ERROR_HIGHLIGHT_DURATION = 2500;
const DEFAULT_FOCUS_DELAY = 200;

const normalizePath = (fieldPath = "") =>
	fieldPath.replace(/\.(\d+)/g, "[$1]");

const findFirstErrorEntry = (errors, parentPath = "") => {
	if (!errors || typeof errors !== "object") return null;

	for (const key of Object.keys(errors)) {
		const value = errors[key];
		if (!value) continue;

		const currentPath = parentPath ? `${parentPath}.${key}` : key;

		if (value.message || value.type) {
			return { name: currentPath, error: value };
		}

		if (typeof value === "object") {
			const nested = findFirstErrorEntry(value, currentPath);
			if (nested) return nested;
		}
	}

	return null;
};

const applyTemporaryHighlight = (element) => {
	if (!element || !element.classList) return;

	element.classList.add(ERROR_HIGHLIGHT_CLASS);
	setTimeout(() => {
		element.classList.remove(ERROR_HIGHLIGHT_CLASS);
	}, ERROR_HIGHLIGHT_DURATION);
};

const focusFieldElement = (fieldName) => {
	if (typeof document === "undefined") return;

	const normalizedName = normalizePath(fieldName);
	const selectors = [
		`#${normalizedName}`,
		`#${fieldName}`,
		`[name="${normalizedName}"]`,
		`[name="${fieldName}"]`,
	];

	let target = null;
	for (const selector of selectors) {
		target = document.querySelector(selector);
		if (target) break;
	}

	if (!target) return;

	if (typeof target.scrollIntoView === "function") {
		target.scrollIntoView({ behavior: "smooth", block: "center" });
	}

	if (typeof target.focus === "function") {
		target.focus({ preventScroll: true });
	}

	applyTemporaryHighlight(target);
};

export const createFieldTabMap = (tabFieldMap = {}) => {
	if (!tabFieldMap || typeof tabFieldMap !== "object") return {};

	const fieldTabMap = {};
	for (const [tabId, fields] of Object.entries(tabFieldMap)) {
		if (!Array.isArray(fields)) continue;
		for (const fieldName of fields) {
			if (typeof fieldName !== "string" || !fieldName.trim()) continue;
			fieldTabMap[fieldName] = tabId;
			fieldTabMap[normalizePath(fieldName)] = tabId;
		}
	}

	return fieldTabMap;
};

export const handleTabbedFormErrors = (options) => {
	const {
		errors,
		fieldTabMap,
		tabLabelMap,
		setActiveTab,
		showAlert,
		focusDelay = DEFAULT_FOCUS_DELAY,
	} = options || {};

	if (!errors || Object.keys(errors).length === 0) return;

	const firstError = findFirstErrorEntry(errors);
	if (!firstError) return;

	const { name: fieldName, error } = firstError;
	const normalizedName = normalizePath(fieldName);
	const targetTab =
		fieldTabMap?.[normalizedName] ||
		fieldTabMap?.[fieldName] ||
		null;

	if (targetTab && typeof setActiveTab === "function") {
		setActiveTab(targetTab);
	}

	const tabLabel = tabLabelMap?.[targetTab];
	const alertMessage =
		tabLabel
			? `Please correct errors in the ${tabLabel} tab.`
			: error?.message || DEFAULT_ALERT;

	if (typeof showAlert === "function") {
		showAlert(alertMessage, "danger");
	}

	setTimeout(() => focusFieldElement(fieldName), focusDelay);
};


