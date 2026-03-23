// app.js — Tempted Bakery Frontend Application
// Talks to the Node.js backend API

const API = window.location.origin; // same origin
let authToken = localStorage.getItem('tempted_token') || null;
let currentAdminFilter = 'All';
let currentSiteFilter  = 'All';
let editCurrentPhoto   = null;

// ══════════════════════════════════
//  UTILS
// ══════════════════════════════════
function esc(s){
  if(!s) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

function showToast(msg, type=''){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(()=> t.className = '', 3200);
}

function showLoader(show, text='Loading...'){
  const l = document.getElementById('loader');
  const lt = document.getElementById('loaderText');
  lt.textContent = text;
  l.classList.toggle('show', show);
}

// ══════════════════════════════════
//  ROUTING
// ══════════════════════════════════
function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
  if(id === 'sitePage'){ loadSiteMenu(); }
  if(id === 'adminPage'){ showAdminTab('menuTab'); }
}

function goTo(id){
  document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
}

// Nav scroll effect
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav.main-nav');
  if(nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ══════════════════════════════════
//  API HELPERS
// ══════════════════════════════════
async function apiFetch(path, options={}){
  if(authToken){
    options.headers = { ...options.headers, Authorization: `Bearer ${authToken}` };
  }
  const res = await fetch(`${API}${path}`, options);
  const data = await res.json().catch(()=> ({}));
  if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ══════════════════════════════════
//  LOGIN
// ══════════════════════════════════
function openLogin(){
  document.getElementById('loginOv').classList.add('open');
  setTimeout(()=> document.getElementById('lPwd').focus(), 100);
}

async function doLogin(){
  const pwd = document.getElementById('lPwd').value.trim();
  const err = document.getElementById('lErr');
  const btn = document.querySelector('.l-btn');
  if(!pwd){ err.textContent = 'Please enter the password.'; return; }

  btn.textContent = 'Checking...'; btn.disabled = true;
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ password: pwd })
    });
    authToken = res.token;
    localStorage.setItem('tempted_token', authToken);
    document.getElementById('loginOv').classList.remove('open');
    document.getElementById('lPwd').value = '';
    err.textContent = '';
    showPage('adminPage');
    showToast('Welcome back! 🎂', 'success');
  } catch(e){
    err.textContent = 'Wrong password. Please try again.';
    document.getElementById('lPwd').value = '';
    document.getElementById('lPwd').focus();
  } finally {
    btn.textContent = 'Enter Admin Panel'; btn.disabled = false;
  }
}

function doLogout(){
  authToken = null;
  localStorage.removeItem('tempted_token');
  showPage('sitePage');
  showToast('Logged out successfully.');
}

// Auto-verify token on load
async function verifyToken(){
  if(!authToken) return;
  try {
    await apiFetch('/api/auth/verify');
  } catch(e){
    authToken = null;
    localStorage.removeItem('tempted_token');
  }
}

// ══════════════════════════════════
//  SITE MENU
// ══════════════════════════════════
async function loadSiteMenu(cat){
  cat = cat || currentSiteFilter;
  currentSiteFilter = cat;
  const grid = document.getElementById('siteGrid');
  const tabs = document.getElementById('siteTabs');

  // Show spinner
  grid.innerHTML = '<div class="menu-loading"><div class="loader-spin"></div></div>';

  try {
    // Load categories
    const cats = await apiFetch('/api/menu/categories');
    const allCats = ['All', ...cats];
    tabs.innerHTML = allCats.map(c =>
      `<button class="tab${c===cat?' active':''}" onclick="loadSiteMenu('${esc(c)}')">${esc(c)}</button>`
    ).join('');

    // Load items
    const url = cat === 'All' ? '/api/menu' : `/api/menu?category=${encodeURIComponent(cat)}`;
    const items = await apiFetch(url);

    if(!items.length){
      grid.innerHTML = '<div class="empty-menu">No items here yet — check back soon! 🎂</div>';
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="mcard">
        <div class="mcard-img">
          ${item.photo_url
            ? `<img src="${item.photo_url}" alt="${esc(item.name)}" loading="lazy"/>`
            : `<div class="mcard-img-ph"><span>${esc(item.emoji||'🍴')}</span><p>Photo coming soon</p></div>`
          }
        </div>
        <div class="mcard-bar"></div>
        <div class="mcard-body">
          <div class="mcard-cat">${esc(item.category)}</div>
          <div class="mcard-name">${esc(item.name)}</div>
          <div class="mcard-desc">${esc(item.description||'')}</div>
          <div class="mcard-footer">
            <div class="mcard-price">${esc(item.price||'Ask for pricing')}</div>
            <button class="mcard-btn" onclick="prefillOrder('${esc(item.name)}')">Order This</button>
          </div>
        </div>
      </div>
    `).join('');

    // Populate order select
    populateOrderSelect(items);
  } catch(e){
    grid.innerHTML = `<div class="empty-menu">Could not load menu. Please try again.</div>`;
    console.error('Menu load error:', e);
  }
}

function prefillOrder(name){
  const sel = document.getElementById('oItem');
  if(sel){
    for(let opt of sel.options){
      if(opt.value === name){ sel.value = name; break; }
    }
  }
  goTo('orderSec');
}

function populateOrderSelect(items){
  const sel = document.getElementById('oItem');
  if(!sel) return;
  sel.innerHTML =
    '<option value="">— Select an item —</option>' +
    items.map(i => `<option value="${esc(i.name)}">${esc(i.name)}</option>`).join('') +
    '<option value="Something else / Multiple items">Something else / Multiple items</option>';
}

// ══════════════════════════════════
//  ORDER FORM
// ══════════════════════════════════
async function submitOrder(){
  const name  = document.getElementById('oName').value.trim();
  const phone = document.getElementById('oPhone').value.trim();
  const email = document.getElementById('oEmail').value.trim();
  const item  = document.getElementById('oItem').value;
  const note  = document.getElementById('oNote').value.trim();
  const btn   = document.getElementById('oBtn');

  if(!name||!phone||!item){ showToast('Please fill in name, phone and item.', 'error'); return; }

  btn.disabled = true; btn.textContent = 'Sending...';

  try {
    // Save to backend
    await apiFetch('/api/orders', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ customer_name:name, phone, email, item_name:item, notes:note })
    });
  } catch(e){ console.warn('Order API failed (non-critical):', e.message); }

  // Open WhatsApp regardless
  const msg =
    `🎂 *New Order — Tempted Desserts*\n\n` +
    `👤 Name: ${name}\n📞 Phone: ${phone}\n` +
    `${email ? '📧 Email: '+email+'\n' : ''}` +
    `🛒 Order: ${item}\n📝 Notes: ${note||'None'}`;
  window.open(`https://wa.me/917585820244?text=${encodeURIComponent(msg)}`, '_blank');

  document.getElementById('oBody').style.display = 'none';
  document.getElementById('oSuc').classList.add('show');
  btn.disabled = false; btn.textContent = 'Send My Order ✦';
}

// ══════════════════════════════════
//  ADMIN TABS
// ══════════════════════════════════
function showAdminTab(tab){
  document.querySelectorAll('.adm-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.adm-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  if(tab === 'menuTab') loadAdminMenu();
  if(tab === 'ordersTab') loadAdminOrders();
}

// ══════════════════════════════════
//  ADMIN MENU
// ══════════════════════════════════
async function loadAdminMenu(cat){
  cat = cat || currentAdminFilter;
  currentAdminFilter = cat;
  const grid  = document.getElementById('admGrid');
  const tabs  = document.getElementById('admTabs');
  const count = document.getElementById('admCount');

  grid.innerHTML = '<div class="no-items" style="opacity:.5">Loading...</div>';

  try {
    const items = await apiFetch('/api/menu/all');
    const cats  = ['All', ...new Set(items.map(i => i.category))];

    count.textContent = `${items.length} item${items.length!==1?'s':''} on menu`;

    tabs.innerHTML = cats.map(c =>
      `<button class="aft${c===cat?' active':''}" onclick="loadAdminMenu('${esc(c)}')">${esc(c)}</button>`
    ).join('');

    const shown = cat === 'All' ? items : items.filter(i => i.category === cat);

    if(!shown.length){
      grid.innerHTML = '<div class="no-items">No items yet. Add one from the form!</div>'; return;
    }
    grid.innerHTML = shown.map(item => `
      <div class="ac">
        ${item.photo_url
          ? `<img class="ac-img" src="${item.photo_url}" alt="${esc(item.name)}" loading="lazy"/>`
          : `<div class="ac-img-ph">${esc(item.emoji||'🍴')}</div>`}
        <div class="ac-body">
          <div class="ac-top">
            <div class="ac-name">${esc(item.name)}</div>
            <div class="ac-btns">
              <button class="ac-e" onclick="openEdit(${item.id})" title="Edit">✏</button>
              <button class="ac-d" onclick="deleteItem(${item.id},'${esc(item.name)}')" title="Delete">✕</button>
            </div>
          </div>
          <div class="ac-cat">${esc(item.category)}</div>
          <div class="ac-desc">${esc(item.description||'No description')}</div>
          <div class="ac-price">${esc(item.price||'—')}</div>
          <span class="ac-avail ${item.available?'yes':'no'}">${item.available?'Available':'Hidden'}</span>
        </div>
      </div>
    `).join('');
  } catch(e){
    grid.innerHTML = '<div class="no-items">Could not load items.</div>';
    if(e.message.includes('401')) { doLogout(); openLogin(); }
  }
}

// ── PHOTO UPLOAD ──
function handlePhotoSelect(input, previewId, areaId){
  const file = input.files[0];
  if(!file) return;
  if(file.size > 8*1024*1024){ showToast('Photo must be under 8MB.','error'); input.value=''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById(previewId);
    prev.querySelector('img').src = e.target.result;
    prev.querySelector('.pua-prev-name').textContent = file.name;
    prev.style.display = 'block';
    const area = document.getElementById(areaId);
    area.querySelector('.pua-ico').style.display = 'none';
    area.querySelector('.pua-txt').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearPhoto(inputId, previewId, areaId, e){
  if(e){ e.stopPropagation(); e.preventDefault(); }
  document.getElementById(inputId).value = '';
  const prev = document.getElementById(previewId);
  if(prev){ prev.style.display='none'; prev.querySelector('img').src=''; }
  const area = document.getElementById(areaId);
  if(area){
    const ico = area.querySelector('.pua-ico');
    const txt = area.querySelector('.pua-txt');
    if(ico) ico.style.display = 'block';
    if(txt) txt.style.display = 'block';
  }
}

// ── ADD ITEM ──
async function addItem(){
  const name  = document.getElementById('aName').value.trim();
  const cat   = document.getElementById('aCat').value;
  const emoji = document.getElementById('aEmoji').value.trim() || '🍴';
  const desc  = document.getElementById('aDesc').value.trim();
  const price = document.getElementById('aPrice').value.trim();
  const msg   = document.getElementById('addMsg');
  const btn   = document.getElementById('addItemBtn');
  const photoFile = document.getElementById('aPhoto').files[0];

  if(!name||!cat){
    msg.style.color='#e07060'; msg.textContent='Please enter name and category.'; return;
  }

  btn.disabled = true; btn.textContent = 'Adding...';
  msg.textContent = '';

  try {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('category', cat);
    fd.append('emoji', emoji);
    fd.append('description', desc);
    fd.append('price', price);
    if(photoFile) fd.append('photo', photoFile);

    await apiFetch('/api/menu', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: fd
    });

    // Reset form
    ['aName','aEmoji','aDesc','aPrice'].forEach(id => document.getElementById(id).value='');
    document.getElementById('aCat').value='';
    clearPhoto('aPhoto','aPrev','aPuArea');

    msg.style.color='var(--gold)'; msg.textContent=`"${name}" added! ✦`;
    setTimeout(()=> msg.textContent='', 3000);
    loadAdminMenu();
    showToast(`"${name}" added to menu!`, 'success');
  } catch(e){
    msg.style.color='#e07060'; msg.textContent = e.message;
    if(e.message.includes('401')) { doLogout(); openLogin(); }
  } finally {
    btn.disabled = false; btn.textContent = 'Add to Menu ✦';
  }
}

// ── DELETE ──
async function deleteItem(id, name){
  if(!confirm(`Remove "${name}" from the menu?`)) return;
  try {
    await apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
    showToast(`"${name}" removed.`);
    loadAdminMenu();
  } catch(e){
    showToast(e.message, 'error');
    if(e.message.includes('401')) { doLogout(); openLogin(); }
  }
}

// ── EDIT ──
async function openEdit(id){
  try {
    const items = await apiFetch('/api/menu/all');
    const item  = items.find(i => i.id === id);
    if(!item) return;
    editCurrentPhoto = item.photo_url || null;

    document.getElementById('eId').value    = item.id;
    document.getElementById('eName').value  = item.name;
    document.getElementById('eCat').value   = item.category;
    document.getElementById('eEmoji').value = item.emoji || '';
    document.getElementById('eDesc').value  = item.description || '';
    document.getElementById('ePrice').value = item.price || '';
    document.getElementById('eAvail').value = item.available ? '1' : '0';

    // Reset photo
    clearPhoto('ePhoto','ePrev','ePuArea');
    if(item.photo_url){
      const prev = document.getElementById('ePrev');
      prev.querySelector('img').src = item.photo_url;
      prev.querySelector('.pua-prev-name').textContent = 'Current photo';
      prev.style.display = 'block';
      document.getElementById('ePuArea').querySelector('.pua-ico').style.display='none';
      document.getElementById('ePuArea').querySelector('.pua-txt').style.display='none';
    }

    document.getElementById('editOv').classList.add('open');
  } catch(e){ showToast(e.message,'error'); }
}

function closeEdit(){
  document.getElementById('editOv').classList.remove('open');
  editCurrentPhoto = null;
}

async function saveEdit(){
  const id    = document.getElementById('eId').value;
  const name  = document.getElementById('eName').value.trim();
  const cat   = document.getElementById('eCat').value;
  const btn   = document.getElementById('editSaveBtn');
  if(!name||!cat){ showToast('Name and category required.','error'); return; }

  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const fd = new FormData();
    fd.append('name',        name);
    fd.append('category',    cat);
    fd.append('emoji',       document.getElementById('eEmoji').value.trim()||'🍴');
    fd.append('description', document.getElementById('eDesc').value.trim());
    fd.append('price',       document.getElementById('ePrice').value.trim());
    fd.append('available',   document.getElementById('eAvail').value);

    const photoFile = document.getElementById('ePhoto').files[0];
    if(photoFile) fd.append('photo', photoFile);

    await apiFetch(`/api/menu/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: fd
    });

    closeEdit();
    loadAdminMenu();
    showToast(`"${name}" updated!`, 'success');
  } catch(e){
    showToast(e.message, 'error');
    if(e.message.includes('401')) { doLogout(); openLogin(); }
  } finally {
    btn.disabled = false; btn.textContent = 'Save Changes';
  }
}

// ══════════════════════════════════
//  ADMIN ORDERS
// ══════════════════════════════════
let currentOrderFilter = 'all';

async function loadAdminOrders(filter){
  filter = filter || currentOrderFilter;
  currentOrderFilter = filter;

  const tbody = document.getElementById('ordersTbody');
  const count = document.getElementById('ordersCount');

  // Update filter buttons
  document.querySelectorAll('.of-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === filter);
  });

  tbody.innerHTML = '<tr><td colspan="7" class="no-orders" style="opacity:.5">Loading...</td></tr>';

  try {
    const url = filter === 'all' ? '/api/orders' : `/api/orders?status=${filter}`;
    const orders = await apiFetch(url);
    count.textContent = `${orders.length} order${orders.length!==1?'s':''}`;

    if(!orders.length){
      tbody.innerHTML = '<tr><td colspan="7" class="no-orders">No orders yet.</td></tr>'; return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td style="color:rgba(201,168,76,.6);font-size:.72rem;">#${o.id}</td>
        <td style="color:var(--gold-l);font-weight:500;">${esc(o.customer_name)}</td>
        <td><a href="tel:${esc(o.phone)}" style="color:var(--gold);text-decoration:none;">${esc(o.phone)}</a></td>
        <td>${esc(o.item_name)}</td>
        <td style="font-size:.75rem;max-width:150px;">${esc(o.notes||'—')}</td>
        <td>
          <select class="order-sel" onchange="updateOrderStatus(${o.id},this.value)">
            ${['new','confirmed','preparing','ready','delivered','cancelled'].map(s =>
              `<option value="${s}"${o.status===s?' selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <button class="order-del-btn" onclick="deleteOrder(${o.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch(e){
    tbody.innerHTML = '<tr><td colspan="7" class="no-orders">Could not load orders.</td></tr>';
    if(e.message.includes('401')) { doLogout(); openLogin(); }
  }
}

async function updateOrderStatus(id, status){
  try {
    await apiFetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ status })
    });
    showToast(`Order #${id} → ${status}`, 'success');
  } catch(e){ showToast(e.message,'error'); }
}

async function deleteOrder(id){
  if(!confirm(`Delete order #${id}?`)) return;
  try {
    await apiFetch(`/api/orders/${id}`, { method: 'DELETE' });
    showToast(`Order #${id} deleted.`);
    loadAdminOrders();
  } catch(e){ showToast(e.message,'error'); }
}

// ══════════════════════════════════
//  DRAG & DROP for photo areas
// ══════════════════════════════════
['aPuArea','ePuArea'].forEach(id => {
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', e => {
    e.preventDefault(); el.classList.remove('over');
    const file = e.dataTransfer?.files[0];
    if(file){
      const inp = el.querySelector('input[type=file]');
      const dt  = new DataTransfer(); dt.items.add(file); inp.files = dt.files;
      inp.dispatchEvent(new Event('change'));
    }
  });
});

// ══════════════════════════════════
//  MODAL / OVERLAY CLOSE
// ══════════════════════════════════
document.getElementById('editOv').addEventListener('click', function(e){
  if(e.target === this) closeEdit();
});
document.getElementById('loginOv').addEventListener('click', function(e){
  if(e.target === this) this.classList.remove('open');
});
document.addEventListener('keydown', e => {
  if(e.key==='Escape'){
    closeEdit();
    document.getElementById('loginOv').classList.remove('open');
  }
});

// Enter key on password field
document.getElementById('lPwd')?.addEventListener('keydown', e => {
  if(e.key==='Enter') doLogin();
});

// ══════════════════════════════════
//  INIT
// ══════════════════════════════════
(async function init(){
  await verifyToken();
  loadSiteMenu();
})();
