const viewLabels = {
  overview: "Overview",
  assets: "My assets",
  activity: "Activity",
  accounts: "Accounts",
  settings: "Your details",
};

const rates = {
  BTC: { name: "Bitcoin", price: 67482.1, network: "Bitcoin" },
  ETH: { name: "Ethereum", price: 3028.44, network: "Ethereum" },
  USDC: { name: "USD Coin", price: 1, network: "Ethereum" },
  SOL: { name: "Solana", price: 154.72, network: "Solana" },
};

const holdings = {
  BTC: "0.1842 BTC",
  ETH: "2.8100 ETH",
  USDC: "4,075.50 USDC",
  SOL: "Not held",
};

const dailyChanges = {
  BTC: "+2.41%",
  ETH: "+1.86%",
  USDC: "+0.01%",
  SOL: "−0.63%",
};

const activityItems = [
  { id: "a1", title: "Received Bitcoin", symbol: "BTC", kind: "Deposit", type: "deposit", date: "Today, 10:42 AM", account: "Bitcoin · On-chain", amount: "+0.025 BTC", value: "+$1,687.05", status: "Complete", statusKey: "complete", glyph: "↓" },
  { id: "a2", title: "BTC → ETH", symbol: "BTC", kind: "Swap", type: "swap", date: "Yesterday, 4:18 PM", account: "Digital assets", amount: "−0.012 BTC", value: "−$809.79", status: "Complete", statusKey: "complete", glyph: "⇄" },
  { id: "a3", title: "Sent USD Coin", symbol: "USDC", kind: "Withdrawal", type: "withdrawal", date: "Nov 11, 2:05 PM", account: "Ethereum · On-chain", amount: "−500 USDC", value: "−$500.00", status: "Pending", statusKey: "pending", glyph: "↑" },
  { id: "a4", title: "Bought USD Coin", symbol: "USDC", kind: "Buy", type: "buy", date: "Nov 10, 9:34 AM", account: "USD account", amount: "+250 USDC", value: "+$250.00", status: "Complete", statusKey: "complete", glyph: "+" },
  { id: "a5", title: "Account transfer", symbol: "USD", kind: "Transfer", type: "transfer", date: "Nov 08, 3:21 PM", account: "Between your accounts", amount: "−$120.00", value: "$120.00", status: "Complete", statusKey: "complete", glyph: "↗" },
  { id: "a6", title: "Received Ethereum", symbol: "ETH", kind: "Deposit", type: "deposit", date: "Nov 06, 11:17 AM", account: "Ethereum · On-chain", amount: "+0.32 ETH", value: "+$969.10", status: "Complete", statusKey: "complete", glyph: "↓" },
  { id: "a7", title: "Sent Bitcoin", symbol: "BTC", kind: "Withdrawal", type: "withdrawal", date: "Nov 04, 8:51 AM", account: "Bitcoin · On-chain", amount: "−0.008 BTC", value: "−$539.86", status: "Pending", statusKey: "pending", glyph: "↑" },
  { id: "a8", title: "Sold Ethereum", symbol: "ETH", kind: "Sell", type: "sell", date: "Nov 02, 1:06 PM", account: "USD account", amount: "−0.20 ETH", value: "+$605.69", status: "Complete", statusKey: "complete", glyph: "−" },
];

const transactionTypes = {
  deposit: { title: "Deposit crypto", intro: "Choose an asset and network to view your sample deposit details.", button: "View deposit details" },
  transfer: { title: "Transfer between accounts", intro: "Move sample funds to another Savant account. No funds will be moved in this preview.", button: "Review transfer" },
  withdraw: { title: "Withdraw crypto", intro: "Send crypto to an external wallet. Recipient information may be required for eligible transfers.", button: "Review withdrawal" },
  buy: { title: "Buy crypto", intro: "Preview a fiat-to-crypto purchase using an illustrative exchange rate.", button: "Review purchase" },
  sell: { title: "Sell crypto", intro: "Preview a crypto-to-fiat sale into your USD account.", button: "Review sale" },
  swap: { title: "Swap assets", intro: "Preview an exchange between crypto assets at an indicative sample rate.", button: "Review swap" },
};

const transactionDialog = document.querySelector("#transaction-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogKicker = document.querySelector("#dialog-kicker");
const dialogProgress = document.querySelector(".dialog-progress");
const dialogContent = document.querySelector("#dialog-content");
const toastRegion = document.querySelector(".toast-region");
let currentAction = "";
let currentStep = 0;
let currentDetails = {};

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function setView(viewName) {
  const panel = document.querySelector(`[data-view-panel="${viewName}"]`);
  if (!panel) return;

  document.querySelectorAll("[data-view-panel]").forEach((view) => {
    view.hidden = view !== panel;
    view.classList.toggle("is-visible", view === panel);
  });
  document.querySelectorAll(".app-nav-link").forEach((link) => {
    const active = link.dataset.view === viewName;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const title = viewLabels[viewName] ?? "Overview";
  document.querySelector("#topbar-title").textContent = title;
  document.title = `${title} — Savant demo`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function assetOptions(excluded = "") {
  return Object.entries(rates)
    .filter(([symbol]) => symbol !== excluded)
    .map(([symbol, asset]) => `<option value="${symbol}">${asset.name} (${symbol})</option>`)
    .join("");
}

function field(label, name, control, hint = "") {
  return `<div class="form-field"><label for="field-${name}">${label}</label>${control}${hint ? `<span class="field-hint">${hint}</span>` : ""}</div>`;
}

function selectField(label, name, options, hint = "") {
  return field(label, name, `<div class="field-select-wrap"><select id="field-${name}" name="${name}" required>${options}</select></div>`, hint);
}

function amountField(label = "Amount") {
  return field(
    label,
    "amount",
    '<input id="field-amount" name="amount" type="number" min="0.01" step="any" inputmode="decimal" placeholder="0.00" required>',
    "Enter an amount greater than zero.",
  );
}

function actionFields(action) {
  if (action === "deposit") {
    return `${selectField("Asset", "asset", assetOptions())}${selectField("Network", "network", '<option value="Bitcoin">Bitcoin</option><option value="Ethereum">Ethereum</option><option value="Solana">Solana</option>', "Only send an asset using a network supported for that asset.")}`;
  }
  if (action === "transfer") {
    return `${selectField("Asset", "asset", assetOptions())}${amountField()}${field("Recipient account email", "recipient", '<input id="field-recipient" name="recipient" type="email" placeholder="name@example.com" autocomplete="email" required>')}${field("Note (optional)", "note", '<input id="field-note" name="note" type="text" maxlength="80" placeholder="What is this transfer for?">')}`;
  }
  if (action === "withdraw") {
    return `${selectField("Asset", "asset", assetOptions())}${amountField()}${selectField("Network", "network", '<option value="Bitcoin">Bitcoin</option><option value="Ethereum">Ethereum</option><option value="Solana">Solana</option>')}${field("Destination wallet address", "address", '<input id="field-address" name="address" type="text" autocomplete="off" placeholder="Enter the recipient wallet address" required>')}<label class="checkbox-field"><input type="checkbox" name="hosted" id="hosted-checkbox"><span>The recipient address belongs to an exchange or hosted wallet.</span></label><div class="travel-rule-panel" id="travel-rule-panel" hidden><h3>Recipient information</h3><p>For eligible transfers, applicable requirements may require information about the sender, recipient and destination service. Only provide information you are authorized to share.</p>${field("Originator name", "originator", '<input id="field-originator" name="originator" value="Jordan Davis" readonly>')}<div class="field-row">${field("Recipient full name", "recipientName", '<input id="field-recipientName" name="recipientName" type="text" autocomplete="off" placeholder="Full name" disabled required>')}${field("Destination country", "country", '<select id="field-country" name="country" disabled required><option value="">Select</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="CA">Canada</option><option value="other">Other</option></select>')}</div>${field("Recipient exchange or provider", "provider", '<input id="field-provider" name="provider" type="text" placeholder="Provider name" disabled required>')}<label class="checkbox-field"><input type="checkbox" name="data-confirm" id="data-confirm" disabled required><span>I confirm these details are accurate and understand they may be shared to meet applicable transfer requirements.</span></label></div>`;
  }
  if (action === "buy") {
    return `${amountField("Spend amount (USD)")}${selectField("Buy", "asset", assetOptions(), "Illustrative quote only; final prices and fees may vary.")}${selectField("Payment method", "payment", '<option value="bank">Bank transfer ···· 2841</option><option value="card">Debit card ···· 1092</option>')}`;
  }
  if (action === "sell") {
    return `${amountField("Amount to sell")}${selectField("Sell", "asset", assetOptions())}${field("Deposit proceeds into", "destination", '<input id="field-destination" name="destination" value="USD account ···· 2841" readonly required>')}`;
  }
  return `${selectField("From", "asset", assetOptions())}${amountField("Amount to swap")}${selectField("To", "toAsset", assetOptions("BTC"), "Indicative exchange rate shown on the next step.")}`;
}

function setProgress(step, labels = ["DETAILS", "REVIEW", "DONE"]) {
  currentStep = step;
  const dots = [...dialogProgress.querySelectorAll(".step-dot")];
  const label = dialogProgress.querySelector(".progress-label");
  dots.forEach((dot, index) => {
    dot.classList.toggle("is-current", index === step);
    dot.classList.toggle("is-done", index < step);
  });
  label.textContent = labels[step] ?? "DONE";
}

function startAction(action) {
  const config = transactionTypes[action];
  if (!config) return;
  currentAction = action;
  currentDetails = {};
  dialogKicker.textContent = "YOUR EXCHANGE";
  dialogTitle.textContent = config.title;
  dialogProgress.hidden = false;
  setProgress(0);
  dialogContent.innerHTML = `
    <p class="dialog-intro">${config.intro}</p>
    <form id="transaction-form" novalidate>
      ${actionFields(action)}
      <p class="dialog-disclaimer">Preview only. This prototype does not connect to a wallet, bank or exchange service.</p>
      <div class="dialog-actions"><button class="dialog-secondary" type="button" data-dialog-cancel>Cancel</button><button class="dialog-primary" type="submit">${config.button} <span aria-hidden="true">→</span></button></div>
    </form>`;
  if (!transactionDialog.open) transactionDialog.showModal();
  dialogContent.querySelector("form").addEventListener("submit", handleDetailsSubmit);
  dialogContent.querySelector("[data-dialog-cancel]").addEventListener("click", closeDialog);
  dialogContent.querySelector("#hosted-checkbox")?.addEventListener("change", (event) => {
    const panel = dialogContent.querySelector("#travel-rule-panel");
    panel.hidden = !event.currentTarget.checked;
    panel.querySelectorAll("input, select").forEach((control) => {
      control.disabled = !event.currentTarget.checked;
      if (control.type === "checkbox") control.checked = false;
    });
  });
  dialogContent.querySelector("#field-asset")?.addEventListener("change", (event) => {
    const network = dialogContent.querySelector("#field-network");
    if (network && action === "deposit") {
      const suggested = rates[event.currentTarget.value].network;
      network.value = [...network.options].some((option) => option.value === suggested) ? suggested : "Ethereum";
    }
  });
  dialogContent.querySelector("#field-toAsset")?.addEventListener("change", (event) => {
    const assetSelect = dialogContent.querySelector("#field-asset");
    if (assetSelect.value === event.currentTarget.value) {
      assetSelect.value = Object.keys(rates).find((symbol) => symbol !== event.currentTarget.value && symbol !== "USDC");
    }
  });
}

function closeDialog() {
  if (transactionDialog.open) transactionDialog.close();
}

function handleDetailsSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  currentDetails = Object.fromEntries(new FormData(form).entries());
  if (currentAction === "deposit") {
    renderDepositAddress();
    return;
  }
  renderReview();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

function calculateEstimate() {
  const amount = Number(currentDetails.amount || 0);
  const asset = rates[currentDetails.asset];
  const value = currentAction === "buy" ? amount : amount * asset.price;
  const feeRate = currentAction === "buy" || currentAction === "sell" ? 0.015 : 0;
  const fee = currentAction === "withdraw" ? 2.5 : value * feeRate;
  return { amount, value, fee, asset };
}

function summaryRow(label, value) {
  const row = document.createElement("div");
  const labelNode = document.createElement("span");
  const valueNode = document.createElement("strong");
  labelNode.textContent = label;
  valueNode.textContent = value;
  row.append(labelNode, valueNode);
  return row;
}

function renderReview() {
  const estimate = calculateEstimate();
  setProgress(1);
  dialogContent.replaceChildren();

  const intro = document.createElement("p");
  intro.className = "dialog-intro";
  intro.textContent = "Review the sample details below. No funds will be moved.";
  dialogContent.append(intro);

  const summary = document.createElement("div");
  summary.className = "quote-summary";
  const rows = [
    ["Action", transactionTypes[currentAction].title],
    ["Asset", `${estimate.asset.name} (${currentDetails.asset})`],
    ["Amount", `${currentDetails.amount} ${currentAction === "buy" ? "USD" : currentDetails.asset}`],
  ];
  if (currentAction === "swap") {
    const output = (estimate.value / rates[currentDetails.toAsset].price).toFixed(6);
    rows.push(["Receive (indicative)", `${output} ${currentDetails.toAsset}`]);
    rows.push(["Sample exchange rate", `1 ${currentDetails.asset} ≈ ${(estimate.asset.price / rates[currentDetails.toAsset].price).toFixed(4)} ${currentDetails.toAsset}`]);
  } else if (currentAction === "buy") {
    rows.push(["Receive (indicative)", `${(estimate.value / estimate.asset.price).toFixed(6)} ${currentDetails.asset}`]);
    rows.push(["Payment method", currentDetails.payment === "card" ? "Debit card ···· 1092" : "Bank transfer ···· 2841"]);
  } else if (currentAction === "sell") {
    rows.push(["Receive (indicative)", formatCurrency(estimate.value - estimate.fee)]);
    rows.push(["Destination", currentDetails.destination]);
  } else if (currentAction === "withdraw") {
    rows.push(["Network", currentDetails.network]);
    rows.push(["Destination", currentDetails.address]);
    if (currentDetails.hosted) rows.push(["Recipient", currentDetails.recipientName]);
  } else if (currentAction === "transfer") {
    rows.push(["Recipient", currentDetails.recipient]);
  }
  rows.push(["Estimated fee", currentAction === "transfer" ? "No fee (sample)" : formatCurrency(estimate.fee)]);
  rows.forEach(([label, value]) => summary.append(summaryRow(label, value)));
  dialogContent.append(summary);

  const disclaimer = document.createElement("p");
  disclaimer.className = "dialog-disclaimer";
  disclaimer.textContent = "Indicative sample values only. Actual fees, rates, network availability and required recipient information depend on the service and applicable rules.";
  dialogContent.append(disclaimer);

  const actions = document.createElement("div");
  actions.className = "dialog-actions";
  actions.innerHTML = '<button class="dialog-secondary" type="button" data-step-back>← Edit details</button><button class="dialog-primary" type="button" data-simulate-confirm>Confirm demo <span aria-hidden="true">→</span></button>';
  dialogContent.append(actions);
  dialogContent.querySelector("[data-step-back]").addEventListener("click", () => {
    const savedDetails = { ...currentDetails };
    startAction(currentAction);
    currentDetails = savedDetails;
    const hosted = dialogContent.querySelector("#hosted-checkbox");
    if (hosted && savedDetails.hosted) {
      hosted.checked = true;
      hosted.dispatchEvent(new Event("change", { bubbles: true }));
    }
    Object.entries(savedDetails).forEach(([name, value]) => {
      const control = dialogContent.querySelector(`[name="${CSS.escape(name)}"]`);
      if (!control || control.readOnly || name === "hosted") return;
      if (control.type === "checkbox") control.checked = true;
      else control.value = value;
    });
  });
  dialogContent.querySelector("[data-simulate-confirm]").addEventListener("click", renderSuccess);
}

function renderDepositAddress() {
  setProgress(1, ["ASSET", "ADDRESS", "DONE"]);
  const symbol = currentDetails.asset;
  const network = currentDetails.network;
  dialogContent.innerHTML = `
    <p class="dialog-intro">This sample address is not connected to a wallet or account. Do not send funds.</p>
    <div class="quote-summary">${[
      summaryRow("Asset", `${rates[symbol].name} (${symbol})`),
      summaryRow("Network", network),
    ].map((node) => node.outerHTML).join("")}</div>
    <div class="sample-address"><span>SAMPLE DEPOSIT ADDRESS · NOT VALID</span><strong>SAVANT-${symbol}-DEMO-ADDRESS</strong><button type="button" data-copy-sample="SAVANT-${symbol}-DEMO-ADDRESS">Copy sample address</button></div>
    <p class="dialog-disclaimer">Sample only. This address is deliberately non-functional. Always verify an address and network in the live product before making a deposit.</p>
    <div class="dialog-actions dialog-actions-end"><button class="dialog-primary" type="button" data-dialog-done>Done <span aria-hidden="true">✓</span></button></div>`;
  dialogContent.querySelector("[data-copy-sample]").addEventListener("click", copyValue);
  dialogContent.querySelector("[data-dialog-done]").addEventListener("click", closeDialog);
}

function renderSuccess() {
  setProgress(2);
  dialogContent.innerHTML = `
    <div class="result-state"><span class="result-icon" aria-hidden="true">✓</span><h3>Demo action complete</h3><p>This was a simulation only. No transaction was created and no funds were moved.</p><span class="result-reference">Preview reference · DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}</span></div>
    <p class="dialog-disclaimer">In the live exchange, you would receive a transaction status and reference after the service confirms the action.</p>
    <div class="dialog-actions dialog-actions-end"><button class="dialog-primary" type="button" data-dialog-done>Done <span aria-hidden="true">✓</span></button></div>`;
  dialogContent.querySelector("[data-dialog-done]").addEventListener("click", closeDialog);
}

function showAssetDetails(symbol) {
  const asset = rates[symbol];
  if (!asset) return;
  const heldAmount = holdings[symbol];
  const numericAmount = Number(heldAmount.replace(/[^\d.]/g, "")) || 0;
  const value = numericAmount ? formatCurrency(numericAmount * asset.price) : "$0.00";
  const iconClass = symbol === "BTC" ? "coin-btc" : symbol === "ETH" ? "coin-eth" : symbol === "USDC" ? "coin-usdc" : "coin-sol";
  const icon = symbol === "BTC" ? "₿" : symbol === "ETH" ? "◆" : symbol === "USDC" ? "$" : "◎";

  dialogKicker.textContent = "ASSET OVERVIEW · SAMPLE";
  dialogTitle.textContent = `${asset.name} (${symbol})`;
  dialogProgress.hidden = true;
  dialogContent.innerHTML = `
    <div class="asset-detail-hero"><span class="coin-icon ${iconClass}">${icon}</span><div><strong>${formatCurrency(asset.price)}</strong><small>Indicative price · <span class="${dailyChanges[symbol].startsWith("+") ? "text-positive" : "text-negative"}">${dailyChanges[symbol]} today</span></small></div></div>
    <div class="quote-summary">${[
      summaryRow("Your holdings", heldAmount),
      summaryRow("Estimated value", value),
      summaryRow("Sample network", asset.network),
    ].map((node) => node.outerHTML).join("")}</div>
    <p class="dialog-disclaimer">Illustrative sample data only. Prices, available networks and balances are not live.</p>
    <div class="dialog-actions asset-detail-actions"><button class="dialog-secondary" type="button" data-asset-action="deposit">Deposit</button><button class="dialog-primary" type="button" data-asset-action="swap">Swap ${symbol}</button></div>`;
  transactionDialog.showModal();
  dialogContent.querySelectorAll("[data-asset-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.assetAction;
      closeDialog();
      startAction(action);
      const assetSelect = dialogContent.querySelector("#field-asset");
      if (assetSelect && [...assetSelect.options].some((option) => option.value === symbol)) {
        assetSelect.value = symbol;
        assetSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (action === "swap") {
        const toAsset = dialogContent.querySelector("#field-toAsset");
        if (toAsset && [...toAsset.options].some((option) => option.value !== symbol)) {
          toAsset.value = [...toAsset.options].find((option) => option.value !== symbol).value;
        }
      }
    });
  });
}

function showTokenizedInfo() {
  dialogKicker.textContent = "ASSET DISCOVERY";
  dialogTitle.textContent = "Tokenized assets";
  dialogProgress.hidden = true;
  dialogContent.innerHTML = `
    <p class="dialog-intro">A preview of how tokenized asset discovery can work in Savant.</p>
    <div class="quote-summary">${[
      summaryRow("What to expect", "Product and issuer information"),
      summaryRow("Before you proceed", "Eligibility and jurisdiction checks"),
      summaryRow("Review carefully", "Fees, terms and risk disclosures"),
    ].map((node) => node.outerHTML).join("")}</div>
    <p class="dialog-disclaimer">No tokenized products are offered in this prototype. Availability, eligibility and product terms would need to be confirmed in the live service.</p>
    <div class="dialog-actions dialog-actions-end"><button class="dialog-primary" type="button" data-dialog-done>Got it</button></div>`;
  transactionDialog.showModal();
  dialogContent.querySelector("[data-dialog-done]").addEventListener("click", closeDialog);
}

function copyValue(event) {
  const value = event.currentTarget.dataset.copy ?? event.currentTarget.dataset.copySample;
  if (!value) return;
  if (!navigator.clipboard?.writeText) {
    showToast("Clipboard access is unavailable in this preview.");
    return;
  }
  navigator.clipboard.writeText(value)
    .then(() => showToast("Sample value copied. Do not use it to send funds."))
    .catch(() => showToast("Could not copy the sample value. Select and copy it manually."));
}

function statusClass(status) {
  return status === "Complete" ? "status-complete" : status === "Pending" ? "status-pending" : "status-failed";
}

function activityIcon(item) {
  const symbolClass = item.symbol === "BTC" ? "coin-btc" : item.symbol === "ETH" ? "coin-eth" : item.symbol === "USDC" ? "coin-usdc" : "coin-sol";
  const symbol = item.symbol === "BTC" ? "₿" : item.symbol === "ETH" ? "◆" : item.symbol === "USDC" ? "$" : item.symbol === "SOL" ? "◎" : "↗";
  return `<span class="coin-icon ${symbolClass}">${symbol}</span>`;
}

function renderActivity() {
  const body = document.querySelector("#activity-rows");
  const status = document.querySelector(".activity-tab.is-selected")?.dataset.activityFilter ?? "all";
  const type = document.querySelector("#type-filter").value;
  const search = document.querySelector("#activity-search").value.trim().toLowerCase();
  const filtered = activityItems.filter((item) => {
    const statusMatches = status === "all" || item.statusKey === status;
    const typeMatches = type === "all" || item.type === type;
    const searchMatches = `${item.title} ${item.kind} ${item.symbol} ${item.account} ${item.amount} ${item.date}`.toLowerCase().includes(search);
    return statusMatches && typeMatches && searchMatches;
  });

  body.innerHTML = filtered.map((item) => `
    <tr data-activity="${item.id}">
      <td><div class="activity-type">${activityIcon(item)}<span><strong>${item.title}</strong><small>${item.kind}</small></span></div></td>
      <td>${item.date}</td>
      <td class="activity-account">${item.account}</td>
      <td class="activity-amount-cell">${item.amount}<br><span class="${item.amount.startsWith("+") ? "text-positive" : ""}">${item.value}</span></td>
      <td><span class="status-tag ${statusClass(item.status)}">${item.status}</span></td>
      <td class="data-row-action"><button type="button" class="row-arrow" data-activity="${item.id}" aria-label="View ${item.title} details">↗</button></td>
    </tr>`).join("");
  document.querySelector("#activity-empty").hidden = filtered.length !== 0;
  document.querySelector(".activity-table").hidden = filtered.length === 0;
}

function showActivityDetails(id) {
  const item = activityItems.find((activity) => activity.id === id);
  if (!item) return;
  dialogKicker.textContent = "SAMPLE TRANSACTION";
  dialogTitle.textContent = item.title;
  dialogProgress.hidden = true;
  dialogContent.innerHTML = `
    <div class="quote-summary">${[
      summaryRow("Type", item.kind),
      summaryRow("Date", item.date),
      summaryRow("Account", item.account),
      summaryRow("Amount", item.amount),
      summaryRow("Indicative value", item.value),
      summaryRow("Status", item.status),
      summaryRow("Reference", `DEMO-${item.id.toUpperCase()}`),
    ].map((node) => node.outerHTML).join("")}</div>
    <p class="dialog-disclaimer">Illustrative activity only. This is not a real transaction or blockchain status.</p>
    <div class="dialog-actions dialog-actions-end"><button class="dialog-primary" type="button" data-dialog-done>Close</button></div>`;
  transactionDialog.showModal();
  dialogContent.querySelector("[data-dialog-done]").addEventListener("click", closeDialog);
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => startAction(button.dataset.action));
});

document.querySelectorAll("[data-asset]").forEach((button) => {
  button.addEventListener("click", () => showAssetDetails(button.dataset.asset));
});

document.querySelector(".dialog-close").addEventListener("click", closeDialog);
transactionDialog.addEventListener("click", (event) => {
  if (event.target === transactionDialog) closeDialog();
});
transactionDialog.addEventListener("close", () => {
  dialogProgress.hidden = false;
});

document.querySelector("[data-open-tokenized]").addEventListener("click", showTokenizedInfo);
document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", copyValue));
document.querySelectorAll(".mini-activity[data-activity]").forEach((button) => {
  button.addEventListener("click", () => showActivityDetails(button.dataset.activity));
});

document.querySelector("#activity-rows").addEventListener("click", (event) => {
  const row = event.target.closest("[data-activity]");
  if (row) showActivityDetails(row.dataset.activity);
});

document.querySelectorAll("[data-activity-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-activity-filter]").forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("is-selected", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
    renderActivity();
  });
});
document.querySelector("#activity-search").addEventListener("input", renderActivity);
document.querySelector("#type-filter").addEventListener("change", renderActivity);
document.querySelector("[data-reset-activity]").addEventListener("click", () => {
  document.querySelector("#activity-search").value = "";
  document.querySelector("#type-filter").value = "all";
  document.querySelector('[data-activity-filter="all"]').click();
});

document.querySelectorAll("[data-filter-table]").forEach((input) => {
  input.addEventListener("input", () => {
    const table = document.querySelector(`#${input.dataset.filterTable}`);
    const query = input.value.trim().toLowerCase();
    table.querySelectorAll("tbody tr").forEach((row) => {
      row.hidden = !row.dataset.searchable.toLowerCase().includes(query);
    });
  });
});

document.querySelector("#global-search").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    setView("activity");
    const search = document.querySelector("#activity-search");
    search.value = event.currentTarget.value;
    renderActivity();
    search.focus();
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#global-search").focus();
  }
});

document.querySelector(".balance-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const isHidden = button.getAttribute("aria-pressed") !== "true";
  document.querySelector(".total-card").classList.toggle("balance-hidden", isHidden);
  button.setAttribute("aria-pressed", String(isHidden));
  button.querySelector(".sr-only").textContent = isHidden ? "Show balance" : "Hide balance";
});

document.querySelector(".demo-banner-close").addEventListener("click", () => {
  document.querySelector(".demo-banner").remove();
});

document.querySelector(".notification-button").addEventListener("click", () => {
  showToast("No notifications in this preview.");
});

document.querySelector("[data-profile-edit]").addEventListener("click", () => {
  showToast("Profile editing will be connected to the account service.");
});

document.querySelector("#app-year").textContent = String(new Date().getFullYear());
renderActivity();

const initialView = new URLSearchParams(window.location.search).get("view");
if (initialView && viewLabels[initialView]) setView(initialView);
