/* VNext interaction fixes */
(()=>{
let draft={};
const oldNewTrip=window.newTrip;
window.newTrip=function(){oldNewTrip();if(draft.name){document.querySelector('#tName').value=draft.name;document.querySelector('#tStart').value=draft.start;document.querySelector('#tEnd').value=draft.end;document.querySelector('#backup').checked=draft.backup;document.querySelector('#backupHint').textContent=draft.backup?'已开启备选路线：创建后可切换多个方案':'关闭后只生成一套行程';document.querySelector('#selfMode').classList.toggle('on',draft.mode!=='ai');document.querySelector('#aiMode').classList.toggle('on',draft.mode==='ai');if(draft.cities?.length){window.newCities=[...draft.cities];document.querySelector('#pickedCities').innerHTML=draft.cities.map(c=>`<span>${c} ×</span>`).join('');document.querySelector('#cityBox').textContent=`已选择 ${draft.cities.length} 个城市`;}}};
window.cityPicker=function(){draft={name:document.querySelector('#tName')?.value||'',start:document.querySelector('#tStart')?.value||'',end:document.querySelector('#tEnd')?.value||'',backup:document.querySelector('#backup')?.checked||false,mode:window.createMode||'self',cities:[...(window.newCities||[])]};let selected=new Set(draft.cities);modal('选择目的地',`<div class="citySearch"><input id="citySearch" placeholder="搜索城市，例如：厦门、杭州" oninput="renderCityPicker(this.value)"></div><div id="cityPickerList"></div><button class="primary wide" onclick="applyCities()">确定（<span id="cityCount">${selected.size}</span>）</button>`);window.citySet=selected;renderCityPicker('')};
window.applyCities=function(){draft.cities=[...window.citySet];closeModal();window.newCities=[...draft.cities];setTimeout(()=>{window.newTrip();},20)};
const oldCreate=window.createTrip;window.createTrip=function(){if(!document.querySelector('#tName'))return;oldCreate()};
})();
