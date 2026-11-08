
"use strict";

// ========================================
// 1. CONFIGURATION AND DATA
// ========================================

const STORAGE_KEY = "artflow_projects_v1";

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

const SAMPLE_PROJECTS = [
    {
        id: "sample-1",
        title: "Character Illustration",
        client: "Alex",
        category: "Illustration",
        price: 2500,
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
        deadline: "",
        status: "Completed",
        description: "Final model and revisions completed.",
        createdAt: "2026-10-18T09:00:00.000Z"
    }
];

// ========================================
// 2. DOM ELEMENTS
// ========================================

const $ = (selector) => document.querySelector(selector);

const elements = {
    dashboard: $("#dashboard"),
    projects: $("#projects"),
    breadcrumb: $("#breadcrumb-label"),

    total: $("#total-count"),
    progress: $("#progress-count"),
    review: $("#review-count"),
    completed: $("#completed-count"),

    recent: $("#recent-projects"),
    deadlines: $("#upcoming-deadlines"),
    projectList: $("#project-list"),
    resultsCount: $("#results-count"),

    search: $("#search-input"),
    statusFilter: $("#status-filter"),
    categoryFilter: $("#category-filter"),
    sortFilter: $("#sort-filter"),

    dialog: $("#project-dialog"),
    form: $("#project-form"),
    dialogTitle: $("#dialog-title"),
    projectId: $("#project-id"),
    title: $("#project-title"),
    client: $("#client-name"),
    category: $("#project-category"),
    price: $("#project-price"),
    deadline: $("#project-deadline"),
    status: $("#project-status"),
    description: $("#project-description"),
    formMessage: $("#form-message"),

    deleteDialog: $("#delete-dialog"),
    confirmDelete: $("#confirm-delete"),
    toast: $("#toast")
};

// ========================================
// 3. APPLICATION STATE
// ========================================

let projects = [];
let pendingDeleteId = null;
let toastTimer = null;

// ========================================
// 4. DATA STORAGE
// ========================================

function loadProjects() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData === null) {
            // Sample data is used on the first launch.
            projects = SAMPLE_PROJECTS.map(project => ({
                ...project
            }));

            saveProjects();
            return;
        }

        const parsedData = JSON.parse(savedData);

        if (
            !Array.isArray(parsedData) ||
            !parsedData.every(isValidStoredProject)
        ) {
            throw new Error("Saved project data is invalid.");
        }

        projects = parsedData;
    } catch (error) {
        console.error("Unable to load projects:", error);

        projects = [];

        showToast(
            "Saved data could not be loaded. Starting with an empty workspace."
        );
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
        project.price >= 0 &&
        typeof project.deadline === "string" &&
        STATUSES.includes(project.status) &&
        typeof project.description === "string" &&
        typeof project.createdAt === "string"
    );
}

function saveProjects() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(projects)
        );

        return true;
    } catch (error) {
        console.error("Unable to save projects:", error);

        showToast(
            "Could not save data. Check your browser storage."
        );

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

function formatPrice(price) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2
    }).format(price);
}

function formatDate(dateString) {
    if (!dateString) {
        return "No deadline";
    }

    const parts = dateString.split("-").map(Number);

    const date = new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

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
    return "status-" + status
        .toLowerCase()
        .replace(/\s+/g, "-");
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
// 6. DASHBOARD STATISTICS
// ========================================

function updateDashboard() {
    elements.total.textContent = projects.length;

    elements.progress.textContent = projects.filter(
        project => project.status === "In Progress"
    ).length;

    elements.review.textContent = projects.filter(
        project => project.status === "For Review"
    ).length;

    elements.completed.textContent = projects.filter(
        project => project.status === "Completed"
    ).length;

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
                <button class="button button-primary"
                    data-action="add" type="button">
                    Create project
                </button>
            </div>
        `;
        return;
    }

    elements.recent.innerHTML = recentProjects
        .map(project => createProjectCard(project, true))
        .join("");
}

function renderUpcomingDeadlines() {
    const upcoming = projects
        .filter(project =>
            project.deadline &&
            project.status !== "Completed"
        )
        .sort((a, b) =>
            a.deadline.localeCompare(b.deadline)
        )
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

            let dateClass = "";

            if (label === "Overdue") {
                dateClass = "overdue";
            } else if (label === "Due today") {
                dateClass = "due-today";
            }

            return `
                <div class="deadline-item">
                    <div class="project-info">
                        <p class="project-title">
                            ${escapeHTML(project.title)}
                        </p>
                        <p class="project-subtitle">
                            ${escapeHTML(project.category)}
                            · ${escapeHTML(project.status)}
                        </p>
                    </div>
                    <span class="deadline-date ${dateClass}">
                        ${escapeHTML(label)}
                    </span>
                </div>
            `;
        })
        .join("");
}

// ========================================
// 7. PROJECT DISPLAY
// ========================================

function createProjectCard(project, compact = false) {
    const description = project.description
        ? `<p class="project-description">
            ${escapeHTML(project.description)}
           </p>`
        : "";

    const deadlineLabel = getDeadlineLabel(project);

    return `
        <article class="project-card" data-project-id="${escapeHTML(project.id)}">
            <div class="project-card-top">
                <div class="project-info">
                    <h3 class="project-title">
                        ${escapeHTML(project.title)}
                    </h3>
                    <p class="project-subtitle">
                        ${escapeHTML(project.client || "Personal project")}
                        · ${escapeHTML(project.category)}
                    </p>
                </div>
                ${statusBadge(project.status)}
            </div>

            ${compact ? "" : description}

            <div class="project-meta">
                <span>◷ ${escapeHTML(deadlineLabel)}</span>
                <span>${escapeHTML(formatPrice(project.price))}</span>
            </div>

            ${compact ? "" : `
                <div class="project-actions">
                    <select class="status-select"
                        data-action="status"
                        data-id="${escapeHTML(project.id)}"
                        aria-label="Change status for ${escapeHTML(project.title)}">
                        ${STATUSES.map(status => `
                            <option value="${escapeHTML(status)}"
                                ${project.status === status ? "selected" : ""}>
                                ${escapeHTML(status)}
                            </option>
                        `).join("")}
                    </select>

                    <button class="small-button"
                        data-action="edit"
                        data-id="${escapeHTML(project.id)}"
                        type="button">Edit</button>

                    <button class="small-button danger-text"
                        data-action="delete"
                        data-id="${escapeHTML(project.id)}"
                        type="button">Delete</button>
                </div>
            `}
        </article>
    `;
}

function getFilteredProjects() {
    const searchTerm = elements.search.value
        .trim()
        .toLowerCase();

    const selectedStatus = elements.statusFilter.value;
    const selectedCategory = elements.categoryFilter.value;
    const sortMethod = elements.sortFilter.value;

    const filtered = projects.filter(project => {
        const searchableText = [
            project.title,
            project.client,
            project.category,
            project.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);

        const matchesStatus =
            selectedStatus === "all" ||
            project.status === selectedStatus;

        const matchesCategory =
            selectedCategory === "all" ||
            project.category === selectedCategory;

        return matchesSearch && matchesStatus && matchesCategory;
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
                <button class="button button-secondary"
                    data-action="clear-filters" type="button">
                    Clear filters
                </button>
            </div>
        `;
    } else {
        elements.projectList.innerHTML = filteredProjects
            .map(project => createProjectCard(project))
            .join("");
    }

    elements.resultsCount.textContent =
        `Showing ${filteredProjects.length} of ${projects.length} projects`;
}

function renderAll() {
    updateDashboard();
    renderProjects();
}

// ========================================
// 8. NAVIGATION
// ========================================

function showSection(sectionName) {
    const isDashboard = sectionName === "dashboard";

    elements.dashboard.classList.toggle("hidden", !isDashboard);
    elements.projects.classList.toggle("hidden", isDashboard);

    elements.breadcrumb.textContent =
        isDashboard ? "Overview" : "My Projects";

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.section === sectionName
        );
    });

    if (!isDashboard) {
        renderProjects();
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

// ========================================
// 9. FORM VALIDATION
// ========================================

function clearValidation() {
    document.querySelectorAll(".field-error").forEach(error => {
        error.textContent = "";
    });

    document.querySelectorAll(".form-group .invalid").forEach(field => {
        field.classList.remove("invalid");
    });

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
    const deadline = elements.deadline.value;
    const description = elements.description.value.trim();

    if (!title) {
        setFieldError(
            elements.title,
            "title-error",
            "Please enter a project title."
        );

        isValid = false;
    }

    if (title.length > 100) {
        setFieldError(
            elements.title,
            "title-error",
            "The title cannot exceed 100 characters."
        );

        isValid = false;
    }

    if (client.length > 80) {
        setFieldError(
            elements.client,
            "client-error",
            "The client name cannot exceed 80 characters."
        );

        isValid = false;
    }

    if (!CATEGORIES.includes(category)) {
        elements.formMessage.textContent =
            "Please select a valid project category.";

        isValid = false;
    }

    if (priceText !== "") {
        const price = Number(priceText);

        if (
            !Number.isFinite(price) ||
            price < 0 ||
            price > 999999999
        ) {
            setFieldError(
                elements.price,
                "price-error",
                "Enter a valid non-negative price."
            );

            isValid = false;
        }
    }

    if (
        deadline &&
        !isValidDateString(deadline)
    ) {
        setFieldError(
            elements.deadline,
            "deadline-error",
            "Please enter a valid deadline."
        );

        isValid = false;
    }

    if (description.length > 1000) {
        elements.formMessage.textContent =
            "Description cannot exceed 1000 characters.";

        isValid = false;
    }

    if (!isValid) {
        const firstInvalid = elements.form.querySelector(".invalid");

        if (firstInvalid) {
            firstInvalid.focus();
        } else {
            elements.formMessage.focus();
        }
    }

    return isValid;
}

function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

// ========================================
// 10. CREATE AND EDIT PROJECTS
// ========================================

function openProjectForm(project = null) {
    elements.form.reset();
    clearValidation();

    elements.projectId.value = project ? project.id : "";

    elements.dialogTitle.textContent = project
        ? "Edit project"
        : "Create a project";

    $("#save-project").textContent = project
        ? "Save changes"
        : "Save project";

    if (project) {
        elements.title.value = project.title;
        elements.client.value = project.client;
        elements.category.value = project.category;
        elements.price.value = project.price;
        elements.deadline.value = project.deadline;
        elements.status.value = project.status;
        elements.description.value = project.description;
    } else {
        elements.category.value = "Illustration";
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

$("#close-dialog").addEventListener("click", closeProjectForm);
$("#cancel-dialog").addEventListener("click", closeProjectForm);

elements.dialog.addEventListener("click", event => {
    if (event.target === elements.dialog) {
        closeProjectForm();
    }
});

elements.form.addEventListener("submit", event => {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const id = elements.projectId.value;

    const projectData = {
        id: id || (
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : String(Date.now()) + Math.random().toString(16).slice(2)
        ),
        title: elements.title.value.trim(),
        client: elements.client.value.trim(),
        category: elements.category.value,
        price: elements.price.value === ""
            ? 0
            : Number(elements.price.value),
        deadline: elements.deadline.value,
        status: elements.status.value,
        description: elements.description.value.trim(),
        createdAt: new Date().toISOString()
    };

    if (id) {
        const index = projects.findIndex(project => project.id === id);

        if (index === -1) {
            elements.formMessage.textContent =
                "This project no longer exists. Close the form and try again.";
            return;
        }

        // Keep the original creation date when editing.
        projectData.createdAt = projects[index].createdAt;
        projects[index] = projectData;
    } else {
        projects.push(projectData);
    }

    const saved = saveProjects();

    closeProjectForm();
    renderAll();

    if (saved) {
        showToast(id ? "Project updated successfully." : "Project created successfully.");
    }
});

// ========================================
// 11. EVENT DELEGATION FOR PROJECT ACTIONS
// ========================================

function handleProjectAction(event) {
    const target = event.target.closest("[data-action]");

    if (!target) {
        return;
    }

    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === "add") {
        openProjectForm();
        return;
    }

    if (action === "clear-filters") {
        elements.search.value = "";
        elements.statusFilter.value = "all";
        elements.categoryFilter.value = "all";
        elements.sortFilter.value = "newest";

        renderProjects();
        return;
    }

    const project = findProject(id);

    if (!project) {
        return;
    }

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

// ========================================
// 12. STATUS MANAGEMENT
// ========================================

function handleStatusChange(event) {
    const target = event.target;

    if (
        !target.matches('select[data-action="status"]')
    ) {
        return;
    }

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

    if (saved) {
        showToast("Project status updated.");
    }
}

elements.projectList.addEventListener("change", handleStatusChange);

// ========================================
// 13. DELETE PROJECTS
// ========================================

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
    if (!pendingDeleteId) {
        return;
    }

    const exists = projects.some(
        project => project.id === pendingDeleteId
    );

    if (!exists) {
        pendingDeleteId = null;
        elements.deleteDialog.close();
        showToast("Project not found.");
        return;
    }

    projects = projects.filter(
        project => project.id !== pendingDeleteId
    );

    pendingDeleteId = null;
    elements.deleteDialog.close();

    const saved = saveProjects();

    renderAll();

    if (saved) {
        showToast("Project deleted.");
    }
});

// ========================================
// 14. SEARCH, FILTERING, AND SORTING
// ========================================

elements.search.addEventListener("input", renderProjects);

elements.statusFilter.addEventListener("change", renderProjects);

elements.categoryFilter.addEventListener("change", renderProjects);

elements.sortFilter.addEventListener("change", renderProjects);

// ========================================
// 15. INITIALIZE APPLICATION
// ========================================

function initApp() {
    loadProjects();
    renderAll();
}

initApp();
