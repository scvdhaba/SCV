let rawMaterials = JSON.parse(localStorage.getItem('hotel_raw_materials')) || [];
let menuDishes = JSON.parse(localStorage.getItem('hotel_menu_dishes')) || [];
let stockLogs = JSON.parse(localStorage.getItem('hotel_stock_logs')) || [];
let invoices = JSON.parse(localStorage.getItem('hotel_invoices')) || [];

let cart = [];
let currentDiscount = 0;
let currentReportType = 'daily';

// Credentials configuration
const ADMIN_USER = "SCV";
const ADMIN_PASS = "Sai7788";

function saveData() {
    localStorage.setItem('hotel_raw_materials', JSON.stringify(rawMaterials));
    localStorage.setItem('hotel_menu_dishes', JSON.stringify(menuDishes));
    localStorage.setItem('hotel_stock_logs', JSON.stringify(stockLogs));
    localStorage.setItem('hotel_invoices', JSON.stringify(invoices));
}

// ================= AUTHENTICATION =================

function handleLogin() {
    let u = document.getElementById('login-user').value.trim();
    let p = document.getElementById('login-pass').value.trim();

    if (u === ADMIN_USER && p === ADMIN_PASS) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        switchDashboard('billing');
    } else {
        alert("Invalid username or password! (Default: admin / 1234)");
    }
}

function handleLogout() {
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

// ================= DASHBOARD NAVIGATION =================

function switchDashboard(name) {
    document.getElementById('billing-dashboard').style.display = name === 'billing' ? 'block' : 'none';
    document.getElementById('menu-dashboard').style.display = name === 'menu' ? 'block' : 'none';
    document.getElementById('inventory-dashboard').style.display = name === 'inventory' ? 'block' : 'none';

    document.getElementById('tab-billing').classList.toggle('active-tab', name === 'billing');
    document.getElementById('tab-menu').classList.toggle('active-tab', name === 'menu');
    document.getElementById('tab-inventory').classList.toggle('active-tab', name === 'inventory');
    
    if (name === 'billing') {
        renderBillingMenu();
        renderSalesReports('daily');
    }
    if (name === 'menu') {
        renderMenuDashboard();
    }
    if (name === 'inventory') {
        renderInventoryDashboard();
        renderStockReports('daily');
    }
}

// ================= ITEM MASTER (CRUD) =================

function saveRawMaterial() {
    let id = document.getElementById('edit-raw-id').value;
    let name = document.getElementById('raw-name').value.trim();
    let unit = document.getElementById('raw-unit').value.trim();
    let minLimit = parseFloat(document.getElementById('raw-min').value);

    if (!name || !unit || isNaN(minLimit)) {
        alert("Please fill out all Item Master fields correctly.");
        return;
    }

    if (id) {
        let item = rawMaterials.find(r => r.id == id);
        if (item) {
            item.name = name;
            item.unit = unit;
            item.minLimit = minLimit;
            alert("Raw material updated successfully!");
        }
    } else {
        rawMaterials.push({ id: Date.now(), name, unit, qty: 0, minLimit });
        alert("Raw material added to Item Master!");
    }

    saveData();
    cancelEditRaw();
    renderInventoryDashboard();
}

function editRawMaterial(id) {
    let item = rawMaterials.find(r => r.id == id);
    if (item) {
        document.getElementById('edit-raw-id').value = item.id;
        document.getElementById('raw-name').value = item.name;
        document.getElementById('raw-unit').value = item.unit;
        document.getElementById('raw-min').value = item.minLimit;
        
        document.getElementById('master-form-title').innerText = "Modify Raw Material";
        document.getElementById('master-btn').innerText = "Update Item";
        document.getElementById('cancel-edit-btn').style.display = 'block';
    }
}

function cancelEditRaw() {
    document.getElementById('edit-raw-id').value = '';
    document.getElementById('raw-name').value = '';
    document.getElementById('raw-unit').value = '';
    document.getElementById('raw-min').value = '';
    
    document.getElementById('master-form-title').innerText = "1. Item Master (Add Raw Material)";
    document.getElementById('master-btn').innerText = "Add to Item Master";
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

function deleteRawMaterial(id) {
    if (confirm("Are you sure you want to delete this raw material?")) {
        rawMaterials = rawMaterials.filter(r => r.id != id);
        saveData();
        renderInventoryDashboard();
    }
}

// ================= STOCK IN / OUT =================

function adjustStock(type) {
    let id = document.getElementById('select-raw-item').value;
    let val = parseFloat(document.getElementById('trans-qty').value);

    if (!id || isNaN(val) || val <= 0) {
        alert("Select an item and enter a valid quantity.");
        return;
    }

    let item = rawMaterials.find(r => r.id == id);
    if (item) {
        if (type === 'in') {
            item.qty += val;
        } else {
            if (item.qty < val) {
                alert("Error: Cannot stock out more than current stock!");
                return;
            }
            item.qty -= val;
        }

        stockLogs.push({
            date: new Date().toISOString().split('T')[0],
            itemName: item.name,
            type: type.toUpperCase(),
            qty: val,
            unit: item.unit,
            timestamp: Date.now()
        });

        saveData();
        document.getElementById('trans-qty').value = '';
        renderInventoryDashboard();
        renderStockReports('daily');
        alert("Stock updated successfully!");
    }
}

// ================= MENU DISH MANAGEMENT =================

function saveMenuDish() {
    let id = document.getElementById('edit-dish-id').value;
    let name = document.getElementById('dish-name').value.trim();
    let price = parseFloat(document.getElementById('dish-price').value);
    let rawId = document.getElementById('dish-raw-select').value;
    let rawUsage = parseFloat(document.getElementById('dish-raw-qty').value);

    if (!name || isNaN(price)) {
        alert("Please enter a valid dish name and price.");
        return;
    }

    if (id) {
        let dish = menuDishes.find(d => d.id == id);
        if (dish) {
            dish.name = name;
            dish.price = price;
            dish.rawId = rawId || null;
            dish.rawUsage = isNaN(rawUsage) ? 0 : rawUsage;
            alert("Menu dish updated successfully!");
        }
    } else {
        menuDishes.push({ 
            id: Date.now(), 
            name, 
            price, 
            rawId: rawId || null, 
            rawUsage: isNaN(rawUsage) ? 0 : rawUsage 
        });
        alert("Menu dish created successfully!");
    }

    saveData();
    cancelEditDish();
    renderMenuDashboard();
}

function editMenuDish(id) {
    let dish = menuDishes.find(d => d.id == id);
    if (dish) {
        document.getElementById('edit-dish-id').value = dish.id;
        document.getElementById('dish-name').value = dish.name;
        document.getElementById('dish-price').value = dish.price;
        document.getElementById('dish-raw-select').value = dish.rawId || "";
        document.getElementById('dish-raw-qty').value = dish.rawUsage || "";

        document.getElementById('dish-form-title').innerText = "Modify Menu Dish";
        document.getElementById('dish-save-btn').innerText = "Update Dish";
        document.getElementById('dish-cancel-btn').style.display = 'block';
    }
}

function cancelEditDish() {
    document.getElementById('edit-dish-id').value = '';
    document.getElementById('dish-name').value = '';
    document.getElementById('dish-price').value = '';
    document.getElementById('dish-raw-select').value = '';
    document.getElementById('dish-raw-qty').value = '';

    document.getElementById('dish-form-title').innerText = "Create / Edit Menu Dish";
    document.getElementById('dish-save-btn').innerText = "Save Menu Dish";
    document.getElementById('dish-cancel-btn').style.display = 'none';
}

function deleteMenuDish(id) {
    if (confirm("Are you sure you want to delete this dish from the menu?")) {
        menuDishes = menuDishes.filter(d => d.id != id);
        saveData();
        renderMenuDashboard();
    }
}

function renderMenuDashboard() {
    let dishRawHtml = '<option value="">-- None (No Raw Material Deduction) --</option>';
    rawMaterials.forEach(r => {
        dishRawHtml += `<option value="${r.id}">${r.name} (${r.unit})</option>`;
    });
    document.getElementById('dish-raw-select').innerHTML = dishRawHtml;

    let dishListHtml = '';
    menuDishes.forEach(d => {
        let rawItem = rawMaterials.find(r => r.id == d.rawId);
        let usageText = rawItem ? `Uses: ${d.rawUsage} ${rawItem.unit} of ${rawItem.name}` : 'No raw material linked';
        dishListHtml += `<div class="item-row">
            <span><strong>${d.name}</strong> - ₹${d.price}<br><small>${usageText}</small></span>
            <span>
                <button style="padding:4px 8px; background:#ffc107;" onclick="editMenuDish(${d.id})">Edit</button>
                <button style="padding:4px 8px; background:#dc3545; color:white;" onclick="deleteMenuDish(${d.id})">Del</button>
            </span>
        </div>`;
    });
    document.getElementById('dish-management-list').innerHTML = dishListHtml || '<p>No dishes created yet.</p>';
}

function renderInventoryDashboard() {
    let selectHtml = '<option value="">-- Select Raw Material --</option>';
    let overviewHtml = '';
    let masterListHtml = '';

    rawMaterials.forEach(r => {
        selectHtml += `<option value="${r.id}">${r.name} (${r.unit})</option>`;

        let badge = r.qty === 0 ? '<span class="badge-out">Out of Stock</span>' : (r.qty <= r.minLimit ? '<span class="badge-low">Low Quantity</span>' : '<span class="badge-ok">In Stock</span>');

        masterListHtml += `<div class="item-row">
            <span><strong>${r.name}</strong> (${r.unit})<br><small>Min: ${r.minLimit}</small></span>
            <span>
                <button style="padding:4px 8px; background:#ffc107;" onclick="editRawMaterial(${r.id})">Edit</button>
                <button style="padding:4px 8px; background:#dc3545; color:white;" onclick="deleteRawMaterial(${r.id})">Del</button>
            </span>
        </div>`;

        overviewHtml += `<div class="item-row">
            <span><strong>${r.name}</strong><br><small>Stock: ${r.qty} ${r.unit}</small></span>
            <span>${badge}</span>
        </div>`;
    });

    document.getElementById('select-raw-item').innerHTML = selectHtml;
    document.getElementById('item-master-list').innerHTML = masterListHtml || '<p>No items in Item Master.</p>';
    document.getElementById('raw-stock-overview').innerHTML = overviewHtml || '<p>No raw materials added yet.</p>';
}

// ================= STOCK REPORTS =================

function renderStockReports(filter) {
    let today = new Date().toISOString().split('T')[0];
    let currentMonth = today.substring(0, 7);
    let currentYear = today.substring(0, 4);

    let filteredLogs = stockLogs.filter(log => {
        if (filter === 'daily') return log.date === today;
        if (filter === 'mtd') return log.date.startsWith(currentMonth);
        if (filter === 'ytd') return log.date.startsWith(currentYear);
        return true;
    });

    let html = '';
    if (filteredLogs.length === 0) {
        html = '<p><small>No stock transactions found for this period.</small></p>';
    } else {
        filteredLogs.forEach(l => {
            html += `<div style="font-size:13px; border-bottom:1px solid #eee; padding:5px 0;">
                <strong>${l.date}</strong> - ${l.itemName}: <span style="color:${l.type.includes('IN')?'green':'red'}">${l.type} ${l.qty} ${l.unit}</span>
            </div>`;
        });
    }
    document.getElementById('stock-report-view').innerHTML = html;
}

// ================= BILLING, CART & PREVIEW =================

function setDiscount(val) {
    currentDiscount = val;
    document.getElementById('custom-discount').value = '';
    renderCart();
}

function setCustomDiscount(val) {
    let parsed = parseFloat(val);
    currentDiscount = isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), 100);
    renderCart();
}

function renderBillingMenu() {
    let html = '';
    if (menuDishes.length === 0) {
        html = '<p>No menu dishes available. Add them in the Menu tab first.</p>';
    } else {
        menuDishes.forEach(d => {
            html += `<div class="item-row">
                <span><strong>${d.name}</strong><br>₹${d.price}</span>
                <button style="width:auto; padding:6px 12px; background:#17a2b8; color:white;" onclick="addToCart(${d.id})">Add</button>
            </div>`;
        });
    }
    document.getElementById('dish-menu-list').innerHTML = html;
    renderCart();
}

function addToCart(id) {
    let dish = menuDishes.find(d => d.id === id);
    let item = cart.find(c => c.id === id);
    if (item) {
        item.qty++;
    } else {
        cart.push({ id: dish.id, name: dish.name, price: dish.price, rawId: dish.rawId, rawUsage: dish.rawUsage, qty: 1 });
    }
    renderCart();
}

// New: Update Cart Quantity (+, - or remove completely)
function updateCartQty(id, change) {
    let itemIndex = cart.findIndex(c => c.id === id);
    if (itemIndex > -1) {
        cart[itemIndex].qty += change;
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1); // Remove item if quantity drops to 0 or below
        }
    }
    renderCart();
}

function renderCart() {
    let html = '';
    let subtotal = 0;
    if (cart.length === 0) {
        html = '<p>Cart is empty.</p>';
    } else {
        cart.forEach(c => {
            let itemTotal = c.price * c.qty;
            subtotal += itemTotal;
            html += `<div class="cart-row" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${c.name}</strong><br>
                    <small>₹${c.price} x ${c.qty} = <strong>₹${itemTotal}</strong></small>
                </div>
                <div style="display: flex; gap: 4px; align-items: center;">
                    <button style="padding: 2px 8px; background: #dc3545; color: white; font-size: 12px;" onclick="updateCartQty(${c.id}, -1)">-</button>
                    <span style="padding: 0 4px; font-weight: bold; font-size: 13px;">${c.qty}</span>
                    <button style="padding: 2px 8px; background: #28a745; color: white; font-size: 12px;" onclick="updateCartQty(${c.id}, 1)">+</button>
                    <button style="padding: 2px 6px; background: #6c757d; color: white; font-size: 11px; margin-left: 4px;" onclick="updateCartQty(${c.id}, -${c.qty})">Remove</button>
                </div>
            </div>`;
        });
    }

    let discAmt = (subtotal * currentDiscount) / 100;
    let grandTotal = subtotal - discAmt;

    document.getElementById('cart-list').innerHTML = html;
    document.getElementById('cart-subtotal').innerText = subtotal;
    document.getElementById('cart-disc-amt').innerText = discAmt.toFixed(2);
    document.getElementById('cart-total').innerText = grandTotal.toFixed(2);
}

function openBillPreview() {
    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let discAmt = (subtotal * currentDiscount) / 100;
    let total = subtotal - discAmt;

    let previewHtml = '';
    cart.forEach(c => {
        previewHtml += `<div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
            <span>${c.name} x ${c.qty}</span>
            <span>₹${c.price * c.qty}</span>
        </div>`;
    });

    document.getElementById('preview-items-list').innerHTML = previewHtml;
    document.getElementById('prev-subtotal').innerText = subtotal;
    document.getElementById('prev-disc').innerText = currentDiscount;
    document.getElementById('prev-total').innerText = total.toFixed(2);

    document.getElementById('bill-modal').style.display = 'flex';
}

function closeBillPreview() {
    document.getElementById('bill-modal').style.display = 'none';
}

function confirmCheckout() {
    closeBillPreview();

    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let discAmt = (subtotal * currentDiscount) / 100;
    let total = subtotal - discAmt;

    // Deduct stock if raw material is linked
    cart.forEach(c => {
        if (c.rawId) {
            let rawItem = rawMaterials.find(r => r.id == c.rawId);
            if (rawItem) {
                let totalDeduction = c.rawUsage * c.qty;
                rawItem.qty -= totalDeduction;
                if (rawItem.qty < 0) rawItem.qty = 0;

                stockLogs.push({
                    date: new Date().toISOString().split('T')[0],
                    itemName: rawItem.name,
                    type: 'OUT (SALE)',
                    qty: totalDeduction,
                    unit: rawItem.unit,
                    timestamp: Date.now()
                });
            }
        }
    });

    invoices.push({
        date: new Date().toISOString().split('T')[0],
        total: total,
        discount: currentDiscount,
        timestamp: Date.now()
    });

    saveData();
    alert("Bill completed successfully!");
    cart = [];
    currentDiscount = 0;
    document.getElementById('custom-discount').value = '';
    renderBillingMenu();
    renderSalesReports(currentReportType);
}

// ================= SALES REPORTS & EXPORT =================

function renderSalesReports(filter) {
    currentReportType = filter;
    let today = new Date().toISOString().split('T')[0];
    let currentMonth = today.substring(0, 7);
    let currentYear = today.substring(0, 4);

    let filteredInvoices = invoices.filter(inv => {
        if (filter === 'daily') return inv.date === today;
        if (filter === 'mtd') return inv.date.startsWith(currentMonth);
        if (filter === 'ytd') return inv.date.startsWith(currentYear);
        return true;
    });

    let totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

    let html = `<div style="font-size:14px; margin-bottom:8px;"><strong>Total Sales (${filter.toUpperCase()}): ₹${totalSales.toFixed(2)}</strong></div>`;
    
    if (filteredInvoices.length === 0) {
        html += '<p><small>No sales recorded for this period.</small></p>';
    } else {
        filteredInvoices.slice(-5).reverse().forEach(inv => {
            html += `<div style="font-size:12px; border-bottom:1px solid #eee; padding:4px 0;">
                ${inv.date} - Amount: <strong>₹${inv.total.toFixed(2)}</strong> (Disc: ${inv.discount}%)
            </div>`;
        });
    }

    document.getElementById('sales-report-view').innerHTML = html;
}

function exportSales(format) {
    let element = document.getElementById('sales-report-card');

    if (format === 'pdf') {
        let opt = {
            margin: 0.5,
            filename: `Sales_Report_${currentReportType.toUpperCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).save();
    } 
    else if (format === 'jpg') {
        html2canvas(element).then(canvas => {
            let link = document.createElement('a');
            link.download = `Sales_Report_${currentReportType.toUpperCase()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg');
            link.click();
        });
    } 
    else if (format === 'excel') {
        let csvContent = "data:text/csv;charset=utf-8,Date,Total Amount,Discount (%)\n";
        invoices.forEach(inv => {
            csvContent += `${inv.date},${inv.total},${inv.discount}\n`;
        });
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Sales_Report_${currentReportType.toUpperCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
