/* 旅伴旅行管家 Pro · 全国旅游数据层 */
(function(){
  'use strict';
  const cityFile='data/cities.json',spotFile='data/spots.json',foodFile='data/foods.json',hotelFile='data/hotels.json';
  const mapSpot=x=>({id:x.spotId||x.id,spotId:x.spotId||x.id,name:x['景点名称']||x.name||'',city:x['城市']||x.city||'',province:x['省份']||x.province||'',type:x['类型']||x.type||'',address:x['地址']||x.address||'',highlight:x['简介']||x.highlight||'',note:x['简介']||x.note||'',recommendedTime:x['推荐游玩时间']||'',recommendTime:x['推荐游玩时间']||'',season:x['推荐季节']||'',ticket:x['门票']||'',price:x['门票']||'',openTime:x['开放时间']||'',transport:x['交通']||'',latlng:x['经纬度']||'',image:x['图片']||'',tags:x['标签']||'',hot:x['热门程度']||''});
  const mapFood=x=>({id:x.foodId||x.id,foodId:x.foodId||x.id,name:x['店名']||x.name||'',city:x['城市']||x.city||'',address:x['地址']||x.address||'',type:x['类型']||x.type||'',dishes:x['推荐菜']||'',recommended:x['推荐菜']||'',price:x['人均']||'',tags:x['标签']||'',note:x['推荐菜']||'',latlng:x['经纬度']||'',image:x['图片']||''});
  const mapHotel=x=>({id:x.hotelId||x.id,hotelId:x.hotelId||x.id,name:x['酒店名称']||x.name||'',city:x['城市']||x.city||'',address:x['地址']||x.address||'',rating:x['星级']||'',price:x['价格区间']||'',tags:x['标签']||'',image:x['图片']||'',latlng:x['经纬度']||'',favorite:x['用户收藏']||''});
  window.LVBAN_DATA={cities:['福州','平潭','泉州','厦门'],cityRecords:[],spots:[],foods:[],hotels:[]};
  window.LVBAN_DATA_READY=Promise.all([fetch(cityFile).then(r=>r.json()),fetch(spotFile).then(r=>r.json()),fetch(foodFile).then(r=>r.json()),fetch(hotelFile).then(r=>r.json())]).then(([cities,spots,foods,hotels])=>{window.LVBAN_DATA.cityRecords=cities;window.LVBAN_DATA.cities=cities.map(x=>x['城市']||x.city).filter(Boolean);window.LVBAN_DATA.spots=spots.map(mapSpot);window.LVBAN_DATA.foods=foods.map(mapFood);window.LVBAN_DATA.hotels=hotels.map(mapHotel);window.dispatchEvent(new CustomEvent('lvban-data-ready'));return window.LVBAN_DATA}).catch(err=>{console.error('[旅伴] 数据加载失败',err);window.dispatchEvent(new CustomEvent('lvban-data-error',{detail:err}));return window.LVBAN_DATA});
  const load=src=>{const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s)};
  load('data/catalog-ui.js?v=20260821-1');
  load('trip-day-create.js?v=20260821-1');
  load('catalog-add-prefill.js?v=20260821-1');
  load('catalog-add-flow-unified.js?v=20260821-2');
  load('itinerary-seed-fujian-2026.js?v=20260821-1');
  load('fujian-xiamen-date-cleanup.js?v=20260821-3');
  load('share-runtime-fix.js?v=20260821-1');
  load('trip-list-dom-fix.js?v=20260821-1');
  load('new-trip-form-v2.js?v=20260821-1');
  const updateHomeTripSubtitle=()=>{const el=document.querySelector('#home .grid .tile .muted');if(el)el.textContent='准备好就出发吧'};
  updateHomeTripSubtitle();
  window.addEventListener('lvban-data-ready',updateHomeTripSubtitle);
})();