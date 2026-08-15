const toggle = document.getElementById("themeToggle");
const saved = localStorage.getItem("pic﻿oso-theme");
if (saved === "dark") document.body.classList.add("dark");
toggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("pic﻿oso-theme", document.body.classList.contains("dark") ? "dark" : "light");
});
document.querySelectorAll("nav a").forEach(a => {
  a.addEventListener("click", () => {
    document.querySelectorAll("nav a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
  });
});
