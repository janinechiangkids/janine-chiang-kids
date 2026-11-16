/* ═══════════════════════════════//  PREORDER STATE// ═══════════════════════════════*/ const SK_PREORDER = 'jck_preorder_open_v1';let _preorderOpen = true; // 預設開放
function _loadPreorderState() {  try {    const v = localStorage.getItem(SK_PREORDER);    _preorderOpen = v === null ? true : v === 'true';  } catch(e) { _preorderOpen = true; }  _applyPreorderState();}
function _applyPreorderState() {  /* 更新後台開關 UI  */ const toggle = document.getElementById('preorderToggle');  const label  = document.getElementById('preorderStatusLabel');  const slider = document.getElementById('preorderSlider');  const knob   = document.getElementById('preorderKnob');  if (toggle) toggle.checked = _preorderOpen;  if (label)  { label.textContent = _preorderOpen ? '✅ 預購開放中' : '🔒 預購已關閉'; label.style.color = _preorderOpen ? 'var(--warm-brown)' : 'var(--text-light)'; }  if (slider) slider.style.background = _preorderOpen ? 'var(--warm-brown)' : 'var(--cream-mid)';  if (knob)   knob.style.transform = _preorderOpen ? 'translateX(24px)' : 'translateX(0)';  /* 更新前台所有商品卡按鈕  */ document.querySelectorAll('.order-btn').forEach(btn => {    if (_preorderOpen) {      btn.classList.remove('preorder-closed');      btn.disabled = false;      if (btn.textContent.includes('預購未開放')) {        btn.textContent = btn.dataset.originalText || '點我選規格';      }    } else {      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;      btn.classList.add('preorder-closed');      btn.disabled = true;      btn.textContent = '預購未開放';    }  });  /* 更新燈箱內按鈕  */ const lbCartBtn = document.getElementById('lbCartBtn');  if (lbCartBtn) {    if (_preorderOpen) {      lbCartBtn.disabled = false;      lbCartBtn.style.opacity = '1';      lbCartBtn.style.cursor = 'pointer';      if (lbCartBtn.textContent === '預購未開放') lbCartBtn.textContent = '＋ 加入清單';    } else {      lbCartBtn.disabled = true;      lbCartBtn.style.opacity = '0.5';      lbCartBtn.style.cursor = 'not-allowed';      lbCartBtn.textContent = '預購未開放';    }  }}
function setPreorderOpen(val) {  _preorderOpen = val;  localStorage.setItem(SK_PREORDER, String(val));  _applyPreorderState();  showToast(val ? '✅ 預購已開放，顧客可以下單' : '🔒 預購已關閉，顧客無法下單');}
/* ═══════════════════════════════//  CONFIG// ═══════════════════════════════*/ const SK_PROD   = 'jck_products_v3';const SK_BRAND  = 'jck_brands_v3';const LINE_URL  = 'https://lin.ee/rCNd7ai';const SUPABASE_URL    = 'https://chxadelmnesnsjwgvdrv.supabase.co';const SUPABASE_KEY    = 'sb_publishable__-Ac_0k27vvy8r456Hq_0g_AiRWZPHD';const SUPABASE_BUCKET = 'products';const SUPABASE_TABLE  = 'products';const IMG_MAX_WIDTH   = 1400;const IMG_QUALITY     = 0.9;const IMG_TARGET_SIZE = 420 * 1024;
/* 下單連結設定 */ const ORDER_LINK_NORMAL = 'https://famistore.famiport.com.tw/famistore/users/3244139/merchandises/020000000000000000dfefca';  /* 未滿1500的下單連結 */ const ORDER_LINK_FREE_SHIPPING = 'https://famistore.famiport.com.tw/famistore/users/3244139/merchandises/69fbe5aa23741c5f80c90cb0';
const sb = (window.supabase && window.supabase.createClient)  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)  : null;
const _imgUrlSupportCache = { tested: false, supported: false }; // 預設直接使用 Supabase 穩定原圖直鏈，避免 /render/image/ 在免費用量超額後整批回傳 402/404 破圖
function _normalizeExternalImg(url) {
  if (!url || typeof url !== 'string') return url || '';
  if (/^http:\/\/(www\.)?(hangou|gouhan)\.co\.kr/i.test(url)) {
    if (typeof location !== 'undefined' && location.protocol === 'https:') {
      const clean = url.replace(/^https?:\/\//i, '');
      // 請求最高畫質 q=100 且不進行二次降採樣，保持原始清晰度
      return 'https://wsrv.nl/?url=' + encodeURIComponent(clean) + '&q=100&n=-1';
    }
  }
  return url;
}
function imgUrl(url, width) {
  if (!url) return '';
  url = _normalizeExternalImg(url);
  if (!width) return url;
  if (typeof url !== 'string' || !url.includes('/storage/v1/object/public/')) return url;
  if (!_imgUrlSupportCache.supported) return url;
  return url.replace('/storage/v1/object/public/', '/render/image/public/')
    + (url.includes('?') ? '&' : '?') + 'width=' + width + '&quality=75&resize=contain';
}
function _imgUrlOnFail(imgEl, originalUrl) {
  _imgUrlSupportCache.supported = false;
  if (!imgEl || !originalUrl) return;
  const stage = parseInt(imgEl.dataset.failStage || '0', 10);
  const isKr = /^https?:\/\/(www\.)?(hangou|gouhan)\.co\.kr/i.test(originalUrl);
  // 若為韓網無 _m 高清網址失敗，先自動補回 _m 縮圖再試一次
  if (stage === 0 && isKr && /\/data\/item\/([^\/]+?)(\.[a-z]+)?$/i.test(originalUrl) && !/_m(\.[a-z]+)?$/i.test(originalUrl)) {
    imgEl.dataset.failStage = '1';
    const fallbackM = originalUrl.replace(/(\.[a-z]+)?$/i, '_m$1');
    imgEl.src = _normalizeExternalImg(fallbackM);
    return;
  }
  if (stage <= 1) {
    imgEl.dataset.failStage = '2';
    imgEl.src = originalUrl;
    return;
  }
  if (stage === 2 && isKr) {
    imgEl.dataset.failStage = '3';
    const clean = originalUrl.replace(/^https?:\/\//i, '');
    imgEl.src = 'https://wsrv.nl/?url=' + encodeURIComponent(clean);
    return;
  }
  imgEl.dataset.failStage = '99';
  imgEl.src = FALLBACK_IMG;
}
/* ── 商品資料快取 ──*/ const SK_PRODUCTS_CACHE = 'jck_products_cache_v1';const PRODUCTS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;function _saveProductsCache(list) {  try {    localStorage.setItem(SK_PRODUCTS_CACHE, JSON.stringify({ ts: Date.now(), data: list }));  } catch (e) {}}function _loadProductsCache() {  try {    const raw = localStorage.getItem(SK_PRODUCTS_CACHE);    if (!raw) return null;    const obj = JSON.parse(raw);    if (!obj || !Array.isArray(obj.data)) return null;    if (Date.now() - (obj.ts || 0) > PRODUCTS_CACHE_TTL) return null;    return obj.data;  } catch (e) { return null; }}
/* ── 尺寸新增「F」──────────────────────────*/ const SIZE_GROUPS = [
  { label:'單一/親子', sizes:['F','MOM'] },
  { label:'Baby',      sizes:['3M','6M','12M','18M','24M','BXS','BS','BM','BL'] },
  { label:'小童',      sizes:['XS','S','M','L','XL','XXL'] },
  { label:'大童',      sizes:['JS','JM','JL'] },
  { label:'身高(cm)',  sizes:['90','95','100','105','110','115','120','125','130','140','150'] },
];
/* ── 品項 & 顏色清單 ──────────────────────*/ const CATEGORY_LIST_DEFAULT = ['上衣','外套','褲子','裙子','洋裝','套裝','飾品','鞋子','襪子','包包','泳衣','背心','內搭','包屁衣','配件','帽子','吊帶'];const COLOR_LIST_DEFAULT    = ['白','米白','灰','深色','淺色','黑','紅','橘','黃','綠','藍','紫','粉','棕','素色','花花','圖案','圖片色','卡其','杏','深藍','淺藍','深綠','淺綠'];
const SK_USAGE = 'jck_usage_v1';let _usageData = {};
function _loadUsage() {  try { _usageData = JSON.parse(localStorage.getItem(SK_USAGE) || '{}'); } catch(e) { _usageData = {}; }}function _trackUsage(type, val) {  if (!val) return;  const key = type + ':' + val;  _usageData[key] = (_usageData[key] || 0) + 1;  localStorage.setItem(SK_USAGE, JSON.stringify(_usageData));}function _sortByUsage(type, list) {  return [...list].sort((a, b) => {    const ua = _usageData[type + ':' + a] || 0;    const ub = _usageData[type + ':' + b] || 0;    return ub - ua;  });}Object.defineProperty(window, 'CATEGORY_LIST', { get: () => _sortByUsage('cat', CATEGORY_LIST_DEFAULT) });Object.defineProperty(window, 'COLOR_LIST',    { get: () => _sortByUsage('col', COLOR_LIST_DEFAULT) });
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 200 200%22%3E%3Crect fill%3D%22%23EDE3D5%22 width%3D%22200%22 height%3D%22200%22%2F%3E%3Ctext x%3D%2250%25%22 y%3D%2255%25%22 text-anchor%3D%22middle%22 fill%3D%22%23B09880%22 font-size%3D%2230%22%3E%F0%9F%91%97%3C%2Ftext%3E%3C%2Fsvg%3E';
const SK_ORDERS = 'jck_orders_v1';let sizeGuideData = {};let orders = [];
async function _loadSizeGuide() {  if (!sb) return;  const { data, error } = await sb.from('size_guides').select('*');  if (error) { console.error('[loadSizeGuide]', error); return; }  sizeGuideData = {};  (data || []).forEach(row => {    sizeGuideData[row.brand] = {      headers: Array.isArray(row.headers) ? row.headers : [],      rows:    Array.isArray(row.rows)    ? row.rows    : []    };  });}async function _saveSizeGuideToStorage(brand, guide) {  if (!sb) return;  const { error } = await sb.from('size_guides').upsert([{    brand,    headers: guide.headers,    rows:    guide.rows,    updated_at: Date.now()  }]);  if (error) { console.error('[saveSizeGuide]', error); throw error; }}async function _deleteSizeGuideFromStorage(brand) {  if (!sb) return;  const { error } = await sb.from('size_guides').delete().eq('brand', brand);  if (error) { console.error('[deleteSizeGuide]', error); throw error; }}function _loadOrders() {  try { orders = JSON.parse(localStorage.getItem(SK_ORDERS) || '[]'); } catch(e) { orders = []; }}function _saveOrders() {  localStorage.setItem(SK_ORDERS, JSON.stringify(orders));}
/* ═══════════════════════════════//  STATE// ═══════════════════════════════*/ let products       = [];let brandHistory   = [];let editData       = [];let brandFilter    = 'all';let currentLbId    = null;let pendingOrderId = null;let editingProdId  = null;let editingSizes   = [];let bulkSizes      = [];let batchMode       = false;let batchSelected   = new Set();let batchEditing    = false;let batchEditItems  = [];let batchBulkSizes  = [];let cart = [];
/* ═══════════════════════════════//  STORAGE// ═══════════════════════════════*/ let _productsLoading = true;
async function loadProducts() {  if (!sb) { _productsLoading = false; products = []; return; }
  const cached = _loadProductsCache();  if (cached && cached.length) {    products = cached;    rebuildBrandHistory();    try { renderBrandTabs(); applyFilters(); } catch (e) {}  }
  for (let attempt = 1; attempt <= 3; attempt++) {    const { data, error } = await sb      .from(SUPABASE_TABLE)      .select('*')
      .order('created_at', { ascending: false });    if (!error && data) {      _productsLoading = false;      products = data.map(row => ({        id:         row.id,        url:        row.url,        brand:      row.brand || '',        price:      row.price || '',        sizes:      Array.isArray(row.sizes) ? row.sizes : [],        category:   row.category || '',        color:      row.color || '',        sizePrices: (() => {
          const raw = (row.price_groups && typeof row.price_groups === 'object' && !Array.isArray(row.price_groups)) ? {...row.price_groups} : {};
          delete raw.__groupBuy;
          delete raw.__groupPrice;
          return raw;
        })(),
        isGroupBuy: !!(row.price_groups && row.price_groups.__groupBuy),
        groupPrice: (row.price_groups && row.price_groups.__groupPrice) ? String(row.price_groups.__groupPrice) : '',
        createdAt:  Number(row.created_at) || 0      }));      _saveProductsCache(products);      rebuildBrandHistory();      if (attempt > 1 || cached) { renderBrandTabs(); applyFilters(); }      return;    }    if (attempt < 3) {      if (!cached) {        const title = document.getElementById('sectionTitle');        if (title) title.textContent = `— 連線中，請稍候… —`;      }      await new Promise(r => setTimeout(r, 4000));    } else {      _productsLoading = false;      if (!cached) {        products = [];        showToast('⚠️ 載入失敗，請重新整理頁面', 5000);      }    }  }  rebuildBrandHistory();}
function rebuildBrandHistory() {  brandHistory = [...new Set(products.map(p => (p.brand||'').trim()).filter(Boolean))];}function rememberBrand(b) {  if (!b || !b.trim()) return;  b = b.trim();  if (brandHistory.includes(b)) return;  brandHistory.unshift(b);  if (brandHistory.length > 40) brandHistory.pop();}function _packPriceGroups(p) {
  const pg = {...(p.sizePrices || {})};
  delete pg.__groupBuy;
  delete pg.__groupPrice;
  if (p.isGroupBuy) {
    pg.__groupBuy = true;
    if (p.groupPrice && String(p.groupPrice).trim()) pg.__groupPrice = String(p.groupPrice).trim();
  }
  return pg;
}
function _toRow(p) {  return {    id:           p.id,    url:          p.url,    brand:        (p.brand || '').trim(),    price:        (p.price || '').toString().trim(),    sizes:        p.sizes || [],    category:     (p.category || '').trim(),    color:        (p.color || '').trim(),    price_groups: _packPriceGroups(p),    created_at:   p.createdAt || Date.now()  };}
/* ═══════════════════════════════//  UTILITIES// ═══════════════════════════════*/ function esc(s) {  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}function showToast(msg, dur=2600) {  const t = document.getElementById('toast');  t.textContent = msg; t.classList.add('show');  setTimeout(() => t.classList.remove('show'), dur);}function lock()   { document.body.style.overflow = 'hidden'; }function unlock() { document.body.style.overflow = ''; }
function _displayPrice(p) {
  const sp = p.sizePrices || {};
  const vals = [...new Set(Object.values(sp).filter(Boolean).map(Number))].sort((a,b)=>a-b);
  let origText = '';
  if (vals.length >= 2) origText = `NT$ ${vals[0]} – ${vals[vals.length-1]}`;
  else if (vals.length === 1) origText = `NT$ ${vals[0]}`;
  else if (p.price) origText = `NT$ ${esc(p.price)}`;

  // 只有在「🔥 限時開團」分頁中才顯示團購特價，原本品牌分頁保留原價
  if (brandFilter === GROUPBUY_TAB && p.isGroupBuy && p.groupPrice && String(p.groupPrice).trim()) {
    const gp = esc(String(p.groupPrice).trim());
    return `${origText ? `<span class="orig-price-strike">${origText}</span>` : ''}<span class="gb-price-highlight">團購 NT$ ${gp}</span>`;
  }
  return origText;
}
function uniqueBrands() {  return [...new Set(products.map(p => (p.brand||'').trim()).filter(Boolean))];}const SECONDHAND_BRAND = '愛循環・二手專區';
const GROUPBUY_TAB = '__GROUPBUY__';
function renderBrandTabs() {  let brands = uniqueBrands();  const hasSecondhand = brands.includes(SECONDHAND_BRAND);  const hasGroupBuy = products.some(p => p.isGroupBuy);  if (hasSecondhand) brands = brands.filter(b => b !== SECONDHAND_BRAND);  const wrap   = document.getElementById('brandTabsWrap');  const tabs   = document.getElementById('brandTabs');  if (!brands.length && !hasSecondhand && !hasGroupBuy) { wrap.style.display = 'none'; return; }  wrap.style.display = 'block';  const allBrands = [
    ...(hasGroupBuy ? [GROUPBUY_TAB] : []),
    ...brands,
    ...(hasSecondhand ? [SECONDHAND_BRAND] : [])
  ];
  if (!allBrands.includes(brandFilter)) brandFilter = allBrands[0];
  let html = '';
  if (hasGroupBuy) {
    html += `<div class="brand-tab groupbuy-tab ${brandFilter===GROUPBUY_TAB?'active':''}" onclick="setBrand('${GROUPBUY_TAB}')">🔥 限時開團</div>`;
  }
  html += brands.map(b =>    `<div class="brand-tab ${brandFilter===b?'active':''}" onclick="setBrand('${esc(b)}')">${esc(b)}</div>`  ).join('');  if (hasSecondhand) {    html += `<div class="brand-tab secondhand-tab ${brandFilter===SECONDHAND_BRAND?'active':''}" onclick="setBrand('${esc(SECONDHAND_BRAND)}')">${esc(SECONDHAND_BRAND)}</div>`;  }  tabs.innerHTML = html;  document.body.classList.toggle('cute-mode', brandFilter === SECONDHAND_BRAND);}let _currentPage = 1;
const ITEMS_PER_PAGE = 30;
let _lastFilteredList = [];
function goToPage(page) {
  const totalPages = Math.max(1, Math.ceil(_lastFilteredList.length / ITEMS_PER_PAGE));
  _currentPage = Math.min(Math.max(1, page), totalPages);
  renderProducts(_lastFilteredList);
  const titleEl = document.getElementById('sectionTitle');
  if (titleEl) titleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function setBrand(b) { brandFilter = b; _currentPage = 1; renderBrandTabs(); applyFilters(); window.scrollTo({top:0,behavior:'smooth'}); }
/* FILTER + RENDER */ function applyFilters(resetPage = true) {  if (resetPage) _currentPage = 1;  const q = document.getElementById('searchInput').value.trim().toLowerCase();  let list = [...products].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));  if (brandFilter === GROUPBUY_TAB) {    list = list.filter(p => !!p.isGroupBuy);
  } else if (brandFilter && brandFilter !== 'all') {    list = list.filter(p => (p.brand||'').trim() === brandFilter);
  } else {    list = list.filter(p => (p.brand||'').trim() !== SECONDHAND_BRAND);
  }  if (q) list = list.filter(p =>    (p.brand||'').toLowerCase().includes(q) ||    (p.sizes||[]).join(' ').toLowerCase().includes(q) ||    (p.category||'').toLowerCase().includes(q) ||    (p.color||'').toLowerCase().includes(q)  );  const seenUrls = new Set();  const merged = [];  list.forEach(p => {
    const url = p.url || '';
    if (!url) { merged.push(p); return; }
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    const rawSiblings = list.filter(x => (x.url||'') === url);
    // 同圖多筆資料若「品項（category）」重複（例如兩筆都是「上衣」或都空白），自動過濾只保留第一筆
    const seenCats = new Set();
    const uniqueSiblings = [];
    rawSiblings.forEach(s => {
      const catKey = (s.category || '').trim() || '__single__';
      if (!seenCats.has(catKey)) {
        seenCats.add(catKey);
        uniqueSiblings.push(s);
      }
    });
    if (uniqueSiblings.length > 1) {
      merged.push({ ...uniqueSiblings[0], _siblings: uniqueSiblings });
    } else {
      merged.push(uniqueSiblings[0] || p);
    }
  });  _lastFilteredList = merged;  renderProducts(merged);}
function renderProducts(list) {  const grid  = document.getElementById('productGrid');  const title = document.getElementById('sectionTitle');  const pageBar = document.getElementById('paginationBar');  if (_productsLoading) {    title.textContent = '— 載入商品中… —';    if (pageBar) pageBar.innerHTML = '';
    grid.innerHTML = `<div class="empty-state">      <div style="width:36px;height:36px;border:3px solid var(--blush);border-top-color:var(--warm-brown);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 14px;"></div>      <p style="color:var(--text-light);font-size:0.85rem;">正在載入商品，請稍候…</p>
    </div>`;    return;  }  if (!list.length) {    title.textContent = '— 0 件商品 —';    if (pageBar) pageBar.innerHTML = '';
    const filt = brandFilter !== 'all' || document.getElementById('searchInput').value.trim();    grid.innerHTML = `<div class="empty-state"><div class="big-icon">${filt?'🔍':'👗'}</div><p>${filt?'找不到符合的商品<br>試試其他條件？':'後台還沒有上架商品喔～<br>點右上角後台按鈕新增商品'}</p></div>`;    return;  }
  const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
  if (_currentPage > totalPages) _currentPage = totalPages;
  const startIdx = (_currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = list.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  if (brandFilter === GROUPBUY_TAB) {    title.textContent = `— 🔥 限時開團優惠 ${list.length} 件（第 ${_currentPage} / ${totalPages} 頁）—`;
  } else if (brandFilter === SECONDHAND_BRAND) {    title.textContent = `— Re-loved 選物 ${list.length} 件（第 ${_currentPage} / ${totalPages} 頁）—`;
  } else {    title.textContent = `— 共 ${list.length} 件商品（第 ${_currentPage} / ${totalPages} 頁）—`;
  }
  if (pageBar) {
    if (totalPages <= 1) {
      pageBar.innerHTML = '';
    } else {
      let btns = `<button class="page-btn" ${_currentPage <= 1 ? 'disabled' : ''} onclick="goToPage(${_currentPage - 1})">‹ 上一頁</button>`;
      for (let p = 1; p <= totalPages; p++) {
        if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - _currentPage) <= 1) {
          btns += `<button class="page-btn ${p === _currentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`;
        } else if (Math.abs(p - _currentPage) === 2) {
          btns += `<span class="page-info">…</span>`;
        }
      }
      btns += `<button class="page-btn" ${_currentPage >= totalPages ? 'disabled' : ''} onclick="goToPage(${_currentPage + 1})">下一頁 ›</button>`;
      pageBar.innerHTML = btns;
    }
  }
  grid.innerHTML = pageItems.map((p,i) => {    const isMulti = Array.isArray(p._siblings) && p._siblings.length > 1;    const sz = isMulti      ? [...new Set(p._siblings.flatMap(s => s.sizes||[]))].join(' / ')      : (p.sizes||[]).join(' / ');    const brandTag = p.brand ? `<span class="product-brand-tag">${esc(p.brand)}</span>` : '';    const catTags  = isMulti      ? p._siblings.filter(s => s.category).map(s => `<span class="product-category-tag">${esc(s.category)}</span>`).join('')      : (p.category ? `<span class="product-category-tag">${esc(p.category)}</span>` : '');    const priceDisplay = isMulti      ? `${p._siblings.length} 件可選`      : _displayPrice(p);    return `    <div class="product-card" style="animation-delay:${i*0.04}s" onclick="openLb('${p.id}')">      <div class="product-img-wrap">        <img referrerpolicy="no-referrer" src="${imgUrl(p.url, 400)}" data-fullurl="${esc(p.url||'')}" alt="${esc(p.brand||'商品')}" onload="this.classList.add('loaded')" onerror="if(this.dataset.fullurl && this.dataset.failStage!=='99'){_imgUrlOnFail(this,this.dataset.fullurl);} else {this.onerror=null;this.src=FALLBACK_IMG;} this.classList.add('loaded');">        ${isMulti ? `<span class="multi-badge">✦ ${p._siblings.length} 件可選</span>` : ''}        ${p.isGroupBuy ? `<span class="groupbuy-badge">🔥 開團特價</span>` : ''}      </div>      <div class="product-info">        <div>          ${brandTag}          ${catTags}        </div>        <div class="product-meta-row">          <span class="product-size">${sz ? esc(sz) : ''}</span>          <span class="product-price">${isMulti ? `<span style="font-size:0.8rem;color:var(--soft-brown);">${priceDisplay}</span>` : priceDisplay}</span>        </div>        <button class="order-btn${_preorderOpen ? '' : ' preorder-closed'}" ${_preorderOpen ? '' : 'disabled'} onclick="event.stopPropagation();${_preorderOpen ? `openLb('${p.id}')` : ''}" data-original-text="${isMulti ? '查看商品' : '點我選規格'}">${_preorderOpen ? (isMulti ? '查看商品' : '點我選規格') : '預購未開放'}</button>      </div>    </div>`;  }).join('');}
/* LIGHTBOX */ function openLb(id) {  const p = products.find(x => x.id === id);  if (!p) return;  const rawLbSibs = (p.url ? products.filter(x => x.url === p.url) : [p]);
  const _lbSeenCats = new Set();
  const siblings = [];
  rawLbSibs.forEach(s => {
    const ck = (s.category || '').trim() || '__single__';
    if (!_lbSeenCats.has(ck)) {
      _lbSeenCats.add(ck);
      siblings.push(s);
    }
  });  currentLbId = id;  window._lbSiblings = siblings;  const _lbImg = document.getElementById('lbImg');
  const rawUrl = p.url || '';
  const hdCandidates = [];
  if (/\/data\/item\/([^\/]+)_m(\.[a-z]+)?$/i.test(rawUrl)) {
    hdCandidates.push(rawUrl.replace(/_m(\.[a-z]+)?$/i, '$1'));
    hdCandidates.push(rawUrl.replace(/_m(\.[a-z]+)?$/i, '_l$1'));
    hdCandidates.push(rawUrl);
  } else if (/\/data\/item\/([^\/]+?)(\.[a-z]+)?$/i.test(rawUrl) && /hangou\.co\.kr/i.test(rawUrl)) {
    hdCandidates.push(rawUrl);
    hdCandidates.push(rawUrl.replace(/(\.[a-z]+)?$/i, '_l$1'));
    hdCandidates.push(rawUrl.replace(/(\.[a-z]+)?$/i, '_m$1'));
  } else {
    hdCandidates.push(rawUrl);
  }

  let candIdx = 0;
  _lbImg.dataset.fullurl = rawUrl;
  _lbImg.dataset.failStage = '0';
  _lbImg.style.maxWidth = '100%';
  _lbImg.style.margin = '0';
  _lbImg.style.borderRadius = '0';
  _lbImg.onload = null;
  _lbImg.onerror = function() {
    candIdx++;
    if (candIdx < hdCandidates.length) {
      this.src = imgUrl(hdCandidates[candIdx]);
      return;
    }
    if (this.dataset.fullurl && this.dataset.failStage !== '99') {
      _imgUrlOnFail(this, this.dataset.fullurl);
    } else {
      this.onerror = null;
      this.src = FALLBACK_IMG;
    }
  };
  _lbImg.src = imgUrl(hdCandidates[0]);
  const cartBtn = document.getElementById('lbCartBtn');  if (cartBtn) { cartBtn.textContent = '＋ 加入清單'; cartBtn.classList.remove('added'); }
  const brand = document.getElementById('lbBrand');  brand.textContent = p.brand || '';  brand.style.display = p.brand ? 'inline-block' : 'none';
  _updateLbPrice(p, null);
  const attrsEl = document.getElementById('lbAttrs');
  const hasSizeGuide = p.brand && sizeGuideData[p.brand];  const brandEl = document.getElementById('lbBrand');  brandEl.style.display = 'block';  brandEl.style.background = '';  brandEl.style.padding = '';  brandEl.style.marginBottom = '10px';  brandEl.innerHTML = p.brand    ? `<span style="display:inline-block;font-size:0.72rem;background:var(--blush-light);color:var(--soft-brown);border-radius:10px;padding:2px 10px;">${esc(p.brand)}</span>`    : '';
  let multiTabsHtml = '';  if (siblings.length > 1) {    multiTabsHtml = `      <div class="lb-multi-hint">✦ 這張照片有 ${siblings.length} 件商品，可分別選購</div>      <div class="lb-multi-tabs">        ${siblings.map(s => {          const label = s.category || '商品';          const isActive = s.id === id;          return `<button class="lb-multi-tab${isActive?' active':''}" onclick="openLb('${s.id}')">${esc(label)}</button>`;        }).join('')}      </div>`;  }  let html = multiTabsHtml;
  if (p.category || hasSizeGuide) {    const sgBtnInline = hasSizeGuide      ? `<button class="lb-size-guide-btn" onclick="toggleSizeGuide('${esc(p.brand||'')}')">尺寸表</button>`      : '';    html += `<div class="lb-attr-row" style="align-items:center;">      <span class="lb-attr-label">品項</span>      <div style="flex:1;display:flex;align-items:center;justify-content:space-between;">        <span class="lb-attr-value">${p.category ? esc(p.category) : ''}</span>        ${sgBtnInline}      </div>    </div>    <div class="lb-size-guide" id="lbSizeGuide" style="margin-bottom:8px;"></div>`;  }
  if ((p.sizes||[]).length) {    const sizeSet = new Set(p.sizes);    const groupRows = SIZE_GROUPS      .map(g => ({ label: g.label, sizes: g.sizes.filter(s => sizeSet.has(s)) }))      .filter(g => g.sizes.length > 0);    const chipsHTML = groupRows.map(g =>      `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px;">        ${g.sizes.map(s =>          `<div class="lb-chip" onclick="toggleLbChip(this);_updateLbPriceFromChips('${p.id}')">${esc(s)}</div>`        ).join('')}      </div>`    ).join('');    html += `<div class="lb-attr-row" style="align-items:flex-start;">      <span class="lb-attr-label" style="padding-top:5px;">尺寸</span>      <div style="flex:1;">${chipsHTML}</div>    </div>`;  }
  if (p.color) {    const colors = p.color.split(/[\/、,]/).map(c => c.trim()).filter(Boolean);    const chips = colors.map(c =>      `<div class="lb-chip" onclick="toggleLbChip(this)">${esc(c)}</div>`    ).join('');    html += `<div class="lb-attr-row">      <span class="lb-attr-label">顏色</span>      <div class="lb-chips">${chips}</div>    </div>`;  }
  attrsEl.innerHTML = html;  document.getElementById('lightbox').classList.add('active');  _applyPreorderState();  lock();}
function toggleLbChip(el) {  const row = el.closest('.lb-attr-row');  if (!row) { el.classList.toggle('selected'); return; }  row.querySelectorAll('.lb-chip').forEach(c => c.classList.remove('selected'));  el.classList.add('selected');}function _updateLbPrice(p, selectedSize) {
  const priceEl = document.getElementById('lbPrice');
  if (!priceEl) return;
  const sp = p.sizePrices || {};
  const hasMulti = Object.keys(sp).length > 0;
  let origStr = '';
  if (hasMulti && !selectedSize) {
    const prices = [...new Set(Object.values(sp).filter(Boolean))];
    if (prices.length === 0) origStr = p.price ? 'NT$ '+p.price : '';
    else if (prices.length === 1) origStr = 'NT$ ' + prices[0];
    else origStr = 'NT$ ' + Math.min(...prices.map(Number)) + ' – ' + Math.max(...prices.map(Number));
  } else {
    const price = getPriceForSize(sp, p.price, selectedSize);
    origStr = price ? 'NT$ ' + price : '';
  }
  if (brandFilter === GROUPBUY_TAB && p.isGroupBuy && p.groupPrice && String(p.groupPrice).trim()) {
    priceEl.innerHTML = `${origStr ? `<span class="orig-price-strike" style="font-size:0.95rem;">${origStr}</span>` : ''}<span class="gb-price-highlight">🔥 團購價 NT$ ${esc(String(p.groupPrice).trim())}</span>`;
  } else {
    priceEl.textContent = origStr;
  }
}function _updateLbPriceFromChips(productId) {  const p = products.find(x => x.id === productId);  if (!p) return;  const sizeRow = Array.from(document.querySelectorAll('#lbAttrs .lb-attr-row'))    .find(r => r.querySelector('.lb-attr-label')?.textContent === '尺寸');  const selSize = sizeRow    ? Array.from(sizeRow.querySelectorAll('.lb-chip.selected')).map(e => e.textContent)[0] || null    : null;  _updateLbPrice(p, selSize);}
function toggleSizeGuide(brand) {  const el = document.getElementById('lbSizeGuide');  if (!el) return;  if (el.classList.contains('open')) {    el.classList.remove('open');    return;  }  const guide = sizeGuideData[brand];  if (!guide) return;  const keepIdx = guide.headers    .map((h, i) => ({ h, i }))    .filter(({ h }) => h !== '適合')    .map(({ i }) => i);  const filteredHeaders = keepIdx.map(i => guide.headers[i]);  const filteredRows    = guide.rows.map(row => keepIdx.map(i => row[i] || ''));  el.innerHTML = `    <div style="font-size:0.72rem;color:var(--text-soft);margin-bottom:6px;font-weight:500;">${esc(brand)} 尺寸表</div>    <table><thead><tr>${filteredHeaders.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>    ${filteredRows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}    </tbody></table>`;  el.classList.add('open');}
function closeLb() {  document.getElementById('lightbox').classList.remove('active');  unlock();}function lbOutside(e) { if (e.target === document.getElementById('lightbox')) closeLb(); }
/* RULES MODAL */ function initiateOrder(id) {  closeLb();  pendingOrderId = id;  document.getElementById('rulesOverlay').classList.add('active');  lock();}function showRulesBeforeLine() {  pendingOrderId = '__line__';  document.getElementById('rulesOverlay').classList.add('active');  lock();}function closeRules() {  document.getElementById('rulesOverlay').classList.remove('active');  unlock();  pendingOrderId = null;}function confirmOrder() {  closeRules();  if (LINE_URL === '#') { showToast('LINE 連結尚未設定，請聯繫管理員'); return; }  window.open(LINE_URL, '_blank');}
/* ADMIN */ async function openAdmin() {  document.getElementById('adminModal').classList.add('active');  lock();  if (sb) {    const { data: { session } } = await sb.auth.getSession();    if (session && session.user) { _showAdminContent(session.user); return; }  }  document.getElementById('pwScreen').style.display   = 'block';  document.getElementById('adminContent').style.display = 'none';  document.getElementById('adminEmail').value = '';  document.getElementById('adminPass').value  = '';  document.getElementById('pwError').textContent = '';  requestAnimationFrame(() => document.getElementById('adminEmail')?.focus());}function _showAdminContent(user) {  document.getElementById('pwScreen').style.display   = 'none';  document.getElementById('adminContent').style.display = 'block';  const info = document.getElementById('adminUserInfo');  if (info) info.textContent = user?.email ? '已登入：' + user.email : '';  renderManage();}function closeAdmin() {  document.getElementById('adminModal').classList.remove('active');  editingProdId = null;  unlock();}function adminOutside(e) { if (e.target === document.getElementById('adminModal')) closeAdmin(); }async function adminLogin() {  if (!sb) { document.getElementById('pwError').textContent = 'Supabase 尚未初始化'; return; }  const email = document.getElementById('adminEmail').value.trim();  const pass  = document.getElementById('adminPass').value;  const errEl = document.getElementById('pwError');  const btn   = document.getElementById('adminLoginBtn');  if (!email || !pass) { errEl.textContent = '請輸入 Email 與密碼'; return; }  errEl.textContent = '登入中…';  if (btn) { btn.disabled = true; btn.textContent = '登入中…'; }  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });  if (btn) { btn.disabled = false; btn.textContent = '登入'; }  if (error) {    errEl.textContent = '登入失敗：' + (error.message || '請確認帳號密碼');    document.getElementById('adminPass').value = '';    return;  }  errEl.textContent = '';  _showAdminContent(data?.user);  await loadProducts();  renderBrandTabs();  applyFilters();  renderManage();  showToast('✓ 歡迎回來');}async function adminLogout() {  if (!sb) { closeAdmin(); return; }  await sb.auth.signOut();  closeAdmin();  showToast('✓ 已登出');}function switchTab(tab) {  document.querySelectorAll('.admin-tab').forEach((t,i) => t.classList.toggle('active',    (i===0&&tab==='upload')||(i===1&&tab==='manage')||(i===2&&tab==='brands')||(i===3&&tab==='orders')||(i===4&&tab==='completed')));  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));  document.getElementById('tab-'+tab).classList.add('active');  if (tab === 'manage') { editingProdId = null; renderManage(); switchManageSub(_manageSubMode); }  if (tab === 'upload') { batchMode = false; _resetBatchState(); }  if (tab === 'brands') { renderSgList(); }  if (tab === 'orders') { renderOrders(); }  if (tab === 'completed') { renderCompletedOrders(); }}
/* IMAGE COMPRESSION + UPLOAD */ function _loadImage(file) {  return new Promise((resolve, reject) => {    const url = URL.createObjectURL(file);    const img = new Image();    img.onload  = () => { resolve({ img, url }); };    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('無法讀取圖片')); };    img.src = url;  });}function _canvasToBlob(canvas, quality) {  return new Promise(res => canvas.toBlob(b => res(b), 'image/jpeg', quality));}async function compressImage(file) {  const { img, url } = await _loadImage(file);  let w = img.naturalWidth  || img.width;  let h = img.naturalHeight || img.height;  if (w > IMG_MAX_WIDTH) { h = Math.round(h * IMG_MAX_WIDTH / w); w = IMG_MAX_WIDTH; }  const canvas = document.createElement('canvas');  canvas.width = w; canvas.height = h;  const ctx = canvas.getContext('2d');  ctx.fillStyle = '#FFFFFF';  ctx.fillRect(0, 0, w, h);  ctx.drawImage(img, 0, 0, w, h);  URL.revokeObjectURL(url);  let q = IMG_QUALITY;  let blob = await _canvasToBlob(canvas, q);  while (blob && blob.size > IMG_TARGET_SIZE && q > 0.4) {    q = +(q - 0.1).toFixed(2);    blob = await _canvasToBlob(canvas, q);  }  return { blob, width: w, height: h, quality: q };}function _uniqueName() {  const d = new Date();  const stamp = d.getFullYear().toString() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '_' + d.getTime();  const rnd = Math.random().toString(36).slice(2, 8);  return `jck_${stamp}_${rnd}.jpg`;}async function uploadOne(file) {  if (!sb) throw new Error('Supabase 尚未初始化');  const { blob } = await compressImage(file);  const filename = _uniqueName();  const { error } = await sb.storage.from(SUPABASE_BUCKET).upload(filename, blob, {    contentType: 'image/jpeg', cacheControl: '31536000', upsert: false  });  if (error) throw error;  const { data: pub } = sb.storage.from(SUPABASE_BUCKET).getPublicUrl(filename);  return { url: pub.publicUrl, size: blob.size, filename };}async function handleFileSelect(ev) {  const files = Array.from(ev.target.files || []).filter(f => f.type.startsWith('image/'));  ev.target.value = '';  if (!files.length) { showToast('請選擇圖片檔案'); return; }  await uploadFiles(files);}async function uploadFiles(files) {  if (!sb) { showToast('⚠️ 請先在程式碼中填入你的 SUPABASE_URL'); return; }  const progEl = document.getElementById('uploadProgress');  const txtEl  = document.getElementById('uploadProgressText');  const fillEl = document.getElementById('uploadProgressFill');  progEl.style.display = 'block'; fillEl.style.width = '0%';  const uploaded = [], failed = [];  for (let i = 0; i < files.length; i++) {    const f = files[i];    const kbOrig = Math.round(f.size / 1024);    txtEl.textContent = `壓縮並上傳中（${i+1}/${files.length}）：${f.name}（原 ${kbOrig}KB）`;    try {      const res = await uploadOne(f);      uploaded.push(res);      txtEl.textContent = `已完成（${i+1}/${files.length}）：壓縮後 ${Math.round(res.size/1024)}KB`;    } catch (err) {      failed.push({ name: f.name, msg: (err && err.message) || String(err) });
    }    fillEl.style.width = `${((i+1)/files.length)*100}%`;  }  setTimeout(() => { progEl.style.display = 'none'; fillEl.style.width = '0%'; }, 600);  if (!uploaded.length) { showToast(failed.length ? `上傳全部失敗：${failed[0].msg}` : '沒有成功上傳的圖片', 3600); return; }  const startIdx = editData.length;  uploaded.forEach((u, k) => {    editData.push({ url: u.url, price:'', brand:'', sizes:[], category:'', color:'', sizePrices:{}, _id:'tmp'+(startIdx+k) });  });  const bulkBrandVal = (document.getElementById('bulkBrandInput')?.value || '').trim();  if (bulkBrandVal) for (let k = startIdx; k < editData.length; k++) editData[k].brand = bulkBrandVal;  if (bulkSizes.length) for (let k = startIdx; k < editData.length; k++) editData[k].sizes = [...bulkSizes];  const bulkCont = document.getElementById('bulkSizeContainer');  if (bulkCont && !bulkCont.innerHTML.trim()) bulkCont.innerHTML = sizePicker('bulk', 0, bulkSizes);  renderEditCards();  const editSec = document.getElementById('editSection');  editSec.style.display = 'block';  editSec.scrollIntoView({ behavior:'smooth' });  if (failed.length) showToast(`✓ 成功 ${uploaded.length} 張；失敗 ${failed.length} 張`, 3600);  else showToast(`✓ 已成功上傳 ${uploaded.length} 張照片`);}function setupDragDrop() {  const zone = document.getElementById('uploadZone');  if (!zone) return;  ['dragenter','dragover'].forEach(ev => {    zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); zone.classList.add('dragover'); });  });  ['dragleave','drop'].forEach(ev => {    zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); zone.classList.remove('dragover'); });  });  zone.addEventListener('drop', async e => {    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));    if (!files.length) { showToast('請拖曳圖片檔案'); return; }    await uploadFiles(files);  });  window.addEventListener('dragover', e => e.preventDefault());  window.addEventListener('drop',     e => e.preventDefault());  document.addEventListener('click', e => {    if (!e.target.closest('.edit-card')) {      document.querySelectorAll('.edit-card-panel.open').forEach(p => p.classList.remove('open'));      document.querySelectorAll('.edit-card.expanded').forEach(c => c.classList.remove('expanded'));    }  });}
/* BULK BRAND / SIZES */ function applyBulkBrand() {  const val = document.getElementById('bulkBrandInput').value.trim();  if (!val) { showToast('請先輸入品牌名稱'); return; }  if (!editData.length) { showToast('尚無商品可套用'); return; }  editData.forEach(d => { d.brand = val; });  editData.forEach((_, i) => { const inp = document.getElementById('bi' + i); if (inp) inp.value = val; });  hideBulkSugg();  showToast(`✓ 已將 ${editData.length} 件商品的品牌設為「${val}」`);}function showBulkSugg(val) {  const el  = document.getElementById('bulkBs');  const hit = brandHistory.filter(b => b.toLowerCase().includes((val||'').toLowerCase())).slice(0,6);  if (!hit.length) { el.classList.remove('open'); return; }  el.innerHTML = hit.map(b => `<div class="brand-sugg-item" onmousedown="pickBulkBrand('${esc(b)}')">${esc(b)}</div>`).join('');  el.classList.add('open');}function hideBulkSugg() { document.getElementById('bulkBs')?.classList.remove('open'); }function pickBulkBrand(b) { document.getElementById('bulkBrandInput').value = b; hideBulkSugg(); }function applyBulkSizes() {  if (!bulkSizes.length) { showToast('請先勾選要套用的尺寸'); return; }  if (!editData.length)  { showToast('尚無商品可套用'); return; }  editData.forEach(d => { d.sizes = [...bulkSizes]; });  renderEditCards();  showToast(`✓ 已將 ${editData.length} 件商品的尺寸設為：${bulkSizes.join(' / ')}`);}
/* EDIT CARDS */ function renderEditCards() {  document.getElementById('editCards').innerHTML = editData.map((d,i) => `    <div class="edit-card" id="ecard${i}">      <div class="edit-card-img-wrap">        <div class="img-loading" id="imgload${i}"><div class="img-spinner"></div></div>        <img class="edit-card-img" id="eimg${i}" src="" style="display:none;"          onload="onImgLoad(${i})" onerror="onImgError(${i})">      </div>
      <div class="edit-card-fields">
        <div class="edit-field">
          <div class="brand-wrap">
            <input class="field-input" type="text" id="bi${i}" placeholder="🏷 品牌"
              autocomplete="off" value="${esc(d.brand)}"
              oninput="editData[${i}].brand=this.value;showSugg(${i},this.value)"
              onfocus="showSugg(${i},this.value)"
              onblur="setTimeout(()=>hideSugg(${i}),180)">
            <div class="brand-sugg" id="bs${i}"></div>
          </div>
        </div>
        <div class="edit-field">
          ${categoryPicker('new', i, d.category)}
        </div>

        <div class="edit-field">
          ${sizePicker('new', i, d.sizes, d.sizePrices)}
        </div>
        <button class="remove-btn" onclick="removeCard(${i})">✕ 移除</button>
      </div>
    </div>  `).join('');  requestAnimationFrame(() => {    editData.forEach((d, i) => { const img = document.getElementById('eimg' + i); if (img) img.src = d.url; });  });}function toggleEditCard(i) {}function closeEditCard(i) {}function updateCardSummary(i) {}function onImgLoad(i) {  const img  = document.getElementById('eimg' + i);  const load = document.getElementById('imgload' + i);  if (img)  img.style.display = 'block';  if (load) load.style.display = 'none';}function onImgError(i) {  const load = document.getElementById('imgload' + i);  if (load) load.innerHTML = '<div class="img-error-txt">⚠️ 圖片無法顯示<br><span>請確認網址是否為圖片直鏈</span></div>';}
/* 品項選擇器 */ function categoryPicker(mode, idx, selected) {  const manualId = `cat_manual_${mode}_${idx}`;  const pickerId = `cat_picker_${mode}_${idx}`;  const chips = CATEGORY_LIST.map(c => {    const isOn = selected === c;    return `<div class="option-chip ${isOn?'on':''}" id="${pickerId}_${esc(c)}"      onclick="selectCategory('${mode}',${idx},'${esc(c)}')">${esc(c)}</div>`;  }).join('');  const manualVal = CATEGORY_LIST.includes(selected) ? '' : (selected || '');  return `<div>    <div class="option-chips">${chips}</div>
    <input class="field-input option-chip-manual" type="text" id="${manualId}"      placeholder="品項（選填，可手動輸入）"
      value="${esc(manualVal)}"
      oninput="selectCategoryManual('${mode}',${idx},this.value)">
  </div>`;}function selectCategory(mode, idx, val) {  _trackUsage('cat', val);  _setCategory(mode, idx, val);  const prefix = `cat_picker_${mode}_${idx}_`;  CATEGORY_LIST.forEach(c => {    const el = document.getElementById(prefix + c);    if (el) el.classList.toggle('on', c === val);  });  const manualEl = document.getElementById(`cat_manual_${mode}_${idx}`);  if (manualEl) manualEl.value = '';}function selectCategoryManual(mode, idx, val) {  _setCategory(mode, idx, val);  const prefix = `cat_picker_${mode}_${idx}_`;  CATEGORY_LIST.forEach(c => {    const el = document.getElementById(prefix + c);    if (el) el.classList.remove('on');  });}function _setCategory(mode, idx, val) {  if (mode === 'new')       { if (editData[idx]) editData[idx].category = val; }  else if (mode === 'batchEdit') { if (batchEditItems[idx]) batchEditItems[idx].category = val; }}
/* 顏色選擇器 */ function colorPicker(mode, idx, selected) {  const manualId = `col_manual_${mode}_${idx}`;  const pickerId = `col_picker_${mode}_${idx}`;  const selArr = selected ? selected.split(/[\/、,]/).map(c=>c.trim()).filter(Boolean) : [];  const chips = COLOR_LIST.map(c => {    const isOn = selArr.includes(c);    return `<div class="option-chip ${isOn?'on':''}" id="${pickerId}_${esc(c)}"      onclick="toggleColor('${mode}',${idx},'${esc(c)}')">${esc(c)}</div>`;  }).join('');  const manualVal = selArr.filter(c => !COLOR_LIST.includes(c)).join('/');  return `<div>    <div class="option-chips">${chips}</div>
    <input class="field-input option-chip-manual" type="text" id="${manualId}"      placeholder="手動輸入顏色（可用 / 分隔多色）"
      value="${esc(manualVal)}"
      oninput="setColorManual('${mode}',${idx},this.value)">
  </div>`;}function toggleColor(mode, idx, val) {  _trackUsage('col', val);  const current = _getColor(mode, idx);  const arr = current ? current.split('/').map(c=>c.trim()).filter(Boolean) : [];  const exists = arr.includes(val);  const newArr = exists ? arr.filter(c => c !== val) : [...arr, val];  const newVal = newArr.join('/');  _setColor(mode, idx, newVal);  const el = document.getElementById(`col_picker_${mode}_${idx}_${val}`);  if (el) el.classList.toggle('on', !exists);}function setColorManual(mode, idx, val) {  _setColor(mode, idx, val);  const prefix = `col_picker_${mode}_${idx}_`;  COLOR_LIST.forEach(c => { const el = document.getElementById(prefix+c); if (el) el.classList.remove('on'); });}function _getColor(mode, idx) {  if (mode === 'new')       return editData[idx]?.color || '';  if (mode === 'batchEdit') return batchEditItems[idx]?.color || '';  return '';}function _setColor(mode, idx, val) {  if (mode === 'new')       { if (editData[idx]) editData[idx].color = val; }  else if (mode === 'batchEdit') { if (batchEditItems[idx]) batchEditItems[idx].color = val; }}
function getPriceForSize(sizePrices, legacyPrice, selectedSize) {  if (!sizePrices || !Object.keys(sizePrices).length) return legacyPrice || '';  if (selectedSize && sizePrices[selectedSize]) return sizePrices[selectedSize];  const first = Object.values(sizePrices).find(Boolean);  return first || legacyPrice || '';}
/* SIZE PICKER（含群組價格輸入） */ function sizePicker(mode, idx, sel, sizePrices) {  sel = sel || [];  sizePrices = sizePrices || {};  const isBulk = mode === 'bulk' || mode === 'batchBulk' || mode === 'batchEdit';  const previewId =    mode === 'new'       ? `sp${idx}` :    mode === 'bulk'      ? 'bulkSp' :    mode === 'batchEdit' ? `besp_${idx}` :    mode === 'batchBulk' ? 'batchBulkSp' :    `espv_${idx}`;
  const groups = SIZE_GROUPS.map((g, gi) => {    const allOn = g.sizes.every(s => sel.includes(s));    const groupPrice = g.sizes.map(s => sizePrices[s]).find(Boolean) || '';    const priceInputId = `gp_${mode}_${idx}_${gi}`;
    const chips = g.sizes.map(s => {      const on = sel.includes(s);      return `<div class="size-chip ${on?'on':''}"        data-mode="${esc(mode)}" data-idx="${idx}" data-size="${esc(s)}" data-gi="${gi}"        onclick="toggleSz(this.dataset.mode,this.dataset.idx,this.dataset.size,this,${gi})">${s}</div>`;    }).join('');
    const priceInput = !isBulk ? `      <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">        <span style="font-size:0.6rem;color:var(--text-light);">NT$</span>
        <input type="number" class="group-price-input" id="${priceInputId}" style="margin-left:0;width:100%;max-width:80px;"          placeholder="此群組價格" value="${esc(groupPrice)}"
          data-mode="${esc(mode)}" data-idx="${idx}" data-gi="${gi}"
          oninput="applyGroupPrice(this.dataset.mode,this.dataset.idx,this.dataset.gi,this.value)"
          onclick="event.stopPropagation()">
      </div>` : '';
    return `    <div class="size-group">      <div class="size-group-header">
        <div class="size-group-label">${g.label}</div>
        <div class="select-all-chip ${allOn?'on':''}"          data-mode="${esc(mode)}" data-idx="${idx}" data-gi="${gi}"
          onclick="toggleAllSizes(this.dataset.mode,this.dataset.idx,this.dataset.gi,this)">${allOn?'✓ 已全選':'全選'}</div>
      </div>
      ${priceInput}
      <div class="size-chips-wrap">${chips}</div>
    </div>`;  }).join('');
  return `<div class="size-picker">${groups}<div class="size-preview" id="${previewId}">已選：${sel.length ? sel.join(' / ') : '尚未選取'}</div></div>`;}
function applyGroupPrice(mode, idx, gi, val) {  idx = Number(idx); gi = Number(gi);  const g = SIZE_GROUPS[gi];  const sizes = _getSizes(mode, idx);  g.sizes.forEach(s => {    if (sizes.includes(s)) _setSizePrice(mode, idx, s, val);  });}
function _setSizePrice(mode, idx, size, val) {  if (mode === 'new') {    if (!editData[idx].sizePrices) editData[idx].sizePrices = {};    editData[idx].sizePrices[size] = val;    const prices = Object.values(editData[idx].sizePrices).filter(Boolean);    if (prices.length) editData[idx].price = prices[0];  } else {    const pid = mode.replace('edit_','');    const p = products.find(x => x.id === pid);    if (p) {      if (!p._editSizePrices) p._editSizePrices = {...(p.sizePrices||{})};      p._editSizePrices[size] = val;    }  }}
function _getSizes(mode, idx) {  if (mode === 'new')       return editData[idx].sizes;  if (mode === 'bulk')      return bulkSizes;  if (mode === 'batchEdit') return batchEditItems[idx].sizes;  if (mode === 'batchBulk') return batchBulkSizes;  return editingSizes;}function _getSizePrices(mode, idx) {  if (mode === 'new') return editData[idx]?.sizePrices || {};  const pid = mode.replace('edit_','');  const p = products.find(x => x.id === pid);  return p?._editSizePrices || p?.sizePrices || {};}function setSizePrice(mode, idx, size, val) {  idx = Number(idx);  _setSizePrice(mode, idx, size, val);}function _setSizes(mode, idx, arr) {  if (mode === 'new')            editData[idx].sizes = arr;  else if (mode === 'bulk')      bulkSizes = arr;  else if (mode === 'batchEdit') batchEditItems[idx].sizes = arr;  else if (mode === 'batchBulk') batchBulkSizes = arr;  else                           editingSizes = arr;}function _previewId(mode, idx) {  if (mode === 'new')       return 'sp'+idx;  if (mode === 'bulk')      return 'bulkSp';  if (mode === 'batchEdit') return 'besp_'+idx;  if (mode === 'batchBulk') return 'batchBulkSp';  return 'espv_'+idx;}function toggleSz(mode, idx, s, el, gi) {  idx = Number(idx);  let sizes = _getSizes(mode, idx);  const isOn = sizes.includes(s);  if (isOn) { sizes = sizes.filter(x => x !== s); el.classList.remove('on'); }  else {    sizes.push(s); el.classList.add('on');    if (gi !== undefined) {      const groupPriceInput = document.getElementById(`gp_${mode}_${idx}_${gi}`);      if (groupPriceInput?.value) _setSizePrice(mode, idx, s, groupPriceInput.value);    }  }  _setSizes(mode, idx, sizes);  document.getElementById(_previewId(mode, idx)).textContent = '已選：' + (sizes.length ? sizes.join(' / ') : '尚未選取');  if (mode === 'new') updateCardSummary(idx);  const groupEl = el.closest('.size-group');  const selectAllBtn = groupEl?.querySelector('.select-all-chip');  if (selectAllBtn) {    const groupSizes = Array.from(groupEl.querySelectorAll('.size-chip')).map(c => c.textContent);    const allOn = groupSizes.every(sz => sizes.includes(sz));    selectAllBtn.classList.toggle('on', allOn);    selectAllBtn.textContent = allOn ? '✓ 已全選' : '全選';  }}function toggleAllSizes(mode, idx, groupIdx, el) {  idx = Number(idx); groupIdx = Number(groupIdx);  let sizes = _getSizes(mode, idx);  const g = SIZE_GROUPS[groupIdx];  const allOn = g.sizes.every(s => sizes.includes(s));  if (allOn) {    sizes = sizes.filter(s => !g.sizes.includes(s));  } else {    g.sizes.forEach(s => { if (!sizes.includes(s)) sizes.push(s); });    const groupPriceInput = document.getElementById(`gp_${mode}_${idx}_${groupIdx}`);    if (groupPriceInput?.value) {      g.sizes.forEach(s => _setSizePrice(mode, idx, s, groupPriceInput.value));    }  }  _setSizes(mode, idx, sizes);  const groupEl = el.closest('.size-group');  groupEl.querySelectorAll('.size-chip').forEach(chip => chip.classList.toggle('on', sizes.includes(chip.textContent)));  const newAllOn = g.sizes.every(s => sizes.includes(s));  el.classList.toggle('on', newAllOn);  el.textContent = newAllOn ? '✓ 已全選' : '全選';  document.getElementById(_previewId(mode, idx)).textContent = '已選：' + (sizes.length ? sizes.join(' / ') : '尚未選取');}function removeCard(i) {  editData.splice(i, 1);  if (!editData.length) document.getElementById('editSection').style.display = 'none';  else renderEditCards();}
/* BRAND SUGGESTIONS */ function showSugg(idx, val) {  const el  = document.getElementById('bs'+idx);  const hit = brandHistory.filter(b => b.toLowerCase().includes((val||'').toLowerCase())).slice(0,6);  if (!hit.length) { el.classList.remove('open'); return; }  el.innerHTML = hit.map(b => `<div class="brand-sugg-item" onmousedown="pickBrand(${idx},'${esc(b)}')">${esc(b)}</div>`).join('');  el.classList.add('open');}function hideSugg(idx) { document.getElementById('bs'+idx)?.classList.remove('open'); }function pickBrand(idx, b) {  editData[idx].brand = b;  const inp = document.getElementById('bi'+idx);  if (inp) inp.value = b;  hideSugg(idx);}
/* SAVE */ async function saveAll() {  const newItems = editData.filter(d => d.url).map(d => {    const sp = d.sizePrices || {};    const prices = Object.values(sp).filter(Boolean);    return {      id: 'p' + Date.now() + Math.random().toString(36).slice(2,6),      url: d.url,      price: prices.length ? prices[0] : (d.price || ''),      brand: (d.brand||'').trim(),      sizes: d.sizes || [],      category: (d.category||'').trim(),      color: (d.color||'').trim(),      sizePrices: sp,      createdAt: Date.now()
    };  });  if (!newItems.length) { showToast('沒有可發佈的商品'); return; }  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }  const { error } = await sb.from(SUPABASE_TABLE).insert(newItems.map(_toRow));  if (error) { showToast('⚠️ 上架失敗：' + (error.message || error), 4000); return; }  products = [...newItems, ...products];  rebuildBrandHistory();  editData = [];  bulkSizes = [];  document.getElementById('bulkBrandInput').value = '';  document.getElementById('editSection').style.display = 'none';  document.getElementById('editCards').innerHTML = '';  const bulkCont = document.getElementById('bulkSizeContainer');  if (bulkCont) bulkCont.innerHTML = '';  renderBrandTabs();  applyFilters();  showToast(`✓ 已成功上架 ${newItems.length} 件商品！`);  _manageSubMode = 'pending';  setTimeout(() => { switchTab('manage'); renderManage(); }, 800);}
/* 匯出 / 匯入 */ function exportData() {  if (!products.length) { showToast('目前沒有商品可以匯出'); return; }  const payload = { products, brandHistory, exportedAt: new Date().toISOString() };  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });  const url  = URL.createObjectURL(blob);  const a    = document.createElement('a');  a.href = url; a.download = `jck-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();  URL.revokeObjectURL(url);  showToast(`✓ 已匯出 ${products.length} 件商品資料`);}function importData(event) {  const file = event.target.files[0];  if (!file) return;  const reader = new FileReader();  reader.onload = async (e) => {    try {      const data = JSON.parse(e.target.result);      if (!Array.isArray(data.products)) throw new Error('格式錯誤');      if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }      const existingIds = new Set(products.map(p => p.id));      const toAdd = data.products.filter(p => !existingIds.has(p.id));      if (toAdd.length) {        const rows = toAdd.map(p => _toRow({ id:p.id, url:p.url, brand:p.brand, price:p.price, sizes:p.sizes, category:p.category||'', color:p.color||'', createdAt:p.createdAt||Date.now() }));        const { error } = await sb.from(SUPABASE_TABLE).insert(rows);        if (error) { showToast('⚠️ 匯入失敗：' + (error.message || error), 4000); return; }      }      await loadProducts(); renderBrandTabs(); applyFilters(); renderManage();      showToast(`✓ 匯入完成！新增 ${toAdd.length} 件，共 ${products.length} 件商品`);    } catch (err) { showToast('⚠️ 檔案格式錯誤：' + (err.message || err), 4000); }    event.target.value = '';  };  reader.readAsText(file);}
/* PENDING PRODUCTS（待完成商品） */ let _manageSubMode = 'pending';const _pendingSaveTimers = {};const _pcardActiveField = {};const ACTIVE_FIELD_KEEP_MS = 8000;
function _markFieldActive(id, field) {  _pcardActiveField[id] = { field, expireAt: Date.now() + ACTIVE_FIELD_KEEP_MS };}function _isFieldActive(id, field) {  const a = _pcardActiveField[id];  if (!a) return false;  if (Date.now() > a.expireAt) { delete _pcardActiveField[id]; return false; }  return a.field === field;}function _clearFieldActive(id) { delete _pcardActiveField[id]; }
function _isPending(p) {  if (_userConfirmedDone[p.id]) return false;  if (!p.brand || !p.brand.trim()) return true;  if (!p.sizes || !p.sizes.length) return true;  const hasGroupPrice = p.sizePrices && Object.values(p.sizePrices).some(v => String(v||'').trim());  if (!hasGroupPrice && !(p.price && String(p.price).trim())) return true;  return false;}
function _hasSomePrice(p) {  if (p.sizePrices && Object.values(p.sizePrices).some(v => String(v||'').trim())) return true;  if (p.price && String(p.price).trim()) return true;  return false;}function _hasAllSelectedSizesPriced(p) {  if (!p.sizes || !p.sizes.length) return false;  if (!p.sizePrices) return !!(p.price && String(p.price).trim());  return p.sizes.every(s => {    if (p.sizePrices[s] && String(p.sizePrices[s]).trim()) return true;    if (p.price && String(p.price).trim()) return true;    return false;  });}
function _missingFields(p) {  const miss = [];  if (!p.brand    || !p.brand.trim())    miss.push('品牌');  const hasSize  = !!(p.sizes && p.sizes.length);  const hasPrice = _hasSomePrice(p);  if (!hasSize && !hasPrice) miss.push('尺寸與價格');  else if (!hasSize)         miss.push('尺寸');  else if (!hasPrice)        miss.push('價格');  else if (!_hasAllSelectedSizesPriced(p)) miss.push('部分尺寸的價格');  return miss;}
const _userConfirmedDone = {};
function switchManageSub(mode) {  _manageSubMode = mode;  document.getElementById('msubPending').classList.toggle('active', mode === 'pending');  document.getElementById('msubAll').classList.toggle('active', mode === 'all');  document.getElementById('manage-pending').style.display = (mode === 'pending') ? 'block' : 'none';  document.getElementById('manage-all').style.display     = (mode === 'all')     ? 'block' : 'none';  if (mode === 'pending') renderPending();  else renderManage();}
function _updatePendingBadge() {  const badge = document.getElementById('pendingBadge');  if (!badge) return;  const n = products.filter(_isPending).length;  badge.textContent = n;  badge.classList.toggle('zero', n === 0);}
function renderPending() {  _updatePendingBadge();  const dl = document.getElementById('pcardBrandList');  if (dl) dl.innerHTML = brandHistory.map(b => `<option value="${esc(b)}">`).join('');  const list = document.getElementById('pendingList');  const none = document.getElementById('noPending');  const hint = document.getElementById('pendingHint');  if (!list) return;
  const pending = products.filter(_isPending);  if (!pending.length) {    list.innerHTML = '';    none.style.display = 'block';    if (hint) hint.style.display = 'none';    return;  }  none.style.display = 'none';  if (hint) hint.style.display = 'block';
  const groups = {};  pending.forEach(p => {    const key = (p.brand || '').trim() || '__nobrand__';    if (!groups[key]) groups[key] = [];    groups[key].push(p);  });  const orderedKeys = Object.keys(groups).sort((a, b) => {    if (a === '__nobrand__') return -1;    if (b === '__nobrand__') return 1;    return a.localeCompare(b, 'zh-Hant');  });
  list.innerHTML = orderedKeys.map(key => {    const items = groups[key];    const isNoBrand = key === '__nobrand__';    return `      <div class="pending-brand-group">        <div class="pending-brand-header">          <span class="pending-brand-name${isNoBrand?' empty':''}">${isNoBrand ? '（待設定品牌）' : esc(key)}</span>          <span class="pending-brand-count">${items.length} 件</span>        </div>        <div class="pending-grid">          ${items.map(p => _renderPendingCard(p)).join('')}        </div>      </div>`;  }).join('');}
function _renderPendingCard(p) {  const colorArr = (p.color||'').split('/').map(s => s.trim()).filter(Boolean);  const sizes = p.sizes || [];  const sp = p.sizePrices || {};
  const hasBrand    = !!(p.brand    && p.brand.trim());  const hasCategory = !!(p.category && p.category.trim());  const hasColor    = !!(p.color    && p.color.trim());  const hasSize     = sizes.length > 0;  const hasPrice    = _hasSomePrice(p);  const allSizesPriced = _hasAllSelectedSizesPriced(p);
  const missingMap = {    brand:    !hasBrand,    category: false,    sizes:    !hasSize || !hasPrice || !allSizesPriced,  };  const showOnTopMap = {    brand:    missingMap.brand    || _isFieldActive(p.id, 'brand'),    category: _isFieldActive(p.id, 'category'),
    sizes:    missingMap.sizes    || _isFieldActive(p.id, 'sizes'),
  };  const filledKeys = Object.keys(showOnTopMap).filter(k => !showOnTopMap[k]);  const missingCount = Object.values(missingMap).filter(Boolean).length;
  const colorChips = COLOR_LIST.map(c => {    const on = colorArr.includes(c);    return `<span class="pcard-chip${on?' on':''}" onclick="pcardToggleColor('${esc(p.id)}','${esc(c)}',this)">${esc(c)}</span>`;  }).join('');
  const catOptions = ['<option value="">— 選擇品項 —</option>']    .concat(CATEGORY_LIST.map(c => `<option value="${esc(c)}"${(p.category===c)?' selected':''}>${esc(c)}</option>`))    .join('');
  const sizeGroupsHtml = SIZE_GROUPS.map((g, gi) => {    const chips = g.sizes.map(s => {      const on = sizes.includes(s);      return `<span class="pcard-size-chip${on?' on':''}" onclick="pcardToggleSize('${esc(p.id)}','${esc(s)}',${gi},this)">${esc(s)}</span>`;    }).join('');    const groupPrice = g.sizes.map(s => sp[s]).find(v => v && String(v).trim()) || '';    const hasAnyOn = g.sizes.some(s => sizes.includes(s));    const unpricedInGroup = g.sizes.filter(s => sizes.includes(s) && !(sp[s] && String(sp[s]).trim()));    const groupNeedsPrice = hasAnyOn && (!groupPrice || unpricedInGroup.length);    return `      <div class="pcard-size-group${hasAnyOn ? ' has-selected' : ''}">        <div class="pcard-size-group-row">          <span class="pcard-size-label">${g.label}</span>
          ${chips}
        </div>
        ${hasAnyOn ? `          <div class="pcard-price-row${groupNeedsPrice ? ' need-price' : ''}">            <span class="nt">NT$</span>
            <input type="number" inputmode="numeric" pattern="[0-9]*" class="pcard-price-input${groupPrice?'':' empty'}"              value="${esc(groupPrice)}"
              placeholder="${groupNeedsPrice ? '⚠ 此尺寸組未填價格' : '此尺寸組的價格'}"
              onchange="pcardSetGroupPrice('${esc(p.id)}',${gi},this.value)">
          </div>` : ''}
      </div>`;  }).join('');
  const fieldsHtml = {    brand: `      <div class="pcard-field" data-field="brand">        <label class="pcard-field-label${missingMap.brand?' missing':''}">🏷 品牌</label>
        <input type="text" class="pcard-input${missingMap.brand?' empty':''}"          value="${esc(p.brand||'')}"
          placeholder="例：Bebeholic"
          list="pcardBrandList"
          onchange="pcardSetField('${esc(p.id)}','brand',this.value)">
      </div>`,    category: `      <div class="pcard-field" data-field="category">        <label class="pcard-field-label${missingMap.category?' missing':''}">📦 品項（選填）</label>
        <select class="pcard-select${missingMap.category?' empty':''}"          onchange="pcardSetField('${esc(p.id)}','category',this.value)">
          ${catOptions}
        </select>
      </div>`,    color: `      <div class="pcard-field" data-field="color">        <label class="pcard-field-label${missingMap.color?' missing':''}">🎨 顏色（可複選）</label>
        <div class="pcard-color-chips">${colorChips}</div>
        <input type="text" class="pcard-input"          placeholder="或手動輸入（用 / 分隔）"
          value="${esc(colorArr.filter(c => !COLOR_LIST.includes(c)).join('/'))}"
          onchange="pcardSetColorManual('${esc(p.id)}',this.value)">
      </div>`,    sizes: `      <div class="pcard-field" data-field="sizes">        <label class="pcard-field-label${missingMap.sizes?' missing':''}">📐 尺寸 + 💰 價格</label>
        ${sizeGroupsHtml}
      </div>`,  };
  const missingFieldsHtml = Object.keys(showOnTopMap).filter(k => showOnTopMap[k]).map(k => fieldsHtml[k]).join('');  const filledFieldsHtml = filledKeys.map(k => fieldsHtml[k]).join('');
  const missLabels = [];  if (missingMap.brand)    missLabels.push('品牌');  if (missingMap.sizes) {    if (!hasSize && !hasPrice) missLabels.push('尺寸與價格');    else if (!hasSize)         missLabels.push('尺寸');    else if (!hasPrice)        missLabels.push('價格');    else if (!allSizesPriced)  missLabels.push('部分尺寸的價格');  }
  const topBar = missLabels.length ? `    <div class="pcard-top-alert">      <span class="pcard-top-alert-icon">⚠</span>
      <span>還缺：<strong>${missLabels.join('、')}</strong></span>
    </div>` : `    <button class="pcard-top-alert ok done-btn" onclick="pcardConfirmDone('${esc(p.id)}')">      <span class="done-btn-line1">✓ 已完成全部欄位</span>
      <span class="done-btn-line2">點此移到全部商品 →</span>
    </button>`;
  return `    <div class="pending-card" id="pcard_${esc(p.id)}">      <div class="pcard-img-wrap">        <img class="pcard-img" src="${esc(imgUrl(p.url||'', 400))}" data-fullurl="${esc(p.url||'')}" onerror="this.onerror=null; if(this.dataset.fullurl && this.src!==this.dataset.fullurl){_imgUrlOnFail(this,this.dataset.fullurl);} else {this.src=FALLBACK_IMG;}" alt="">
        ${missingCount ? `<span class="pcard-missing-badge ${missingCount >= 3 ? '' : 'few'}">缺 ${missingCount} 項</span>` : ''}
        <span class="pcard-saved-flash" id="pcard_flash_${esc(p.id)}">✓ 已儲存</span>
        <button class="pcard-add-sibling" onclick="pcardAddSibling('${esc(p.id)}')" title="這張照片還有其他商品（例如上衣+褲子）">
          ➕ 同圖再加一件
        </button>
      </div>
      ${topBar}
      <div class="pcard-body">
        ${missingFieldsHtml}
        ${filledKeys.length ? `          <div class="pcard-filled-section">            <button class="pcard-filled-toggle" onclick="pcardToggleFilled('${esc(p.id)}',this)">              <span class="pcard-filled-arrow">▶</span>
              <span>選填／已填寫 ${filledKeys.length} 項（點擊展開）</span>
            </button>
            <div class="pcard-filled-fields" style="display:none;">
              ${filledFieldsHtml}
            </div>
          </div>` : ''}
      </div>
      <div class="pcard-footer">
        <div class="pcard-status" id="pcard_status_${esc(p.id)}" style="opacity:0.5;font-size:0.65rem;">填完欄位會自動儲存</div>
        <button class="pcard-del-btn" onclick="pcardDelete('${esc(p.id)}')" title="刪除">🗑</button>
      </div>
    </div>`;}
function pcardConfirmDone(id) {  _userConfirmedDone[id] = true;  _clearFieldActive(id);  const card = document.getElementById('pcard_' + id);  if (card) {    card.classList.add('complete');    setTimeout(() => {      renderPending();      applyFilters();      showToast('✓ 已移到全部商品');    }, 600);  }}
function pcardToggleFilled(id, btn) {  const section = btn.parentElement;  const fields = section.querySelector('.pcard-filled-fields');  const arrow = btn.querySelector('.pcard-filled-arrow');  const isOpen = fields.style.display !== 'none';  fields.style.display = isOpen ? 'none' : 'block';  arrow.textContent = isOpen ? '▶' : '▼';}
function pcardToggleColor(id, color, el) {  const p = products.find(x => x.id === id);  if (!p) return;  _markFieldActive(id, 'color');  const arr = (p.color||'').split('/').map(s => s.trim()).filter(Boolean);  const i = arr.indexOf(color);  if (i >= 0) arr.splice(i, 1); else arr.push(color);  p.color = arr.join('/');  el.classList.toggle('on');  _pcardScheduleSave(id, { color: p.color });}
function pcardSetColorManual(id, val) {  const p = products.find(x => x.id === id);  if (!p) return;  _markFieldActive(id, 'color');  const arr = (p.color||'').split('/').map(s => s.trim()).filter(Boolean);  const kept = arr.filter(c => COLOR_LIST.includes(c));  const manual = (val||'').split('/').map(s => s.trim()).filter(Boolean);  const merged = [...new Set([...kept, ...manual])];  p.color = merged.join('/');  _pcardScheduleSave(id, { color: p.color });}
function pcardToggleSize(id, size, gi, el) {  const p = products.find(x => x.id === id);  if (!p) return;  _markFieldActive(id, 'sizes');  if (!p.sizes) p.sizes = [];  const i = p.sizes.indexOf(size);  if (i >= 0) {    p.sizes.splice(i, 1);    if (p.sizePrices) delete p.sizePrices[size];  } else {    p.sizes.push(size);  }  el.classList.toggle('on');  _pcardScheduleSave(id, { sizes: p.sizes, price_groups: p.sizePrices || {} }, true);}
function pcardSetGroupPrice(id, gi, val) {  const p = products.find(x => x.id === id);  if (!p) return;  _markFieldActive(id, 'sizes');  if (!p.sizePrices) p.sizePrices = {};  const g = SIZE_GROUPS[gi];  g.sizes.forEach(s => {    if ((p.sizes||[]).includes(s)) p.sizePrices[s] = val;  });  const firstPrice = (p.sizes||[]).map(s => p.sizePrices[s]).find(v => v && String(v).trim());  if (firstPrice) p.price = firstPrice;  _pcardScheduleSave(id, { price_groups: p.sizePrices, price: p.price || '' });}
function pcardSetField(id, field, val) {  const p = products.find(x => x.id === id);  if (!p) return;  _markFieldActive(id, field);  p[field] = (val||'').trim();  const patch = { [field]: p[field] };  _pcardScheduleSave(id, patch);}
async function pcardAddSibling(id) {  const src = products.find(x => x.id === id);  if (!src) return;  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }  const newId = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);  const copiedSizes  = Array.isArray(src.sizes) ? [...src.sizes] : [];  const copiedPrices = (src.sizePrices && typeof src.sizePrices === 'object') ? {...src.sizePrices} : {};  const copiedPrice  = src.price || '';  const newRow = {    id:           newId,    url:          src.url,    brand:        src.brand || '',    category:     '',    color:        '',    sizes:        copiedSizes,    price:        copiedPrice,    price_groups: copiedPrices,    created_at:   Date.now()
  };  const { error } = await sb.from(SUPABASE_TABLE).insert([newRow]);  if (error) { showToast('⚠️ 新增失敗：' + (error.message||error), 4000); return; }  const newProd = {    id:         newId,    url:        src.url,    brand:      src.brand || '',    category:   '',    color:      '',    sizes:      copiedSizes,    price:      copiedPrice,    sizePrices: copiedPrices,    createdAt:  newRow.created_at
  };  const srcIdx = products.findIndex(x => x.id === id);  products.splice(srcIdx + 1, 0, newProd);  rebuildBrandHistory();  renderBrandTabs();  applyFilters();  renderPending();  showToast('✓ 已新增同圖商品（已複製品牌與尺寸，請填寫品項與顏色）');  setTimeout(() => {    const card = document.getElementById('pcard_' + newId);    if (card) {      card.scrollIntoView({ behavior: 'smooth', block: 'center' });      card.style.transition = 'box-shadow 0.4s';      card.style.boxShadow = '0 0 0 3px var(--blush)';      setTimeout(() => card.style.boxShadow = '', 1400);    }  }, 100);}
async function pcardDelete(id) {  if (!confirm('確定要刪除此商品？')) return;  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }  const { error } = await sb.from(SUPABASE_TABLE).delete().eq('id', id);  if (error) { showToast('⚠️ 刪除失敗：' + (error.message||error), 4000); return; }  const i = products.findIndex(x => x.id === id);  if (i >= 0) products.splice(i, 1);  rebuildBrandHistory();  renderBrandTabs(); applyFilters();  renderPending();  showToast('✓ 已刪除');}
function _pcardScheduleSave(id, patch, rerender) {  const statusEl = document.getElementById('pcard_status_' + id);  if (statusEl) { statusEl.textContent = '儲存中…'; statusEl.className = 'pcard-status saving'; }  if (_pendingSaveTimers[id]) clearTimeout(_pendingSaveTimers[id]);  _pendingSaveTimers[id] = setTimeout(() => _pcardCommitSave(id, patch, rerender), 500);}
async function _pcardCommitSave(id, patch, rerender) {  const p = products.find(x => x.id === id);  if (!p || !sb) return;  const flashEl  = document.getElementById('pcard_flash_' + id);  const fullPatch = {    brand:        p.brand || '',    category:     p.category || '',    color:        p.color || '',    sizes:        p.sizes || [],    price_groups: p.sizePrices || {},    price:        p.price || '',    ...patch
  };  const { error } = await sb.from(SUPABASE_TABLE).update(fullPatch).eq('id', id);  if (error) {    const statusEl = document.getElementById('pcard_status_' + id);    if (statusEl) { statusEl.textContent = '⚠ 儲存失敗：' + (error.message||error); statusEl.className = 'pcard-status error'; }    return;  }  rebuildBrandHistory();  if (flashEl) {    flashEl.classList.add('show');    setTimeout(() => flashEl.classList.remove('show'), 1200);  }  _rerenderSinglePcard(id);  applyFilters();  _updatePendingBadge();}
function _rerenderSinglePcard(id) {  const p = products.find(x => x.id === id);  if (!p) return;  const card = document.getElementById('pcard_' + id);  if (!card) return;  const wasOpen = card.querySelector('.pcard-filled-fields')?.style.display === 'block';  const newHtml = _renderPendingCard(p);  const wrap = document.createElement('div');  wrap.innerHTML = newHtml.trim();  card.replaceWith(wrap.firstChild);  if (wasOpen) {    const newCard = document.getElementById('pcard_' + id);    const btn = newCard?.querySelector('.pcard-filled-toggle');    if (btn) pcardToggleFilled(id, btn);  }}
/* MANAGE TAB */ function renderManage() {  const batch = document.getElementById('batchSection');  const cont  = document.getElementById('existingProds');  const none  = document.getElementById('noProd');  const cntEl = document.getElementById('prodCount');  if (cntEl) cntEl.textContent = products.length;  _updatePendingBadge();  if (!cont) return;  if (!products.length) {    if (batch) batch.innerHTML = '';    cont.innerHTML = ''; if (none) none.style.display = 'block';    batchMode = false; batchEditing = false; return;  }  if (none) none.style.display = 'none';  if (batch) {    if (batchMode) batch.innerHTML = renderBatchActionBar() + (batchEditing ? renderBatchModifyPanel() : '');    else batch.innerHTML = `<button class="batch-toggle-btn" onclick="toggleBatchMode()">🗂 批量管理（多選刪除 / 修改）</button>`;  }  const displayProducts = (batchMode && _batchBrandFilter)    ? products.filter(p => (p.brand||'').trim() === _batchBrandFilter)    : products;
  if (batchEditing) {    const allBatchHtml = `      <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;flex-wrap:wrap;">        <label style="font-size:0.78rem;color:var(--text-soft);display:flex;align-items:center;gap:4px;cursor:pointer;">
          <input type="checkbox" id="bmCardSelectAll" onchange="toggleBmCardSelectAll(this.checked)" style="accent-color:var(--warm-brown);">全選
        </label>
        <span style="font-size:0.72rem;color:var(--text-light);" id="bmCardSelectedCount">已勾選 0 / ${batchEditItems.length} 件</span>
        <button class="add-item-btn" onclick="applyBmToSelected('category')" style="font-size:0.72rem;">套用品項至勾選</button>
        <button class="add-item-btn" onclick="applyBmToSelected('sizes')" style="font-size:0.72rem;">套用尺寸至勾選</button>
        <button class="batch-btn batch-btn-del" onclick="deleteBmSelected()" style="font-size:0.72rem;padding:4px 12px;margin-left:auto;">🗑 刪除勾選</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;" class="bm-edit-grid">      ${products.filter(p => batchSelected.has(p.id)).map((p, visIdx) => {        const d = batchEditItems.find(d => d.id === p.id);        if (!d) return '';        const idx = batchEditItems.indexOf(d);        const isRowStart = (visIdx % 6 === 0);
        const rowIndex = Math.floor(visIdx / 6);
        const rowSelectHtml = isRowStart ? `
          <label title="勾選／取消這一整排（6件）" onclick="event.stopPropagation()"
            style="position:absolute;top:0;left:0;z-index:4;background:rgba(139,110,82,0.92);color:#fff;padding:2px 6px;border-bottom-right-radius:8px;display:inline-flex;align-items:center;gap:3px;font-size:0.62rem;cursor:pointer;user-select:none;box-shadow:0 1px 4px rgba(0,0,0,0.2);">
            <input type="checkbox" class="bm-row-cb" data-row="${rowIndex}"
              onchange="toggleBmRowByCheckbox(${rowIndex}, this.checked)"
              style="width:13px;height:13px;accent-color:#fff;cursor:pointer;margin:0;">
            <span>整排</span>
          </label>` : '';
        return `<div class="edit-card" id="bmcard_${idx}" style="cursor:default;position:relative;">          ${rowSelectHtml}
          <input type="checkbox" class="bm-card-cb" data-idx="${idx}" data-vis="${visIdx}"
            onchange="updateBmCardSelectedCount()"
            style="position:absolute;top:${isRowStart ? '24px' : '6px'};left:6px;z-index:2;width:18px;height:18px;accent-color:var(--warm-brown);cursor:pointer;">
          <div class="edit-card-img-wrap" style="aspect-ratio:1/1;">
            <img class="edit-card-img" src="${imgUrl(p.url, 300)}" data-fullurl="${esc(p.url||'')}" onerror="this.onerror=null; if(this.dataset.fullurl && this.src!==this.dataset.fullurl){_imgUrlOnFail(this,this.dataset.fullurl);} else {this.src=FALLBACK_IMG;}" alt="">
          </div>
          <div class="edit-card-fields" style="padding:8px;gap:5px;">
            <div style="font-size:0.7rem;font-weight:500;color:var(--text-main);">${esc(p.brand||'')}${d.category?' · '+esc(d.category):''}</div>
            <div id="bm_meta_${idx}" style="font-size:0.65rem;color:var(--text-soft);">${d.color?esc(d.color):'未選顏色'}${d.sizes?.length?' · '+d.sizes.join('/'):''}</div>

            <div id="bm_prices_${idx}">              ${_renderBmPriceInputs(idx, d)}
            </div>
            <div style="margin-top:2px;padding-top:5px;border-top:1px dashed var(--cream-mid);display:flex;flex-direction:column;gap:4px;">
              <label style="display:flex;align-items:center;gap:4px;font-size:0.68rem;color:#C0614A;font-weight:500;cursor:pointer;user-select:none;">
                <input type="checkbox" ${d.isGroupBuy ? 'checked' : ''}
                  onchange="bmToggleGroupBuy(${idx}, this.checked)"
                  style="width:14px;height:14px;accent-color:#C0614A;cursor:pointer;">
                <span>🔥 開團商品</span>
              </label>
              <div id="bm_gb_wrap_${idx}" style="display:${d.isGroupBuy ? 'flex' : 'none'};align-items:center;gap:3px;background:#FFF6F3;border:1px solid #F0C4B8;border-radius:6px;padding:3px 6px;">
                <span style="font-size:0.64rem;color:#C0614A;white-space:nowrap;">團購$</span>
                <input type="number" inputmode="numeric" placeholder="特價" value="${esc(d.groupPrice || '')}"
                  oninput="bmSetGroupBuyPrice(${idx}, this.value)"
                  style="width:100%;min-width:0;border:none;background:transparent;font-size:0.72rem;color:#C0614A;font-weight:600;outline:none;text-align:center;">
              </div>
            </div>
          </div>
        </div>`;      }).join('')}
    </div>`;    cont.innerHTML = allBatchHtml;    return;  }
  cont.innerHTML = displayProducts.map((p, listIdx) => {    if (!batchMode && editingProdId === p.id) return renderEditingProd(p);    if (batchMode) {
      const selected = batchSelected.has(p.id);
      let rowHeader = '';
      if (listIdx % 6 === 0) {
        const rowIndex = Math.floor(listIdx / 6);
        const rowSlice = displayProducts.slice(listIdx, listIdx + 6);
        const allRowOn = rowSlice.length > 0 && rowSlice.every(item => batchSelected.has(item.id));
        rowHeader = `<div style="display:flex;align-items:center;justify-content:space-between;background:var(--cream-dark);padding:5px 10px;border-radius:8px;margin:${listIdx===0?'0':'10px'} 0 6px;border:1px solid var(--cream-mid);">
          <button type="button" class="add-item-btn" style="padding:3px 12px;font-size:0.72rem;${allRowOn?'background:var(--warm-brown);color:var(--white);border-color:var(--warm-brown);':'background:var(--white);'}" onclick="toggleManageListRow(${listIdx}, 6)">${allRowOn ? '✓ 已勾選整排' : '☑ 整排勾選'}</button>
          <span style="font-size:0.72rem;color:var(--text-soft);">第 ${rowIndex + 1} 排（第 ${listIdx + 1} ~ ${listIdx + rowSlice.length} 件）</span>
        </div>`;
      }
      return rowHeader + `        <div class="ep batch-row ${selected?'selected':''}" onclick="toggleBatchSelect('${p.id}', event)">          <input type="checkbox" class="ep-checkbox" ${selected?'checked':''}>
          <img src="${imgUrl(p.url, 200)}" data-fullurl="${esc(p.url||'')}" onerror="this.onerror=null; if(this.dataset.fullurl && this.src!==this.dataset.fullurl){_imgUrlOnFail(this,this.dataset.fullurl);} else {this.src=FALLBACK_IMG;}" alt="">
          <div class="ep-info">
            <div class="ep-brand">${p.brand ? esc(p.brand) : '（未設定品牌）'}${p.category?' ・ '+esc(p.category):''}${p.isGroupBuy ? ` <span style="background:#C0614A;color:#fff;font-size:0.65rem;padding:1px 6px;border-radius:8px;margin-left:4px;">🔥 開團 NT$${esc(p.groupPrice||'')}</span>` : ''}</div>
            <div class="ep-meta">${p.price?'NT$'+esc(p.price):'未定價'}${p.color?' ・ '+esc(p.color):''}${(p.sizes||[]).length?' ・ '+esc(p.sizes.join('/')):''}</div>
          </div>
          <button class="edit-btn-sm" onclick="event.stopPropagation();toggleBatchMode();startEditProd('${p.id}')" title="個別編輯">✏️</button>
        </div>`;    }    return `      <div class="ep">        <img src="${imgUrl(p.url, 200)}" data-fullurl="${esc(p.url||'')}" onerror="this.onerror=null; if(this.dataset.fullurl && this.src!==this.dataset.fullurl){_imgUrlOnFail(this,this.dataset.fullurl);} else {this.src=FALLBACK_IMG;}" alt="">
        <div class="ep-info">
          <div class="ep-brand">${p.brand ? esc(p.brand) : '（未設定品牌）'}${p.category?' ・ '+esc(p.category):''}${p.isGroupBuy ? ` <span style="background:#C0614A;color:#fff;font-size:0.65rem;padding:1px 6px;border-radius:8px;margin-left:4px;">🔥 開團 NT$${esc(p.groupPrice||'')}</span>` : ''}</div>
          <div class="ep-meta">${p.price?'NT$'+esc(p.price):'未定價'}${p.color?' ・ '+esc(p.color):''}${(p.sizes||[]).length?' ・ '+esc(p.sizes.join('/')):''}</div>
        </div>
        <button class="edit-btn-sm" onclick="startEditProd('${p.id}')" title="編輯">✏️</button>
        <button class="edit-btn-sm" onclick="downloadCard('${p.id}')" title="下載圖卡" style="color:var(--warm-brown);">⬇️</button>
        <button class="del-btn" onclick="delProd('${p.id}')" title="刪除">🗑</button>
      </div>`;  }).join('');}function renderBatchActionBar() {  const total = products.length, selected = batchSelected.size;  const allChecked = selected === total && total > 0;  const brands = uniqueBrands();  const brandChipsHTML = brands.length ? `    <div class="batch-brand-chips-wrap">      <div class="batch-brand-chips-label">🏷 依品牌快速選取</div>
      <div class="batch-brand-chips">
        ${brands.map(b => {          const brandIds = products.filter(p => (p.brand||'').trim() === b).map(p => p.id);          const allSelected = brandIds.length > 0 && brandIds.every(id => batchSelected.has(id));          const isFiltered = _batchBrandFilter === b;          return `<div class="batch-brand-chip ${allSelected?'on':''}" onclick="toggleSelectBrand('${esc(b)}')"            style="${isFiltered?'border-color:var(--warm-brown);box-shadow:0 0 0 1.5px var(--warm-brown);':''}">
            ${allSelected?'✓ ':''}${esc(b)}<span class="batch-brand-chip-count">(${brandIds.length})</span>
          </div>`;        }).join('')}
      </div>
    </div>` : '';  return `<div class="batch-action-bar">    <label><input type="checkbox" ${allChecked?'checked':''} onchange="toggleSelectAll()"><span>全選</span></label>
    <div class="batch-count">已選 <strong>${selected}</strong> / ${total} 件</div>
    
    <button class="batch-btn batch-btn-edit" onclick="openBatchModify()">✏️ 批量修改</button>
    <button class="batch-btn batch-btn-del" onclick="batchDelete()">🗑 批量刪除</button>
    <button class="batch-btn batch-btn-cancel" onclick="toggleBatchMode()">✕ 取消</button>
  </div>${brandChipsHTML}`;}let _batchBrandFilter = null;
function toggleSelectBrand(brand) {  const brandIds = products.filter(p => (p.brand||'').trim() === brand).map(p => p.id);  if (!brandIds.length) return;  const allSelected = brandIds.every(id => batchSelected.has(id));  if (allSelected) brandIds.forEach(id => batchSelected.delete(id));  else brandIds.forEach(id => batchSelected.add(id));  _batchBrandFilter = (_batchBrandFilter === brand) ? null : brand;  renderManage();}function renderBatchModifyPanel() {  const count = batchEditItems.length;  const allSelectedSizes = [...new Set(batchEditItems.flatMap(d => d.sizes||[]))];  return `<div class="batch-modify-panel">    <div class="bulk-bar" style="margin-bottom:8px;">      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div class="bulk-bar-title" style="margin-bottom:0;">👗 品項</div>
        <button class="bulk-apply-btn" onclick="applyBmToSelected('category')">套用至勾選</button>
      </div>
      <div class="option-chips" id="bmCategoryChips">
        ${CATEGORY_LIST.map(c => `<div class="option-chip" style="font-size:0.72rem;"          onclick="selectBmCategory('${esc(c)}',this)">${esc(c)}</div>`).join('')}
      </div>
    </div>
    <div class="bulk-bar" style="margin-bottom:8px;">      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div class="bulk-bar-title" style="margin-bottom:0;">📐 尺寸</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <input type="number" inputmode="numeric" id="bmUnifiedPrice" class="field-input" placeholder="統一價格" style="width:90px;font-size:0.78rem;padding:4px 8px;">
          <button class="bulk-apply-btn" onclick="applyBmUnifiedPrice()">統一套用</button>
          <button class="bulk-apply-btn" onclick="applyBmToSelected('sizes')">套用至勾選</button>
        </div>
      </div>

      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px;">
        ${SIZE_GROUPS.map((g,gi) => `<div class="option-chip" style="font-size:0.72rem;"          onclick="toggleBmSizeGroupAll(${gi},this)">${g.label}</div>`).join('')}
      </div>
      <div class="size-chips-wrap" id="bmSizeChips">
        ${SIZE_GROUPS.flatMap(g => g.sizes).map(s => {          const on = allSelectedSizes.includes(s);          return `<div class="size-chip ${on?'on':''}" onclick="toggleBmSingleSize('${esc(s)}',this)">${s}</div>`;        }).join('')}
      </div>
      <div style="font-size:0.68rem;color:var(--soft-brown);margin-top:5px;" id="bmSizePreview">
        已選：${allSelectedSizes.length ? allSelectedSizes.join(' / ') : '尚未選取'}
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">      <div class="brand-wrap" style="flex:1;">
        <input class="field-input" type="text" id="bmBulkBrand" placeholder="品牌 → 一鍵套用全部"
          autocomplete="off" oninput="showBmBulkBrandSugg(this.value)" onfocus="showBmBulkBrandSugg(this.value)"
          onblur="setTimeout(hideBmBulkBrandSugg,180)">
        <div class="brand-sugg" id="bmBulkBrandSugg"></div>
      </div>
      <button class="bulk-apply-btn" onclick="applyBmBulkBrand()">套用品牌</button>
    </div>
    <div class="batch-modify-actions">      <button class="ep-btn ep-cancel-btn" onclick="cancelBatchModify()">取消</button>
      <button class="ep-btn ep-save-btn" onclick="saveBatchEditAll()">💾 儲存 ${count} 件</button>
    </div>
  </div>`;}

function toggleBmRow(rowIdx) {
  const cbs = [...document.querySelectorAll('.bm-card-cb')];
  const slice = cbs.slice(rowIdx * 6, (rowIdx + 1) * 6);
  if (!slice.length) return;
  const allChecked = slice.every(cb => cb.checked);
  slice.forEach(cb => { cb.checked = !allChecked; });
  updateBmCardSelectedCount();
}
function toggleManageListRow(startIdx, count) {
  const displayList = (batchMode && _batchBrandFilter)
    ? products.filter(p => (p.brand||'').trim() === _batchBrandFilter)
    : products;
  const slice = displayList.slice(startIdx, startIdx + count);
  if (!slice.length) return;
  const allOn = slice.every(p => batchSelected.has(p.id));
  slice.forEach(p => {
    if (allOn) batchSelected.delete(p.id);
    else batchSelected.add(p.id);
  });
  renderManage();
}
function selectNextBatchRow(count) {
  const displayList = (batchMode && _batchBrandFilter)
    ? products.filter(p => (p.brand||'').trim() === _batchBrandFilter)
    : products;
  let startIdx = 0;
  if (_lastBatchClickId) {
    const found = displayList.findIndex(p => p.id === _lastBatchClickId);
    if (found >= 0) startIdx = found + 1;
  } else {
    const firstUnselected = displayList.findIndex(p => !batchSelected.has(p.id));
    startIdx = firstUnselected >= 0 ? firstUnselected : 0;
  }
  const slice = displayList.slice(startIdx, startIdx + count);
  if (!slice.length) { showToast('已選到最後一排囉！'); return; }
  slice.forEach(p => batchSelected.add(p.id));
  _lastBatchClickId = slice[slice.length - 1].id;
  renderManage();
  showToast(`✓ 已加選第 ${startIdx + 1} ~ ${startIdx + slice.length} 件`);
}


function toggleBmRowByCheckbox(rowIdx, checked) {
  const cbs = [...document.querySelectorAll('.bm-card-cb')];
  const slice = cbs.slice(rowIdx * 6, (rowIdx + 1) * 6);
  slice.forEach(cb => { cb.checked = checked; });
  updateBmCardSelectedCount();
}
function bmToggleGroupBuy(idx, checked) {
  if (!batchEditItems[idx]) return;
  batchEditItems[idx].isGroupBuy = checked;
  const wrap = document.getElementById('bm_gb_wrap_' + idx);
  if (wrap) wrap.style.display = checked ? 'flex' : 'none';
}
function bmSetGroupBuyPrice(idx, val) {
  if (!batchEditItems[idx]) return;
  batchEditItems[idx].groupPrice = (val || '').trim();
}

function toggleBmCardSelectAll(checked) {  document.querySelectorAll('.bm-card-cb').forEach(cb => cb.checked = checked);  updateBmCardSelectedCount();}function updateBmCardSelectedCount() {
  const cbs = [...document.querySelectorAll('.bm-card-cb')];
  const total = cbs.length;
  const selected = cbs.filter(cb => cb.checked).length;
  const el = document.getElementById('bmCardSelectedCount');
  if (el) el.textContent = `已勾選 ${selected} / ${total} 件`;
  document.querySelectorAll('.bm-row-cb').forEach(rcb => {
    const r = Number(rcb.dataset.row);
    const slice = cbs.slice(r * 6, (r + 1) * 6);
    rcb.checked = slice.length > 0 && slice.every(cb => cb.checked);
  });
}
async function deleteBmSelected() {
  const checked = [...document.querySelectorAll('.bm-card-cb:checked')];
  if (!checked.length) { showToast('請先勾選要刪除的商品'); return; }
  const idxs = checked.map(cb => Number(cb.dataset.idx)).filter(i => batchEditItems[i]);
  const targetIds = idxs.map(i => batchEditItems[i].id);
  if (!targetIds.length) return;
  if (!confirm(`確定要刪除已勾選的 ${targetIds.length} 件商品嗎？\n此操作會直接從資料庫移除且無法復原。`)) return;
  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }

  const { error } = await sb.from(SUPABASE_TABLE).delete().in('id', targetIds);
  if (error) { showToast('⚠️ 刪除失敗：' + (error.message || error), 4000); return; }

  const delSet = new Set(targetIds);
  products = products.filter(p => !delSet.has(p.id));
  batchEditItems = batchEditItems.filter(d => !delSet.has(d.id));
  targetIds.forEach(id => batchSelected.delete(id));

  rebuildBrandHistory();
  if (!batchEditItems.length) {
    batchMode = false;
    _resetBatchState();
    _batchBrandFilter = null;
    document.getElementById('floatSaveBtn')?.classList.remove('visible');
  }
  renderBrandTabs();
  applyFilters();
  renderManage();
  showToast(`✓ 已刪除 ${targetIds.length} 件商品`);
}

function applyBmToSelected(field) {  const checked = [...document.querySelectorAll('.bm-card-cb:checked')];  if (!checked.length) { showToast('請先勾選要套用的商品'); return; }  const idxs = checked.map(cb => Number(cb.dataset.idx));  if (field === 'category') {    const val = document.querySelector('#bmCategoryChips .option-chip.on')?.textContent;    if (!val) { showToast('請先在上方選擇品項'); return; }    idxs.forEach(idx => { if (batchEditItems[idx]) batchEditItems[idx].category = val; });    _refreshBmProductRows();    showToast(`✓ 已套用品項「${val}」至 ${idxs.length} 件`);  } else if (field === 'sizes') {    const sizes = [..._bmSelectedSizes];    if (!sizes.length) { showToast('請先在上方選擇尺寸'); return; }    idxs.forEach(idx => {      if (!batchEditItems[idx]) return;      batchEditItems[idx].sizes = [...sizes];    });    _refreshBmProductRows();    showToast(`✓ 已套用尺寸至 ${idxs.length} 件`);  }}
function selectBmCategory(val, el) {  document.querySelectorAll('#bmCategoryChips .option-chip').forEach(c => c.classList.remove('on'));  el.classList.add('on');  _trackUsage('cat', val);}
let _bmSelectedSizes = new Set();function toggleBmSizeGroupAll(gi, el) {  const g = SIZE_GROUPS[gi];  const allOn = g.sizes.every(s => _bmSelectedSizes.has(s));  if (allOn) g.sizes.forEach(s => _bmSelectedSizes.delete(s));  else g.sizes.forEach(s => _bmSelectedSizes.add(s));  document.querySelectorAll('#bmSizeChips .size-chip').forEach(chip => {    chip.classList.toggle('on', _bmSelectedSizes.has(chip.textContent));  });  _applyBmSizes();}function toggleBmSingleSize(s, el) {  if (_bmSelectedSizes.has(s)) _bmSelectedSizes.delete(s);  else _bmSelectedSizes.add(s);  el.classList.toggle('on', _bmSelectedSizes.has(s));  _applyBmSizes();}function _applyBmSizes() {  const sizes = [..._bmSelectedSizes];  batchEditItems.forEach(d => d.sizes = [...sizes]);  document.getElementById('bmSizePreview').textContent = '已選：' + (sizes.length ? sizes.join(' / ') : '尚未選取');  _refreshBmProductRows();}function applyBmUnifiedPrice() {  const price = document.getElementById('bmUnifiedPrice')?.value.trim();  if (!price) { showToast('請先輸入統一價格'); return; }  batchEditItems.forEach(d => {    const sp = d.sizePrices || {};    (d.sizes||[]).forEach(s => { sp[s] = price; });    d.sizePrices = sp;    d.price = price;  });  _refreshBmProductRows();  showToast(`✓ 已套用統一價格 NT$${price}`);}
function applyBmDiffPrice() {  const baseGroupIdx = parseInt(document.getElementById('bmBaseGroup')?.value || '2');  const baseRaw      = (document.getElementById('bmBasePrice')?.value || '').trim();  const sign         = document.getElementById('bmDiffSign')?.value || '+';  const diffRaw      = (document.getElementById('bmDiffAmt')?.value || '').trim();  if (!baseRaw)  { showToast('請先輸入基準價'); return; }  if (!diffRaw)  { showToast('請輸入差額金額'); return; }  const basePrice = parseFloat(baseRaw);  const diff      = parseFloat(diffRaw);  if (isNaN(basePrice) || isNaN(diff)) { showToast('價格與差額需為數字'); return; }  const otherPrice = sign === '+' ? basePrice + diff : basePrice - diff;  if (otherPrice < 0) { showToast('⚠ 計算結果為負數'); return; }  const baseGroup = SIZE_GROUPS[baseGroupIdx];  if (!baseGroup) { showToast('⚠ 無效的基準組'); return; }  let appliedItems = 0;  batchEditItems.forEach(d => {    if (!d.sizes || !d.sizes.length) return;    const sp = d.sizePrices || {};    let touched = false;    d.sizes.forEach(s => {      const inBaseGroup = baseGroup.sizes.includes(s);
      sp[s] = String(inBaseGroup ? basePrice : otherPrice);
      touched = true;
    });    if (touched) {
      d.sizePrices = sp;
      d.price = sp[d.sizes[0]];
      appliedItems++;
    }  });  if (!appliedItems) { showToast('沒有可套用的商品（請先選尺寸）'); return; }  _refreshBmProductRows();  showToast(`✓ 已套用差價（基準 ${basePrice} / 其他 ${otherPrice}）共 ${appliedItems} 件商品`);}
function _renderBmPriceInputs(idx, d) {  if (!d.sizes || !d.sizes.length) return `<span style="font-size:0.72rem;color:var(--text-light);">請先在上方選擇尺寸</span>`;  const sp = d.sizePrices || {};  const activeGroups = SIZE_GROUPS.filter(g => g.sizes.some(s => d.sizes.includes(s)));  if (!activeGroups.length) return '';  return `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">    ${activeGroups.map(g => {      const groupPrice = g.sizes.map(s => sp[s]).find(Boolean) || '';      return `<div style="display:flex;align-items:center;gap:4px;background:var(--cream-dark);border-radius:8px;padding:4px 8px;">        <span style="font-size:0.72rem;font-weight:500;color:var(--text-main);">${g.label}</span>
        <input type="number" placeholder="NT$" value="${esc(groupPrice)}"
          style="width:70px;border:1.5px solid var(--blush);border-radius:6px;padding:2px 5px;font-size:0.72rem;text-align:center;font-family:'Noto Serif TC',serif;color:var(--warm-brown);background:var(--white);outline:none;"
          oninput="bmSetGroupPrice(${idx},'${esc(g.label)}',this.value)">
      </div>`;    }).join('')}  </div>`;}function bmSetGroupPrice(idx, groupLabel, val) {  const d = batchEditItems[idx]; if (!d) return;  if (!d.sizePrices) d.sizePrices = {};  const g = SIZE_GROUPS.find(g => g.label === groupLabel);  if (!g) return;  g.sizes.forEach(s => { if ((d.sizes||[]).includes(s)) d.sizePrices[s] = val; });  d.price = val;}function bmItemToggleColor(idx, val, el) {  const d = batchEditItems[idx]; if (!d) return;  const arr = (d.color||'').split('/').map(c=>c.trim()).filter(Boolean);  const exists = arr.includes(val);  d.color = exists ? arr.filter(c=>c!==val).join('/') : [...arr, val].join('/');  el.classList.toggle('on', !exists);  _trackUsage('col', val);  const metaEl = document.getElementById(`bm_meta_${idx}`);  if (metaEl) metaEl.textContent = (d.category||'未選品項') + (d.color?' ・ '+d.color:'') + (d.sizes?.length?' ・ '+d.sizes.join('/') : '');}function bmItemSetColorManual(idx, val) {  const d = batchEditItems[idx]; if (!d) return;  const chipColors = COLOR_LIST_DEFAULT.filter(c => (d.color||'').split('/').includes(c));  const manuals = val.split(/[\/,、]/).map(c=>c.trim()).filter(Boolean);  d.color = [...chipColors, ...manuals].join('/');  const metaEl = document.getElementById(`bm_meta_${idx}`);  if (metaEl) metaEl.textContent = (d.category||'未選品項') + (d.color?' ・ '+d.color:'') + (d.sizes?.length?' ・ '+d.sizes.join('/') : '');}function _refreshBmProductRows() {  batchEditItems.forEach((d, idx) => {    const priceWrap = document.getElementById(`bm_prices_${idx}`);
    if (priceWrap) priceWrap.innerHTML = _renderBmPriceInputs(idx, d);
    const metaEl = document.getElementById(`bm_meta_${idx}`);
    if (metaEl) metaEl.textContent = (d.color||'未選顏色') + (d.sizes?.length?' · '+d.sizes.join('/') : '');
  });}function renderEditingProd(p) {  const colorArr = (p.color||'').split('/').map(s => s.trim()).filter(Boolean);  const colorChips = COLOR_LIST.map(c => {    const on = colorArr.includes(c);    return `<span class="ep-color-chip${on?' on':''}" onclick="epToggleEditColor('${p.id}','${esc(c)}',this)">${esc(c)}</span>`;  }).join('');  const catOptions = ['<option value="">— 選擇品項 —</option>']    .concat(CATEGORY_LIST.map(c => `<option value="${esc(c)}"${(p.category===c)?' selected':''}>${esc(c)}</option>`))    .join('');  return `<div class="ep-editing">    <div class="ep-editing-header">      <img src="${imgUrl(p.url, 200)}" data-fullurl="${esc(p.url||'')}" onerror="this.onerror=null; if(this.dataset.fullurl && this.src!==this.dataset.fullurl){_imgUrlOnFail(this,this.dataset.fullurl);} else {this.src=FALLBACK_IMG;}" alt="">
      <div class="ep-editing-title">編輯商品</div>
    </div>
    <div class="ep-editing-body">
      <div class="edit-field">
        <label>🏷 品牌</label>
        <div class="brand-wrap">
          <input class="field-input" type="text" id="ebi_${p.id}" value="${esc(p.brand||'')}" autocomplete="off"
            oninput="showEditSugg('${p.id}',this.value)" onfocus="showEditSugg('${p.id}',this.value)"
            onblur="setTimeout(()=>hideEditSugg('${p.id}'),180)">
          <div class="brand-sugg" id="ebs_${p.id}"></div>
        </div>
      </div>
      <div class="edit-field">
        <label>📦 品項（選填）</label>
        <select class="field-input" id="ecat_${p.id}">
          ${catOptions}
        </select>
      </div>

      <div class="edit-field">
        <label>📐 尺寸 ＋ 💰 價格</label>
        ${sizePicker('edit_' + p.id, 0, editingSizes, p._editSizePrices || p.sizePrices || {})}
      </div>
      <div class="gb-edit-box">
        <div class="gb-edit-row">
          <label class="gb-check-label">
            <input type="checkbox" id="egb_${p.id}" ${p.isGroupBuy ? 'checked' : ''}
              onchange="document.getElementById('egb_price_wrap_${p.id}').style.display = this.checked ? 'flex' : 'none';">
            <span>🔥 設為「開團商品」（自動同步至「限時開團」分頁）</span>
          </label>
        </div>
        <div id="egb_price_wrap_${p.id}" style="display:${p.isGroupBuy ? 'flex' : 'none'};align-items:center;gap:8px;">
          <span style="font-size:0.78rem;color:#C0614A;font-weight:500;white-space:nowrap;">團購特價 NT$</span>
          <input type="number" inputmode="numeric" class="field-input" id="egb_price_${p.id}"
            placeholder="輸入開團特價金額（如：290）"
            value="${esc(p.groupPrice || '')}"
            style="border-color:#F0C4B8;">
        </div>
      </div>
      <div class="ep-editing-actions">
        <button class="ep-btn ep-cancel-btn" onclick="cancelEditProd()">取消</button>
        <button class="ep-btn ep-save-btn" onclick="saveEditProd('${p.id}')">💾 儲存變更</button>
      </div>
    </div>
  </div>`;}
function epToggleEditColor(pid, color, el) {  const inp = document.getElementById('ecol_' + pid);  if (!inp) return;  const arr = (inp.value||'').split('/').map(s => s.trim()).filter(Boolean);  const i = arr.indexOf(color);  if (i >= 0) arr.splice(i, 1); else arr.push(color);  inp.value = arr.join('/');  el.classList.toggle('on');}function startEditProd(id) {  const p = products.find(x => x.id === id);  if (!p) return;  editingProdId = id;  editingSizes  = [...(p.sizes||[])];  p._editSizePrices = {...(p.sizePrices||{})};  renderManage();  requestAnimationFrame(() => { const el = document.querySelector('.ep-editing'); if (el) el.scrollIntoView({ behavior:'smooth', block:'center' }); });}function cancelEditProd() { editingProdId = null; editingSizes = []; renderManage(); }async function saveEditProd(id) {  const p = products.find(x => x.id === id);  if (!p) return;  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }  const brand      = document.getElementById('ebi_'+id).value.trim();  const category   = document.getElementById('ecat_'+id).value.trim();  const color      = p.color || '';  const sizes      = [...editingSizes];  const sizePrices = p._editSizePrices || p.sizePrices || {};  const prices     = sizes.map(s => sizePrices[s]).filter(Boolean);  const price      = prices.length ? prices[0] : (p.price || '');
  const isGroupBuy = !!document.getElementById('egb_' + id)?.checked;
  const groupPrice = (document.getElementById('egb_price_' + id)?.value || '').trim();
  if (isGroupBuy && !groupPrice) {
    showToast('⚠️ 請輸入開團特價金額！');
    document.getElementById('egb_price_' + id)?.focus();
    return;
  }
  const packedPg = {...sizePrices};
  delete packedPg.__groupBuy;
  delete packedPg.__groupPrice;
  if (isGroupBuy) {
    packedPg.__groupBuy = true;
    packedPg.__groupPrice = groupPrice;
  }
  const { error } = await sb.from(SUPABASE_TABLE)    .update({ brand, price, sizes, category, color, price_groups: packedPg }).eq('id', id);  if (error) { showToast('⚠️ 更新失敗：' + (error.message || error), 4000); return; }  p.brand = brand; p.price = price; p.sizes = sizes;  p.category = category; p.color = color; p.sizePrices = sizePrices;  p.isGroupBuy = isGroupBuy; p.groupPrice = isGroupBuy ? groupPrice : '';  delete p._editSizePrices;  rebuildBrandHistory();  editingProdId = null; editingSizes = [];  renderBrandTabs(); applyFilters(); renderManage();  showToast('✓ 商品已更新');}function showEditSugg(pid, val) {  const el  = document.getElementById('ebs_'+pid);  const hit = brandHistory.filter(b => b.toLowerCase().includes((val||'').toLowerCase())).slice(0,6);  if (!hit.length) { el.classList.remove('open'); return; }  el.innerHTML = hit.map(b => `<div class="brand-sugg-item" onmousedown="pickEditBrand('${pid}','${esc(b)}')">${esc(b)}</div>`).join('');  el.classList.add('open');}function hideEditSugg(pid) { document.getElementById('ebs_'+pid)?.classList.remove('open'); }function pickEditBrand(pid, b) { const inp = document.getElementById('ebi_'+pid); if (inp) inp.value = b; hideEditSugg(pid); }async function delProd(id) {  if (!confirm('確定要刪除此商品？')) return;  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }  const { error } = await sb.from(SUPABASE_TABLE).delete().eq('id', id);  if (error) { showToast('⚠️ 刪除失敗：' + (error.message || error), 4000); return; }  products = products.filter(p => p.id !== id);  rebuildBrandHistory();  if (editingProdId === id) { editingProdId = null; editingSizes = []; }  renderBrandTabs(); applyFilters(); renderManage();  showToast('已刪除商品');}
function toggleBatchMode() {  batchMode = !batchMode;  if (batchMode) { editingProdId = null; editingSizes = []; }  else { _resetBatchState(); _batchBrandFilter = null; }  renderManage();}function _resetBatchState() { batchSelected.clear(); batchEditing = false; batchEditItems = []; batchBulkSizes = []; }let _lastBatchClickId = null;
function toggleBatchSelect(id, ev) {
  const displayList = (batchMode && _batchBrandFilter)
    ? products.filter(p => (p.brand||'').trim() === _batchBrandFilter)
    : products;
  if (ev && ev.shiftKey && _lastBatchClickId && _lastBatchClickId !== id) {
    const idx1 = displayList.findIndex(p => p.id === _lastBatchClickId);
    const idx2 = displayList.findIndex(p => p.id === id);
    if (idx1 >= 0 && idx2 >= 0) {
      const [start, end] = idx1 < idx2 ? [idx1, idx2] : [idx2, idx1];
      const targetState = !batchSelected.has(id);
      for (let k = start; k <= end; k++) {
        if (targetState) batchSelected.add(displayList[k].id);
        else batchSelected.delete(displayList[k].id);
      }
      _lastBatchClickId = id;
      renderManage();
      return;
    }
  }
  if (batchSelected.has(id)) batchSelected.delete(id);
  else batchSelected.add(id);
  _lastBatchClickId = id;
  renderManage();
}function toggleSelectAll() {  if (batchSelected.size === products.length && products.length > 0) batchSelected.clear();  else products.forEach(p => batchSelected.add(p.id));  renderManage();}async function batchDelete() {  if (!batchSelected.size) { showToast('請先勾選要刪除的商品'); return; }  if (!confirm(`確定要刪除已選的 ${batchSelected.size} 件商品嗎？\n此操作無法復原。`)) return;  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }  const ids = [...batchSelected]; const count = ids.length;  const { error } = await sb.from(SUPABASE_TABLE).delete().in('id', ids);  if (error) { showToast('⚠️ 批量刪除失敗：' + (error.message || error), 4000); return; }  products = products.filter(p => !batchSelected.has(p.id));  rebuildBrandHistory(); batchMode = false; _resetBatchState();  renderBrandTabs(); applyFilters(); renderManage();  showToast(`✓ 已刪除 ${count} 件商品`);}function openBatchModify() {  if (!batchSelected.size) { showToast('請先勾選要修改的商品'); return; }  batchEditItems = products.filter(p => batchSelected.has(p.id)).map(p => ({
    id: p.id, url: p.url, brand: p.brand||'', price: p.price||'',
    sizes: [...(p.sizes||[])], category: p.category||'', color: p.color||'',
    sizePrices: {...(p.sizePrices||{})},
    isGroupBuy: !!p.isGroupBuy,
    groupPrice: p.groupPrice || ''
  }));  batchBulkSizes = []; batchEditing = true;  _bmSelectedSizes = new Set();  _bmColors = [];  document.getElementById('floatSaveBtn')?.classList.add('visible');  renderManage();  requestAnimationFrame(() => { const el = document.querySelector('.batch-modify-panel'); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); });}function cancelBatchModify() {  batchEditing = false; batchEditItems = []; batchBulkSizes = [];  document.getElementById('floatSaveBtn')?.classList.remove('visible');  renderManage();}async function saveBatchEditAll() {  if (!batchEditItems.length) { showToast('沒有可儲存的商品'); return; }  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }  const count = batchEditItems.length;  const byIdProd = new Map(products.map(p => [p.id, p]));  const rows = batchEditItems.map(d => {    const p = byIdProd.get(d.id) || {};    const sp = d.sizePrices || {};    const prices = d.sizes.map(s => sp[s]).filter(Boolean);    const price = prices.length ? prices[0] : (d.price || '');    return _toRow({
      id: d.id, url: p.url||d.url||'', brand: d.brand, price, sizes: d.sizes,
      category: d.category||'', color: d.color||'', sizePrices: sp,
      isGroupBuy: !!d.isGroupBuy, groupPrice: (d.groupPrice||'').toString().trim(),
      createdAt: p.createdAt||Date.now()
    });
  });
  const { error } = await sb.from(SUPABASE_TABLE).upsert(rows);
  if (error) { showToast('⚠️ 批量更新失敗：' + (error.message || error), 4000); return; }
  const byIdEdit = new Map(batchEditItems.map(d => [d.id, d]));
  products.forEach(p => {
    if (!byIdEdit.has(p.id)) return;
    const d = byIdEdit.get(p.id);
    p.brand = (d.brand||'').trim(); p.price = (d.price||'').toString().trim();
    p.sizes = [...(d.sizes||[])]; p.category = (d.category||'').trim(); p.color = (d.color||'').trim();
    p.sizePrices = {...(d.sizePrices||{})};
    p.isGroupBuy = !!d.isGroupBuy;
    p.groupPrice = d.isGroupBuy ? (d.groupPrice||'').toString().trim() : '';
  });  rebuildBrandHistory(); batchMode = false; _resetBatchState(); _batchBrandFilter = null;  document.getElementById('floatSaveBtn')?.classList.remove('visible');  renderBrandTabs(); applyFilters(); renderManage();  showToast(`✓ 已更新 ${count} 件商品`);}function applyBmBulkBrand() {  const val = (document.getElementById('bmBulkBrand')?.value||'').trim();  if (!val) { showToast('請先輸入品牌名稱'); return; }  batchEditItems.forEach(d => { d.brand = val; });  hideBmBulkBrandSugg();  showToast(`✓ 已將 ${batchEditItems.length} 件商品的品牌設為「${val}」`);}function showBmBulkBrandSugg(val) {  const el = document.getElementById('bmBulkBrandSugg');  if (!el) return;  const hit = brandHistory.filter(b => b.toLowerCase().includes((val||'').toLowerCase())).slice(0,6);  if (!hit.length) { el.classList.remove('open'); return; }  el.innerHTML = hit.map(b => `<div class="brand-sugg-item" onmousedown="pickBmBulkBrand('${esc(b)}')">${esc(b)}</div>`).join('');  el.classList.add('open');}function hideBmBulkBrandSugg() { document.getElementById('bmBulkBrandSugg')?.classList.remove('open'); }function pickBmBulkBrand(b) { const inp = document.getElementById('bmBulkBrand'); if (inp) inp.value = b; hideBmBulkBrandSugg(); }
/* CART（購物清單） */ function updateCartFab() {  const fab = document.getElementById('cartFab');  const cnt = document.getElementById('cartFabCount');  if (cart.length) { fab.classList.add('visible'); cnt.textContent = cart.length; }  else             { fab.classList.remove('visible'); }}function addToCart() {  if (!_preorderOpen) { showToast('⚠️ 目前預購未開放，無法加入清單'); return; }  const p = products.find(x => x.id === currentLbId);  if (!p) return;
  const sizeRow  = Array.from(document.querySelectorAll('#lbAttrs .lb-attr-row')).find(r => r.querySelector('.lb-attr-label')?.textContent === '尺寸');  const colorRow = Array.from(document.querySelectorAll('#lbAttrs .lb-attr-row')).find(r => r.querySelector('.lb-attr-label')?.textContent === '顏色');
  const hasSizeOptions  = sizeRow  && sizeRow.querySelectorAll('.lb-chip').length > 0;  const hasColorOptions = colorRow && colorRow.querySelectorAll('.lb-chip').length > 0;  const selSizeArr  = sizeRow  ? Array.from(sizeRow.querySelectorAll('.lb-chip.selected')).map(e=>e.textContent)  : [];  const selColorArr = colorRow ? Array.from(colorRow.querySelectorAll('.lb-chip.selected')).map(e=>e.textContent) : [];
  if (hasSizeOptions && selSizeArr.length === 0) {    showToast('請先選擇尺寸！', 2200);    return;  }  if (hasColorOptions && selColorArr.length === 0) {    showToast('請先選擇顏色！', 2200);    return;  }
  const selectedSize = selSizeArr[0] || '';  const basePrice = getPriceForSize(p.sizePrices, p.price, selectedSize);
  const correctPrice = (brandFilter === GROUPBUY_TAB && p.isGroupBuy && p.groupPrice && String(p.groupPrice).trim()) ? String(p.groupPrice).trim() : basePrice;
  cart.push({    cartId:   Date.now() + Math.random().toString(36).slice(2,5),    id:       p.id,    url:      p.url,    brand:    p.brand || '',    category: p.category || '',    size:     selSizeArr.join('/') || (p.sizes||[]).join('/'),    color:    selColorArr.join('/') || p.color || '',    price:    correctPrice || p.price || ''  });  updateCartFab();  const btn = document.getElementById('lbCartBtn');  if (btn) { btn.textContent = '✓ 已加入'; btn.classList.add('added'); }  showToast('✓ 已加入清單！');}function openCart() {  renderCartPanel();  document.getElementById('cartOverlay').classList.add('active');  lock();}function closeCart() {  document.getElementById('cartOverlay').classList.remove('active');  unlock();}function cartOutside(e) { if (e.target === document.getElementById('cartOverlay')) closeCart(); }function openRelovedGuide() {  document.getElementById('relovedOverlay').classList.add('active');  lock();}function closeRelovedGuide() {  document.getElementById('relovedOverlay').classList.remove('active');  unlock();}function relovedOutside(e) { if (e.target === document.getElementById('relovedOverlay')) closeRelovedGuide(); }function renderCartPanel() {  const itemsEl  = document.getElementById('cartItems');  const footerEl = document.getElementById('cartFooter');  if (!cart.length) {    itemsEl.innerHTML  = `<div class="cart-empty">清單是空的<br>快去挑選喜歡的商品吧</div>`;    footerEl.innerHTML = '';    return;  }  itemsEl.innerHTML = cart.map((item, i) => `    <div class="cart-item">      <img class="cart-item-img" src="${imgUrl(item.url, 150)}" data-fullurl="${esc(item.url||'')}" onerror="this.onerror=null; if(this.dataset.fullurl && this.src!==this.dataset.fullurl){_imgUrlOnFail(this,this.dataset.fullurl);} else {this.src=FALLBACK_IMG;}" alt="">
      <div class="cart-item-info">
        <div class="cart-item-brand">${esc(item.brand)}${item.category?' · '+esc(item.category):''}</div>
        <div class="cart-item-specs">
          ${item.size  ? '尺寸：'+esc(item.size)+'<br>' : ''}
          ${item.color ? '顏色：'+esc(item.color) : ''}
        </div>
        ${item.price ? `<div class="cart-item-price">NT$ ${esc(item.price)}</div>` : ''}
      </div>
      <button class="cart-item-remove" onclick="removeCartItem('${item.cartId}')">✕</button>
    </div>`).join('');  const total = cart.reduce((s, item) => s + (Number(item.price)||0), 0);  footerEl.innerHTML = `    <div class="cart-total">      <span class="cart-total-label">預計金額</span>
      <span class="cart-total-price">NT$ ${total.toLocaleString()}</span>
    </div>
    <div style="margin-bottom:10px;">
      <input class="field-input" type="text" id="cartCustomerName" placeholder="你的姓名 / Line 名稱（必填）" style="margin-bottom:8px;">
      <input class="field-input" type="text" id="cartCustomerLine" placeholder="Line ID（選填，方便查詢）">
    </div>
    <button class="cart-send-btn" id="cartSendBtn" onclick="submitCartToSupabase()">複製訊息並開啟官方 Line</button>
    <button class="cart-clear-btn" onclick="clearCart()">清空清單</button>`;}function removeCartItem(cartId) {  cart = cart.filter(i => i.cartId !== cartId);  updateCartFab();  renderCartPanel();}function clearCart() {  if (!confirm('確定要清空清單？')) return;  cart = [];  updateCartFab();  closeCart();}async function submitCartToSupabase() {  const nameEl = document.getElementById('cartCustomerName');  const lineEl = document.getElementById('cartCustomerLine');  const name   = nameEl?.value.trim();  const lineId = lineEl?.value.trim();  if (!name) { showToast('請填入你的姓名 / Line 名稱'); nameEl?.focus(); return; }  if (!sb) { showToast('⚠️ 系統錯誤，請稍後再試'); return; }
  const btn = document.getElementById('cartSendBtn');  if (btn) { btn.disabled = true; btn.textContent = '傳送中…'; }
  const token = 'jck' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);  const id    = 'co' + Date.now() + Math.random().toString(36).slice(2,5);  const items = cart.map(item => ({    url: item.url, brand: item.brand, category: item.category,    size: item.size, color: item.color, price: item.price  }));  const { error } = await sb.from('customer_orders').insert([{    id, token,    customer_name: name,    line_id:       lineId,    items,    status:        0,    created_at:    Date.now()  }]);  if (error) {    showToast('⚠️ 傳送失敗，請再試一次', 3500);    if (btn) { btn.disabled = false; btn.textContent = '傳送清單至官方 Line'; }    return;  }  const orderUrl = `${location.origin}${location.pathname}?c=${token}`;  const total    = cart.reduce((s, item) => s + (Number(item.price)||0), 0);  const plainMsg = `Hi！我是 ${name}，想預購以下商品\n\n`    + items.map((item,i) =>        `${i+1}. ${item.brand}${item.category?' '+item.category:''}`        + (item.size  ? `　尺寸：${item.size}`  : '')        + (item.color ? `　顏色：${item.color}` : '')        + (item.price ? `　NT$${item.price}`    : '')      ).join('\n')    + `\n\n預計金額：NT$ ${total.toLocaleString()}`    + `\n\n查看完整清單（含圖）：\n${orderUrl}`;
  cart = [];  updateCartFab();
  closeCart();  history.replaceState(null, '', `?c=${token}`);  showOrderByToken(token);  showLineSendModal(plainMsg);}
/* LINE SEND MODAL */ let _lineMsgText = '';let _isCheckoutModal = false;function showLineSendModal(msg, title) {  _lineMsgText = msg;  _isCheckoutModal = title && title.includes('結帳單確認');  document.getElementById('lineSendMsg').textContent = msg;  document.getElementById('lineGoBtn').href = LINE_URL;  document.getElementById('lineCopyBtn').textContent = '複製訊息';  document.getElementById('lineCopyBtn').classList.remove('copied');  document.querySelector('.line-send-title').textContent = title || '傳送清單至官方 Line';  document.getElementById('lineSendOverlay').classList.add('active');  lock();}function closeLineSendModal() {  document.getElementById('lineSendOverlay').classList.remove('active');  unlock();}async function copyLineMsg() {  const btn = document.getElementById('lineCopyBtn');  try {    await navigator.clipboard.writeText(_lineMsgText);    btn.textContent = '✓ 已複製！';    btn.classList.add('copied');  } catch(e) {    showToast('請長按選取後複製');  }}
/* ORDERS & SIZE GUIDES & REPORTS */ const ORDER_STATUS = ['訂購中','待回台','在台打包','斷貨'];const ORDER_STATUS_CLASS = ['s0','s1','s2','s3'];let orderBatchMode = false;let orderSelected  = new Set();
function toggleOrderBatch() {  orderBatchMode = !orderBatchMode;  orderSelected.clear();  document.getElementById('orderBatchBar').style.display = orderBatchMode ? 'flex' : 'none';  renderOrders();}async function toggleItemOrdered(orderId, idx, currentSt) {  const isOrdered = (currentSt === 'ordered' || currentSt === 'phase_1' || currentSt === 'phase_2');  const newSt = isOrdered ? '' : 'ordered';  await setItemStatus(orderId, idx, newSt);}function toggleOrderSelect(id) {  if (orderSelected.has(id)) orderSelected.delete(id);  else orderSelected.add(id);  document.getElementById('orderSelectedCount').textContent = orderSelected.size;  const card = document.querySelector(`.order-card[data-id="${id}"]`);  if (card) {    card.classList.toggle('selected', orderSelected.has(id));    const cb = card.querySelector('.ep-checkbox');    if (cb) cb.checked = orderSelected.has(id);  }  document.getElementById('orderSelectAll').checked = false;}function toggleOrderSelectAll() {  const all = document.getElementById('orderSelectAll').checked;  document.querySelectorAll('.order-card[data-id]').forEach(c => {    if (all) orderSelected.add(c.dataset.id);    else orderSelected.delete(c.dataset.id);    c.classList.toggle('selected', all);    const cb = c.querySelector('.ep-checkbox');    if (cb) cb.checked = all;  });  document.getElementById('orderSelectedCount').textContent = orderSelected.size;}function addNoItemRow() {  const wrap = document.getElementById('noItemRows');  if (!wrap) return;  const row = document.createElement('div');  row.className = 'new-order-item-row';  row.innerHTML = `    <input class="field-input" type="text" placeholder="品牌＋品項描述" style="flex:2;min-width:140px;">
    <input class="field-input" type="text" placeholder="尺寸" style="width:70px;flex:none;">
    <input class="field-input" type="text" placeholder="顏色" style="width:70px;flex:none;">
    <input class="field-input" type="number" placeholder="金額" style="width:80px;flex:none;">
    <button class="rm-item-btn" onclick="this.closest('.new-order-item-row').remove()">✕</button>`;  wrap.appendChild(row);}async function createOrder() {  const name   = document.getElementById('noName').value.trim();  const lineId = document.getElementById('noLine').value.trim();  const phone  = document.getElementById('noPhone').value.trim();  if (!name) { showToast('請填入顧客姓名'); return; }  const rows  = document.querySelectorAll('#noItemRows .new-order-item-row');  const items = [];  rows.forEach(row => {    const inputs = row.querySelectorAll('input');    const desc = inputs[0].value.trim(), size = inputs[1].value.trim();    const color = inputs[2].value.trim(), price = inputs[3].value.trim();    if (desc) items.push({ brand: desc, category:'', size, color, price, url:'' });  });  if (!items.length) { showToast('請至少填入一件商品'); return; }  if (!sb) { showToast('⚠️ Supabase 尚未初始化'); return; }  const token = 'jck' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);  const id    = 'co' + Date.now() + Math.random().toString(36).slice(2,5);  const { error } = await sb.from('customer_orders').insert([{    id, token, customer_name: name, line_id: lineId, items, status: 0,    ordered: false, item_status: {}, merged_into: null, merged_orders: [],    note: phone ? '電話：' + phone : '', created_at: Date.now()  }]);  if (error) { showToast('⚠️ 建立失敗：' + (error.message||error), 4000); return; }  document.getElementById('noName').value = '';  document.getElementById('noLine').value = '';  document.getElementById('noPhone').value = '';  await renderOrders();  showToast(`✓ 訂單已建立`);}

function openOrderImgLightbox(url, caption) {
  if (!url) return;
  const ov = document.getElementById('orderImgLightbox');
  const img = document.getElementById('orderImgLightboxImg');
  const cap = document.getElementById('orderImgLightboxCaption');
  if (!ov || !img) return;
  img.src = url;
  if (cap) cap.textContent = caption || '';
  ov.classList.add('active');
}

async function renderOrders() {  const el  = document.getElementById('orderList');  const cnt = document.getElementById('orderCount');  if (!el) return;  el.innerHTML = `<div class="no-results">載入中…</div>`;  if (!sb) { el.innerHTML = `<div class="no-results">Supabase 未連線</div>`; return; }  const filter = document.getElementById('orderFilterStatus')?.value;  let query = sb.from('customer_orders').select('*').is('completed_at', null).order('created_at', { ascending: false });  if (filter !== '' && filter !== undefined) query = query.eq('status', Number(filter));  let { data, error } = await query;  if (error) {    let q2 = sb.from('customer_orders').select('*').order('created_at', { ascending: false });    if (filter !== '' && filter !== undefined) q2 = q2.eq('status', Number(filter));    const r2 = await q2;    if (r2.error) { el.innerHTML = `<div class="no-results">載入失敗</div>`; return; }    data = (r2.data || []).filter(o => !o.completed_at);  }  const list = data || [];  if (cnt) cnt.textContent = list.length;  if (!list.length) { el.innerHTML = `<div class="no-results">尚無訂單紀錄</div>`; return; }
  el.innerHTML = list.map(o => {    const items      = Array.isArray(o.items) ? o.items : [];    const itemStatus = (o.item_status && typeof o.item_status === 'object') ? o.item_status : {};    const total = items.reduce((s, item, i) =>      itemStatus[i] === 'oos' ? s : s + (Number(item.price)||0), 0);    const arrivedTotal = items.reduce((s, item, i) =>      itemStatus[i] === 'arrived' ? s + (Number(item.price)||0) : s, 0);    const orderUrl   = `${location.origin}${location.pathname}?c=${o.token}`;    const hasChildren = o.merged_orders && o.merged_orders.length > 0;
    const itemsHTML = items.map((item, i) => {      const st = itemStatus[i] || '';      const labelClass = st === 'arrived' ? 'arrived' : st === 'oos' ? 'oos' : '';      const phaseVal = (st === 'phase_1' || st === 'phase_2') ? st : 'phase_0';      const phaseDisabled = (st === 'arrived' || st === 'oos');      const phaseSelect = `<select class="order-status-select" style="font-size:0.72rem;${phaseDisabled?'opacity:0.45;':''}"        onclick="event.stopPropagation()"        onchange="event.stopPropagation();setItemStatus('${o.id}',${i},this.value==='phase_0'?'':this.value)">        <option value="phase_0" ${phaseVal==='phase_0'?'selected':''}>訂購中</option>
        <option value="phase_1" ${phaseVal==='phase_1'?'selected':''}>待回台</option>
        <option value="phase_2" ${phaseVal==='phase_2'?'selected':''}>在台打包</option>
      </select>`;      const isOrdered = (st === 'ordered' || st === 'phase_1' || st === 'phase_2');      const orderedBtn = `<button class="order-ordered-btn ${isOrdered?'on':''}"        onclick="event.stopPropagation();toggleItemOrdered('${o.id}',${i},'${st}')"        style="font-size:0.72rem;padding:3px 10px;">
        ${isOrdered?'✓ 叫貨':'叫貨'}
      </button>`;      const arrivedBtn = `<button class="order-ordered-btn ${st==='arrived'?'on':''}"        onclick="event.stopPropagation();setItemStatus('${o.id}',${i},'${st}'==='arrived'?'':'arrived')"        style="font-size:0.72rem;padding:3px 10px;${st==='arrived'?'':'background:transparent;border:1.5px solid var(--cream-mid);color:var(--text-soft);'}">
        ${st==='arrived'?'✓ 到貨':'到貨'}
      </button>`;      const oosBtn = `<button class="order-ordered-btn ${st==='oos'?'on':''}"        onclick="event.stopPropagation();setItemStatus('${o.id}',${i},'${st}'==='oos'?'':'oos')"        style="font-size:0.72rem;padding:3px 10px;${st==='oos'?'background:var(--red);border-color:var(--red);':'background:transparent;border:1.5px solid var(--cream-mid);color:var(--text-soft);'}">
        ${st==='oos'?'✓ 斷貨':'斷貨'}
      </button>`;      return `<div class="order-item-row" data-item-index="${i}" data-order-id="${o.id}">        <div class="order-item-label ${labelClass}">
          ${item.url?`<img class="order-item-thumb" src="${esc(imgUrl(item.url, 120))}" data-fullurl="${esc(item.url)}" data-caption="${esc((item.brand||item.desc||'') + (item.category?' · '+item.category:'') + (item.size?' ／'+item.size:'') + (item.color?' ／'+item.color:''))}" onclick="event.stopPropagation();openOrderImgLightbox(this.dataset.fullurl, this.dataset.caption)" title="點擊放大檢視圖片" onerror="this.style.display='none'">`:''}
          <strong>${esc(item.brand||item.desc||'')}</strong>${item.category?' · '+esc(item.category):''}
          ${item.size?' ／'+esc(item.size):''}${item.color?' ／'+esc(item.color):''}
          ${item.price?` <span style="color:var(--warm-brown);">NT$${esc(item.price)}</span>`:''}
        </div>
        ${orderedBtn}
        ${phaseSelect}
        ${arrivedBtn}${oosBtn}
      </div>`;    }).join('');
    return `<div class="order-card ${orderBatchMode&&orderSelected.has(o.id)?'selected':''}" data-id="${o.id}">      <div class="order-card-head" onclick="${orderBatchMode?`toggleOrderSelect('${o.id}')`:''}">        <div style="flex:1;min-width:0;">          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">            <div class="order-no">${esc(o.token)}</div>
            ${hasChildren?`<span class="order-merged-tag" style="background:var(--blush);">主單</span>`:''}
            ${o.ordered?`<span class="order-merged-tag" style="background:#D4EDDA;color:#155724;">已叫貨</span>`:''}
          </div>
          <div class="order-customer">${esc(o.customer_name||'')}</div>
          <div class="order-contact">${o.line_id?'Line: '+esc(o.line_id):''}${o.note?' · '+esc(o.note):''}</div>
          <div style="font-size:0.68rem;margin-top:2px;"><a href="${orderUrl}" target="_blank" style="color:var(--soft-brown);">查詢連結 ↗</a></div>
        </div>
      </div>
      <div class="order-items-list">${itemsHTML}</div>
      <div class="order-total-row">
        <div>
          <span class="order-total-amt">NT$ ${total.toLocaleString()}</span>
          ${arrivedTotal>0&&arrivedTotal<total?`<span style="font-size:0.72rem;color:#155724;margin-left:8px;">到貨 NT$${arrivedTotal.toLocaleString()}</span>`:''}
        </div>
        <div class="order-action-row">
          <button class="order-ordered-btn ${o.ordered?'on':''}" onclick="toggleOrdered('${o.id}',${!o.ordered})">${o.ordered?'✓ 已叫貨':'叫貨'}</button>
          <button class="order-checkout-btn" onclick="exportCheckout('${o.id}')">結帳單</button>
          <button class="order-checkout-btn" style="background:#D4EDDA;color:#155724;" onclick="completeOrder('${o.id}')">✓ 完成訂單</button>
          <button class="order-del-btn" onclick="deleteOrder('${o.id}')">🗑</button>
        </div>
      </div>
    </div>`;  }).join('');}
async function setItemStatus(id, idx, val) {  if (!sb) return;  const { data } = await sb.from('customer_orders').select('item_status').eq('id', id).single();  const st = (data?.item_status && typeof data.item_status === 'object') ? {...data.item_status} : {};  if (val) st[idx] = val; else delete st[idx];  await sb.from('customer_orders').update({ item_status: st }).eq('id', id);  await renderOrders();}async function toggleOrdered(id, val) {  if (!sb) return;  await sb.from('customer_orders').update({ ordered: val }).eq('id', id);  showToast(val ? '✓ 已標記叫貨' : '已取消叫貨標記');  await renderOrders();}async function exportCheckout(id) {  if (!sb) return;  const { data } = await sb.from('customer_orders').select('*').eq('id', id).single();  if (!data) return;  const items = Array.isArray(data.items) ? data.items : [];  const itemStatus = data.item_status || {};  const arrivedItems = items.map((item, i) => ({ ...item, _i: i })).filter(item => itemStatus[item._i] === 'arrived');  if (!arrivedItems.length) { showToast('尚無已到貨商品'); return; }  const originalSubtotal = arrivedItems.reduce((s, it) => s + (Number(it.price)||0), 0);  const platformFee = 60;  const payable = originalSubtotal - platformFee;  let msg = `【Janine Chiang Kids 到貨結帳通知】\n\n` + arrivedItems.map((item, i) => `${i+1}. ${item.brand||''}${item.category?' '+item.category:''}${item.size?' ／'+item.size:''}${item.color?' ／'+item.color:''} NT$${item.price||0}`).join('\n') + `\n\n商品小計：NT$ ${originalSubtotal.toLocaleString()}\n好賣家下單費：- NT$ ${platformFee}\n實際匯款金額：NT$ ${payable.toLocaleString()}`;  showLineSendModal(msg, '結帳單確認 → 傳送至 Line');}async function mergeOrders() {  if (orderSelected.size < 2 || !sb) return;  const ids = [...orderSelected];  const { data } = await sb.from('customer_orders').select('*').in('id', ids);  if (!data || data.length < 2) return;  const main = data[0], others = data.slice(1);  const mergedItems = data.flatMap(o => Array.isArray(o.items) ? o.items : []);  const mergedNames = [...new Set(data.map(o => o.customer_name))].join(' + ');  await sb.from('customer_orders').update({ items: mergedItems, customer_name: mergedNames, merged_orders: others.map(o => o.id) }).eq('id', main.id);  await sb.from('customer_orders').delete().in('id', others.map(o => o.id));  orderSelected.clear(); orderBatchMode = false; document.getElementById('orderBatchBar').style.display = 'none';  await renderOrders(); showToast(`✓ 已合併 ${ids.length} 筆訂單`);}async function batchDeleteOrders() {  if (!orderSelected.size || !sb) return;  if (!confirm(`確定要刪除 ${orderSelected.size} 筆訂單？`)) return;  await sb.from('customer_orders').delete().in('id', [...orderSelected]);  orderSelected.clear(); orderBatchMode = false; document.getElementById('orderBatchBar').style.display = 'none';  await renderOrders(); showToast('✓ 已刪除所選訂單');}async function showUnordered() {  if (!sb) return;  const { data } = await sb.from('customer_orders').select('*').is('merged_into', null).order('created_at', { ascending: false });  const el = document.getElementById('unorderedAlert'), list = document.getElementById('unorderedList');  if (!data) return;  const unorderedItems = [];  data.forEach(o => { (o.items||[]).forEach((item, i) => { if (!(o.item_status||{})[i]) unorderedItems.push({ orderId: o.id, idx: i, customerName: o.customer_name, item }); }); });  if (!unorderedItems.length) { showToast('✓ 所有商品都已叫貨！'); el.style.display='none'; return; }  list.innerHTML = unorderedItems.map(({ customerName, item }) => `<div>${esc(customerName)} ・ ${esc(item.brand||'')} ${esc(item.size||'')} ${esc(item.color||'')}</div>`).join('');  el.style.display = 'block';}async function completeOrder(id) {  if (!confirm('確定將此訂單標記為已完成？')) return;  await sb.from('customer_orders').update({ completed_at: Date.now() }).eq('id', id);  showToast('✓ 訂單已完成'); await renderOrders();}async function reopenOrder(id) {  await sb.from('customer_orders').update({ completed_at: null }).eq('id', id);  showToast('✓ 已還原至訂單管理'); await renderCompletedOrders();}async function renderCompletedOrders() {  const el = document.getElementById('completedList'), cnt = document.getElementById('completedCount');  if (!el || !sb) return;  const { data } = await sb.from('customer_orders').select('*').not('completed_at', 'is', null).order('completed_at', { ascending: false });  const list = data || [];  if (cnt) cnt.textContent = list.length;
  el.innerHTML = list.length ? list.map(o => `<div class="order-card"><div class="order-customer">${esc(o.customer_name||'')}</div><button class="order-edit-btn" onclick="reopenOrder('${o.id}')">↩ 還原</button></div>`).join('') : '<div class="no-results">尚無已完成訂單</div>';}async function deleteOrder(id) {  if (!confirm('確定要刪除此訂單？') || !sb) return;  await sb.from('customer_orders').delete().eq('id', id);  await renderOrders(); showToast('已刪除訂單');}async function showOrderByToken(token) {  const overlay = document.getElementById('oqResult'), inner = document.getElementById('oqResultInner');  if (!overlay || !inner || !sb) return;  overlay.style.display = 'flex';
  const { data: rows } = await sb.rpc('get_order_by_token', { p_token: token });  const data = (rows && rows.length > 0) ? rows[0] : null;
  if (!data) { inner.innerHTML = '找不到此訂單'; return; }
  const items = Array.isArray(data.items) ? data.items : [];
  const total = items.reduce((s, item) => s + (Number(item.price)||0), 0);
  inner.innerHTML = `<div class="oq-name">${esc(data.customer_name)} 的清單</div><div class="oq-total">合計 NT$ ${total.toLocaleString()}</div>`;}
function showSgBrandSugg(val) { const el = document.getElementById('sgBrandSugg'); const hit = brandHistory.filter(b => b.toLowerCase().includes((val||'').toLowerCase())).slice(0,8); if (!hit.length) { el.classList.remove('open'); return; } el.innerHTML = hit.map(b => `<div class="brand-sugg-item" onmousedown="document.getElementById('sgBrandInput').value='${esc(b)}';hideSgBrandSugg();loadSgEditor()">${esc(b)}</div>`).join(''); el.classList.add('open'); }function hideSgBrandSugg() { document.getElementById('sgBrandSugg')?.classList.remove('open'); }function loadSgEditor() { const brand = document.getElementById('sgBrandInput').value.trim(); if (!brand) return; document.getElementById('sgEditor').style.display = 'block'; const existing = sizeGuideData[brand]; document.getElementById('sgHeaders').value = existing ? existing.headers.join(',') : ''; document.getElementById('sgRows').value = existing ? existing.rows.map(r => r.join(',')).join('\n') : ''; }async function saveSizeGuide() { const brand = document.getElementById('sgBrandInput').value.trim(), headers = document.getElementById('sgHeaders').value.trim(), rowsRaw = document.getElementById('sgRows').value.trim(); if (!brand || !headers || !rowsRaw) return; const guide = { headers: headers.split(',').map(h=>h.trim()), rows: rowsRaw.split('\n').map(l=>l.split(',').map(c=>c.trim())) }; await _saveSizeGuideToStorage(brand, guide); sizeGuideData[brand] = guide; renderSgList(); showToast(`✓ 已儲存「${brand}」的尺寸表`); }async function deleteSizeGuide() { const brand = document.getElementById('sgBrandInput').value.trim(); if (!brand) return; await _deleteSizeGuideFromStorage(brand); delete sizeGuideData[brand]; document.getElementById('sgEditor').style.display = 'none'; renderSgList(); showToast('已刪除'); }function renderSgList() { const el = document.getElementById('sgList'); if (!el) return; const brands = Object.keys(sizeGuideData); el.innerHTML = brands.length ? brands.map(b => `<div class="ep"><div class="ep-info"><div class="ep-brand">${esc(b)}</div></div><button class="edit-btn-sm" onclick="document.getElementById('sgBrandInput').value='${esc(b)}';loadSgEditor()">✏️</button></div>`).join('') : '<div class="no-results">尚未設定任何品牌尺寸表</div>'; }
function showSalesReport() { document.getElementById('salesReportOverlay').style.display = 'flex'; updateSalesReport(); }function closeSalesReport() { document.getElementById('salesReportOverlay').style.display = 'none'; }async function updateSalesReport() { if (!sb) return; const { data: orders } = await sb.from('customer_orders').select('*').not('completed_at', 'is', null); const list = orders || []; const totalRevenue = list.reduce((s, o) => s + (o.items||[]).reduce((a, b) => a + (Number(b.price)||0), 0), 0); document.getElementById('salesReportStats').innerHTML = `<div style="padding:12px;">總完成訂單：${list.length} 筆｜總銷售額：NT$ ${totalRevenue.toLocaleString()}</div>`; }function exportSalesReport() { showToast('✓ 報表已下載'); }
function closeCardEditor() { document.getElementById('cardEditorOverlay').classList.remove('active'); }function ceOutside(e) { if (e.target.id === 'cardEditorOverlay') closeCardEditor(); }function ceReset() {}function ceDownload() {}function downloadCard(id) { showToast('請先登入後台'); }

// ═══════════════════════════════════════════════════════════
//  🇰🇷 韓國批發網（hangou.co.kr）HTML 一鍵解析引擎（強化版）
// ═══════════════════════════════════════════════════════════
const KR_COLOR_MAP = {
  '화이트':'白','백색':'白','아이보리':'米白','아이':'米白','크림':'米白','베이지':'米白',
  '그레이':'灰','회색':'灰','차콜':'深色','먹색':'深色','블랙':'黑','검정':'黑',
  '레드':'紅','빨강':'紅','와인':'紅','버건디':'紅','오렌지':'橘','주황':'橘',
  '옐로우':'黃','노랑':'黃','머스타드':'黃','레몬':'黃',
  '그린':'綠','초록':'綠','민트':'淺綠','카키':'卡其','올리브':'深綠','연두':'淺綠',
  '블루':'藍','파랑':'藍','소라':'淺藍','스카이':'淺藍','하늘':'淺藍','네이비':'深藍','곤색':'深藍','데님':'藍','청':'藍',
  '퍼플':'紫','보라':'紫','라벤더':'紫','연보라':'紫',
  '핑크':'粉','분홍':'粉','인디핑크':'粉','살구':'杏','피치':'粉',
  '브라운':'棕','갈색':'棕','모카':'棕','코코아':'棕','카멜':'棕','밤색':'棕',
  '별':'圖案','체크':'圖案','도트':'圖案','스트라이프':'圖案','꽃':'花花','플라워':'花花'
};
const KR_CATEGORY_MAP = [
  { kw: ['모자','비니','보넷','캡','햇','해트','버킷햇','스카프','머플러','장갑'], cat: '帽子' },
  { kw: ['양말','삭스','니삭스','타이츠','레깅스양말'], cat: '襪子' },
  { kw: ['신발','운동화','샌들','부츠','슬리퍼','로퍼','슈즈'], cat: '鞋子' },
  { kw: ['가방','백팩','크로스백','에코백','파우치'], cat: '包包' },
  { kw: ['수영복','래쉬가드','비키니','모노키니'], cat: '泳衣' },
  { kw: ['악세사리','헤어핀','머리띠','목걸이','반지','팔찌','핀','헤어밴드','슈슈'], cat: '飾品' },
  { kw: ['원피스','드레스'], cat: '洋裝' },
  { kw: ['상하세트','세트','상하복','추리닝세트'], cat: '套裝' },
  { kw: ['슈트','바디슈트','우주복','롬퍼'], cat: '包屁衣' },
  { kw: ['치마','스커트'], cat: '裙子' },
  { kw: ['바지','팬츠','레깅스','치랭스','블루머','슬랙스','데님팬츠','조거팬츠'], cat: '褲子' },
  { kw: ['자켓','점퍼','코트','가디건','패딩','아우터','야상','집업','블레이저'], cat: '外套' },
  { kw: ['조끼','베스트','나시','나시티','민소매'], cat: '背心' },
  { kw: ['멜빵','오버롤'], cat: '吊帶' },
  { kw: ['티셔츠','맨투맨','후드','블라우스','셔츠','니트','상의','폴라','탑','롱티'], cat: '上衣' }
];
function _calcKrPrice(krw) {
  if (!krw || isNaN(krw) || krw <= 0) return '';
  const rate = parseFloat(document.getElementById('krRateInput')?.value) || 40;
  const mult = parseFloat(document.getElementById('krMultInput')?.value) || 1.18;
  const add  = parseFloat(document.getElementById('krAddInput')?.value)  || 102;
  return String(Math.floor(((krw / rate) * mult + add) / 10) * 10);
}


function parseKoreanHtml() {
  const htmlStr = (document.getElementById('krHtmlInput')?.value || '').trim();
  if (!htmlStr) { showToast('請先貼上韓國批發網的網頁編碼'); return; }
  const doc = new DOMParser().parseFromString(htmlStr, 'text/html');
  // 支援首頁/列表頁 (img[id$="_m"]) 或一般商品圖 (img[src*="/data/item/"])
  let imgNodes = Array.from(doc.querySelectorAll('img[id$="_m"]'));
  if (!imgNodes.length) {
    imgNodes = Array.from(doc.querySelectorAll('img[src*="/data/item/"]'));
  }
  if (!imgNodes.length) { showToast('⚠️ 找不到商品資料，請確認是否複製了完整的 <body> 編碼', 4000); return; }

  const parsedItems = [], seenUrls = new Set();
  let skippedSoldOutCount = 0;
  const validSizes = new Set(SIZE_GROUPS.flatMap(g => g.sizes));

  imgNodes.forEach(img => {
    let imgUrl = img.getAttribute('data-original') || img.getAttribute('data-src') || img.getAttribute('src') || '';
    if (!imgUrl) return;
    if (imgUrl.startsWith('//')) imgUrl = 'http:' + imgUrl;
    else if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {}
    else if (imgUrl.startsWith('/')) imgUrl = 'http://hangou.co.kr' + imgUrl;
    else if (imgUrl.startsWith('./')) imgUrl = 'http://hangou.co.kr/gnu/' + imgUrl.slice(2);
    else if (imgUrl.startsWith('../')) imgUrl = 'http://hangou.co.kr/' + imgUrl.replace(/\.\.\//g, '');
    else imgUrl = 'http://hangou.co.kr/gnu/' + imgUrl;
    if (seenUrls.has(imgUrl)) return;
    seenUrls.add(imgUrl);

    const cardTable = img.closest('table') || img.parentElement;
    if (!cardTable) return;

    // 優先直接抓 .amount 裡的價格（最準確）
    let krwPrice = 0;
    const amountEl = cardTable.querySelector('.amount');
    if (amountEl) {
      const numStr = amountEl.textContent.replace(/[^\d]/g, '');
      if (numStr) krwPrice = parseInt(numStr, 10);
    }

    const rows = Array.from(cardTable.querySelectorAll('tr')).map(tr => tr.textContent.trim()).filter(Boolean);
    let rawCat = '', rawBrand = '', rawTitle = '', rawSizes = '', isSoldOut = false;

    rows.forEach((txt, idx) => {
      if (idx === 0) return;
      const cleanTxt = txt.replace(/\s+/g, ' ').trim();
      if (cleanTxt.startsWith('[') && cleanTxt.endsWith(']')) {
        rawCat = cleanTxt;
      } else if (cleanTxt === '품절' || cleanTxt.includes('품절')) {
        isSoldOut = true;
      } else if (/^\d{8,}$/.test(cleanTxt) || cleanTxt.includes('新款')) {
        // 貨號或季節標籤
      } else if (/^[₩￦]?\s*[\d,]+\s*원?$/.test(cleanTxt) && cleanTxt.replace(/[^\d]/g, '') !== '0') {
        if (!krwPrice) krwPrice = parseInt(cleanTxt.replace(/[^\d]/g, ''), 10);
      } else if (cleanTxt.includes('|') || /^(XS|S|M|L|XL|XXL|JS|JM|JL|JXL|BXS|BS|BM|BL|\d{1,3})$/i.test(cleanTxt)) {
        rawSizes = cleanTxt;
      } else if (!rawBrand) {
        rawBrand = cleanTxt;
      } else if (!rawTitle) {
        rawTitle = cleanTxt;
      }
    });

    if (!rawTitle && krwPrice === 0 && !isSoldOut) return;

    let brand = (rawBrand || '').replace(/\([^)]*[가-힯]+[^)]*\)/g, '').trim();
    if (brand.includes('現貨區') || brand.includes('分部') || !brand) {
      const dashIdx = rawTitle.indexOf('-');
      if (dashIdx > 0) brand = rawTitle.slice(0, dashIdx).trim();
    }

    // 斷貨（품절）商品直接省略不匯入
    if (isSoldOut) {
      skippedSoldOutCount++;
      return;
    }

    const combined = `${rawCat} ${rawTitle}`;
    let category = '';
    for (const item of KR_CATEGORY_MAP) { if (item.kw.some(k => combined.includes(k))) { category = item.cat; break; } }

    let color = '';

    const ntdPrice = _calcKrPrice(krwPrice);
    let sizes = rawSizes
      ? rawSizes.split('|').map(s => s.trim().toUpperCase()).filter(s => validSizes.has(s))
      : [];
    // 若韓國尺寸為特殊碼（如 3、60、5|7|9）導致無法對應，自動預設為 F，確保價格能正常帶入並發佈！
    if (!sizes.length && ntdPrice) {
      sizes = ['F'];
    }

    const sizePrices = {};
    if (ntdPrice && sizes.length) {
      sizes.forEach(s => { sizePrices[s] = ntdPrice; });
    }

    // 韓國批發網高清大圖通常為去掉 _m 後綴的原圖（例如 /data/item/1777022672），若無則自動退回 _m
    const hdImgUrl = /\/data\/item\/([^\/]+)_m(\.[a-z]+)?$/i.test(imgUrl)
      ? imgUrl.replace(/_m(\.[a-z]+)?$/i, '$1')
      : imgUrl;

    parsedItems.push({
      url: hdImgUrl,
      price: ntdPrice,
      brand,
      sizes,
      category,
      color,
      sizePrices,
      _rawBrand: rawBrand,
      _rawTitle: rawTitle,
      _rawCat: rawCat,
      _id: 'kr_' + Date.now() + '_' + parsedItems.length
    });
  });

  if (!parsedItems.length) { showToast('⚠️ 此頁面沒有可匯入的商品', 4000); return; }

  // 智慧合併：全方位偵測「品牌名 / 品名 / 分類 / 尺寸」中的 JR / 주니어（大童款）
  const nonJrItems = [];
  const jrItems = [];
  parsedItems.forEach(it => {
    const checkStr = `${it.brand || ''} ${it._rawBrand || ''} ${it._rawTitle || ''} ${it._rawCat || ''}`.toUpperCase();
    const isJr = /(^|[^A-Z0-9])JR([^A-Z0-9]|$)/.test(checkStr)
      || checkStr.includes('주니어')
      || (it.sizes.length > 0 && it.sizes.every(s => ['JS','JM','JL','JXL'].includes(s)));
    if (isJr) {
      // 把品牌名稱裡的 JR / 주니어 清乾淨，方便與主品牌配對（例如 "VIVID-I JR" -> "VIVID-I"）
      it.brand = (it.brand || '').replace(/[\(\[\-\_\s]*jr[\)\]\-\_\s]*/gi, '').replace(/주니어/g, '').trim();
      jrItems.push(it);
    } else {
      nonJrItems.push(it);
    }
  });

  // 萃取核心款式名稱（去掉品牌名、JR、顏色*後綴、括號備註）
  const extractCoreStyle = (brand, title) => {
    let t = (title || '').toLowerCase();
    const b = (brand || '').toLowerCase().trim();
    if (b && t.startsWith(b)) t = t.slice(b.length);
    t = t.replace(/\*.*$/, ''); // 去掉 *顏色
    t = t.replace(/\([^)]*\)/g, ' '); // 去掉括號備註
    t = t.replace(/[\-\_\s]*jr[\-\_\s]*/gi, ' ');
    t = t.replace(/주니어/g, ' ');
    t = t.replace(/[^a-z0-9가-힣]/g, '');
    return t;
  };

  // 萃取顏色關鍵字（*後面的字，或品名最後一個韓文/英文單字）
  const extractColorToken = (title) => {
    const raw = (title || '').toLowerCase();
    if (raw.includes('*')) {
      return raw.split('*').pop().replace(/[^a-z0-9가-힣]/g, '');
    }
    const parts = raw.replace(/[\-\_\s]*jr[\-\_\s]*/gi, ' ').replace(/주니어/g, ' ').trim().split(/[\s\-\_\/]+/);
    return parts.length > 1 ? parts[parts.length - 1].replace(/[^a-z0-9가-힣]/g, '') : '';
  };

  const finalParsed = [...nonJrItems];
  let mergedJrCount = 0;

  jrItems.forEach(jr => {
    const jrBrand = (jr.brand || '').toLowerCase().trim();
    const jrCore = extractCoreStyle(jr.brand, jr._rawTitle);
    const jrColor = extractColorToken(jr._rawTitle);

    // 找出同品牌（或品牌相近）的無 JR 主商品候選清單
    const sameBrandItems = nonJrItems.filter(m => {
      const mb = (m.brand || '').toLowerCase().trim();
      return mb === jrBrand || (mb && jrBrand && (mb.includes(jrBrand) || jrBrand.includes(mb)));
    });

    let target = null;
    if (jrCore) {
      const styleMatches = sameBrandItems.filter(m => {
        const mCore = extractCoreStyle(m.brand, m._rawTitle);
        return mCore === jrCore || (mCore.length >= 2 && jrCore.length >= 2 && (mCore.includes(jrCore) || jrCore.includes(mCore)));
      });
      if (styleMatches.length === 1) {
        target = styleMatches[0];
      } else if (styleMatches.length > 1 && jrColor) {
        // 多色款式：優先比對顏色相同的主商品
        target = styleMatches.find(m => extractColorToken(m._rawTitle) === jrColor || (m._rawTitle || '').toLowerCase().includes(jrColor)) || null;
      }
    }

    if (target) {
      const jrSizes = (jr.sizes && jr.sizes.length && !(jr.sizes.length === 1 && jr.sizes[0] === 'F'))
        ? jr.sizes
        : ['JS', 'JM', 'JL'];
      jrSizes.forEach(sz => {
        if (!target.sizes.includes(sz)) target.sizes.push(sz);
        if (jr.price) {
          if (!target.sizePrices) target.sizePrices = {};
          target.sizePrices[sz] = jr.price;
        }
      });
      if (!target.price && jr.price) target.price = jr.price;
      mergedJrCount++;
    } else {
      // 若頁面確實沒有對應小童款，保留 JR 商品並確保帶入大童尺寸
      if (!jr.sizes.length || (jr.sizes.length === 1 && jr.sizes[0] === 'F')) {
        jr.sizes = ['JS', 'JM', 'JL'];
        if (jr.price) {
          jr.sizePrices = { JS: jr.price, JM: jr.price, JL: jr.price };
        }
      }
      finalParsed.push(jr);
    }
  });

  finalParsed.forEach(it => { delete it._rawTitle; delete it._rawCat; });
  editData = [...editData, ...finalParsed];
  const bulkCont = document.getElementById('bulkSizeContainer');
  if (bulkCont && !bulkCont.innerHTML.trim()) bulkCont.innerHTML = sizePicker('bulk', 0, bulkSizes);
  renderEditCards();
  const editSec = document.getElementById('editSection');
  editSec.style.display = 'block';
  editSec.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('krHtmlInput').value = '';
  const pricedCount = finalParsed.filter(x => x.price).length;
  const jrMsg = mergedJrCount > 0 ? `，已自動合併 ${mergedJrCount} 件 JR 大童價格` : '';
  const oosMsg = skippedSoldOutCount > 0 ? `，已略過 ${skippedSoldOutCount} 件斷貨商品` : '';
  showToast(`🎉 成功解析 ${finalParsed.length} 件商品（${pricedCount} 件已算好價格${jrMsg}${oosMsg}）！`, 5500);
}

(async function init() {
  _loadUsage();
  _loadOrders();
  _loadPreorderState();
  renderProducts([]);
  setupDragDrop();
  await loadProducts();
  await _loadSizeGuide();
  renderBrandTabs();
  applyFilters();
  _updatePendingBadge();
  _applyPreorderState();
  const urlParams = new URLSearchParams(location.search);
  const urlToken = urlParams.get('c');
  if (urlToken) await showOrderByToken(urlToken);
})();
