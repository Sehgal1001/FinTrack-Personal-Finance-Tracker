/* FinTrack — vanilla JavaScript finance tracker
   Storage: browser localStorage | Charts: Chart.js | FX: Frankfurter API */
"use strict";

const CATEGORIES = {
  expense: ["Food & Dining","Transport","Shopping","Bills & Utilities","Health","Entertainment","Education","Travel","Other"],
  income: ["Salary","Freelance","Investment","Gift","Other"]
};
const CATEGORY_ICONS = {"Food & Dining":"◉","Transport":"↗","Shopping":"◇","Bills & Utilities":"▤","Health":"＋","Entertainment":"♫","Education":"▣","Travel":"✈","Other":"•","Salary":"▤","Freelance":"⌘","Investment":"↗","Gift":"♡"};
const COLORS = ["#6c63df","#36a985","#efa85b","#e77b83","#5d9bd6","#9b82ce","#c6a04c","#62b5bb","#9ca5b5"];
const STORAGE_KEY = "fintrack_data_v1";
const FX_KEY = "fintrack_fx_v1";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const todayISO = () => new Date().toISOString().slice(0,10);
const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
const safeParse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };

const state = {
  transactions: [], budgets: [], currency: "INR", rates: {base:"INR",rates:{INR:1},date:null},
  charts: {cashflow:null,category:null,report:null}, activeView:"overview"
};

function loadData() {
  const saved = safeParse(localStorage.getItem(STORAGE_KEY), {});
  state.transactions = Array.isArray(saved.transactions) ? saved.transactions : [];
  state.budgets = Array.isArray(saved.budgets) ? saved.budgets : [];
  state.currency = saved.currency || "INR";
  const cachedFx = safeParse(localStorage.getItem(FX_KEY), null);
  if (cachedFx && cachedFx.rates) state.rates = cachedFx;
  $("#currencySelect").value = state.currency;
}
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    transactions: state.transactions, budgets: state.budgets, currency: state.currency
  }));
}
function money(amount, currency = state.currency) {
  const rate = state.rates.rates?.[currency] ?? 1;
  const converted = Number(amount || 0) * rate;
  try { return new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:currency==="INR"?0:2}).format(converted); }
  catch { return `${currency} ${converted.toFixed(2)}`; }
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function getMonthTransactions(month = monthKey()) {
  return state.transactions.filter(t => t.date?.startsWith(month));
}
function totals(items) {
  return items.reduce((acc,t) => { acc[t.type] += Number(t.amount); return acc; },{income:0,expense:0});
}
function categoryExpenseTotals(items) {
  return items.filter(t=>t.type==="expense").reduce((acc,t)=>{acc[t.category]=(acc[t.category]||0)+Number(t.amount);return acc;},{});
}
function showToast(message) {
  const toast=$("#toast"); toast.textContent=message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove("show"),2600);
}
function populateCategories() {
  $("#transactionCategory").innerHTML = [...CATEGORIES.expense,...CATEGORIES.income].map(c=>`<option value="${c}">${c}</option>`).join("");
  $("#budgetCategory").innerHTML = CATEGORIES.expense.map(c=>`<option value="${c}">${c}</option>`).join("");
  $("#categoryFilter").innerHTML = `<option value="all">All categories</option>`+[...CATEGORIES.expense,...CATEGORIES.income].map(c=>`<option value="${c}">${c}</option>`).join("");
}
function updateCategoryOptions() {
  const type=$("#transactionType").value, select=$("#transactionCategory"), old=select.value;
  select.innerHTML=CATEGORIES[type].map(c=>`<option value="${c}">${c}</option>`).join("");
  if(CATEGORIES[type].includes(old)) select.value=old;
}
function render() {
  renderOverview(); renderTransactions(); renderBudgets(); renderReports();
  $("#currencySelect").value=state.currency;
}
function renderOverview() {
  const items=getMonthTransactions(), t=totals(items), balance=state.transactions.reduce((sum,x)=>sum+(x.type==="income"?1:-1)*Number(x.amount),0);
  $("#totalBalance").textContent=money(balance); $("#totalIncome").textContent=money(t.income);
  $("#totalExpense").textContent=money(t.expense);
  $("#savingsRate").textContent=`${t.income ? Math.round(((t.income-t.expense)/t.income)*100) : 0}%`;
  $("#currentMonth").textContent=new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  $("#todayLabel").textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();
  renderCashflowChart(); renderCategoryChart();
  const recent=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  $("#recentTransactions").innerHTML=recent.length?recent.map(transactionRow).join(""):`<div class="empty-state">No transactions yet. Add your first transaction.</div>`;
  const budgets=state.budgets.slice(0,4);
  $("#budgetPreview").innerHTML=budgets.length?budgets.map(b=>budgetLine(b)).join(""):`<div class="empty-state">No budgets yet. Create a monthly budget to get started.</div>`;
}
function transactionRow(t) {
  const sign=t.type==="income"?"+":"−";
  return `<div class="transaction-row"><div class="transaction-symbol">${CATEGORY_ICONS[t.category]||"•"}</div><div class="transaction-meta"><strong>${escapeHTML(t.description)}</strong><small>${escapeHTML(t.category)} · ${formatDate(t.date)}</small></div><div class="amount ${t.type}">${sign}${money(t.amount)}</div></div>`;
}
function budgetSpent(category) {
  return getMonthTransactions().filter(t=>t.type==="expense"&&t.category===category).reduce((sum,t)=>sum+Number(t.amount),0);
}
function budgetLine(b) {
  const spent=budgetSpent(b.category), pct=Math.min(100,spent/b.limit*100), over=spent>b.limit;
  return `<div class="budget-line"><div class="budget-line-head"><span>${escapeHTML(b.category)}</span><strong>${money(spent)} / ${money(b.limit)}</strong></div><div class="progress"><span class="${over?"over":""}" style="width:${pct}%"></span></div></div>`;
}
function chartDefaults() {
  Chart.defaults.font.family="'DM Sans', sans-serif"; Chart.defaults.color="#8b93a4";
  Chart.defaults.plugins.legend.labels.usePointStyle=true;
}
function destroyChart(name) { if(state.charts[name]) {state.charts[name].destroy();state.charts[name]=null;} }
function monthSeries(count) {
  return Array.from({length:count},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(count-1-i));return {key:monthKey(d),label:d.toLocaleDateString("en-IN",{month:"short"})};});
}
function renderCashflowChart() {
  if(!window.Chart)return; chartDefaults(); destroyChart("cashflow");
  const series=monthSeries(Number($("#cashflowPeriod").value||6));
  const income=series.map(m=>totals(state.transactions.filter(t=>t.date.startsWith(m.key))).income);
  const expense=series.map(m=>totals(state.transactions.filter(t=>t.date.startsWith(m.key))).expense);
  state.charts.cashflow=new Chart($("#cashflowChart"),{type:"line",data:{labels:series.map(m=>m.label),datasets:[
    {label:"Income",data:income,borderColor:"#36a985",backgroundColor:"#36a98518",fill:true,tension:.4,borderWidth:2,pointRadius:3},
    {label:"Expenses",data:expense,borderColor:"#e77b83",backgroundColor:"#e77b8318",fill:true,tension:.4,borderWidth:2,pointRadius:3}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:7,font:{size:10}}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:"#eef0f5"},ticks:{font:{size:9},callback:v=>shortMoney(v)}}}}});
}
function shortMoney(v) { return v>=100000?`${(v/100000).toFixed(1)}L`:v>=1000?`${(v/1000).toFixed(0)}k`:v; }
function renderCategoryChart() {
  if(!window.Chart)return; destroyChart("category");
  const entries=Object.entries(categoryExpenseTotals(getMonthTransactions())).sort((a,b)=>b[1]-a[1]);
  const total=entries.reduce((s,e)=>s+e[1],0); $("#donutCenter").innerHTML=`<strong>${money(total)}</strong><small>Spent</small>`;
  state.charts.category=new Chart($("#categoryChart"),{type:"doughnut",data:{labels:entries.map(e=>e[0]),datasets:[{data:entries.map(e=>e[1]),backgroundColor:COLORS,borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:"76%",plugins:{legend:{display:false}}}});
  $("#categoryLegend").innerHTML=entries.length?entries.slice(0,6).map((e,i)=>`<div class="legend-item"><span class="legend-dot" style="background:${COLORS[i%COLORS.length]}"></span>${escapeHTML(e[0])}<strong>${Math.round(e[1]/(total||1)*100)}%</strong></div>`).join(""):`<div class="empty-state" style="grid-column:1/-1">No expense data for this month.</div>`;
}
function renderTransactions() {
  const q=$("#searchTransactions").value.toLowerCase(), type=$("#typeFilter").value, cat=$("#categoryFilter").value, month=$("#monthFilter").value;
  const filtered=[...state.transactions].filter(t=>(!q||`${t.description} ${t.category} ${t.notes||""}`.toLowerCase().includes(q))&&(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)&&(!month||t.date.startsWith(month))).sort((a,b)=>b.date.localeCompare(a.date));
  $("#transactionsTable").innerHTML=filtered.length?filtered.map(t=>`<tr><td><div class="transaction-cell"><div class="transaction-symbol">${CATEGORY_ICONS[t.category]||"•"}</div><strong>${escapeHTML(t.description)}</strong></div></td><td>${escapeHTML(t.category)}</td><td>${formatDate(t.date)}</td><td><span class="type-tag ${t.type}">${t.type}</span></td><td class="align-right"><strong class="amount ${t.type}">${t.type==="income"?"+":"−"}${money(t.amount)}</strong></td><td><div class="row-actions"><button class="tiny-btn" data-edit="${t.id}" aria-label="Edit transaction">Edit</button><button class="tiny-btn" data-delete="${t.id}" aria-label="Delete transaction">Delete</button></div></td></tr>`).join(""):`<tr><td colspan="6"><div class="empty-state">No matching transactions found.</div></td></tr>`;
  $("#transactionCount").textContent=`Showing ${filtered.length} of ${state.transactions.length} transactions`;
}
function renderBudgets() {
  const spent=state.budgets.reduce((s,b)=>s+budgetSpent(b.category),0), limits=state.budgets.reduce((s,b)=>s+Number(b.limit),0);
  $("#budgetSummary").innerHTML=[["Total budget",money(limits)],["Spent this month",money(spent)],["Remaining",money(limits-spent)]].map(x=>`<div class="summary-tile"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join("");
  $("#budgetsGrid").innerHTML=state.budgets.length?state.budgets.map(b=>{const s=budgetSpent(b.category),p=s/b.limit*100,over=p>100;return `<article class="budget-card"><div class="budget-card-top"><h3>${CATEGORY_ICONS[b.category]||"•"} &nbsp;${escapeHTML(b.category)}</h3><button class="tiny-btn" data-remove-budget="${escapeHTML(b.category)}">Remove</button></div><p>Monthly spending limit</p><div class="progress"><span class="${over?"over":""}" style="width:${Math.min(100,p)}%"></span></div><div class="budget-card-bottom"><span>${money(s)} spent · ${Math.round(p)}%</span><strong>${money(b.limit)} limit</strong></div></article>`}).join(""):`<article class="panel empty-state" style="grid-column:1/-1">No budgets created. Select “Create budget” to set your first spending limit.</article>`;
}
function renderReports() {
  if(!$("#reportChart")||!window.Chart)return; chartDefaults(); destroyChart("report");
  const series=monthSeries(6), values=series.map(m=>totals(state.transactions.filter(t=>t.date.startsWith(m.key))));
  state.charts.report=new Chart($("#reportChart"),{type:"bar",data:{labels:series.map(m=>m.label),datasets:[{label:"Income",data:values.map(v=>v.income),backgroundColor:"#36a985",borderRadius:5},{label:"Expenses",data:values.map(v=>v.expense),backgroundColor:"#e77b83",borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:8,font:{size:10}}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:"#eef0f5"}}}}});
  const entries=Object.entries(categoryExpenseTotals(getMonthTransactions())).sort((a,b)=>b[1]-a[1]), max=entries[0]?.[1]||1;
  $("#reportCategories").innerHTML=entries.length?entries.map(([name,val],i)=>`<div class="report-category"><div class="report-category-head"><span>${escapeHTML(name)}</span><strong>${money(val)}</strong></div><div class="progress"><span style="width:${val/max*100}%;background:${COLORS[i%COLORS.length]}"></span></div></div>`).join(""):`<div class="empty-state">Add expenses to see your category breakdown.</div>`;
  const monthTotals=totals(getMonthTransactions()), net=monthTotals.income-monthTotals.expense;
  $("#insightText").textContent=monthTotals.income?`You kept ${money(net)} this month after expenses. ${net>=0?"You are spending within your income. Keep building that savings habit.":"Your expenses are higher than income. Review your category budgets to find opportunities to adjust."}`:"Add income and expenses to unlock your monthly financial insights.";
}
function openTransaction(transaction=null) {
  $("#transactionForm").reset(); $("#transactionId").value=transaction?.id||"";
  $("#transactionModalTitle").textContent=transaction?"Edit transaction":"Add transaction";
  $("#description").value=transaction?.description||""; $("#amount").value=transaction?.amount||"";
  $("#transactionType").value=transaction?.type||"expense"; updateCategoryOptions();
  $("#transactionCategory").value=transaction?.category||CATEGORIES[$("#transactionType").value][0];
  $("#transactionDate").value=transaction?.date||todayISO(); $("#notes").value=transaction?.notes||"";
  $("#transactionDialog").showModal();
}
function saveTransaction(event) {
  event.preventDefault();
  const id=$("#transactionId").value, record={id:id||crypto.randomUUID(),description:$("#description").value.trim(),amount:Number($("#amount").value),type:$("#transactionType").value,category:$("#transactionCategory").value,date:$("#transactionDate").value,notes:$("#notes").value.trim(),currency:"INR"};
  if(!record.description||!Number.isFinite(record.amount)||record.amount<=0||!record.date){showToast("Please enter valid transaction details.");return;}
  if(id) state.transactions=state.transactions.map(t=>t.id===id?record:t); else state.transactions.push(record);
  persist(); $("#transactionDialog").close(); render(); showToast(id?"Transaction updated":"Transaction added");
}
function addBudget(event) {
  event.preventDefault(); const category=$("#budgetCategory").value, limit=Number($("#budgetLimit").value);
  if(!Number.isFinite(limit)||limit<=0){showToast("Enter a valid budget amount.");return;}
  const existing=state.budgets.find(b=>b.category===category);
  if(existing)existing.limit=limit;else state.budgets.push({category,limit});
  persist(); $("#budgetDialog").close(); $("#budgetForm").reset(); render(); showToast("Budget saved");
}
function exportJSON() {
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),transactions:state.transactions,budgets:state.budgets},null,2)],{type:"application/json"});
  downloadBlob(blob,`fintrack-backup-${todayISO()}.json`); showToast("Backup downloaded");
}
function exportCSV() {
  const rows=[["Description","Type","Category","Date","Amount (INR)","Notes"],...state.transactions.map(t=>[t.description,t.type,t.category,t.date,t.amount,t.notes||""])];
  const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  downloadBlob(new Blob([csv],{type:"text/csv;charset=utf-8"}),`fintrack-transactions-${todayISO()}.csv`);
  showToast("CSV report downloaded");
}
function downloadBlob(blob,name) { const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url); }
async function refreshRates() {
  const status=$("#apiStatus"); status.textContent="Fetching latest rates…";
  try {
    // Frankfurter provides reference exchange rates. INR is the app's base currency.
    const response=await fetch("https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD,EUR,GBP");
    if(!response.ok)throw new Error(`API returned ${response.status}`);
    const data=await response.json(); state.rates={base:"INR",rates:{INR:1,...data.rates},date:data.date};
    localStorage.setItem(FX_KEY,JSON.stringify(state.rates));
    status.textContent=`Rates updated · ${data.date}`; $("#apiStatus").textContent=`Rates updated · ${data.date}`;
    render(); showToast("Exchange rates updated");
  } catch(error) {
    status.textContent="Could not fetch rates · using cached rates"; $("#apiStatus").textContent="Offline · cached rates (if available)";
    showToast("Exchange-rate API unavailable. Using cached rates.");
    console.warn("FX request failed:",error);
  }
}
function changeView(view) {
  state.activeView=view;
  $$(".view").forEach(el=>el.classList.toggle("active-view",el.id===`${view}View`));
  $$(".nav-link[data-view]").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
  $("#pageTitle").textContent={overview:"Overview",transactions:"Transactions",budgets:"Budgets",reports:"Reports"}[view]||"Overview";
  if(view==="reports")renderReports();
  $("#sidebar").classList.remove("open");
}
function bindEvents() {
  $("#transactionType").addEventListener("change",updateCategoryOptions);
  $("#transactionForm").addEventListener("submit",saveTransaction); $("#budgetForm").addEventListener("submit",addBudget);
  ["addTransactionTop","addTransactionPage"].forEach(id=>$("#"+id).addEventListener("click",()=>openTransaction()));
  $("#addBudgetBtn").addEventListener("click",()=>{$("#budgetForm").reset();$("#budgetDialog").showModal();});
  $$("[data-close]").forEach(b=>b.addEventListener("click",()=>$("#"+b.dataset.close).close()));
  $("#searchTransactions").addEventListener("input",renderTransactions);
  ["typeFilter","categoryFilter","monthFilter"].forEach(id=>$("#"+id).addEventListener("change",renderTransactions));
  $("#clearFilters").addEventListener("click",()=>{$("#searchTransactions").value="";$("#typeFilter").value="all";$("#categoryFilter").value="all";$("#monthFilter").value="";renderTransactions();});
  $("#transactionsTable").addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
    if(edit){const t=state.transactions.find(x=>x.id===edit.dataset.edit);if(t)openTransaction(t);}
    if(del&&confirm("Delete this transaction?")){state.transactions=state.transactions.filter(x=>x.id!==del.dataset.delete);persist();render();showToast("Transaction deleted");}
  });
  $("#budgetsGrid").addEventListener("click",e=>{const b=e.target.closest("[data-remove-budget]");if(b){state.budgets=state.budgets.filter(x=>x.category!==b.dataset.removeBudget);persist();render();showToast("Budget removed");}});
  $("#cashflowPeriod").addEventListener("change",renderCashflowChart);
  $("#currencySelect").addEventListener("change",e=>{state.currency=e.target.value;persist();render();});
  $("#refreshRates").addEventListener("click",refreshRates); $("#exportSidebar").addEventListener("click",exportJSON); $("#downloadCsv").addEventListener("click",exportCSV);
  $("#themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("fintrack_dark",document.body.classList.contains("dark")?"1":"0");});
  $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $$("[data-view]").forEach(link=>link.addEventListener("click",e=>{e.preventDefault();changeView(link.dataset.view);}));
  window.addEventListener("hashchange",()=>{const v=location.hash.replace("#","");if(["overview","transactions","budgets","reports"].includes(v))changeView(v);});
}
function seedDemoData() {
  if(state.transactions.length)return;
  const now=new Date(), y=now.getFullYear(), m=now.getMonth();
  const date=(offset,day)=>{const d=new Date(y,m-offset,day);return d.toISOString().slice(0,10);};
  state.transactions=[
    {id:crypto.randomUUID(),description:"Monthly salary",amount:65000,type:"income",category:"Salary",date:date(0,1),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Apartment rent",amount:14000,type:"expense",category:"Bills & Utilities",date:date(0,3),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Grocery shopping",amount:4200,type:"expense",category:"Food & Dining",date:date(0,5),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Freelance website",amount:8500,type:"income",category:"Freelance",date:date(0,8),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Metro & cab",amount:1800,type:"expense",category:"Transport",date:date(0,10),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Streaming subscription",amount:499,type:"expense",category:"Entertainment",date:date(0,12),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Online course",amount:2200,type:"expense",category:"Education",date:date(0,15),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Monthly salary",amount:62000,type:"income",category:"Salary",date:date(1,1),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Groceries",amount:3800,type:"expense",category:"Food & Dining",date:date(1,6),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Electricity bill",amount:1600,type:"expense",category:"Bills & Utilities",date:date(1,11),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Monthly salary",amount:62000,type:"income",category:"Salary",date:date(2,1),notes:"",currency:"INR"},
    {id:crypto.randomUUID(),description:"Weekend trip",amount:5200,type:"expense",category:"Travel",date:date(2,18),notes:"",currency:"INR"}
  ];
  state.budgets=[{category:"Food & Dining",limit:7000},{category:"Transport",limit:3500},{category:"Entertainment",limit:2000},{category:"Bills & Utilities",limit:18000}];
  persist();
}
function init() {
  loadData(); populateCategories();
  if(localStorage.getItem("fintrack_dark")==="1")document.body.classList.add("dark");
  if(!state.transactions.length)seedDemoData();
  bindEvents(); render();
  if(location.hash&&["overview","transactions","budgets","reports"].includes(location.hash.slice(1)))changeView(location.hash.slice(1));
  refreshRates();
}
document.addEventListener("DOMContentLoaded",init);
