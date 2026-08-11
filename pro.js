/* 旅伴旅行管家 · 行程删除增强层
   负责：行程卡片更多菜单、删除整个行程、删除日期、删除单条日程、首页倒计时。
   不使用 MutationObserver / 高频 setInterval，避免抢占页面点击事件。 */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function dateOf(v) {
    if (!v) return null;
    const d = new Date(String(v).slice(0, 10) + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>\"]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
    }[c]));
  }

  function getTrips() {
    if (Array.isArray(window.db?.trips)) return window.db.trips;
    try {
      const raw = localStorage.getItem('lvban-trips');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function pickTrip() {
    const hiddenDefault = localStorage.getItem('lvban-hidden-default-trip') === '1';
    const list = getTrips()
      .map(t => ({ trip: t, start: t.start, end: t.end }))
      .filter(x => dateOf(x.start))
      .filter(x => !(hiddenDefault && x.trip?.name === '十一福建游'))
      .sort((a, b) => dateOf(a.start) - dateOf(b.start));
    if (!list.length) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const current = list.find(x => {
      const s = dateOf(x.start), e = dateOf(x.end);
      return e && s <= now && now <= e;
    });
    if (current) return current;
    return list.find(x => dateOf(x.start) >= now) || list[list.length - 1];
  }

  function countdown() {
    const hero = $('#home .hero');
    if (!hero) return;
    let box = $('#lv-countdown', hero);
    if (!box) {
      box = document.createElement('div');
      box.id = 'lv-countdown';
      box.className = 'lv-countdown';
      hero.appendChild(box);
    }
    const target = pickTrip();
    if (!target) {
      box.innerHTML = '<b>还没有旅行计划</b><small>进入“我的行程”创建一次旅行</small>';
      return;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = dateOf(target.start), end = dateOf(target.end);
    const name = String(target.trip?.name || '我的旅行');
    if (start <= now && end && now <= end) {
      box.innerHTML = '<strong>旅行进行中</strong><small>当前行程：' + escapeHtml(name) + ' · ' +
        escapeHtml(target.start) + ' 至 ' + escapeHtml(target.end) + '</small>';
      return;
    }
    const days = Math.max(0, Math.ceil((start - now) / 86400000));
    box.innerHTML = '<strong>' + days + ' 天</strong><small>距离下一次出发 · ' +
      escapeHtml(name) + ' · ' + escapeHtml(target.start) + '</small>';
  }

  function injectStyle() {
    if ($('#lv-stable-style')) return;
    const style = document.createElement('style');
    style.id = 'lv-stable-style';
    style.textContent = `
      .lv-more-wrap{position:absolute;right:12px;top:12px;z-index:20}
      .lv-more{width:38px;height:34px!important;padding:0!important;border-radius:12px!important;font-size:20px!important;line-height:30px;background:#f3f1ff!important;color:#6254e8!important}
      .lv-menu{position:absolute;right:0;top:40px;min-width:142px;padding:6px;background:#fff;border:1px solid #eeeafa;border-radius:14px;box-shadow:0 12px 30px #302b5a25;display:none;z-index:100}
      .lv-menu.show{display:block}
      .lv-menu button{display:block;width:100%;text-align:left;padding:10px 11px;border-radius:10px;background:transparent;color:#333;font-size:13px}
      .lv-menu button:hover{background:#f5f3ff}
      .lv-menu .lv-danger{color:#d94e5c}
      .lv-day-delete{margin-left:auto!important;white-space:nowrap}
      .lv-day-x{display:inline-flex;align-items:center;justify-content:center;margin-left:8px;width:22px;height:22px;border-radius:8px;background:#fff0f1;color:#d94e5c;font-weight:900;cursor:pointer;vertical-align:middle}
      .lv-event-delete{margin-left:0!important;white-space:nowrap}
      .lv-delete-hint{margin-top:10px;color:#d94e5c;font-size:12px}
      .lv-countdown{margin-top:16px;padding:15px 16px;border-radius:20px;background:#ffffff20;border:1px solid #ffffff40;color:#fff}
      .lv-countdown strong{display:block;font-size:34px;font-weight:900;letter-spacing:-1px}
      .lv-countdown small,.lv-countdown b{display:block;font-size:12px;margin-top:4px;opacity:.92}
    `;
    document.head.appendChild(style);
  }

  function deleteDefaultTrip() {
    if (!confirm('确定删除“十一福建游”整个行程？删除后首页倒计时也不会再关联它。')) return;
    localStorage.setItem('lvban-hidden-default-trip', '1');
    if (typeof window.renderTrips === 'function') window.renderTrips();
    countdown();
    if (typeof window.toast === 'function') window.toast('行程已删除');
  }

  function deleteCustomTrip(index) {
    if (typeof window.deleteTrip === 'function') {
      window.deleteTrip(index);
      return;
    }
    try {
      const list = JSON.parse(localStorage.getItem('lvban-trips') || '[]');
      if (!Array.isArray(list) || !list[index]) return;
      if (!confirm('确定删除这个行程？')) return;
      list.splice(index, 1);
      localStorage.setItem('lvban-trips', JSON.stringify(list));
      if (typeof window.renderTrips === 'function') window.renderTrips();
      countdown();
    } catch {}
  }

  function addMoreMenu(card, index, isDefault) {
    if (card.querySelector('.lv-more-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'lv-more-wrap';
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'btn lv-more';
    more.textContent = '⋯';
    more.setAttribute('aria-label', '更多操作');

    const menu = document.createElement('div');
    menu.className = 'lv-menu';

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = '复制行程信息';
    copy.onclick = e => {
      e.stopPropagation();
      let text = '';
      if (isDefault) text = '十一福建游 · 2026-09-28 → 2026-10-04';
      else {
        try {
          const list = JSON.parse(localStorage.getItem('lvban-trips') || '[]');
          const t = Array.isArray(list) ? list[index] : null;
          text = t ? [t.name, t.start, t.end].filter(Boolean).join(' · ') : '';
        } catch {}
      }
      if (text) {
        navigator.clipboard?.writeText(text);
        if (typeof window.toast === 'function') window.toast('已复制行程信息');
      }
      menu.classList.remove('show');
    };

    const favorite = document.createElement('button');
    favorite.type = 'button';
    favorite.textContent = '收藏';
    favorite.onclick = e => {
      e.stopPropagation();
      localStorage.setItem('lvban-fav-' + (isDefault ? 'default' : index), '1');
      menu.classList.remove('show');
      if (typeof window.toast === 'function') window.toast('已收藏');
    };

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'lv-danger';
    del.textContent = '删除行程';
    del.onclick = e => {
      e.stopPropagation();
      menu.classList.remove('show');
      if (isDefault) deleteDefaultTrip();
      else deleteCustomTrip(index);
    };

    menu.append(copy, favorite, del);
    wrap.append(more, menu);
    card.appendChild(wrap);

    more.addEventListener('click', e => {
      e.stopPropagation();
      $$('.lv-menu').forEach(m => { if (m !== menu) m.classList.remove('show'); });
      menu.classList.toggle('show');
    });
  }

  function deleteCurrentDay() {
    try {
      const arr = window.schedules?.[window.state?.plan];
      const day = Number(window.state?.day || 0);
      if (!arr || !arr[day]) return;
      if (arr.length <= 1) {
        alert('至少保留一天行程。若不需要这个旅行，请删除整个行程。');
        return;
      }
      const title = arr[day].title || arr[day].date || '当天';
      if (!confirm('确定删除“' + title + '”整天行程？')) return;
      arr.splice(day, 1);
      window.state.day = Math.max(0, Math.min(day, arr.length - 1));
      if (typeof window.renderTrips === 'function') window.renderTrips();
      if (typeof window.toast === 'function') window.toast('当天行程已删除');
    } catch {}
  }

  function deleteCurrentEvent(index) {
    try {
      const arr = window.schedules?.[window.state?.plan];
      const day = Number(window.state?.day || 0);
      if (!arr || !arr[day] || !arr[day].items?.[index]) return;
      const item = arr[day].items[index];
      if (!confirm('确定删除“' + (item[1] || '这条日程') + '”？')) return;
      arr[day].items.splice(index, 1);
      if (typeof window.renderTrips === 'function') window.renderTrips();
      if (typeof window.toast === 'function') window.toast('日程已删除');
    } catch {}
  }

  function decorateTrips() {
    const page = $('#trips');
    if (!page) return;

    // 彻底移除“发现灵感”，不保留空白占位。
    $$('.tabs .tab', page).forEach(button => {
      if ((button.textContent || '').trim() === '发现灵感') button.remove();
    });

    const cards = $$('#tripList .tripcard');
    cards.forEach((card, i) => {
      const isDefault = (card.textContent || '').includes('十一福建游');
      if (isDefault && localStorage.getItem('lvban-hidden-default-trip') === '1') {
        card.remove();
        return;
      }
      addMoreMenu(card, i, isDefault);
      // 防止旧版内置删除按钮与新菜单重复。
      $$('.tripcard > .delete', card).forEach(btn => btn.remove());
    });

    const detail = $('#tripDetail');
    if (!detail) return;

    const panel = $('.panel', detail);
    const bar = $('.detailbar', detail);
    if (bar) {
      let button = bar.querySelector('.lv-day-delete');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn danger lv-day-delete';
        button.textContent = '删除当天';
        button.addEventListener('click', e => { e.stopPropagation(); deleteCurrentDay(); });
        bar.appendChild(button);
      }
    }

    // 每个日期按钮右侧都有明确的 × 删除入口。
    $$('.days .day', detail).forEach((dayButton, i) => {
      if (dayButton.querySelector('.lv-day-x')) return;
      const x = document.createElement('span');
      x.className = 'lv-day-x';
      x.textContent = '×';
      x.title = '删除当天';
      x.addEventListener('click', e => {
        e.stopPropagation();
        window.state.day = i;
        deleteCurrentDay();
      });
      dayButton.appendChild(x);
    });

    // 每一条详细时间日程都强制补一个删除按钮，避免被旧版 HTML/CSS 吃掉。
    $$('.timeline .event', detail).forEach((event, i) => {
      const actions = $('.actions:last-child', event);
      if (actions && actions.querySelector('.lv-event-delete')) return;
      const target = actions || (() => {
        const x = document.createElement('div');
        x.className = 'actions';
        event.appendChild(x);
        return x;
      })();
      const edit = [...target.querySelectorAll('button')].find(b => (b.textContent || '').trim() === '编辑');
      if (!edit) {
        const editButton = document.createElement('button');
        editButton.className = 'btn';
        editButton.type = 'button';
        editButton.textContent = '编辑';
        editButton.addEventListener('click', e => { e.stopPropagation(); if (typeof window.editEvent === 'function') window.editEvent(i); });
        target.appendChild(editButton);
      }
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn danger lv-event-delete';
      del.textContent = '删除';
      del.addEventListener('click', e => { e.stopPropagation(); deleteCurrentEvent(i); });
      target.appendChild(del);
    });

    // 在“添加日程”区域下面给用户一个明确的删除提示，避免删除入口不明显。
    if (bar && !detail.querySelector('.lv-delete-hint')) {
      const hint = document.createElement('div');
      hint.className = 'lv-delete-hint';
      hint.textContent = '可删除当天，也可删除下面任意一条详细日程';
      bar.parentElement?.insertBefore(hint, bar.nextSibling);
    }
  }

  function wrapRender() {
    if (window.__lvStableRenderWrapped || typeof window.renderTrips !== 'function') return;
    const original = window.renderTrips;
    window.renderTrips = function () {
      const result = original.apply(this, arguments);
      decorateTrips();
      countdown();
      return result;
    };
    window.__lvStableRenderWrapped = true;
  }

  function run() {
    injectStyle();
    wrapRender();
    decorateTrips();
    countdown();
  }

  document.addEventListener('DOMContentLoaded', () => {
    run();
    setTimeout(run, 150);
    setTimeout(run, 600);
  });

  window.addEventListener('storage', () => {
    decorateTrips();
    countdown();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.lv-more-wrap')) {
      $$('.lv-menu.show').forEach(m => m.classList.remove('show'));
    }
  });
})();
