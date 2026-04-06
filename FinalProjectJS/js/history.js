const users = [
  {
    id: 1,
    fullName: "Nguyen Van A",
    email: "nguyenvana@gmail.com",
    password: btoa("123456"),
    status: true,
    phone: "0987654321",
    gender: true,
    role: "user",
  },
  {
    id: 2,
    fullName: "admin",
    email: "admin@gmail.com",
    password: btoa("123456"),
    status: true,
    phone: "0987654321",
    gender: true,
    role: "admin",
  },
  {
    id: 3,
    fullName: "Pham Thi B",
    email: "phamthib@gmail.com",
    password: btoa("123456"),
    status: true,
    phone: "0987654321",
    gender: false,
    role: "user",
  },
];

// Đọc dữ liệu JSON từ localStorage, lỗi thì trả fallback.
const getData = (key, fallback) => {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
};

// Ghi dữ liệu JSON vào localStorage.
const setData = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

// Lấy id user hiện tại; chưa login thì dùng guest.
const getCurrentUserId = () =>
  localStorage.getItem("currentUser") ||
  localStorage.getItem("currentUserId") ||
  "guest";

const getLoggedInUserId = () =>
  localStorage.getItem("currentUser") || localStorage.getItem("currentUserId");

// Tạo key theo user để tách dữ liệu từng tài khoản.
const getUserScopedKey = (baseKey) => `${baseKey}_${getCurrentUserId()}`;

// Đọc/ghi dữ liệu theo key đã scope user.
const getScopedData = (key, fallback) =>
  getData(getUserScopedKey(key), fallback);

const setScopedData = (key, value) => setData(getUserScopedKey(key), value);

// Tiện ích format số 1 chữ số thành 2 chữ số (vd: 4 -> 04).
const pad2 = (n) => String(n).padStart(2, "0");

// Lấy tháng hiện tại dạng YYYY-MM.
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
};

// Đọc/lưu tháng đang chọn của user.
const getSelectedBudgetMonth = () =>
  localStorage.getItem(getUserScopedKey("selectedBudgetMonth"));

const saveSelectedBudgetMonth = (month) =>
  localStorage.setItem(getUserScopedKey("selectedBudgetMonth"), month);

// Format tiền hiển thị kiểu Việt Nam.
const formatVnd = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

// Tập hàm truy cập dữ liệu chính.
const getUsers = () => getData("users", users);
const saveUsers = (users) => setData("users", users);
const getBudgets = () => getScopedData("budgets", {});
const saveBudgets = (data) => setScopedData("budgets", data);
const getRemainingBudgets = () => getScopedData("remainingBudgets", {});
const saveRemainingBudgets = (data) => setScopedData("remainingBudgets", data);

// Tính tổng tiền đã chi của 1 tháng.
const getSpentByMonth = (month) => {
  const transactions = getScopedData("transactions", []);
  return transactions
    .filter((item) => String(item.createdDate || "").startsWith(month))
    .reduce((total, item) => total + Number(item.total || 0), 0);
};

// Lưu số tiền còn lại theo tháng.
const setRemainingByMonth = (month, remaining) => {
  const remainingBudgets = getRemainingBudgets();
  remainingBudgets[month] = Number(remaining || 0);
  saveRemainingBudgets(remainingBudgets);
};

// State UI của trang history (tháng, từ khóa, sort, phân trang).
const state = {
  month: getSelectedBudgetMonth() || getCurrentMonth(),
  keyword: "",
  sort: "",
  page: 1,
  pageSize: 5,
};

// Hiển thị cảnh báo/ thông báo ở đầu bảng lịch sử.
const setHistoryWarning = (message, type = "error") => {
  const warning = document.getElementById("historyWarning");
  if (!warning) return;

  warning.textContent = message || "";
  warning.classList.toggle("success", type === "success");
};

// Khởi tạo dữ liệu storage theo key đã scope user.
const initStorage = () => {
  if (!localStorage.getItem("users")) saveUsers(users);

  const ensureScopedJson = (baseKey, fallback) => {
    const scopedKey = getUserScopedKey(baseKey);
    if (localStorage.getItem(scopedKey)) return;

    localStorage.setItem(scopedKey, JSON.stringify(fallback));
  };

  ensureScopedJson("transactions", []);
  ensureScopedJson("monthlyCategories", []);
  ensureScopedJson("budgets", {});
  ensureScopedJson("remainingBudgets", {});
};

// Kiểm tra đăng nhập trước khi vào trang history.
const requireLogin = () => {
  const userId = getLoggedInUserId();
  if (!userId) {
    window.location.href = "login.html";
    return false;
  }
  return true;
};

// Lấy object user hiện tại.
const getCurrentUser = () => {
  const userId = getLoggedInUserId();
  if (!userId) return null;
  const users = getUsers();
  return users.find((u) => String(u.id) === String(userId)) || null;
};

// Highlight item sidebar theo trang hiện tại.
const setSidebarActiveByPage = () => {
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  if (!sidebarItems.length) return;

  const currentPath = window.location.pathname.toLowerCase();
  let currentPage = "information";

  if (
    currentPath.endsWith("/category.html") ||
    currentPath.endsWith("category.html")
  ) {
    currentPage = "category";
  } else if (
    currentPath.endsWith("/history.html") ||
    currentPath.endsWith("history.html")
  ) {
    currentPage = "history";
  }

  sidebarItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === currentPage);
  });
};

// Khởi tạo dropdown account + thông tin user + logout.
const initAccountDropdown = () => {
  const accountEl = document.getElementById("account");
  const accountToggle = document.getElementById("accountToggle");
  const currentUserNameEl = document.getElementById("currentUserName");
  const accountInfoName = document.getElementById("accountInfoName");
  const accountInfoEmail = document.getElementById("accountInfoEmail");
  const accountInfoRole = document.getElementById("accountInfoRole");
  const menuLogoutBtn = document.getElementById("menuLogout");

  if (!accountEl || !accountToggle) return;

  const user = getCurrentUser();
  if (currentUserNameEl) currentUserNameEl.textContent = "Tài khoản";
  if (accountInfoName)
    accountInfoName.textContent = user && user.fullName ? user.fullName : "-";
  if (accountInfoEmail)
    accountInfoEmail.textContent = user && user.email ? user.email : "-";
  if (accountInfoRole)
    accountInfoRole.textContent = `Vai trò: ${user && user.role ? user.role : "user"}`;

  accountToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    accountEl.classList.toggle("open");
  });

  document.addEventListener("click", () => accountEl.classList.remove("open"));

  if (menuLogoutBtn) {
    menuLogoutBtn.addEventListener("click", () => {
      Swal.fire({
        title: "Bạn có chắc muốn đăng xuất?",
        text: "Bạn sẽ cần đăng nhập lại để tiếp tục.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Có, đăng xuất",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem("currentUser");
          localStorage.removeItem("currentUserId");
          window.location.href = "login.html";
        }
      });
    });
  }
};

// Map categoryId -> categoryName để render bảng giao dịch.
const getCategoryMap = () => {
  const monthly = getScopedData("monthlyCategories", []);
  const map = new Map();

  monthly.forEach((monthRecord) => {
    (monthRecord.categories || []).forEach((category) => {
      map.set(Number(category.id), category.name);
    });
  });

  return map;
};

// Lấy danh sách category của đúng tháng.
const getCategoriesByMonth = (month) => {
  const monthly = getScopedData("monthlyCategories", []);
  const monthObj = monthly.find((m) => m.month === month);
  return monthObj && monthObj.categories ? monthObj.categories : [];
};

// Render option danh mục trong form thêm giao dịch.
const renderCategoryOptions = () => {
  const categoryInput = document.getElementById("categoryInput");
  if (!categoryInput) return;

  const categories = getCategoriesByMonth(state.month);

  categoryInput.innerHTML = [
    '<option value="">Tiền chi tiêu</option>',
    ...categories.map(
      (cat) => `<option value="${cat.id}">${cat.name}</option>`,
    ),
  ].join("");
};

// Chuẩn hóa dữ liệu giao dịch để dễ filter/sort/render.
const createTransactionViewModel = (item, index, categoryMap) => {
  const amount = Number(item.total || 0);
  const createdDate = String(item.createdDate || "");
  const month = createdDate.slice(0, 7);
  const categoryId = Number(item.categoryId);

  return {
    ...item,
    index,
    amount,
    month,
    categoryName: categoryMap.get(categoryId) || item.categoryName || "Khác",
  };
};

const getProcessedTransactions = () => {
  const transactions = getScopedData("transactions", []);
  const categoryMap = getCategoryMap();

  return transactions.map((item, index) =>
    createTransactionViewModel(item, index, categoryMap),
  );
};

// Lọc theo tháng + keyword rồi sắp xếp theo state.sort.
const filterAndSortTransactions = () => {
  const keyword = state.keyword.trim().toLowerCase();
  const rows = getProcessedTransactions().filter(
    (row) => row.month === state.month,
  );

  const filteredRows = keyword
    ? rows.filter((row) => {
        const note = String(row.note || "").toLowerCase();
        const category = String(row.categoryName || "").toLowerCase();
        return note.includes(keyword) || category.includes(keyword);
      })
    : rows;

  // Tạo bản sao trước khi sort để không làm đổi mảng gốc.
  if (state.sort === "amount-asc") {
    return [...filteredRows].sort((a, b) => a.amount - b.amount);
  }

  if (state.sort === "amount-desc") {
    return [...filteredRows].sort((a, b) => b.amount - a.amount);
  }

  return filteredRows;
};

// Render bảng lịch sử giao dịch và trạng thái empty.
const renderTable = () => {
  const body = document.getElementById("historyTableBody");
  const empty = document.getElementById("historyEmpty");
  if (!body || !empty) return;

  const rows = filterAndSortTransactions();
  const totalPage = Math.max(1, Math.ceil(rows.length / state.pageSize));
  if (state.page > totalPage) state.page = totalPage;

  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  empty.hidden = rows.length !== 0;

  body.innerHTML = pageRows
    .map((row, idx) => {
      const stt = start + idx + 1;
      return `
        <tr>
          <td>${stt}</td>
          <td>${row.categoryName}</td>
          <td>${formatVnd(row.amount)}</td>
          <td>${row.note || "-"}</td>
          <td>
            <button type="button" class="delete-btn" data-index="${row.index}" title="Xoa">🗑</button>
          </td>
        </tr>
      `;
    })
    .join("");

  renderPagination(rows.length, totalPage);
};

// Render phân trang.
const renderPagination = (totalItems, totalPage) => {
  const pagination = document.getElementById("pagination");
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

// Xóa giao dịch theo index trong mảng transactions.
const deleteTransaction = (index) => {
  const transactions = getScopedData("transactions", []);
  if (index < 0 || index >= transactions.length) return;

  Swal.fire({
    title: "Bạn có chắc muốn xóa giao dịch này?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Có, xóa",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (!result.isConfirmed) return;

    transactions.splice(index, 1);
    setScopedData("transactions", transactions);
    setHistoryWarning("Đã xóa giao dịch.", "success");
    renderBudget();
    renderTable();
  });
};

// Thêm mới 1 giao dịch từ form quick-add.
const addTransaction = () => {
  const amountInput = document.getElementById("amountInput");
  const categoryInput = document.getElementById("categoryInput");
  const noteInput = document.getElementById("noteInput");

  if (!amountInput || !categoryInput || !noteInput) return;

  const amount = Number(amountInput.value);
  const categoryId = Number(categoryInput.value);
  const note = String(noteInput.value || "").trim();

  if (!amount || amount <= 0) {
    setHistoryWarning("Vui lòng nhập số tiền hợp lệ.");
    return;
  }

  if (!categoryId) {
    setHistoryWarning("Vui lòng chọn danh mục chi tiêu.");
    return;
  }

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[state.month] || 0);
  const spentAmount = getSpentByMonth(state.month);
  const nextSpentAmount = spentAmount + amount;

  if (nextSpentAmount > budgetAmount) {
    const remainingAmount = Math.max(0, budgetAmount - spentAmount);
    setHistoryWarning(
      `Giao dịch vượt ngân sách tháng. Bạn chỉ còn ${formatVnd(remainingAmount)} để chi.`,
    );
    return;
  }

  const now = new Date();
  const dateText = `${state.month}-${pad2(now.getDate())}`;

  const transactions = getScopedData("transactions", []);
  // Đưa giao dịch mới lên đầu để hiển thị đầu tiên ở chế độ sắp xếp mặc định.
  transactions.unshift({
    id: Date.now(),
    categoryId,
    total: amount,
    note,
    createdDate: dateText,
  });

  setScopedData("transactions", transactions);
  amountInput.value = "";
  noteInput.value = "";
  categoryInput.value = "";
  setHistoryWarning("Đã thêm giao dịch.", "success");

  state.page = 1;
  renderBudget();
  renderTable();
};

// Tính và render tiền còn lại của tháng hiện tại.
const renderBudget = () => {
  const remainingText = document.getElementById("remainingText");
  if (!remainingText) return;

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[state.month] || 0);
  const spentAmount = getSpentByMonth(state.month);
  const remainingAmount = budgetAmount - spentAmount;

  setRemainingByMonth(state.month, remainingAmount);
  remainingText.textContent = formatVnd(remainingAmount);
};

// Tìm kiếm giao dịch theo từ khóa trong history.
const searchHistory = () => {
  const searchInputElement = document.getElementById("searchInput");
  if (!searchInputElement) return;

  const keyword = searchInputElement.value.toLowerCase().trim();
  state.keyword = keyword;

  state.page = 1;
  renderTable();
};

// Khởi tạo ô chọn tháng và đồng bộ dữ liệu theo tháng.
const initMonthBudget = () => {
  const monthInput = document.getElementById("monthSelect");
  if (!monthInput) return;

  monthInput.value = state.month;
  saveSelectedBudgetMonth(state.month);

  monthInput.addEventListener("change", () => {
    state.month = monthInput.value || getCurrentMonth();
    saveSelectedBudgetMonth(state.month);
    state.page = 1;
    renderBudget();
    renderCategoryOptions();
    renderTable();
  });

  renderBudget();
};

// Bind toàn bộ sự kiện (sort, search, add, delete, paging).
const initHistoryActions = () => {
  const sortSelectElement = document.getElementById("sortSelect");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const addTransactionBtn = document.getElementById("addTransactionBtn");
  const tableBody = document.getElementById("historyTableBody");
  const pagination = document.getElementById("pagination");

  if (
    !sortSelectElement ||
    !searchInput ||
    !searchBtn ||
    !addTransactionBtn ||
    !tableBody ||
    !pagination
  )
    return;

  sortSelectElement.value = state.sort;

  sortSelectElement.addEventListener("change", () => {
    state.sort = sortSelectElement.value;
    state.page = 1;
    renderTable();
  });

  searchBtn.addEventListener("click", searchHistory);
  addTransactionBtn.addEventListener("click", addTransaction);
  [searchInput, addTransactionBtn].forEach((el) => {
    if (el) el.addEventListener("focus", () => setHistoryWarning(""));
  });

  const amountInput = document.getElementById("amountInput");
  const categoryInput = document.getElementById("categoryInput");
  const noteInput = document.getElementById("noteInput");

  [amountInput, categoryInput, noteInput].forEach((el) => {
    if (el) el.addEventListener("input", () => setHistoryWarning(""));
    if (el) el.addEventListener("change", () => setHistoryWarning(""));
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchHistory();
  });

  tableBody.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-index]");
    if (!btn) return;
    const index = Number(btn.dataset.index);
    deleteTransaction(index);
  });

  pagination.addEventListener("click", (event) => {
    const pageBtn = event.target.closest("button.page-btn");
    if (!pageBtn) return;

    const nav = pageBtn.dataset.nav;
    if (nav === "prev") {
      state.page = Math.max(1, state.page - 1);
      renderTable();
      return;
    }

    if (nav === "next") {
      const totalPage = Math.max(
        1,
        Math.ceil(filterAndSortTransactions().length / state.pageSize),
      );
      state.page = Math.min(totalPage, state.page + 1);
      renderTable();
      return;
    }

    const page = Number(pageBtn.dataset.page);
    if (!page) return;
    state.page = page;
    renderTable();
  });

  renderCategoryOptions();
  renderTable();
};

// Hàm init tổng của trang history.
const init = () => {
  initStorage();
  if (!requireLogin()) return;

  setSidebarActiveByPage();
  initAccountDropdown();
  initMonthBudget();
  initHistoryActions();
  window.addEventListener("focus", renderBudget);
};

document.addEventListener("DOMContentLoaded", init);
