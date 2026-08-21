/* 旅伴：分享页运行时基础选择器。供 share-fix 的共享视图使用。 */
(function(){
  if(!window.$)window.$=(s,r=document)=>r.querySelector(s);
  if(!window.$$)window.$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
})();