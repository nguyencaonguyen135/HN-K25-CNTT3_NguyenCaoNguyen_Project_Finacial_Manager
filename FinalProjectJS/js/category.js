const byId = (id) => document.getElementById(id);

const getData = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const setData = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const pad2 = (n) => String(n).padStart(2, "0");
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
};

const formatVnd = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const getBudgets = () => getData("budgets", {});
const getRemainingBudgets = () => getData("remainingBudgets", {});
const saveRemainingBudgets = (data) => setData("remainingBudgets", data);

const getSpentByMonth = (month) => {
  const transactions = getData("transactions", []);
  return transactions
    .filter((item) => String(item.createdDate || "").startsWith(month))
    .reduce((total, item) => total + Number(item.total || 0), 0);
};

const setRemainingByMonth = (month, remaining) => {
  const remainingBudgets = getRemainingBudgets();
  remainingBudgets[month] = Number(remaining || 0);
  saveRemainingBudgets(remainingBudgets);
};

const renderRemainingBudget = (month) => {
  const remainingText = byId("remainingText");
  if (!remainingText) return;

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[month] || 0);
  const spentAmount = getSpentByMonth(month);
  const remainingAmount = budgetAmount - spentAmount;

  setRemainingByMonth(month, remainingAmount);
  remainingText.textContent = formatVnd(remainingAmount);
};

const initStorage = () => {
  if (!localStorage.getItem("monthlyCategories"))
    setData("monthlyCategories", []);
  if (!localStorage.getItem("transactions")) setData("transactions", []);
  if (!localStorage.getItem("users")) setData("users", []);
};

const requireLogin = () => {
  const userId = localStorage.getItem("currentUser");
  if (!userId) {
    window.location.href = "login.html";
    return false;
  }
  return true;
};

const getCurrentUser = () => {
  const userId = localStorage.getItem("currentUser");
  if (!userId) return null;
  const users = getData("users", []);
  return users.find((u) => String(u.id) === String(userId)) || null;
};

const getMonthRecord = (month) => {
  const monthly = getData("monthlyCategories", []);
  let record = monthly.find((m) => m.month === month);

  if (!record) {
    record = { id: Date.now(), month, categories: [] };
    monthly.push(record);
    setData("monthlyCategories", monthly);
  }

  return record;
};

const getSpentByCategoryMap = (month) => {
  const transactions = getData("transactions", []);
  const map = new Map();

  transactions
    .filter((t) => String(t.createdDate || "").startsWith(month))
    .forEach((t) => {
      const categoryId = Number(t.categoryId);
      const amount = Number(t.total || 0);
      if (!categoryId) return;
      map.set(categoryId, (map.get(categoryId) || 0) + amount);
    });

  return map;
};

const syncMonthSpent = (month) => {
  const monthly = getData("monthlyCategories", []);
  const monthObj = monthly.find((m) => m.month === month);
  if (!monthObj) return;

  const spentMap = getSpentByCategoryMap(month);
  let changed = false;

  monthObj.categories.forEach((cat) => {
    const nextSpent = spentMap.get(Number(cat.id)) || 0;
    if (Number(cat.spent || 0) !== nextSpent) {
      cat.spent = nextSpent;
      changed = true;
    }
  });

  if (changed) setData("monthlyCategories", monthly);
};

const initAccountDropdown = () => {
  const accountEl = byId("account");
  const accountToggle = byId("accountToggle");
  const currentUserNameEl = byId("currentUserName");
  const accountInfoName = byId("accountInfoName");
  const accountInfoEmail = byId("accountInfoEmail");
  const accountInfoRole = byId("accountInfoRole");

  const menuLogoutBtn = byId("menuLogout");

  if (!accountEl || !accountToggle) return;

  const user = getCurrentUser();
  if (currentUserNameEl) currentUserNameEl.textContent = "Tài khoản";
  if (accountInfoName) accountInfoName.textContent = user?.fullName || "-";
  if (accountInfoEmail) accountInfoEmail.textContent = user?.email || "-";
  if (accountInfoRole)
    accountInfoRole.textContent = `Vai tro: ${user?.role || "user"}`;

  accountToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    accountEl.classList.toggle("open");
  });

  document.addEventListener("click", () => accountEl.classList.remove("open"));

  menuLogoutBtn?.addEventListener("click", () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentUserId");
        window.location.href = "login.html";
      }
    });
  });
};

const renderCategories = (month) => {
  syncMonthSpent(month);

  const grid = byId("categoryGrid");
  const warning = byId("categoryWarning");
  if (!grid || !warning) return;

  const monthObj = getMonthRecord(month);
  const categories = monthObj.categories || [];

  if (categories.length === 0) {
    grid.innerHTML =
      '<p class="empty">Chua co danh muc nao trong thang nay.</p>';
    warning.textContent = "";
    return;
  }

  const hasOver = categories.some(
    (cat) => Number(cat.spent || 0) > Number(cat.budget || 0),
  );
  warning.textContent = hasOver ? "Co danh muc da vuot han muc." : "";

  grid.innerHTML = categories
    .map((cat) => {
      const spent = Number(cat.spent || 0);
      const budget = Number(cat.budget || 0);
      const overClass = spent > budget ? "card-over" : "";

      return `
        <article class="category-card ${overClass}">
          <span class="card-icon"><i class="fa-solid fa-dollar-sign"></i></span>
          <div>
            <h4 class="card-title">${cat.name}</h4>
            <p class="card-limit">${formatVnd(budget)} | Da chi: ${formatVnd(spent)}</p>
          </div>
          <div class="card-actions">
            <button type="button" class="action-btn" data-action="edit" data-id="${cat.id}" title="Sua">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="action-btn" data-action="delete" data-id="${cat.id}" title="Xoa">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
};

const addCategory = (month) => {
  const nameSelect = byId("categoryNameSelect");
  const limitInput = byId("categoryLimitInput");
  const warning = byId("categoryWarning");

  if (!nameSelect || !limitInput || !warning) return;

  const name = String(nameSelect.value || "").trim();
  const limit = Number(limitInput.value);

  if (!name) {
    warning.textContent = "Vui long chon ten danh muc.";
    return;
  }

  if (!limit || limit <= 0) {
    warning.textContent = "Gioi han phai lon hon 0.";
    return;
  }

  const monthly = getData("monthlyCategories", []);
  const monthObj = monthly.find((m) => m.month === month) || {
    id: Date.now(),
    month,
    categories: [],
  };

  if (!monthly.find((m) => m.month === month)) monthly.push(monthObj);

  const duplicated = monthObj.categories.some(
    (cat) => String(cat.name).toLowerCase() === name.toLowerCase(),
  );

  if (duplicated) {
    warning.textContent = "Danh muc nay da ton tai trong thang da chon.";
    return;
  }

  monthObj.categories.push({
    id: Date.now(),
    name,
    budget: limit,
    spent: 0,
  });

  setData("monthlyCategories", monthly);
  warning.textContent = "";
  limitInput.value = "";
  nameSelect.value = "";
  renderCategories(month);
};

const updateCategory = (month, categoryId) => {
  const monthly = getData("monthlyCategories", []);
  const monthObj = monthly.find((m) => m.month === month);
  if (!monthObj) return;

  const category = monthObj.categories.find(
    (cat) => Number(cat.id) === Number(categoryId),
  );
  if (!category) return;

  const nextName = window.prompt("Ten danh muc moi:", category.name);
  if (nextName === null) return;
  const cleanName = nextName.trim();
  if (!cleanName) return;

  const nextLimitRaw = window.prompt(
    "Han muc moi (VND):",
    String(category.budget),
  );
  if (nextLimitRaw === null) return;

  const nextLimit = Number(nextLimitRaw);
  if (!nextLimit || nextLimit <= 0) {
    alert("Han muc khong hop le.");
    return;
  }

  category.name = cleanName;
  category.budget = nextLimit;
  setData("monthlyCategories", monthly);
  renderCategories(month);
};

const deleteCategory = (month, categoryId) => {
  const monthly = getData("monthlyCategories", []);
  const monthObj = monthly.find((m) => m.month === month);
  if (!monthObj) return;

  const ok = window.confirm("Ban co chac muon xoa danh muc nay?");
  if (!ok) return;

  monthObj.categories = monthObj.categories.filter(
    (cat) => Number(cat.id) !== Number(categoryId),
  );
  setData("monthlyCategories", monthly);
  renderCategories(month);
};

const initCategoryActions = () => {
  const monthSelect = byId("monthSelect");
  const addCategoryBtn = byId("addCategoryBtn");
  const grid = byId("categoryGrid");

  if (!monthSelect || !addCategoryBtn || !grid) return;

  if (!monthSelect.value) monthSelect.value = getCurrentMonth();

  const getMonth = () => monthSelect.value || getCurrentMonth();

  addCategoryBtn.addEventListener("click", () => addCategory(getMonth()));

  monthSelect.addEventListener("change", () => {
    renderRemainingBudget(getMonth());
    renderCategories(getMonth());
  });

  grid.addEventListener("click", (event) => {
    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;

    if (action === "edit") updateCategory(getMonth(), id);
    if (action === "delete") deleteCategory(getMonth(), id);
  });

  renderRemainingBudget(getMonth());
  window.addEventListener("focus", () => renderRemainingBudget(getMonth()));
  renderCategories(getMonth());
};

const init = () => {
  initStorage();
  if (!requireLogin()) return;

  initAccountDropdown();
  initCategoryActions();
};

document.addEventListener("DOMContentLoaded", init);
