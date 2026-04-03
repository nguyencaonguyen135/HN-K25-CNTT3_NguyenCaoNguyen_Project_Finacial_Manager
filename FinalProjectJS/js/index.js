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

const getData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const getUsers = () => getData("users", users);

const saveUsers = (users) =>
  localStorage.setItem("users", JSON.stringify(users));

// Lưu dữ liệu gốc lần đầu
if (!localStorage.getItem("users")) saveUsers(users);

const getCurrentUser = () => {
  const users = getUsers();
  const id =
    localStorage.getItem("currentUser") ||
    localStorage.getItem("currentUserId");
  return users.find((u) => String(u.id) === String(id));
};

let currentUser = getCurrentUser();

if (!currentUser) {
  window.location.href = "login.html";
}



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

setSidebarActiveByPage();


const currentUserName = document.getElementById("currentUserName");
const accountInfoName = document.getElementById("accountInfoName");
const accountInfoEmail = document.getElementById("accountInfoEmail");
const accountInfoRole = document.getElementById("accountInfoRole");

if (currentUserName) currentUserName.textContent = "Tài khoản";

if (accountInfoName) {
  accountInfoName.textContent =
    currentUser && currentUser.fullName ? currentUser.fullName : "-";
}
if (accountInfoEmail) {
  accountInfoEmail.textContent =
    currentUser && currentUser.email ? currentUser.email : "-";
}
if (accountInfoRole) {
  accountInfoRole.textContent =
    "Vai trò: " + (currentUser && currentUser.role ? currentUser.role : "user");
}



const toggleBtn = document.getElementById("accountToggle");
const account = document.getElementById("account");

if (toggleBtn && account) {
  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    account.classList.toggle("open");
  };

  document.onclick = (e) => {
    if (!account.contains(e.target)) {
      account.classList.remove("open");
    }
  };
}



const menuLogoutBtn = document.getElementById("menuLogout");
if (menuLogoutBtn) {
  menuLogoutBtn.onclick = () => {
    Swal.fire({
      title: "Are you sure you want to log out?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Log out it!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentUserId");
        window.location.href = "login.html";
      }
    });
  };
}



const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const genderInput = document.getElementById("gender");

const renderProfile = () => {
  if (!nameInput || !emailInput || !phoneInput || !genderInput || !currentUser)
    return;

  nameInput.value = currentUser.fullName;
  emailInput.value = currentUser.email;
  phoneInput.value = currentUser.phone;
  genderInput.value = currentUser.gender ? "Nam" : "Nữ";
};

renderProfile();



const updateBtn = document.querySelector(".btn-outline");

if (updateBtn) {
  updateBtn.addEventListener("click", () => {
    if (!nameInput || !emailInput || !phoneInput || !genderInput) return;

    const users = getUsers();
    const newEmail = emailInput.value.trim().toLowerCase();

    const isEmailDuplicated = users.some(
      (u) =>
        String(u.id) !== String(currentUser.id) &&
        u.email &&
        u.email.trim().toLowerCase() === newEmail,
    );

    if (isEmailDuplicated) {
      Swal.fire({
        title: "Email already exists!",
        text: "Please use a different email.",
        icon: "error",
      });
      return;
    }
    Swal.fire({
      title: "Bạn có muốn thay đổi thông tin không?",
      text: "Bạn sẽ không thể hoàn tác thao tác này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Có, cập nhật nó!",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (!result.isConfirmed) 
        return;

      currentUser.fullName = nameInput.value.trim();
      currentUser.email = emailInput.value.trim();
      currentUser.phone = phoneInput.value.trim();
      currentUser.gender = genderInput.value.toLowerCase() === "nam";

      const index = users.findIndex((u) => u.id === currentUser.id);
      users[index] = currentUser;

      saveUsers(users);

      if (accountInfoName) {
        accountInfoName.textContent = currentUser.fullName;
      }
      if (accountInfoEmail) {
        accountInfoEmail.textContent = currentUser.email;
      }
      Swal.fire({
        title: "Cập nhật thành công!",
        text: "Thông tin đã được cập nhật",
        icon: "success",
      });
    });
  });
}



const getBudgets = () => getData("budgets", {});
const getRemainingBudgets = () => getData("remainingBudgets", {});
const getTransactions = () => getData("transactions", []);
const getSelectedBudgetMonth = () =>
  localStorage.getItem("selectedBudgetMonth");

const saveBudgets = (data) =>
  localStorage.setItem("budgets", JSON.stringify(data));
const saveRemainingBudgets = (data) =>
  localStorage.setItem("remainingBudgets", JSON.stringify(data));
const saveSelectedBudgetMonth = (month) =>
  localStorage.setItem("selectedBudgetMonth", month);

const parseMoneyInput = (value) =>
  Number(String(value || "").replace(/[^\d]/g, ""));

const formatVnd = (money) =>
  Number(money || 0).toLocaleString("vi-VN") + " VND";

const getSpentByMonth = (month) => {
  const transactions = getTransactions();
  return transactions
    .filter((item) => String(item.createdDate || "").startsWith(month))
    .reduce((total, item) => total + Number(item.total || 0), 0);
};

const saveRemainingByMonth = (month, remainingAmount) => {
  const remainingBudgets = getRemainingBudgets();
  remainingBudgets[month] = Number(remainingAmount || 0);
  saveRemainingBudgets(remainingBudgets);
};

const monthInput = document.getElementById("monthSelect");
const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");
const remainingText = document.getElementById("remainingText");

const renderMonthlyBalance = () => {
  if (!monthInput || !budgetInput || !remainingText) 
    return;

  const month = monthInput.value;
  if (!month)
    return;

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[month] || 0);
  const spentAmount = getSpentByMonth(month);
  const remainingAmount = budgetAmount - spentAmount;

  budgetInput.value = budgetAmount > 0 ? String(budgetAmount) : "";
  remainingText.textContent = formatVnd(remainingAmount);
  saveRemainingByMonth(month, remainingAmount);
};

const initMonthlyBudget = () => {
  if (!monthInput || !budgetInput || !saveBudgetBtn || !remainingText) return;

  if (!localStorage.getItem("budgets")) saveBudgets({});
  if (!localStorage.getItem("remainingBudgets")) saveRemainingBudgets({});
  if (!localStorage.getItem("transactions")) {
    localStorage.setItem("transactions", JSON.stringify([]));
  }

  monthInput.value =
    getSelectedBudgetMonth() ||
    monthInput.value ||
    new Date().toISOString().slice(0, 7);
  saveSelectedBudgetMonth(monthInput.value);

  saveBudgetBtn.addEventListener("click", () => {
    const month = monthInput.value;
    const money = parseMoneyInput(budgetInput.value);

    if (!month) {
      Swal.fire(
        "Chưa chọn tháng", 
        "Vui lòng chọn tháng", 
        "warning");
      return;
    }

    if (!budgetInput.value.trim() || money <= 0) {
      Swal.fire(
        "Chưa nhập tiền", 
        "Vui lòng nhập ngân sách tháng", 
        "warning");
      return;
    }

    const budgets = getBudgets();
    budgets[month] = money;
    saveBudgets(budgets);
    saveSelectedBudgetMonth(month);

    const spentAmount = getSpentByMonth(month);
    const remainingAmount = money - spentAmount;
    remainingText.textContent = formatVnd(remainingAmount);
    saveRemainingByMonth(month, remainingAmount);

    Swal.fire(
      "Thành công",
      "Đã lưu ngân sách",
      "success"
    );
  });

  monthInput.addEventListener("change", () => {
    saveSelectedBudgetMonth(monthInput.value);
    renderMonthlyBalance();
  });
  window.addEventListener("focus", renderMonthlyBalance);

  renderMonthlyBalance();
};

initMonthlyBudget();
