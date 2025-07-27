let pdfTitle = "Electrical Quotation";
let pdfFilename = "quotation.pdf";

const serviceDropdown = document.getElementById("serviceDropdown");
const servicePrice = document.getElementById("servicePrice");
const quantityInput = document.getElementById("quantity");
const tableBody = document.querySelector("#quotationTable tbody");
const grandTotalEl = document.getElementById("grandTotal");
const modal = document.getElementById("serviceManager");
const billHeading = document.getElementById("billHeading");
const outputHeading = document.getElementById("outputHeading");

let quotationItems = [];
let grandTotal = 0;

const perMeterServices = [
  "wiring",
  "cctv cable (cat6) wiring",
  "cctv 3 in 1 cable wiring"
];

let services = JSON.parse(localStorage.getItem("services")) || [
  { name: "Wiring" }, { name: "Fan Installation" }, { name: "Down Light Installation" },
  { name: "Tube Light Installation" }, { name: "2 Model Box with Wiring" },
  { name: "4 Model Box with Wiring" }, { name: "6 Model Box with Wiring" },
  { name: "8 Model Box with Wiring" }, { name: "12 Model Box with Wiring" },
  { name: "16 Model Box with Wiring" }, { name: "18 Model Box with Wiring" },
  { name: "DB Box" }, { name: "Cutting + Chipping Work" }, { name: "Profile Light Installation" },
  { name: "Cable Laying" }, { name: "Panel Board Work" }, { name: "Meter Box Installation" },
  { name: "Labour Charge" }, { name: "CCTV Cable (CAT6) Wiring" },
  { name: "CCTV 3 in 1 Cable Wiring" }, { name: "Material with Labour Charge" }
];

updateServiceDropdown();

function updateServiceDropdown() {
  serviceDropdown.innerHTML = "";
  services.forEach(service => {
    const option = document.createElement("option");
    option.value = service.name;
    option.textContent = service.name;
    serviceDropdown.appendChild(option);
  });
  servicePrice.value = "";
}

serviceDropdown.addEventListener("change", () => {
  servicePrice.value = "";
  const selected = serviceDropdown.value.toLowerCase();
  const isPerMeter = perMeterServices.includes(selected);
  document.getElementById("priceUnit").textContent = isPerMeter ? "(₹/m)" : "(₹)";
});

document.getElementById("quotationForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const serviceName = serviceDropdown.value;
  const rate = parseFloat(servicePrice.value);
  const quantity = parseInt(quantityInput.value);
  if (!serviceName || isNaN(rate) || isNaN(quantity)) return;

  const item = {
    id: Date.now(),
    serviceName,
    quantity,
    rate,
    total: rate * quantity
  };
  quotationItems.push(item);
  renderTable();
  this.reset();
  servicePrice.value = "";
});

function renderTable() {
  tableBody.innerHTML = "";
  grandTotal = 0;
  quotationItems.forEach(item => {
    grandTotal += item.total;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.serviceName}</td>
      <td><input type="number" value="${item.quantity}" min="1" class="update-qty" data-id="${item.id}" /></td>
      <td><input type="number" value="${item.rate}" min="0" class="update-rate" data-id="${item.id}" /></td>
      <td>${item.total.toFixed(2)}</td>
      <td><button onclick="deleteItem(${item.id})">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });
  grandTotalEl.textContent = `Grand Total: ₹${grandTotal.toFixed(2)}`;
}

tableBody.addEventListener("input", function (e) {
  const id = parseInt(e.target.dataset.id);
  const item = quotationItems.find(i => i.id === id);
  if (!item) return;

  if (e.target.classList.contains("update-qty")) {
    const val = parseInt(e.target.value);
    if (val >= 1) item.quantity = val;
  }
  if (e.target.classList.contains("update-rate")) {
    const val = parseFloat(e.target.value);
    if (val >= 0) item.rate = val;
  }
  item.total = item.quantity * item.rate;
  renderTable();
});

function deleteItem(id) {
  quotationItems = quotationItems.filter(i => i.id !== id);
  renderTable();
}

document.getElementById("downloadPDF").addEventListener("click", function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const rowHeight = 10;
  const colWidths = [80, 20, 30, 30];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = (pageWidth - tableWidth) / 2;
  let startY = 20;

  doc.setFontSize(16);
  doc.text(pdfTitle, pageWidth / 2, startY, { align: "center" });
  startY += 15;

  doc.setFontSize(12);
  doc.text("NAME: Chandrasekaran", 20, startY);
  startY += 10;
  doc.text("Contact: 9986625431", 20, startY);
  startY += 15;

  doc.setFontSize(14);
  doc.text(billHeading.textContent, pageWidth / 2, startY, { align: "center" });
  startY += 10;

  const headers = ["Service", "Qty", "Rate", "Total"];
  let currentX = startX;
  headers.forEach((header, i) => {
    doc.rect(currentX, startY, colWidths[i], rowHeight);
    doc.text(header, currentX + colWidths[i] / 2, startY + 7, { align: "center" });
    currentX += colWidths[i];
  });

  startY += rowHeight;
  quotationItems.forEach(item => {
    if (startY + rowHeight > 280) {
      doc.addPage();
      startY = 20;
    }
    currentX = startX;
    const isPerMeter = perMeterServices.includes(item.serviceName.toLowerCase());
    const rateValue = Math.round(item.rate);
    const rateLabel = isPerMeter ? `${item.rate.toFixed(2)} /m` : `${item.rate.toFixed(2)}`;
    const cells = [item.serviceName, String(item.quantity), rateLabel, item.total.toFixed(2)];
    cells.forEach((cell, i) => {
      doc.rect(currentX, startY, colWidths[i], rowHeight);
      const align = i === 0 ? "left" : "right";
      doc.text(cell, currentX + (align === "left" ? 3 : colWidths[i] - 3), startY + 7, { align });
      currentX += colWidths[i];
    });
    startY += rowHeight;
  });

  const spanWidth = colWidths[0] + colWidths[1] + colWidths[2];
  doc.rect(startX, startY, spanWidth, rowHeight);
  doc.rect(startX + spanWidth, startY, colWidths[3], rowHeight);
  doc.setFontSize(14);
  doc.text("Grand Total", startX + 3, startY + 7);
  doc.text(grandTotal.toFixed(2), startX + spanWidth + colWidths[3] - 3, startY + 7, { align: "right" });

  doc.save(pdfFilename);
});

document.getElementById("setQuotationTitle").addEventListener("click", () => {
  billHeading.textContent = "Quotation Bill";
  outputHeading.textContent = "Electrical Quotation";
  pdfTitle = "Electrical Quotation";
  pdfFilename = "quotation.pdf";
});

document.getElementById("setBillTitle").addEventListener("click", () => {
  billHeading.textContent = "Electrical Work Bill";
  outputHeading.textContent = "Electrical Quotation - Bill";
  pdfTitle = "Electrical Work Bill";
  pdfFilename = "work-bill.pdf";
});

function toggleServiceManager() {
  modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}

function addNewService() {
  const name = document.getElementById("newServiceName").value.trim();
  if (!name) return alert("Enter a valid service name");
  services.push({ name });
  localStorage.setItem("services", JSON.stringify(services));
  updateServiceDropdown();
  document.getElementById("newServiceName").value = "";
  toggleServiceManager();
}
