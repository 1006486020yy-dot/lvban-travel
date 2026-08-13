/* 旅伴｜景点 / 美食 / 酒店增强目录层
 * 只接管三个内容库页面：搜索 + 简洁城市筛选 + 完整数据。
 * 不触碰行程、方案 A/B、AI、交通逻辑。
 */
(function () {
  'use strict';

  const state = {
    spotCity: '全部',
    foodCity: '全部',
    hotelCity: '全部',
    spotQuery: '',
    foodQuery: '',
    hotelQuery: ''
  };

  const esc = (v) => String(v ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

  const val = (obj, ...keys) => {
    for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim()) return obj[k];
    return '';
  };

  function cities(items) {
    return ['全部', ...Array.from(new Set(items.map(x => val(x, 'city')).filter(Boolean)))];
  }

  function actionButtons(item) {
    const name = val(item, 'name');
    const address = val(item, 'address');
    const safeName = esc(name).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
    const safeAddr = esc(address).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
    return `<div class="actions">
      <button class="btn" onclick="copy('${safeName}')">复制名称</button>
      <button class="btn" onclick="copy('${safeAddr}')">复制地址</button>
      <button class="btn" onclick="nav('${safeName}','${safeAddr}')">导航</button>
      <button class="btn primary" onclick="addFromCatalog('${safeName}','${safeAddr}')">加入行程</button>
    </div>`;
  }

  function toolbar(target, type, items) {
    const q = state[type + 'Query'];
    const city = state[type + 'City'];
    const cs = cities(items);
    const cityOptions = cs.map(c => `<option value="${esc(c)}" ${c === city ? 'selected' : ''}>${esc(c)}</option>`).join('');
    return `<div class="catalog-tools">
      <input class="catalog-search" id="${target}Search" value="${esc(q)}" placeholder="搜索${type === 'spot' ? '景点' : type === 'food' ? '美食店铺' : '酒店'}名称、地址、关键词…" oninput="LVBAN_CATALOG.setQuery('${type}',this.value)">
      <select class="catalog-city" onchange="LVBAN_CATALOG.setCity('${type}',this.value)">${cityOptions}</select>
    </div>`;
  }

  function card(item, type) {
    const city = val(item, 'city');
    const name = val(item, 'name');
    const address = val(item, 'address');
    const extra = type === 'spot'
      ? [val(item, 'type'), val(item, 'highlight'), val(item, 'recommendedTime'), val(item, 'ticket'), val(item, 'openTime')].filter(Boolean)
      : type === 'food'
        ? [val(item, 'type'), val(item, 'recommended', 'dishes'), val(item, 'price')].filter(Boolean)
        : [val(item, 'rating'), val(item, 'price'), val(item, 'tags')].filter(Boolean);
    return `<article class="data card catalog-card">
      <div class="city">${esc(city)}</div>
      <h3>${esc(name)}</h3>
      <div class="addr">📍 ${esc(address || '暂无详细地址')}</div>
      ${extra.length ? `<div class="catalog-extra">${extra.map(x => `<span>${esc(x)}</span>`).join(' · ')}</div>` : ''}
      ${actionButtons(item)}
    </article>`;
  }

  function filter(items, type) {
    const city = state[type + 'City'];
    const query = state[type + 'Query'].trim().toLowerCase();
    return items.filter(item => {
      const cityOk = city === '全部' || val(item, 'city') === city;
      if (!cityOk) return false;
      if (!query) return true;
      return [val(item, 'name'), val(item, 'city'), val(item, 'address'), val(item, 'type'), val(item, 'highlight'), val(item, 'recommended', 'dishes'), val(item, 'tags')]
        .join(' ').toLowerCase().includes(query);
    });
  }

  function installStyles() {
    if (document.getElementById('lvbanCatalogStyles')) return;
    const style = document.createElement('style');
    style.id = 'lvbanCatalogStyles';
    style.textContent = `.catalog-tools{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:10px;margin:8px 0 14px}.catalog-search,.catalog-city{width:100%;min-height:46px;border:1px solid var(--line);border-radius:15px;background:#fff;padding:11px 14px;outline:none;color:var(--text)}.catalog-search:focus,.catalog-city:focus{border-color:var(--p);box-shadow:0 0 0 3px #6958f51a}.catalog-card{margin:10px 0}.catalog-extra{margin-top:8px;color:var(--muted);font-size:12px;line-height:1.6}.catalog-count{margin:-3px 2px 10px;color:var(--muted);font-size:12px}@media(max-width:760px){.catalog-tools{grid-template-columns:1fr}.catalog-search,.catalog-city{min-height:48px}}`;
    document.head.appendChild(style);
  }

  function ensureTool(target, type, items) {
    const host = document.getElementById(target);
    if (!host) return;
    const old = host.previousElementSibling;
    if (!old || !old.classList.contains('catalog-tools')) {
      host.insertAdjacentHTML('beforebegin', toolbar(target, type, items));
    }
  }

  function render(type) {
    const data = window.LVBAN_DATA || {};
    const key = type === 'spot' ? 'spots' : type === 'food' ? 'foods' : 'hotels';
    const target = type === 'spot' ? 'spotList' : type === 'food' ? 'foodList' : 'hotelList';
    const items = Array.isArray(data[key]) ? data[key] : [];
    ensureTool(target, type, items);
    const result = filter(items, type);
    const host = document.getElementById(target);
    if (!host) return;
    host.innerHTML = `<div class="catalog-count">共 ${result.length} 条${type === 'spot' ? '景点' : type === 'food' ? '美食' : '酒店'}</div>` +
      (result.length ? result.map(x => card(x, type)).join('') : `<div class="empty">没有找到匹配内容，换个关键词试试</div>`);
  }

  window.LVBAN_CATALOG = {
    setQuery(type, value) {
      state[type + 'Query'] = value;
      render(type);
      const input = document.getElementById((type === 'spot' ? 'spotList' : type === 'food' ? 'foodList' : 'hotelList') + 'Search');
      if (input) { input.focus(); input.selectionStart = input.selectionEnd = value.length; }
    },
    setCity(type, value) {
      state[type + 'City'] = value;
      render(type);
    },
    renderAll() { render('spot'); render('food'); render('hotel'); }
  };

  function boot() {
    installStyles();
    const ready = window.LVBAN_DATA_READY || Promise.resolve(window.LVBAN_DATA || {});
    ready.then(() => {
      // 等原页面脚本完成定义后再接管，避免改动行程 / AI / 交通。
      setTimeout(() => LVBAN_CATALOG.renderAll(), 0);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
