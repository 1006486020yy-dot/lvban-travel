/* 旅伴旅行管家 · 新建行程表单最终修复 */
(function(){
  const cities=['厦门','福州','泉州','平潭','上海','杭州','北京','广州','深圳','成都','重庆','西安','南京','苏州','三亚','珠海','青岛','大连','武汉','长沙','昆明','大理','丽江','桂林','张家界','香港','澳门','东京','大阪','京都','首尔','新加坡','曼谷','巴黎','伦敦','罗马'];
  const $=s=>document.querySelector(s);
  function injectStyle(){
    if($('#lv-create-trip-style'))return;
    const s=document.createElement('style');s.id='lv-create-trip-style';s.textContent=`
      .lv-create-flow{padding:2px 0 4px}
      .lv-create-flow .form{display:flex;flex-direction:column;gap:8px}
      .lv-create-flow label{font-size:13px;color:var(--muted);font-weight:700;margin-top:3px}
      .lv-create-flow input[type=text],.lv-create-flow input[type=date]{box-sizing:border-box;width:100%;height:48px;padding:0 14px;border:1px solid var(--line);border-radius:14px;background:#fff;font-size:15px;outline:none}
      .lv-create-flow input:focus{border-color:var(--p);box-shadow:0 0 0 3px #6958f515}
      .lv-city-wrap{position:relative}
      .lv-city-results{display:none;position:absolute;left:0;right:0;top:53px;z-index:300;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 14px 30px rgba(40,30,90,.14);padding:6px;max-height:230px;overflow:auto}
      .lv-city-results.show{display:block}
      .lv-city-option{display:block;width:100%;border:0;background:#fff;text-align:left;padding:11px 12px;border-radius:10px;font-size:14px;cursor:pointer}
      .lv-city-option:hover{background:#f2f0ff;color:var(--p)}
      .lv-city-hint{font-size:11px;color:var(--muted);margin-top:1px}
      .lv-city-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:3px}
      .lv-city-chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;font-size:11px;color:#5d4de5;cursor:pointer}
      .lv-route-box{display:flex;align-items:center;gap:11px;padding:13px 14px;background:#fff;border:1px solid var(--line);border-radius:14px;cursor:pointer;margin-top:3px}
      .lv-route-box input{width:18px;height:18px;margin:0;accent-color:var(--p)}
      .lv-route-box b{font-size:13px;color:#30303b}.lv-route-box small{display:block;color:var(--muted);font-size:11px;margin-top:3px}
      .lv-create-mode{margin-top:3px}.lv-create-mode-title{font-size:13px;color:var(--muted);font-weight:700;margin-bottom:8px}
      .lv-choice-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .lv-choice{min-height:58px;border:1px solid var(--line);border-radius:14px;background:#fff;color:#555;padding:10px 12px;text-align:left;cursor:pointer}
      .lv-choice b{display:block;font-size:13px;color:#24242d}.lv-choice span{display:block;font-size:10px;color:var(--muted);margin-top:4px}
      .lv-choice.on{border:2px solid var(--p);background:#f1efff;color:var(--p);padding:9px 11px;box-shadow:0 5px 16px #6958f51a}
      .lv-choice.on b{color:var(--p)}
      .lv-create-submit{width:100%;height:50px;border:0;border-radius:15px;background:var(--p);color:#fff;font-size:15px;font-weight:800;margin-top:4px;cursor:pointer}
      @media(max-width:600px){.lv-choice-row{grid-template-columns:1fr}.lv-city-chips{display:none}}
    `;document.head.appendChild(s);
  }
  function openNewTrip(){
    const m=$('#modal');if(!m)return;
    injectStyle();
    $('#modalTitle').textContent='新建行程';
    $('#modalBody').innerHTML=`
      <div class="lv-create-flow">
        <div class="form">
          <label>行程名称</label>
          <input id="ntName" type="text" placeholder="例如：国庆厦门慢旅行" autocomplete="off">
          <label>目的地</label>
          <div class="lv-city-wrap">
            <input id="ntCity" type="text" placeholder="搜索或选择城市，例如：厦门" autocomplete="off">
            <div id="lvCityResults" class="lv-city-results"></div>
          </div>
          <div class="lv-city-hint">支持直接搜索城市，也可以从常用城市中选择</div>
          <div class="lv-city-chips">${cities.slice(0,12).map(c=>`<button type="button" class="lv-city-chip" data-city="${c}">${c}</button>`).join('')}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div><label>开始日期</label><input id="ntStart" type="date"></div>
            <div><label>结束日期</label><input id="ntEnd" type="date"></div>
          </div>
          <label class="lv-route-box" for="ntAlternate">
            <input id="ntAlternate" type="checkbox">
            <span><b>是否有备选路线</b><small>只有勾选后，才会出现方案 A / 方案 B</small></span>
          </label>
          <div class="lv-create-mode">
            <div class="lv-create-mode-title">你想怎么创建？</div>
            <div class="lv-choice-row">
              <button type="button" class="lv-choice on" data-mode="manual"><b>我自己安排</b><span>自己添加日期和详细行程</span></button>
              <button type="button" class="lv-choice" data-mode="ai"><b>让 AI 帮我规划</b><span>创建后进入 AI 规划</span></button>
            </div>
          </div>
          <button type="button" class="lv-create-submit" id="lvCreateSubmit">创建行程</button>
        </div>
      </div>`;
    m.classList.add('show');
    window._createMode='manual';
    const input=$('#ntCity'),results=$('#lvCityResults');
    function renderCities(q){
      const keyword=String(q||'').trim().toLowerCase();
      const list=keyword?cities.filter(c=>c.toLowerCase().includes(keyword)):cities.slice(0,10);
      results.innerHTML=list.length?list.map(c=>`<button type="button" class="lv-city-option" data-city="${c}">${c}</button>`).join(''):'<div style="padding:12px;color:var(--muted);font-size:12px">没有匹配城市，可直接使用你输入的城市名称</div>';
      results.classList.add('show');
    }
    input.onfocus=()=>renderCities(input.value);
    input.oninput=()=>renderCities(input.value);
    results.onclick=e=>{const b=e.target.closest('[data-city]');if(!b)return;input.value=b.dataset.city;results.classList.remove('show');input.focus();input.setSelectionRange(input.value.length,input.value.length)};
    document.querySelectorAll('.lv-city-chip').forEach(b=>b.onclick=()=>{input.value=b.dataset.city;results.classList.remove('show')});
    document.querySelectorAll('.lv-choice').forEach(b=>b.onclick=()=>{window._createMode=b.dataset.mode;document.querySelectorAll('.lv-choice').forEach(x=>x.classList.toggle('on',x===b))});
    $('#lvCreateSubmit').onclick=()=>window.createTripFromForm?.();
    document.addEventListener('click',function closeCity(e){if(!e.target.closest('.lv-city-wrap'))results.classList.remove('show')},{once:true});
  }
  function boot(){
    window.openNewTrip=openNewTrip;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
