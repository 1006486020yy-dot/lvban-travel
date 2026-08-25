/* 旅伴旅行管家 · 日期范围布局修复
 * 只整理日期范围选择器的 DOM 位置，不改变日期逻辑。
 */
(function(){
'use strict';
function fix(){
  const wrap=document.getElementById('lvDateFinal');
  const legacy=document.querySelector('.lvntv2-date');
  if(!wrap||!legacy||wrap.dataset.layoutFixed==='1')return;
  wrap.dataset.layoutFixed='1';
  legacy.style.display='none';
  legacy.parentElement?.insertBefore(wrap,legacy);
}
const timer=setInterval(fix,120);setTimeout(()=>clearInterval(timer),20000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
})();
