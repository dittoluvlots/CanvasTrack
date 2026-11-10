"use strict";

// ========================================
// 1. CONFIGURATION AND DATA
// ========================================

const STORAGE_KEY = "artflow_projects_v1";
const TOS_STORAGE_KEY = "artflow_tos_v1";

const STATUSES = [
    "Pending",
    "Planning",
    "In Progress",
    "For Review",
    "Revision",
    "Completed"
];

const CATEGORIES = [
    "Illustration",
    "3D Art",
    "Graphic Design",
    "Other"
];

const SUPPORTED_CURRENCIES = ["PHP", "USD", "IDR", "EUR", "GBP", "JPY"];

const SAMPLE_PROJECTS = [
    {
        id: "sample-1",
        title: "Character Illustration",
        client: "Alex",
        category: "Illustration",
        price: 2500,
        currency: "PHP",
        deadline: "2026-11-05",
        status: "In Progress",
        description: "Finish the character coloring and final details.",
        createdAt: "2026-10-20T09:00:00.000Z"
    },
    {
        id: "sample-2",
        title: "Stylized 3D Character",
        client: "Morgan",
        category: "3D Art",
        price: 5000,
        currency: "PHP",
        deadline: "2026-11-08",
        status: "For Review",
        description: "Prepare the model for client review.",
        createdAt: "2026-10-21T09:00:00.000Z"
    },
    {
        id: "sample-3",
        title: "Brand Logo Design",
        client: "Jamie",
        category: "Graphic Design",
        price: 1800,
        currency: "PHP",
        deadline: "2026-11-12",
        status: "Planning",
        description: "Prepare the first concepts for the client.",
        createdAt: "2026-10-22T09:00:00.000Z"
    },
    {
        id: "sample-4",
        title: "Fantasy Mask Concept",
        client: "Taylor",
        category: "3D Art",
        price: 3200,
        currency: "PHP",
        deadline: "",
        status: "Completed",
        description: "Final model and revisions completed.",
        createdAt: "2026-10-18T09:00:00.000Z"
    }
];

const DEFAULT_TOS_SECTIONS = [
    {
        id: "tos-1",
        title: "Commission Intro",
        subtitle: "Standard greeting and booking overview.",
        body: "Hello! Thank you so much for your interest in commissioning me. Please review my current commission types, slots availability, and Terms of Service below before filling out a request or sending a message. I look forward to bringing your creative ideas to life!"
    },
    {
        id: "tos-2",
        title: "Terms of Service (T.O.S)",
        subtitle: "Payment rules, revisions, and usage rights.",
        body: "1. GENERAL: I reserve the right to decline any commission request that makes me uncomfortable.\n2. PAYMENT: Full payment or 50% upfront deposit is required via GCash / Bank Transfer / PayPal before work begins.\n3. REVISIONS: Minor tweaks are free during sketching. Major changes after coloring incur extra fees.\n4. DEADLINE & REFUND: Standard turnaround time is 1-3 weeks. No refunds are issued after lineart approval.\n5. USAGE: Commissions are for personal use unless commercial rights are explicitly discussed and agreed upon."
    },
    {
        id: "tos-3",
        title: "Commission Types & Rates",
        subtitle: "Quick breakdown of your active offerings.",
        body: "• Illustration (Character Art / Portraits): Starts at ₱2,500 / $45\n• 3D Art & Roblox UGC Assets: Starts at ₱3,200 / $60\n• Graphic Design & Branding: Starts at ₱1,800 / $35\n*Custom rates apply depending on complexity and rush deadlines."
    }
];

// ========================================
// 2. DOM ELEMENTS
// ========================================

const $ = (selector) => document.querySelector(selector);

const elements = {
    dashboard: $("#dashboard"),
    projects: $("#projects"),
    tos: $("#tos"),
    breadcrumb: $("#breadcrumb-label"),

    total: $("#total-count"),
    progress: $("#progress-count"),
    review: $("#review-count"),
    completed: $("#completed-count"),

    recent: $("#recent-projects"),
    deadlines: $("#upcoming-deadlines"),
    projectList: $("#project-list"),
    resultsCount: $("#results-count"),
    tosGrid: $("#tos-grid"),

    search: $("#search-input"),
    statusFilter: $("#status-filter"),
    categoryFilter: $("#category-filter"),
    sortFilter: $("#sort-filter"),
    currencyFilter: $("#currency-filter"),
    currencyCustomFilter: $("#currency-custom-filter"),

    dialog: $("#project-dialog"),
    form: $("#project-form"),
    dialogTitle: $("#dialog-title"),
    projectId: $("#project-id"),
    title: $("#project-title"),
    client: $("#client-name"),
    category: $("#project-category"),
    price: $("#project-price"),
    currency: $("#project-currency"),
    customCurrency: $("#custom-currency"),
    deadline: $("#project-deadline"),
    status: $("#project-status"),
    description: $("#project-description"),
    formMessage: $("#form-message"),

    tosDialog: $("#tos-dialog"),
    tosForm: $("#tos-form"),
    tosDialogTitle: $("#tos-dialog-title"),
    tosId: $("#tos-id"),
    tosTitle: $("#tos-title"),
    tosSubtitle: $("#tos-subtitle"),
    tosBody: $("#tos-body"),
    saveTos: $("#save-tos"),

    deleteDialog: $("#delete-dialog"),
    confirmDelete: $("#confirm-delete"),

    deleteTosDialog: $("#delete-tos-dialog"),
    confirmDeleteTos: $("#confirm-delete-tos"),

    toast: $("#toast")
};

// ========================================
// 3. APPLICATION STATE
// ========================================

let projects = [];
let tosSections = [];
let pendingDeleteId = null;
let pendingDeleteTosId = null;
let toastTimer = null;

// ========================================
// 4. DATA STORAGE
// ========================================

function loadProjects() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData === null) {
            projects = SAMPLE_PROJECTS.map(project => ({ ...project }));
            saveProjects();
            return;
        }
        const parsedData = JSON.parse(savedData);
        if (!Array.isArray(parsedData) || !parsedData.every(isValidStoredProject)) {
            throw new Error("Saved project data is invalid.");
        }
        projects = parsedData.map(project => ({
            ...project,
            currency: (project.currency && typeof project.currency === "string") ? project.currency.trim() : "PHP"
        }));
    } catch (error) {
        console.error("Unable to load projects:", error);
        projects = [];
        showToast("Saved data could not be loaded. Starting with an empty workspace.");
    }
}

function isValidStoredProject(project) {
    return (
        project !== null &&
        typeof project === "object" &&
        typeof project.id === "string" &&
        typeof project.title === "string" &&
        typeof project.client === "string" &&
        CATEGORIES.includes(project.category) &&
        typeof project.price === "number" &&
        Number.isFinite(project.price) &&
        (project.currency === undefined || (typeof project.currency === "string" && project.currency.trim().length > 0 && project.currency.length <= 10)) &&
        project.price >= 0 &&
        typeof project.deadline === "string" &&
        STATUSES.includes(project.status) &&
        typeof project.description === "string" &&
        typeof project.createdAt === "string"
    );
}

function saveProjects() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        return true;
    } catch (error) {
        console.error("Unable to save projects:", error);
        showToast("Could not save data. Check your browser storage.");
        return false;
    }
}

function loadTosSections() {
    try {
        const savedTos = localStorage.getItem(TOS_STORAGE_KEY);
        if (savedTos === null) {
            tosSections = DEFAULT_TOS_SECTIONS.map(sec => ({ ...sec }));
            saveTosSections();
            return;
        }
        const parsedTos = JSON.parse(savedTos);
        if (!Array.isArray(parsedTos)) {
            throw new Error("Saved T.O.S data is invalid.");
        }
        tosSections = parsedTos;
    } catch (error) {
        console.error("Unable to load T.O.S sections:", error);
        tosSections = DEFAULT_TOS_SECTIONS.map(sec => ({ ...sec }));
    }
}

function saveTosSections() {
    try {
        localStorage.setItem(TOS_STORAGE_KEY, JSON.stringify(tosSections));
        return true;
    } catch (error) {
        console.error("Unable to save T.O.S sections:", error);
        showToast("Could not save T.O.S data.");
        return false;
    }
}

// ========================================
// 5. HELPER FUNCTIONS
// ========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[character];
    });
}

function formatPrice(price, currency = "PHP") {
    const safeCurrency = (currency && typeof currency === "string") ? currency.trim() : "PHP";

    const localeMap = {
        PHP: "en-PH",
        USD: "en-US",
        IDR: "id-ID",
        EUR: "de-DE",
        GBP: "en-GB",
        JPY: "ja-JP"
    };

    const locale = localeMap[safeCurrency.toUpperCase()] || "en-US";
    const noDecimals = ["IDR", "JPY", "KRW"].includes(safeCurrency.toUpperCase());

    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: safeCurrency,
            minimumFractionDigits: noDecimals ? 0 : 2,
            maximumFractionDigits: noDecimals ? 0 : 2
        }).format(price);
    } catch {
        const formattedNumber = Number(price).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${safeCurrency} ${formattedNumber}`;
    }
}

function formatDate(dateString) {
    if (!dateString) {
        return "No deadline";
    }
    const parts = dateString.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getStatusClass(status) {
    return "status-" + status.toLowerCase().replace(/\s+/g, "-");
}

function statusBadge(status) {
    return `
        <span class="status-badge ${getStatusClass(status)}">
            ${escapeHTML(status)}
        </span>
    `;
}

function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = setTimeout(() => {
        elements.toast.classList.remove("show");
    }, 3000);
}

function findProject(id) {
    return projects.find(project => project.id === id);
}

function findTosSection(id) {
    return tosSections.find(sec => sec.id === id);
}

function getDeadlineLabel(project) {
    if (!project.deadline) {
        return "No deadline";
    }
    if (project.status === "Completed") {
        return formatDate(project.deadline);
    }
    const today = getTodayString();
    if (project.deadline < today) {
        return "Overdue";
    }
    if (project.deadline === today) {
        return "Due today";
    }
    return formatDate(project.deadline);
}

// ========================================
// 6. DASHBOARD STATISTICS & T.O.S RENDER
// ========================================

function updateDashboard() {
    elements.total.textContent = projects.length;
    elements.progress.textContent = projects.filter(p => p.status === "In Progress").length;
    elements.review.textContent = projects.filter(p => p.status === "For Review").length;
    elements.completed.textContent = projects.filter(p => p.status === "Completed").length;

    renderRecentProjects();
    renderUpcomingDeadlines();
}

function renderRecentProjects() {
    const recentProjects = [...projects]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3);

    if (recentProjects.length === 0) {
        elements.recent.innerHTML = `
            <div class="empty-state">
                <div class="empty-symbol">＋</div>
                <h3>No projects yet</h3>
                <p>Create your first project to get started.</p>
                <button class="button button-primary" data-action="add" type="button">Create project</button>
            </div>
        `;
        return;
    }

    elements.recent.innerHTML = recentProjects
        .map(project => {
            const deadlineLabel = getDeadlineLabel(project);
            let deadlineHTML = escapeHTML(deadlineLabel);

            if (deadlineLabel === "Overdue" && project.deadline) {
                deadlineHTML = `<span class="deadline-overdue">Overdue · ${escapeHTML(formatDate(project.deadline))}</span>`;
            } else if (deadlineLabel === "Due today" && project.deadline) {
                deadlineHTML = `<span class="deadline-due-today">Due today · ${escapeHTML(formatDate(project.deadline))}</span>`;
            }

            return `
                <article class="recent-row">
                    <div class="recent-row-main">
                        <h3 class="project-title">${escapeHTML(project.title)}</h3>
                        <p class="project-subtitle">
                            ${escapeHTML(project.client || "Personal project")} · ${escapeHTML(project.category)}
                        </p>
                    </div>
                    <div class="recent-row-aside">
                        ${statusBadge(project.status)}
                        <div class="recent-row-meta">
                            <strong>${escapeHTML(formatPrice(project.price, project.currency))}</strong>
                            <span>${deadlineHTML}</span>
                        </div>
                        <button class="small-button" data-action="edit" data-id="${escapeHTML(project.id)}" type="button" aria-label="Edit ${escapeHTML(project.title)}">→</button>
                    </div>
                </article>
            `;
        })
        .join("");
}

function renderUpcomingDeadlines() {
    const upcoming = projects
        .filter(project => project.deadline && project.status !== "Completed")
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 4);

    if (upcoming.length === 0) {
        elements.deadlines.innerHTML = `
            <div class="empty-state">
                <p>No upcoming deadlines. Add a deadline to a project to see it here.</p>
            </div>
        `;
        return;
    }

    elements.deadlines.innerHTML = upcoming
        .map(project => {
            const label = getDeadlineLabel(project);
            const [year, month, day] = project.deadline.split("-").map(Number);
            const dateObj = new Date(year, month - 1, day);
            const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" });
            const dayNum = String(day).padStart(2, "0");

            let boxClass = "";
            if (label === "Overdue") boxClass = "overdue";
            else if (label === "Due today") boxClass = "due-today";

            return `
                <div class="deadline-item">
                    <div class="deadline-box ${boxClass}" aria-hidden="true">
                        <span class="month">${escapeHTML(monthShort)}</span>
                        <span class="day">${escapeHTML(dayNum)}</span>
                    </div>
                    <div class="project-info">
                        <p class="project-title">${escapeHTML(project.title)}</p>
                        <p class="project-subtitle">${escapeHTML(label)} · ${escapeHTML(project.status)}</p>
                    </div>
                </div>
            `;
        })
        .join("");
}

function renderTosSections() {
    if (!tosSections || tosSections.length === 0) {
        elements.tosGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>No sections added yet</h3>
                <p>Click "Add new section" above to create copy-paste guidelines for your clients.</p>
            </div>
        `;
        return;
    }

    elements.tosGrid.innerHTML = tosSections
        .map(sec => `
            <article class="panel tos-card" data-tos-id="${escapeHTML(sec.id)}">
                <div class="panel-heading">
                    <div>
                        <h2>${escapeHTML(sec.title)}</h2>
                        <p>${escapeHTML(sec.subtitle || "Client guideline template")}</p>
                    </div>
                    <div class="tos-actions">
                        <button class="small-button copy-btn" data-copy-target="tos-body-${escapeHTML(sec.id)}" type="button">Copy text</button>
                        <button class="small-button" data-action="edit-tos" data-id="${escapeHTML(sec.id)}" type="button">Edit</button>
                        <button class="small-button danger-text" data-action="delete-tos" data-id="${escapeHTML(sec.id)}" type="button">Delete</button>
                    </div>
                </div>
                <div class="tos-content" id="tos-body-${escapeHTML(sec.id)}">${escapeHTML(sec.body)}</div>
            </article>
        `)
        .join("");
}

// ========================================
// 7. PROJECT DISPLAY
// ========================================

function createProjectCard(project, compact = false) {
    const description = project.description
        ? `<p class="project-description">${escapeHTML(project.description)}</p>`
        : "";

    const deadlineLabel = getDeadlineLabel(project);
    let deadlineHTML = `<span>◷ ${escapeHTML(deadlineLabel)}</span>`;

    if (deadlineLabel === "Overdue" && project.deadline) {
        deadlineHTML = `<span class="deadline-overdue">◷ Overdue · ${escapeHTML(formatDate(project.deadline))}</span>`;
    } else if (deadlineLabel === "Due today" && project.deadline) {
        deadlineHTML = `<span class="deadline-due-today">◷ Due today · ${escapeHTML(formatDate(project.deadline))}</span>`;
    }

    return `
        <article class="project-card" data-project-id="${escapeHTML(project.id)}">
            <div class="project-card-top">
                <div class="project-info">
                    <h3 class="project-title">${escapeHTML(project.title)}</h3>
                    <p class="project-subtitle">
                        ${escapeHTML(project.client || "Personal project")} · ${escapeHTML(project.category)}
                    </p>
                </div>
                ${statusBadge(project.status)}
            </div>

            ${compact ? "" : description}

            <div class="project-meta">
                ${deadlineHTML}
                <span>${escapeHTML(formatPrice(project.price, project.currency))}</span>
            </div>

            ${compact ? "" : `
                <div class="project-actions">
                    <select class="status-select" data-action="status" data-id="${escapeHTML(project.id)}" aria-label="Change status for ${escapeHTML(project.title)}">
                        ${STATUSES.map(status => `
                            <option value="${escapeHTML(status)}" ${project.status === status ? "selected" : ""}>
                                ${escapeHTML(status)}
                            </option>
                        `).join("")}
                    </select>

                    <button class="small-button" data-action="edit" data-id="${escapeHTML(project.id)}" type="button">Edit</button>
                    <button class="small-button danger-text" data-action="delete" data-id="${escapeHTML(project.id)}" type="button">Delete</button>
                </div>
            `}
        </article>
    `;
}

function getFilteredProjects() {
    const searchTerm = elements.search.value.trim().toLowerCase();
    const selectedStatus = elements.statusFilter.value;
    const checkedCategories = Array.from(
        elements.categoryFilter.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    const sortMethod = elements.sortFilter.value;

    const currencyFilterVal = elements.currencyFilter.value;
    let targetCurr = "";
    if (currencyFilterVal !== "all") {
        if (currencyFilterVal === "CUSTOM") {
            const customVal = elements.currencyCustomFilter.value.trim();
            const lettersOnlyRegex = /^[A-Za-z\s₱$€£¥₩฿Rp₹₽₺₴₦]+$/;
            if (customVal && lettersOnlyRegex.test(customVal)) {
                targetCurr = customVal.toUpperCase();
            } else {
                targetCurr = "CUSTOM_INVALID";
            }
        } else {
            targetCurr = currencyFilterVal.toUpperCase();
        }
    }

    const filtered = projects.filter(project => {
        const searchableText = [
            project.title,
            project.client,
            project.category,
            project.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);
        const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
        const matchesCategory = checkedCategories.length === 0 || checkedCategories.includes(project.category);
        
        let matchesCurrency = true;
        if (targetCurr === "CUSTOM_INVALID") {
            matchesCurrency = false;
        } else if (targetCurr) {
            const projCurr = (project.currency || "PHP").toUpperCase();
            matchesCurrency = projCurr === targetCurr;
        }

        return matchesSearch && matchesStatus && matchesCategory && matchesCurrency;
    });

    filtered.sort((a, b) => {
        switch (sortMethod) {
            case "deadline":
                if (!a.deadline) return b.deadline ? 1 : 0;
                if (!b.deadline) return -1;
                return a.deadline.localeCompare(b.deadline);
            case "price-high":
                return b.price - a.price;
            case "price-low":
                return a.price - b.price;
            case "title":
                return a.title.localeCompare(b.title);
            case "newest":
            default:
                return b.createdAt.localeCompare(a.createdAt);
        }
    });

    return filtered;
}

function renderProjects() {
    const filteredProjects = getFilteredProjects();

    if (filteredProjects.length === 0) {
        elements.projectList.innerHTML = `
            <div class="empty-state">
                <div class="empty-symbol">⌕</div>
                <h3>No matching projects</h3>
                <p>Try a different search term or change your filters.</p>
                <button class="button button-secondary" data-action="clear-filters" type="button">Clear filters</button>
            </div>
        `;
    } else {
        elements.projectList.innerHTML = filteredProjects.map(project => createProjectCard(project)).join("");
    }

    elements.resultsCount.textContent = `Showing ${filteredProjects.length} of ${projects.length} projects`;
}

function renderAll() {
    updateDashboard();
    renderProjects();
    renderTosSections();
}

// ========================================
// 8. NAVIGATION & TABS
// ========================================

function showSection(sectionName) {
    const isDashboard = sectionName === "dashboard";
    const isProjects = sectionName === "projects";
    const isTos = sectionName === "tos";

    elements.dashboard.classList.toggle("hidden", !isDashboard);
    elements.projects.classList.toggle("hidden", !isProjects);
    elements.tos.classList.toggle("hidden", !isTos);

    if (isDashboard) {
        elements.breadcrumb.textContent = "Overview";
    } else if (isProjects) {
        elements.breadcrumb.textContent = "My Projects";
    } else if (isTos) {
        elements.breadcrumb.textContent = "Intro & T.O.S";
    }

    document.querySelectorAll(".nav-link").forEach(link => {
        const isActive = link.dataset.section === sectionName;
        link.classList.toggle("active", isActive);
        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    if (isProjects) {
        renderProjects();
    } else if (isTos) {
        renderTosSections();
    }
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showSection(link.dataset.section);
    });
});

$("#view-all").addEventListener("click", () => {
    showSection("projects");
});

$("#open-add-form").addEventListener("click", () => {
    openProjectForm();
});

$("#open-tos-form").addEventListener("click", () => {
    openTosForm();
});

// Currency dropdown change handler (Modal form)
elements.currency.addEventListener("change", () => {
    const isCustom = elements.currency.value === "CUSTOM";
    elements.customCurrency.classList.toggle("hidden", !isCustom);
    if (isCustom) {
        elements.customCurrency.focus();
    } else {
        elements.customCurrency.value = "";
    }
});

// Independent Currency Filter change handler
elements.currencyFilter.addEventListener("change", () => {
    const isCustom = elements.currencyFilter.value === "CUSTOM";
    elements.currencyCustomFilter.classList.toggle("hidden", !isCustom);
    if (isCustom) {
        elements.currencyCustomFilter.focus();
    } else {
        elements.currencyCustomFilter.value = "";
    }
    renderProjects();
});

elements.currencyCustomFilter.addEventListener("input", renderProjects);

// Copy T.O.S text handler
document.addEventListener("click", event => {
    const copyButton = event.target.closest(".copy-btn");
    if (!copyButton) return;

    const targetId = copyButton.dataset.copyTarget;
    const textElement = document.getElementById(targetId);
    if (!textElement) return;

    const textToCopy = textElement.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = "Copied! ✓";
        copyButton.style.color = "var(--green)";
        copyButton.style.borderColor = "#c4ead8";

        setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.style.color = "";
            copyButton.style.borderColor = "";
        }, 2000);

        showToast("Copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy:", err);
        showToast("Failed to copy text.");
    });
});

// ========================================
// 9. FORM VALIDATION & MODALS
// ========================================

function clearValidation() {
    document.querySelectorAll(".field-error").forEach(error => { error.textContent = ""; });
    document.querySelectorAll(".form-group .invalid").forEach(field => { field.classList.remove("invalid"); });
    elements.formMessage.textContent = "";
}

function setFieldError(field, errorId, message) {
    field.classList.add("invalid");
    $("#" + errorId).textContent = message;
}

function validateForm() {
    clearValidation();
    let isValid = true;

    const title = elements.title.value.trim();
    const client = elements.client.value.trim();
    const category = elements.category.value;
    const priceText = elements.price.value;
    const currency = elements.currency.value;
    const deadline = elements.deadline.value;
    const description = elements.description.value.trim();

    if (!title) {
        setFieldError(elements.title, "title-error", "Please enter a project title.");
        isValid = false;
    }
    if (title.length > 100) {
        setFieldError(elements.title, "title-error", "The title cannot exceed 100 characters.");
        isValid = false;
    }
    if (client.length > 80) {
        setFieldError(elements.client, "client-error", "The client name cannot exceed 80 characters.");
        isValid = false;
    }
    if (!CATEGORIES.includes(category)) {
        elements.formMessage.textContent = "Please select a valid project category.";
        isValid = false;
    }
    if (currency === "CUSTOM") {
        const customVal = elements.customCurrency.value.trim();
        const lettersOnlyRegex = /^[A-Za-z\s₱$€£¥₩฿Rp₹₽₺₴₦]+$/;

        if (!customVal) {
            setFieldError(elements.customCurrency, "price-error", "Please enter a custom currency code or symbol.");
            isValid = false;
        } else if (!lettersOnlyRegex.test(customVal)) {
            setFieldError(elements.customCurrency, "price-error", "Currency symbols cannot contain numbers.");
            isValid = false;
        }
    } else if (!SUPPORTED_CURRENCIES.includes(currency)) {
        elements.formMessage.textContent = "Please choose a valid currency for the project price.";
        isValid = false;
    }
    if (priceText !== "") {
        const price = Number(priceText);
        if (!Number.isFinite(price) || price < 0 || price > 999999999) {
            setFieldError(elements.price, "price-error", "Enter a valid non-negative price.");
            isValid = false;
        }
    }
    if (deadline && !isValidDateString(deadline)) {
        setFieldError(elements.deadline, "deadline-error", "Please enter a valid deadline.");
        isValid = false;
    }
    if (description.length > 1000) {
        elements.formMessage.textContent = "Description cannot exceed 1000 characters.";
        isValid = false;
    }

    return isValid;
}

function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function openProjectForm(project = null) {
    elements.form.reset();
    clearValidation();
    elements.projectId.value = project ? project.id : "";
    elements.dialogTitle.textContent = project ? "Edit project" : "Create a project";
    $("#save-project").textContent = project ? "Save changes" : "Save project";

    if (project) {
        elements.title.value = project.title;
        elements.client.value = project.client;
        elements.category.value = project.category;
        elements.price.value = project.price;

        const savedCurrency = project.currency || "PHP";
        if (SUPPORTED_CURRENCIES.includes(savedCurrency)) {
            elements.currency.value = savedCurrency;
            elements.customCurrency.classList.add("hidden");
            elements.customCurrency.value = "";
        } else {
            elements.currency.value = "CUSTOM";
            elements.customCurrency.classList.remove("hidden");
            elements.customCurrency.value = savedCurrency;
        }

        elements.deadline.value = project.deadline;
        elements.status.value = project.status;
        elements.description.value = project.description;
    } else {
        elements.category.value = "Illustration";
        elements.currency.value = "PHP";
        elements.customCurrency.classList.add("hidden");
        elements.customCurrency.value = "";
        elements.status.value = "Pending";
    }

    elements.dialog.showModal();
    elements.title.focus();
}

function closeProjectForm() {
    elements.dialog.close();
    elements.form.reset();
    clearValidation();
}

function openTosForm(sec = null) {
    elements.tosForm.reset();
    elements.tosTitle.classList.remove("invalid");
    elements.tosBody.classList.remove("invalid");
    $("#tos-title-error").textContent = "";
    $("#tos-body-error").textContent = "";

    elements.tosId.value = sec ? sec.id : "";
    elements.tosDialogTitle.textContent = sec ? "Edit section" : "Add copy-paste section";
    elements.saveTos.textContent = sec ? "Save changes" : "Save section";

    if (sec) {
        elements.tosTitle.value = sec.title;
        elements.tosSubtitle.value = sec.subtitle || "";
        elements.tosBody.value = sec.body;
    } else {
        elements.tosTitle.value = "";
        elements.tosSubtitle.value = "";
        elements.tosBody.value = "";
    }

    elements.tosDialog.showModal();
    elements.tosTitle.focus();
}

function closeTosForm() {
    elements.tosDialog.close();
    elements.tosForm.reset();
}

$("#close-dialog").addEventListener("click", closeProjectForm);
$("#cancel-dialog").addEventListener("click", closeProjectForm);
elements.dialog.addEventListener("click", event => {
    if (event.target === elements.dialog) closeProjectForm();
});

$("#close-tos-dialog").addEventListener("click", closeTosForm);
$("#cancel-tos-dialog").addEventListener("click", closeTosForm);
elements.tosDialog.addEventListener("click", event => {
    if (event.target === elements.tosDialog) closeTosForm();
});

elements.form.addEventListener("submit", event => {
    event.preventDefault();
    if (!validateForm()) return;

    const id = elements.projectId.value;
    const existingProject = id ? findProject(id) : null;

    const projectData = {
        id: id || (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
        title: elements.title.value.trim(),
        client: elements.client.value.trim(),
        category: elements.category.value,
        price: elements.price.value === "" ? 0 : Number(elements.price.value),
        currency: elements.currency.value === "CUSTOM"
            ? elements.customCurrency.value.trim()
            : (SUPPORTED_CURRENCIES.includes(elements.currency.value) ? elements.currency.value : "PHP"),
        deadline: elements.deadline.value,
        status: elements.status.value,
        description: elements.description.value.trim(),
        createdAt: existingProject ? existingProject.createdAt : new Date().toISOString()
    };

    if (id) {
        const index = projects.findIndex(project => project.id === id);
        if (index === -1) {
            elements.formMessage.textContent = "This project no longer exists.";
            return;
        }
        projects[index] = projectData;
    } else {
        projects.push(projectData);
    }

    const saved = saveProjects();
    closeProjectForm();
    renderAll();
    if (saved) showToast(id ? "Project updated successfully." : "Project created successfully.");
});

elements.tosForm.addEventListener("submit", event => {
    event.preventDefault();
    const id = elements.tosId.value;
    const title = elements.tosTitle.value.trim();
    const subtitle = elements.tosSubtitle.value.trim();
    const body = elements.tosBody.value.trim();

    elements.tosTitle.classList.remove("invalid");
    elements.tosBody.classList.remove("invalid");
    $("#tos-title-error").textContent = "";
    $("#tos-body-error").textContent = "";

    if (!title) {
        elements.tosTitle.classList.add("invalid");
        $("#tos-title-error").textContent = "Please enter a section title.";
        elements.tosTitle.focus();
        return;
    }
    if (!body) {
        elements.tosBody.classList.add("invalid");
        $("#tos-body-error").textContent = "Please enter section content.";
        elements.tosBody.focus();
        return;
    }

    const tosData = {
        id: id || (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
        title,
        subtitle,
        body
    };

    if (id) {
        const index = tosSections.findIndex(sec => sec.id === id);
        if (index !== -1) {
            tosSections[index] = tosData;
        }
    } else {
        tosSections.push(tosData);
    }

    saveTosSections();
    closeTosForm();
    renderTosSections();
    showToast(id ? "T.O.S section updated successfully." : "New T.O.S section added successfully.");
});

// ========================================
// 10. EVENT DELEGATION FOR ACTIONS & DELETION
// ========================================

function handleProjectAction(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === "add") {
        openProjectForm();
        return;
    }
    if (action === "clear-filters") {
        elements.search.value = "";
        elements.statusFilter.value = "all";
        elements.categoryFilter.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
        elements.sortFilter.value = "newest";
        elements.currencyFilter.value = "all";
        elements.currencyCustomFilter.classList.add("hidden");
        elements.currencyCustomFilter.value = "";
        renderProjects();
        return;
    }
    if (action === "edit-tos") {
        const sec = findTosSection(id);
        if (sec) openTosForm(sec);
        return;
    }
    if (action === "delete-tos") {
        pendingDeleteTosId = id;
        elements.deleteTosDialog.showModal();
        return;
    }

    const project = findProject(id);
    if (!project) return;

    if (action === "edit") {
        openProjectForm(project);
    }
    if (action === "delete") {
        pendingDeleteId = id;
        elements.deleteDialog.showModal();
    }
}

elements.projectList.addEventListener("click", handleProjectAction);
elements.recent.addEventListener("click", handleProjectAction);
elements.tosGrid.addEventListener("click", handleProjectAction);

// Status Change Handler
elements.projectList.addEventListener("change", event => {
    const target = event.target;
    if (!target.matches('select[data-action="status"]')) return;

    const project = findProject(target.dataset.id);
    if (!project) {
        showToast("Project not found.");
        renderAll();
        return;
    }
    if (!STATUSES.includes(target.value)) {
        showToast("Please select a valid status.");
        renderAll();
        return;
    }

    project.status = target.value;
    const saved = saveProjects();
    renderAll();
    if (saved) showToast("Project status updated.");
});

// Project Delete Confirmation
$("#cancel-delete").addEventListener("click", () => {
    pendingDeleteId = null;
    elements.deleteDialog.close();
});
elements.deleteDialog.addEventListener("click", event => {
    if (event.target === elements.deleteDialog) {
        pendingDeleteId = null;
        elements.deleteDialog.close();
    }
});
elements.confirmDelete.addEventListener("click", () => {
    if (!pendingDeleteId) return;
    projects = projects.filter(project => project.id !== pendingDeleteId);
    pendingDeleteId = null;
    elements.deleteDialog.close();
    const saved = saveProjects();
    renderAll();
    if (saved) showToast("Project deleted.");
});

// T.O.S Delete Confirmation
$("#cancel-delete-tos").addEventListener("click", () => {
    pendingDeleteTosId = null;
    elements.deleteTosDialog.close();
});
elements.deleteTosDialog.addEventListener("click", event => {
    if (event.target === elements.deleteTosDialog) {
        pendingDeleteTosId = null;
        elements.deleteTosDialog.close();
    }
});
elements.confirmDeleteTos.addEventListener("click", () => {
    if (!pendingDeleteTosId) return;
    tosSections = tosSections.filter(sec => sec.id !== pendingDeleteTosId);
    pendingDeleteTosId = null;
    elements.deleteTosDialog.close();
    saveTosSections();
    renderTosSections();
    showToast("T.O.S section deleted.");
});

// ========================================
// 11. SEARCH, FILTERING, AND SORTING
// ========================================

elements.search.addEventListener("input", renderProjects);
elements.statusFilter.addEventListener("change", renderProjects);
elements.categoryFilter.addEventListener("change", renderProjects);
elements.sortFilter.addEventListener("change", renderProjects);

// ========================================
// 12. INITIALIZE APPLICATION
// ========================================

function initApp() {
    loadProjects();
    loadTosSections();
    renderAll();
}

initApp();