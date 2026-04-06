const adminById = (id) => document.getElementById(id);

const initAdminMenuActive = () => {
  const currentPage = document.body.dataset.adminPage || "dashboard";
  const menuItems = document.querySelectorAll(".menu-item[data-menu]");

  menuItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.menu === currentPage);
  });
};

const initAdminSignOut = () => {
  const signOutBtn = adminById("signOutBtn");
  if (!signOutBtn) return;

  signOutBtn.addEventListener("click", () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (!result.isConfirmed) return;
      localStorage.removeItem("currentUser");
      localStorage.removeItem("currentUserId");
      window.location.href = "login.html";
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initAdminMenuActive();
  initAdminSignOut();
});



