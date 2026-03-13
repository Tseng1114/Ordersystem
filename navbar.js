export function initNavbar(pageKey = "") {
  const root = document.getElementById("navbar-root");
  if (!root) return;

  const onMenu =
    pageKey === "drink" || pageKey === "food" || pageKey === "menu";

  root.innerHTML = `
    <nav class="nb__bar">
      <a class="nb__brand" href="index.html"> 曾可愛家族點餐</a>

      <button class="nb__toggle" id="nb_toggle" aria-label="選單">
        <span></span><span></span><span></span>
      </button>

      <ul class="nb__menu" id="nb_menu">

        <li class="nb__group">
          <button class="nb__group-btn" type="button">
            訂單 <span class="nb__chevron">▾</span>
          </button>
          <div class="nb__dropdown">
            <a href="create_event.html" class="${pageKey === "create" ? "nb__active" : ""}">新增訂單</a>
            <a href="edit_order.html"   class="${pageKey === "edit" ? "nb__active" : ""}">修改訂單</a>
            <a href="search_order.html"       class="${pageKey === "lookup" ? "nb__active" : ""}">查詢訂單</a>
          </div>
        </li>

        <li class="nb__group nb__group--link">
          <a class="nb__group-btn nb__group-btn--link ${onMenu ? "nb__active-page" : ""}" href="menu.html">菜單</a>
        </li>

      </ul>
    </nav>
  `;

  const toggle = document.getElementById("nb_toggle");
  const menu = document.getElementById("nb_menu");
  toggle.addEventListener("click", () => menu.classList.toggle("nb__open"));

  document.querySelectorAll(".nb__group").forEach((grp) => {
    const btn = grp.querySelector(".nb__group-btn");
    if (btn && btn.tagName === "BUTTON") {
      btn.addEventListener("click", () => {
        if (window.innerWidth <= 640) grp.classList.toggle("nb__open");
      });
    }
  });
}
