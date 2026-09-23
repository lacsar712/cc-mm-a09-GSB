const tokenKey = "methane_token";
let token = localStorage.getItem(tokenKey) || "";
let role = localStorage.getItem("methane_role") || "";
let view = "board";

const loginBox = document.querySelector("#login");
const appBox = document.querySelector("#app");
const boardView = document.querySelector("#boardView");
const criticalView = document.querySelector("#criticalView");
const rows = document.querySelector("#rows");
const criticalRows = document.querySelector("#criticalRows");
const live = document.querySelector("#live");
const form = document.querySelector("#form");
const criticalInput = document.querySelector("#criticalInput");
const criticalMsg = document.querySelector("#criticalMsg");

function levelClass(level) {
  if (level === "危急") return "critical";
  return level === "报警" ? "alarm" : "ok";
}

function paint(tbody, list) {
  tbody.innerHTML = list
    .map(
      (r) =>
        `<tr><td>${r.site}</td><td>${r.ch4_pct}</td><td class="${levelClass(r.level)}">${r.level}</td><td>${r.note}</td></tr>`,
    )
    .join("");
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "请求失败");
  return data;
}

function switchView(next) {
  view = next;
  boardView.hidden = view !== "board";
  criticalView.hidden = view !== "critical";
  document.querySelector("#navBoard").classList.toggle("active", view === "board");
  document.querySelector("#navCritical").classList.toggle("active", view === "critical");
  if (view === "critical") loadCritical();
}

async function loadSettings() {
  const s = await api("/api/settings");
  criticalInput.value = s.critical_threshold;
}

function showApp() {
  loginBox.hidden = true;
  appBox.hidden = false;
  document.querySelector("#who").textContent = role === "writer" ? "检查员" : "查看";
  document.querySelector("#out").hidden = false;
  form.hidden = role !== "writer";
  const writer = role === "writer";
  criticalInput.disabled = !writer;
  document.querySelector("#saveCritical").hidden = !writer;
  document.querySelector("#criticalHint").hidden = writer;
  switchView("board");
  loadSettings();
  connect();
  load();
}

async function load() {
  paint(rows, await api("/api/readings"));
}

async function loadCritical() {
  paint(criticalRows, await api("/api/readings?level=" + encodeURIComponent("危急")));
}

function connect() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/ws/alerts`);
  ws.onmessage = (ev) => {
    const row = JSON.parse(ev.data);
    live.textContent = `刚推送：${row.site} ${row.level}`;
    load();
    if (view === "critical" && row.level === "危急") loadCritical();
  };
}

document.querySelector("#go").onclick = async () => {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: document.querySelector("#user").value,
      password: document.querySelector("#pass").value,
    }),
  });
  token = data.access_token;
  role = data.role;
  localStorage.setItem(tokenKey, token);
  localStorage.setItem("methane_role", role);
  showApp();
};

form.onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api("/api/readings", {
      method: "POST",
      body: JSON.stringify({
        site: document.querySelector("#site").value,
        ch4_pct: Number(document.querySelector("#ch4").value),
      }),
    });
  } catch (err) {
    live.textContent = err.message;
  }
};

document.querySelector("#saveCritical").onclick = async () => {
  criticalMsg.textContent = "";
  try {
    const value = Number(criticalInput.value);
    const s = await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify({ critical_threshold: value }),
    });
    criticalInput.value = s.critical_threshold;
    criticalMsg.textContent = "已保存，立即对新上报生效";
  } catch (err) {
    criticalMsg.textContent = err.message;
  }
};

document.querySelector("#navBoard").onclick = () => switchView("board");
document.querySelector("#navCritical").onclick = () => switchView("critical");

document.querySelector("#out").onclick = () => {
  localStorage.clear();
  location.reload();
};

if (token) showApp();
