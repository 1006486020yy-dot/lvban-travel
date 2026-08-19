(function(){
  function bind(){
    document.querySelectorAll('[data-share-trip],#shareTripBtn,.share-trip-btn,.share-btn').forEach(function(el){
      if(el.dataset.shareBound==='1') return;
      el.dataset.shareBound='1';
      el.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        var t=window.currentTrip?.()||window.db?.trips?.find(x=>x.id===window.activeTrip)||window.db?.trips?.[0];
        if(window.openShareModal) return window.openShareModal(t);
        var m=document.getElementById('modal'); if(!m) return;
        var title=document.getElementById('modalTitle'), body=document.getElementById('modalBody');
        if(title) title.textContent='分享行程';
        if(body) body.innerHTML='<div class="form"><p>选择分享方式</p><button class="btn primary" id="shareReadonly">只读查看</button><button class="btn" id="shareCollaborate">好友协作编辑</button><div id="shareResult" style="margin-top:12px"></div></div>';
        m.classList.add('show');
        function make(mode){
          var id=t?.id||window.activeTrip||'trip-main';
          fetch('/api/share',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tripId:id,mode:mode,trip:t})}).then(r=>r.json()).then(x=>{document.getElementById('shareResult').innerHTML=x.url?'<p>分享链接已生成</p><input readonly value="'+x.url+'" onclick="this.select()">':'<p>分享生成失败，请检查 Cloudflare KV 绑定。</p>';}).catch(()=>{document.getElementById('shareResult').textContent='分享生成失败，请检查 Cloudflare Functions。';});
        }
        document.getElementById('shareReadonly')?.addEventListener('click',()=>make('readonly'));
        document.getElementById('shareCollaborate')?.addEventListener('click',()=>make('collaborate'));
      });
    });
  }
  new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',bind); setTimeout(bind,300); setTimeout(bind,1200);
})();