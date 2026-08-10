(function(){
 const KEY='lvban_pro_store_v1';
 const defaults={trips:[],favorites:{spots:[],foods:[],hotels:[],other:[]},settings:{},aiMemory:[],tools:{}};
 function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return JSON.parse(JSON.stringify(defaults));}}
 function save(s){localStorage.setItem(KEY,JSON.stringify(s));return s;}
 window.LvbanStore={
  key:KEY,load,save,get(){return load()},patch(fn){const s=load();fn(s);return save(s)},
  export(){const blob=new Blob([JSON.stringify(load(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lvban-backup-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)},
  importFile(file,done){const r=new FileReader();r.onload=()=>{try{save(JSON.parse(r.result));done&&done(true)}catch(e){done&&done(false)}};r.readAsText(file)},
  fav(type,id){return this.patch(s=>{s.favorites[type] ||= [];const a=s.favorites[type],i=a.indexOf(id);i<0?a.push(id):a.splice(i,1)})},
  isFav(type,id){return load().favorites[type]?.includes(id)}
 };
})();
