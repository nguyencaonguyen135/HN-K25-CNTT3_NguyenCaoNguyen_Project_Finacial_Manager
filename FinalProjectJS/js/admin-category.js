const byId = (id) => document.getElementById(id);

const defaultCategories = [
  { id: 1, name: "Tiền tích lũy", icon: "💵", status: true },
  { id: 2, name: "Tiền xăng", icon: "⛽", status: false },
  { id: 3, name: "Tiền ăn", icon: "🍜", status: true },
  { id: 4, name: "Tiền đi chơi", icon: "🧩", status: false },
  { id: 5, name: "Tiền cho con", icon: "👨‍👩‍👧", status: true },
  { id: 6, name: "Tiền dự phòng", icon: "💯", status: true },
  { id: 7, name: "Tiền sửa đồ", icon: "⚙", status: true },
  { id: 8, name: "Tiền cà phê", icon: "☕", status: true },
];

const state = {
  keyword: "",
  page: 1,
  pageSize: 8,
  editingId: null,
};

const getCategories = () => {
  try {
    return JSON.parse(localStorage.getItem("categories")) || defaultCategories;
  } catch {
    return defaultCategories;
  }
};

const saveCategories = (categories) => {
  localStorage.setItem("categories", JSON.stringify(categories));
};

const ensureCategories = () => {
  if (!localStorage.getItem("categories")) saveCategories(defaultCategories);
};

const normalize = (text) =>
  String(text || "")
    .trim()
    .toLowerCase();

const getDisplayCategories = () => {
  const keyword = normalize(state.keyword);
  let rows = getCategories();

  if (keyword) {
    rows = rows.filter((row) => normalize(row.name).includes(keyword));
  }

  return rows;
};

const renderPagination = (totalItems, totalPage) => {
  const pagination = byId("categoriesPagination");
  if (!pagination) return;

  if (totalItems <= state.pageSize) {
    pagination.innerHTML = "";
    return;
  }

  const pageButtons = Array.from({ length: totalPage }, (_, i) => {
    const page = i + 1;
    const activeClass = page === state.page ? "active" : "";
    return `<button type="button" class="page-btn ${activeClass}" data-page="${page}">${page}</button>`;
  }).join("");

  pagination.innerHTML = `
    <button type="button" class="page-btn" data-nav="prev" ${state.page === 1 ? "disabled" : ""}>←</button>
    ${pageButtons}
    <button type="button" class="page-btn" data-nav="next" ${state.page === totalPage ? "disabled" : ""}>→</button>
  `;
};

const renderTable = () => {
  const body = byId("categoriesTableBody");
  const empty = byId("categoriesEmpty");
  if (!body || !empty) return;

  const rows = getDisplayCategories();
  const totalPage = Math.max(1, Math.ceil(rows.length / state.pageSize));
  if (state.page > totalPage) state.page = totalPage;

  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  empty.hidden = rows.length !== 0;

  body.innerHTML = pageRows
    .map((row, idx) => {
      const stt = start + idx + 1;
      const active = Boolean(row.status);
      return `
        <tr>
          <td>${stt}</td>
          <td>${row.name}</td>
          <td><span class="category-image-icon">${row.icon || "💵"}</span></td>
          <td>
            <span class="status-pill ${active ? "active" : "inactive"}">
              ${active ? "Active" : "InActive"}
            </span>
          </td>
          <td>
            <div class="row-actions">
              <button type="button" class="btn-mini btn-edit" data-action="edit" data-id="${row.id}">Edit</button>
              <button type="button" class="btn-mini ${active ? "btn-block" : "btn-unblock"}" data-action="toggle" data-id="${row.id}">${active ? "Block" : "UnBlock"}</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  renderPagination(rows.length, totalPage);
};

const openModal = (category = null) => {
  const overlay = byId("categoryModalOverlay");
  const nameInput = byId("modalCategoryName");
  const iconInput = byId("modalCategoryIcon");
  const statusInput = byId("modalCategoryStatus");
  const title = byId("categoryModalTitle");
  if (!overlay || !nameInput || !iconInput || !statusInput || !title) return;

  if (category) {
    state.editingId = Number(category.id);
    title.textContent = "Edit Category";
    nameInput.value = category.name || "";
    iconInput.value = category.icon || "💵";
    statusInput.value = category.status ? "active" : "inactive";
  } else {
    state.editingId = null;
    title.textContent = "Add Category";
    nameInput.value = "";
    iconInput.value = "💵";
    statusInput.value = "active";
  }

  overlay.hidden = false;
};

const closeModal = () => {
  const overlay = byId("categoryModalOverlay");
  if (overlay) overlay.hidden = true;
};

const saveFromModal = () => {
  const nameInput = byId("modalCategoryName");
  const iconInput = byId("modalCategoryIcon");
  const statusInput = byId("modalCategoryStatus");
  if (!nameInput || !iconInput || !statusInput) return;

  const name = String(nameInput.value || "").trim();
  const icon = String(iconInput.value || "💵").trim() || "💵";
  const isActive = statusInput.value === "active";

  if (!name) {
    Swal.fire("Thông báo", "Vui lòng nhập tên danh mục", "warning");
    return;
  }

  const categories = getCategories();

  if (state.editingId) {
    const idx = categories.findIndex(
      (c) => Number(c.id) === Number(state.editingId),
    );
    if (idx >= 0) {
      categories[idx].name = name;
      categories[idx].icon = icon;
      categories[idx].status = isActive;
    }
  } else {
    categories.push({
      id: Date.now(),
      name,
      icon,
      status: isActive,
    });
  }

  saveCategories(categories);
  closeModal();
  renderTable();
};

const toggleStatus = (id) => {
  const categories = getCategories();
  const idx = categories.findIndex((c) => Number(c.id) === Number(id));
  if (idx < 0) return;

  categories[idx].status = !Boolean(categories[idx].status);
  saveCategories(categories);
  renderTable();
};

const initEvents = () => {
  const searchInput = byId("categorySearchInput");
  const addBtn = byId("addCategoryBtn");
  const body = byId("categoriesTableBody");
  const pagination = byId("categoriesPagination");
  const closeBtn = byId("categoryModalClose");
  const cancelBtn = byId("categoryModalCancel");
  const saveBtn = byId("categoryModalSave");
  const overlay = byId("categoryModalOverlay");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.keyword = searchInput.value || "";
      state.page = 1;
      renderTable();
    });
  }

  if (addBtn) addBtn.addEventListener("click", () => openModal());
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (saveBtn) saveBtn.addEventListener("click", saveFromModal);

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeModal();
    });
  }

  if (body) {
    body.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-action]");
      if (!btn) return;

      const id = btn.dataset.id;
      if (btn.dataset.action === "edit") {
        const category = getCategories().find(
          (c) => Number(c.id) === Number(id),
        );
        if (category) openModal(category);
      }

      if (btn.dataset.action === "toggle") {
        toggleStatus(id);
      }
    });
  }

  if (pagination) {
    pagination.addEventListener("click", (event) => {
      const btn = event.target.closest("button.page-btn");
      if (!btn) return;

      const nav = btn.dataset.nav;
      if (nav === "prev") {
        state.page = Math.max(1, state.page - 1);
        renderTable();
        return;
      }

      if (nav === "next") {
        const totalPage = Math.max(
          1,
          Math.ceil(getDisplayCategories().length / state.pageSize),
        );
        state.page = Math.min(totalPage, state.page + 1);
        renderTable();
        return;
      }

      const page = Number(btn.dataset.page);
      if (!page) return;
      state.page = page;
      renderTable();
    });
  }
};

const init = () => {
  ensureCategories();
  initEvents();
  renderTable();
};

document.addEventListener("DOMContentLoaded", init);
