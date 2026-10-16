import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';

test('Gateway CRUD, independent data and dependency failures', async () => {
 const folder=mkdtempSync(path.join(os.tmpdir(),'soa-test-'));
 const env={...process.env,DATA_DIR:folder,SV_PORT:'14301',DT_PORT:'14302',DK_PORT:'14303',GATEWAY_PORT:'14300',SV_URL:'http://127.0.0.1:14301',DT_URL:'http://127.0.0.1:14302',DK_URL:'http://127.0.0.1:14303'};
 const children=[];
 async function start(file){const child=fork(new URL(file,import.meta.url),[],{env,stdio:['ignore','ignore','pipe','ipc']});children.push(child);await Promise.race([once(child,'message'),once(child,'exit').then(()=>{throw Error('Service exited before ready');}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Startup timeout')),10000);t.unref();})]);return child;}
 async function request(resource,method='GET',body){const response=await fetch('http://127.0.0.1:14300'+resource,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:response.status,data:response.status===204?null:await response.json()};}
 try{
 await start('../services/sinhvien/index.js');const topic=await start('../services/detai/index.js');await start('../services/dangky/index.js');await start('../src/gateway.js');
 const home=await fetch('http://127.0.0.1:14300/');assert.equal(home.status,200);assert.match(await home.text(), /SOA Workspace/);
 assert.equal((await request('/api/health')).data.filter(s=>s.status==='up').length,3);
 assert.equal((await request('/api/sinhvien','POST',{maSV:'SV1',hoTen:'Nguyễn An',lop:'CT01'})).status,201);
 assert.equal((await request('/api/sinhvien','POST',{maSV:'SV1',hoTen:'Trùng',lop:'CT01'})).status,409);
 assert.equal((await request('/api/sinhvien','POST',{})).status,400);
 assert.equal((await request('/api/detai','POST',{maDT:'DT1',tenDeTai:'SOA'})).status,201);
 let registration=await request('/api/dangky','POST',{maSV:'SV1',maDT:'DT1'});assert.equal(registration.status,201);const id=registration.data.maDK;
 assert.equal((await request('/api/dangky','POST',{maSV:'SV1',maDT:'DT1'})).status,409);
 assert.equal((await request('/api/dangky','POST',{maSV:'missing',maDT:'DT1'})).status,404);
 assert.equal((await request('/api/sinhvien/SV1','PUT',{hoTen:'Đã sửa',lop:'CT02'})).data.hoTen,'Đã sửa');
 assert.equal((await request('/api/detai/DT1','PUT',{tenDeTai:'Đã sửa',moTa:'HTTP'})).status,200);
 assert.equal((await request('/api/dangky/'+id,'PUT',{maSV:'SV1',maDT:'DT1'})).status,200);
 const exited=once(topic,'exit');topic.send('stop');await exited;
 assert.equal((await request('/api/dangky','POST',{maSV:'SV1',maDT:'DT1'})).status,503);
 assert.equal((await request('/api/detai')).status,503);
 assert.equal((await request('/api/sinhvien')).status,200);
 await start('../services/detai/index.js');assert.equal((await request('/api/detai/DT1')).data.moTa,'HTTP');
 assert.equal((await request('/api/dangky/'+id,'DELETE')).status,204);
 assert.equal((await request('/api/sinhvien/SV1','DELETE')).status,204);
 assert.equal((await request('/api/detai/DT1','DELETE')).status,204);
 assert.equal((await request('/api/unknown')).status,404);
 assert.equal((await request('/api/toString')).status,404);
 const malformed=await fetch('http://127.0.0.1:14300/api/sinhvien',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(malformed.status,400);
 const unsupported=await fetch('http://127.0.0.1:14300/api/sinhvien',{method:'POST',headers:{'Content-Type':'text/plain'},body:'hello'});assert.equal(unsupported.status,415);
 }finally{await Promise.all(children.filter(c=>c.exitCode===null).map(async c=>{const done=once(c,'exit');if(c.connected)c.send('stop');else c.kill();await done;}));rmSync(folder,{recursive:true,force:true});}
});
