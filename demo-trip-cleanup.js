/* 旅伴｜示例行程整理
   只整理默认的“十一福建游”示例，不影响用户自己创建的行程。
*/
(function(){
  'use strict';
  const VERSION='20260902-clean-v1';
  const getDB=()=>typeof window.db==='function'?window.db():window.db;
  const save=()=>window.save?.();
  const uid=(p,s)=>`${p}-${s}`;
  const days=[
    {day:1,date:'2026-09-28',city:'福州',cityLabel:'福州',title:'抵达福州',items:[
      {id:uid('demo','1-1'),time:'晚间',type:'交通',name:'北京 / 杭州 → 福州',address:'福州长乐国际机场',note:'晚上抵达福州。'},
      {id:uid('demo','1-2'),time:'晚间',type:'住宿',name:'福州酒店入住',address:'福州市区',note:'办理入住后休息。'}
    ]},
    {day:2,date:'2026-09-29',city:'平潭',cityLabel:'福州 → 平潭',title:'福州半日 → 平潭',items:[
      {id:uid('demo','2-1'),time:'上午',type:'景点',name:'三坊七巷',address:'福州市鼓楼区南后街',note:'上午游览历史街区。'},
      {id:uid('demo','2-2'),time:'午间',type:'美食',name:'福州午餐',address:'三坊七巷附近',note:'午餐后前往福州站。'},
      {id:uid('demo','2-3'),time:'下午',type:'交通',name:'福州 → 平潭',address:'福州站 → 平潭站',note:'前往平潭办理入住。'},
      {id:uid('demo','2-4'),time:'下午',type:'景点',name:'猴研岛（68海里）',address:'平潭县澳前镇东澳村',note:'平潭南线海岛风光。'},
      {id:uid('demo','2-5'),time:'傍晚',type:'景点',name:'坛南湾',address:'平潭县敖东镇坛南湾',note:'海边散步、看日落。'},
      {id:uid('demo','2-6'),time:'晚上',type:'住宿',name:'平潭酒店入住',address:'龙王头沙滩附近',note:'入住后休息。'}
    ]},
    {day:3,date:'2026-09-30',city:'平潭',cityLabel:'平潭',title:'平潭北线',items:[
      {id:uid('demo','3-1'),time:'早晨',type:'景点',name:'龙王头海滨浴场',address:'平潭龙王头',note:'看日出。'},
      {id:uid('demo','3-2'),time:'上午',type:'景点',name:'仙人井',address:'平潭县流水镇',note:'海蚀地貌与海岸风光。'},
      {id:uid('demo','3-3'),time:'中午',type:'美食',name:'北港村午餐',address:'平潭县流水镇北港村',note:'在北港村附近用餐。'},
      {id:uid('demo','3-4'),time:'下午',type:'景点',name:'镜沙黑沙滩',address:'平潭县流水镇镜沙村',note:'黑沙滩海岸景观。'},
      {id:uid('demo','3-5'),time:'傍晚',type:'景点',name:'长江澳风车田',address:'平潭县平原镇长江澳',note:'风车与海岸线。'},
      {id:uid('demo','3-6'),time:'晚上',type:'住宿',name:'平潭酒店',address:'平潭城区',note:'晚餐后休息。'}
    ]},
    {day:4,date:'2026-10-01',city:'厦门',cityLabel:'平潭 → 厦门',title:'抵达厦门 · 环岛海景',items:[
      {id:uid('demo','4-1'),time:'上午',type:'交通',name:'平潭 → 厦门',address:'平潭站 → 厦门',note:'离开平潭前往厦门。'},
      {id:uid('demo','4-2'),time:'下午',type:'景点',name:'胡里山炮台',address:'厦门市思明区胡里山炮台',note:'海防历史与厦门湾海景。'},
      {id:uid('demo','4-3'),time:'下午',type:'景点',name:'白城沙滩',address:'厦门市思明区环岛南路',note:'短暂停留看海、散步。'},
      {id:uid('demo','4-4'),time:'傍晚',type:'景点',name:'演武大桥观景区域',address:'厦门市思明区演武路',note:'看厦门湾和城市海景。'},
      {id:uid('demo','4-5'),time:'晚上',type:'景点',name:'沙坡尾',address:'厦门市思明区大学路',note:'逛避风坞与艺术街区。'}
    ]},
    {day:5,date:'2026-10-02',city:'厦门',cityLabel:'厦门',title:'鼓浪屿一日游',items:[
      {id:uid('demo','5-1'),time:'上午',type:'交通',name:'厦门 → 鼓浪屿',address:'东渡客运码头 → 鼓浪屿',note:'乘轮渡上岛。'},
      {id:uid('demo','5-2'),time:'上午',type:'景点',name:'鼓浪屿',address:'厦门市思明区鼓浪屿',note:'岛上街巷与历史建筑。'},
      {id:uid('demo','5-3'),time:'中午',type:'美食',name:'鼓浪屿午餐',address:'鼓浪屿岛内',note:'岛上用餐。'},
      {id:uid('demo','5-4'),time:'下午',type:'景点',name:'日光岩',address:'厦门市思明区鼓浪屿晃岩路62号',note:'登高俯瞰鼓浪屿与厦门。'},
      {id:uid('demo','5-5'),time:'下午',type:'景点',name:'菽庄花园',address:'厦门市思明区鼓浪屿',note:'园林与海景。'},
      {id:uid('demo','5-6'),time:'晚上',type:'景点',name:'中山路步行街',address:'厦门市思明区中山路',note:'返回厦门后夜游。'}
    ]},
    {day:6,date:'2026-10-03',city:'厦门',cityLabel:'厦门',title:'南普陀 · 植物园 · 集美',items:[
      {id:uid('demo','6-1'),time:'上午',type:'景点',name:'南普陀寺',address:'厦门市思明区思明南路515号',note:'上午游览。'},
      {id:uid('demo','6-2'),time:'中午',type:'美食',name:'厦门午餐',address:'思明区附近',note:'午餐后前往植物园。'},
      {id:uid('demo','6-3'),time:'下午',type:'景点',name:'厦门园林植物园',address:'厦门市思明区虎园路25号',note:'热带雨林、多肉植物等区域。'},
      {id:uid('demo','6-4'),time:'下午',type:'景点',name:'钟鼓索道',address:'厦门市思明区虎园路',note:'俯瞰厦门城市与山海景观。'},
      {id:uid('demo','6-5'),time:'傍晚',type:'交通',name:'前往集美区',address:'思明区 → 集美区',note:'前往集美办理入住。'},
      {id:uid('demo','6-6'),time:'晚上',type:'住宿',name:'集美区酒店入住',address:'厦门市集美区',note:'入住后在集美区晚餐。'}
    ]},
    {day:7,date:'2026-10-04',city:'厦门',cityLabel:'集美',title:'集美半日 → 返回',items:[
      {id:uid('demo','7-1'),time:'上午',type:'景点',name:'集美学村',address:'厦门市集美区',note:'感受集美建筑与校园风光。'},
      {id:uid('demo','7-2'),time:'中午',type:'美食',name:'集美午餐',address:'集美区',note:'午餐后自由活动。'},
      {id:uid('demo','7-3'),time:'下午',type:'自由活动',name:'集美区自由活动',address:'厦门市集美区',note:'根据返程时间灵活安排。'},
      {id:uid('demo','7-4'),time:'晚上',type:'交通',name:'厦门 → 杭州',address:'厦门 → 杭州',note:'返回杭州。'}
    ]}
  ];
  function clean(){
    const d=getDB();if(!d||!Array.isArray(d.trips))return;
    const t=d.trips.find(x=>x&&x.name==='旅伴旅行管家｜十一福建游');if(!t||t.__demoCleanVersion===VERSION)return;
    const plan=t.plans?.[0]||{id:'plan-demo',name:'默认行程'};
    const cloned=days.map(x=>({...x,items:x.items.map(i=>({...i}))}));
    plan.days=cloned;t.plans=Array.isArray(t.plans)&&t.plans.length?t.plans:[plan];
    t.days=cloned.map(x=>({...x,items:x.items.map(i=>({...i}))}));
    t.cities=['福州','平潭','厦门'];t.cityDays={福州:1,平潭:2,厦门:4};t.__demoCleanVersion=VERSION;
    save();window.dispatchEvent(new CustomEvent('lvban-db-change'));window.dispatchEvent(new CustomEvent('lvban-demo-cleaned'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(clean,250),{once:true});else setTimeout(clean,250);
})();
