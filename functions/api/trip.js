const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const code=()=>{const a=new Uint8Array(9);crypto.getRandomValues(a);return 'LV'+Array.from(a,b=>b.toString(36).padStart(2,'0')).join('').slice(0,12).toUpperCase()};
export async function onRequestGet({request,env}){
  if(!env.LVBAN_KV)return json({error:'LVBAN_KV_NOT_CONFIGURED'},503);
  const c=new URL(request.url).searchParams.get('code');if(!c)return json({error:'missing code'},400);
  const room=await env.LVBAN_KV.get('room:'+c,'json');if(!room)return json({error:'room not found'},404);return json(room);
}
export async function onRequestPost({request,env}){
  if(!env.LVBAN_KV)return json({error:'LVBAN_KV_NOT_CONFIGURED'},503);
  let body;try{body=await request.json()}catch{return json({error:'invalid json'},400)}
  if(body.action==='create'){
    if(!body.trip)return json({error:'missing trip'},400);const c=code();const room={code:c,trip:body.trip,votes:{route:0,spots:0,food:0},members:[],createdAt:Date.now()};await env.LVBAN_KV.put('room:'+c,JSON.stringify(room),{expirationTtl:2592000});return json({code:c});
  }
  if(body.action==='vote'){
    const c=String(body.code||''),option=String(body.option||'');if(!c||!['route','spots','food'].includes(option))return json({error:'invalid vote'},400);const key='room:'+c;const room=await env.LVBAN_KV.get(key,'json');if(!room)return json({error:'room not found'},404);room.votes=room.votes||{route:0,spots:0,food:0};room.votes[option]=Number(room.votes[option]||0)+1;await env.LVBAN_KV.put(key,JSON.stringify(room),{expirationTtl:2592000});return json({votes:room.votes});
  }
  if(body.action==='member'){
    const c=String(body.code||''),name=String(body.name||'朋友').slice(0,30),permission=body.permission==='edit'?'edit':'view',key='room:'+c,room=await env.LVBAN_KV.get(key,'json');if(!room)return json({error:'room not found'},404);room.members=Array.isArray(room.members)?room.members:[];room.members.push({name,permission,joinedAt:Date.now()});await env.LVBAN_KV.put(key,JSON.stringify(room),{expirationTtl:2592000});return json({members:room.members});
  }
  return json({error:'unknown action'},400);
}
