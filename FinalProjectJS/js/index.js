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

const getUsers = () => JSON.parse(localStorage.getItem("users")) || users;

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

// =======================
// 3. SIDEBAR ACTIVE STATE
// =======================
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

// =======================
// 4. HIỂN THỊ TÊN USER HEADER
// =======================
const currentUserName = document.getElementById("currentUserName");
const accountInfoName = document.getElementById("accountInfoName");
const accountInfoEmail = document.getElementById("accountInfoEmail");
const accountInfoRole = document.getElementById("accountInfoRole");

currentUserName.textContent = "Tài khoản";

// NAME
if (accountInfoName) {
  accountInfoName.textContent =
    currentUser && currentUser.fullName ? currentUser.fullName : "-";
}

// EMAIL
if (accountInfoEmail) {
  accountInfoEmail.textContent =
    currentUser && currentUser.email ? currentUser.email : "-";
}

// ROLE
if (accountInfoRole) {
  accountInfoRole.textContent =
    "Vai trò: " + (currentUser && currentUser.role ? currentUser.role : "user");
}

// =======================
// 5. DROPDOWN ACCOUNT
// =======================
const toggleBtn = document.getElementById("accountToggle");
const account = document.getElementById("account");

toggleBtn.onclick = (e) => {
  e.stopPropagation();
  account.classList.toggle("open");
};

document.onclick = (e) => {
  if (!account.contains(e.target)) {
    account.classList.remove("open");
  }
};

// =======================
// 6. LOGOUT
// =======================
document.getElementById("menuLogout").onclick = () => {
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

// =======================
// 7. PROFILE INFO
// =======================
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const genderInput = document.getElementById("gender");

const renderProfile = () => {
  nameInput.value = currentUser.fullName;
  emailInput.value = currentUser.email;
  phoneInput.value = currentUser.phone;
  genderInput.value = currentUser.gender ? "Nam" : "Nữ";
};

renderProfile();

// =======================
// 8. UPDATE PROFILE
// =======================
const updateBtn = document.querySelector(".btn-outline");
updateBtn.addEventListener("click", () => {
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

  currentUser.fullName = nameInput.value.trim();
  currentUser.email = emailInput.value.trim();
  currentUser.phone = phoneInput.value.trim();
  currentUser.gender = genderInput.value.toLowerCase() === "nam";

  const index = users.findIndex((u) => u.id === currentUser.id);
  users[index] = currentUser;

  saveUsers(users);

  Swal.fire({
    title: "Do you want to change the information?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, update it!",
  }).then((result) => {
    if (result.isConfirmed) {
      if (accountInfoName) {
        accountInfoName.textContent = currentUser.fullName;
      }
      if (accountInfoEmail) {
        accountInfoEmail.textContent = currentUser.email;
      }
    }
    Swal.fire({
      title: "Update successful!",
      text: "The information has been updated",
      icon: "success",
    });
  });
});

// =======================
// 9. NGÂN SÁCH THEO THÁNG
// =======================
const monthInput = document.getElementById("monthSelect");
const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");
const remainingText = document.getElementById("remainingText");

const getBudgets = () => JSON.parse(localStorage.getItem("budgets")) || {};

const saveBudgets = (data) =>
  localStorage.setItem("budgets", JSON.stringify(data));

// set tháng hiện tại
const today = new Date().toISOString().slice(0, 7);
monthInput.value = today;
