const config = {
 sinhvien:{title:'Sinh viên',description:'Quản lý hồ sơ sinh viên tham gia đồ án tốt nghiệp.',fields:['maSV','hoTen','lop'],port:3001},
 detai:{title:'Đề tài',description:'Tổ chức danh mục đề tài và nội dung nghiên cứu.',fields:['maDT','tenDeTai','moTa'],port:3002},
 dangky:{title:'Đăng ký',description:'Kết nối sinh viên với đề tài thông qua các dịch vụ HTTP.',fields:['maDK','maSV','maDT','ngayDangKy'],port:3003}
};
const labels={maSV:'Mã sinh viên',hoTen:'Họ và tên',lop:'Lớp',maDT:'Mã đề tài',tenDeTai:'Tên đề tài',moTa:'Mô tả',maDK:'Mã đăng ký',ngayDangKy:'Ngày đăng ký'};
const state={view:'overview',data:{},errors:{},health:[],editing:null,selected:null,busy:false,loading:false};
const $=s=>document.querySelector(s);
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
const iconPaths={cap:'m2 9 10-5 10 5-10 5zM6 11v6c4 3 8 3 12 0v-6M22 9v7',dashboard:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',book:'M12 7v14M3 3h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z',link:'M10 13a5 5 0 0 0 7 .5l4-4a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.5l-4 4a5 5 0 0 0 7 7l2-2',network:'M9 3h6v6H9zM3 15h6v6H3zM15 15h6v6h-6zM12 9v3M6 15v-3h12v3',menu:'M4 6h16M4 12h16M4 18h16',refresh:'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6',search:'M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0',arrow:'M5 12h14M12 5l7 7-7 7',trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',chevron:'m6 9 6 6 6-6'};
const entityIcons={sinhvien:'users',detai:'book',dangky:'link'};
function icon(name,cls=''){const span=el('span',undefined,cls);span.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[name]||iconPaths.book}"/></svg>`;return span;}
document.querySelectorAll('[data-icon]').forEach(node=>node.replaceChildren(icon(node.dataset.icon)));
function displayValue(name,item,key){if(key==='ngayDangKy')return new Date(item[key]).toLocaleString('vi-VN');if(name==='dangky'&&key==='maSV'){const r=state.data.sinhvien?.find(r=>r.maSV===item[key]);return r?`${item[key]} · ${r.hoTen}`:item[key];}if(name==='dangky'&&key==='maDT'){const r=state.data.detai?.find(r=>r.maDT===item[key]);return r?`${item[key]} · ${r.tenDeTai}`:item[key];}return item[key]||'Chưa có mô tả';}
function skeleton(){const box=el('div');box.setAttribute('aria-label','Đang tải dữ liệu');for(let i=0;i<3;i++){const row=el('div',undefined,'skeleton-row');row.append(el('span'));box.append(row);}return box;}
function empty(text,retry=false){const box=el('div',undefined,'empty');box.append(el('p',text));if(retry){const b=el('button','Thử lại');b.onclick=load;box.append(b);}return box;}
function animateChange(node){if(!node||matchMedia('(prefers-reduced-motion: reduce)').matches)return;node.getAnimations().forEach(a=>a.cancel());node.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'cubic-bezier(.2,.8,.2,1)'});}
function message(text,error=false){$('#message').textContent=text;$('#message').className=error?'error':'';}
async function call(name,method='GET',id='',body,log=true){
 const url=`/api/${name}${id?'/'+encodeURIComponent(id):''}`;
 try{
 const response=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(9000)});
 const data=response.status===204?null:await response.json();
 if(log)$('#result').textContent=`${method} ${url}\nHTTP ${response.status}\n${body?'Gửi: '+JSON.stringify(body)+'\n':''}${JSON.stringify(data,null,2)}`;
 if(!response.ok)throw new Error(data.error||'Yêu cầu thất bại.');return data;
 }catch(error){if(log)$('#result').textContent+='\n'+error.message;throw error;}
}
async function load(){
 if(state.loading)return;state.loading=true;
 $('#refresh').disabled=true;
 render();
 await Promise.all(Object.keys(config).map(async name=>{try{state.data[name]=await call(name,'GET','',undefined,false);delete state.errors[name];}catch(e){state.data[name]=null;state.errors[name]=e.message;}}));
 try{state.health=await (await fetch('/api/health',{signal:AbortSignal.timeout(5000)})).json();}catch{state.health=[];}
 state.loading=false;render();if(state.view==='dangky')refreshRegistrationOptions();$('#refresh').disabled=false;
 const failed=Object.keys(state.errors);if(failed.length)message('Không tải được: '+failed.map(n=>config[n].title).join(', ')+'. Các dịch vụ còn lại vẫn có thể sử dụng.',true);
}
function table(name,rows,actions=true){
 if(state.loading)return skeleton();const wrap=el('div',undefined,'table-wrap');
 if(!rows){wrap.append(el('p','Dịch vụ chưa sẵn sàng. Hãy kiểm tra tiến trình rồi làm mới.','empty'));return wrap;}
 if(!rows.length){wrap.append(el('p','Chưa có dữ liệu phù hợp.','empty'));return wrap;}
 const t=el('table'),head=el('thead'),tr=el('tr');config[name].fields.forEach(f=>tr.append(el('th',labels[f])));if(actions)tr.append(el('th','Thao tác'));head.append(tr);t.append(head);const tbody=el('tbody');
 for(const item of rows){const row=el('tr');for(const f of config[name].fields){const td=el('td',displayValue(name,item,f));td.dataset.label=labels[f];td.title=String(item[f]??'');row.append(td);}
 if(actions){const td=el('td');for(const action of ['Xem','Sửa','Xóa']){const b=el('button',action,action==='Xóa'?'danger':'');b.disabled=state.busy;b.onclick=()=>handle(name,item,action);td.append(b);}row.append(td);}tbody.append(row);}t.append(tbody);wrap.append(t);return wrap;
}
function render(){
 $('#stats').replaceChildren(...Object.entries(config).map(([name,c])=>{const card=el('div',undefined,'stat'),label=el('div',c.title,'stat-label');label.append(icon(entityIcons[name],'stat-icon'));card.append(label,el('strong',state.loading?'—':state.data[name]?.length??'—'),el('small',state.errors[name]?'Chưa kết nối':'Bản ghi trong hệ thống'));return card;}));
 $('#recent').replaceChildren(table('dangky',state.data.dangky?[...state.data.dangky].reverse().slice(0,4):null,false));
 $('#services').replaceChildren(...Object.entries(config).map(([name,c])=>{const card=el('div',undefined,'service');const up=state.health.find(s=>s.name===name)?.status==='up';card.append(icon(entityIcons[name],'stat-icon'),el('h2',c.title),el('small',`HTTP :${c.port} · /${name}`),el('small',`SQLite · ${name}.sqlite`),el('div',state.loading?'Đang kiểm tra':up?'Đang hoạt động':'Chưa kết nối','status'+(up||state.loading?'':' down')));return card;}));
 if(config[state.view])renderTable();
}
function renderTable(){
 const name=state.view,q=$('#search').value.toLocaleLowerCase('vi'),all=state.data[name],rows=all?.filter(r=>config[name].fields.some(k=>String(displayValue(name,r,k)).toLocaleLowerCase('vi').includes(q)));const box=$('#table');$('#list-count').textContent=state.loading?'Đang tải…':`${rows?.length??0} bản ghi${q?' phù hợp':' · Hiển thị tất cả'}`;
 if(state.loading){box.replaceChildren(skeleton());return;}
 if(!all){box.replaceChildren(empty('Dịch vụ chưa sẵn sàng. Kiểm tra tiến trình rồi thử lại.',true));renderDetail(null);return;}
 if(!rows.length){const e=empty(q?'Không có bản ghi khớp từ khóa. Thử từ khóa khác.':'Chưa có bản ghi. Sử dụng form bên cạnh để thêm mới.');if(q){const clear=el('button','Xóa tìm kiếm','text-button');clear.onclick=()=>{$('#search').value='';renderTable();$('#search').focus();};e.append(clear);}box.replaceChildren(e);renderDetail(null);return;}
 const key=config[name].fields[0];if(!rows.some(r=>r[key]===state.selected))state.selected=rows[0][key];const list=el('div',undefined,'record-list');
 for(const item of rows){const b=el('button',undefined,'record');b.type='button';b.disabled=state.busy;if(item[key]===state.selected)b.setAttribute('aria-current','true');const text=el('span',undefined,'record-body');text.append(el('span',name==='sinhvien'?item.hoTen:name==='detai'?item.tenDeTai:displayValue(name,item,'maSV'),'record-title'),el('span',name==='sinhvien'?`${item.maSV} · ${item.lop}`:name==='detai'?`${item.maDT} · ${item.moTa||'Chưa có mô tả'}`:`${displayValue(name,item,'maDT')} · ${displayValue(name,item,'ngayDangKy')}`,'record-meta'));b.append(icon(entityIcons[name],'record-symbol'),text);b.onclick=()=>{if(state.busy)return;state.selected=item[key];renderTable();};list.append(b);}
 box.replaceChildren(list);renderDetail(rows.find(r=>r[key]===state.selected));
}
function renderDetail(item){const box=document.querySelector('#record-detail'),key=item?state.view+':'+item[config[state.view].fields[0]]:'';if(box.dataset.record!==key){box.dataset.record=key;animateChange(box);}box.replaceChildren(el('h2','Chi tiết bản ghi'));if(!item){box.append(el('p','Chọn một bản ghi trong danh sách để xem thông tin.','muted'));return;}const name=state.view,dl=el('dl',undefined,'description-list');for(const k of config[name].fields)dl.append(el('dt',labels[k]),el('dd',displayValue(name,item,k)));const actions=el('div',undefined,'actions');for(const action of ['Xem','Sửa','Xóa']){const b=el('button',action,action==='Xóa'?'danger':'');b.type='button';b.disabled=state.busy;b.onclick=()=>handle(name,item,action);actions.append(b);}box.append(dl,actions);}
function form(){
 const name=state.view,c=config[name],f=$('#entity-form');f.replaceChildren();$('#form-title').textContent=state.editing?'Chỉnh sửa bản ghi':'Thêm '+c.title.toLowerCase();
 for(const key of c.fields.filter(k=>!['maDK','ngayDangKy'].includes(k))){const field=el('div',undefined,'field'),label=el('label',labels[key]);label.htmlFor='field-'+key;if(key!=='moTa')label.append(el('em','*'));let input;
 if(name==='dangky'){input=el('select');input.append(new Option('Chọn '+labels[key].toLowerCase(),''));const source=key==='maSV'?'sinhvien':'detai';for(const r of state.data[source]||[])input.append(new Option(r[key]+' · '+(r.hoTen||r.tenDeTai),r[key]));if(state.editing&&!Array.from(input.options).some(o=>o.value===state.editing[key]))input.append(new Option(state.editing[key],state.editing[key]));}
 else{input=el(key==='moTa'?'textarea':'input');input.maxLength=key==='moTa'?2000:200;}
 input.id='field-'+key;input.name=key;input.required=key!=='moTa';input.value=state.editing?.[key]||'';input.disabled=!!state.editing&&name!=='dangky'&&key===c.fields[0];field.append(label,input);const note=el('p',input.disabled?'Mã được giữ nguyên khi chỉnh sửa.':'','field-note');field.append(note);f.append(field);}
 const actions=el('div',undefined,'form-actions');if(state.editing){const cancel=el('button','Hủy sửa');cancel.type='button';cancel.onclick=()=>{state.editing=null;form();};actions.append(cancel);}const submit=el('button',state.editing?'Lưu thay đổi':'Thêm mới','primary');submit.type='submit';actions.append(submit);f.append(actions);enhanceSelects();
}
function enhanceSelects(){
 for(const select of $('#entity-form').querySelectorAll('select')){
  select.parentElement.querySelector('.select-control')?.remove();select.hidden=true;select.required=false;const wrap=el('div',undefined,'select-control'),trigger=el('button',undefined,'select-trigger'),text=el('span',select.selectedOptions[0]?.textContent);trigger.type='button';trigger.id=select.id+'-trigger';select.parentElement.querySelector('label').htmlFor=trigger.id;trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label',labels[select.name]);trigger.append(text,icon('chevron'));const menu=el('div',undefined,'select-menu');menu.hidden=true;menu.id=select.id+'-options';menu.setAttribute('role','listbox');menu.setAttribute('aria-label',labels[select.name]);trigger.setAttribute('aria-controls',menu.id);
  const close=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false');};
  for(const option of select.options){if(!option.value)continue;const b=el('button',option.textContent,'select-option');b.type='button';b.setAttribute('role','option');b.setAttribute('aria-selected',String(select.value===option.value));b.onclick=()=>{select.value=option.value;text.textContent=option.textContent;menu.querySelectorAll('[role=option]').forEach(o=>o.setAttribute('aria-selected',String(o===b)));close();trigger.focus();};menu.append(b);}
  if(!menu.children.length)menu.append(el('p','Chưa có dữ liệu để chọn.','empty'));
  trigger.onclick=()=>{const opening=menu.hidden;document.querySelectorAll('.select-menu').forEach(m=>m.hidden=true);document.querySelectorAll('.select-trigger').forEach(t=>t.setAttribute('aria-expanded','false'));menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));};
  wrap.onkeydown=e=>{const options=[...menu.querySelectorAll('button')];if(e.key==='Escape'){close();trigger.focus();e.stopPropagation();}if(['ArrowDown','ArrowUp'].includes(e.key)&&options.length){e.preventDefault();menu.hidden=false;trigger.setAttribute('aria-expanded','true');const i=options.indexOf(document.activeElement),offset=e.key==='ArrowDown'?1:-1;options[(i+offset+options.length)%options.length].focus();}};wrap.append(trigger,menu);select.after(wrap);
 }
}
document.addEventListener('click',event=>{if(!event.target.closest('.select-control')){document.querySelectorAll('.select-menu').forEach(m=>m.hidden=true);document.querySelectorAll('.select-trigger').forEach(t=>t.setAttribute('aria-expanded','false'));}});
function refreshRegistrationOptions(){
 for(const select of $('#entity-form').querySelectorAll('select')){
  const value=select.value,key=select.name,source=key==='maSV'?'sinhvien':'detai';
  select.replaceChildren(new Option('Chọn '+labels[key].toLowerCase(),''));
  for(const row of state.data[source]||[])select.append(new Option(row[key]+' · '+(row.hoTen||row.tenDeTai),row[key]));
  if(value&&!Array.from(select.options).some(option=>option.value===value)&&state.editing)select.append(new Option(value+' (không còn khả dụng)',value));
  select.value=value;
 }
 enhanceSelects();
}
function view(name){if(state.busy||(!config[name]&&!['overview','architecture'].includes(name)))return;const changed=state.view!==name;state.view=name;state.editing=null;state.selected=null;$('#search').value='';$('#overview-view').hidden=name!=='overview';$('#architecture-view').hidden=name!=='architecture';$('#manager').hidden=!config[name];$('#title').textContent=config[name]?.title||(name==='overview'?'Tổng quan':'Kiến trúc dịch vụ');$('#subtitle').textContent=config[name]?'Tra cứu và quản lý '+config[name].title.toLowerCase()+'.':name==='overview'?'Theo dõi sinh viên, đề tài và đăng ký tại một nơi.':'Quan sát ranh giới và trạng thái của từng dịch vụ.';document.querySelectorAll('nav button').forEach(b=>{b.classList.toggle('active',b.dataset.view===name);if(b.dataset.view===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});history.replaceState(null,'','#/'+name);setMenu(false);message('');if(config[name]){form();$('#list-title').textContent='Danh sách '+config[name].title.toLowerCase();renderTable();}if(changed)animateChange(config[name]?document.querySelector('#manager'):name==='overview'?document.querySelector('#overview-view'):document.querySelector('#architecture-view'));}
function confirmDelete(id){return new Promise(resolve=>{const dialog=$('#delete-dialog');$('#delete-description').textContent=`Xóa vĩnh viễn bản ghi ${id}? Hãy xóa các đăng ký liên quan trước khi xóa sinh viên hoặc đề tài.`;dialog.returnValue='cancel';dialog.addEventListener('close',()=>resolve(dialog.returnValue==='delete'),{once:true});dialog.showModal();});}
async function handle(name,item,action){if(state.busy)return;const id=item[config[name].fields[0]];state.busy=true;render();try{if(action==='Xem'){await call(name,'GET',id);$('.api').open=true;$('.api').scrollIntoView({behavior:'smooth',block:'center'});}if(action==='Sửa'){state.editing=await call(name,'GET',id);form();$('#entity-form').scrollIntoView({behavior:'smooth',block:'center'});}if(action==='Xóa'&&await confirmDelete(id)){await call(name,'DELETE',id);if(state.editing?.[config[name].fields[0]]===id){state.editing=null;form();}await load();message('Đã xóa bản ghi.');}}catch(e){message(e.message,true);}finally{state.busy=false;render();}}
$('#entity-form').onsubmit=async event=>{event.preventDefault();if(state.busy)return;const name=state.view,body=Object.fromEntries(new FormData(event.target));if(name==='dangky'&&(!body.maSV||!body.maDT)){message('Vui lòng chọn sinh viên và đề tài.',true);event.target.querySelector('.select-trigger').focus();return;}Object.keys(body).forEach(k=>body[k]=body[k].trim());state.busy=true;event.target.querySelectorAll('button').forEach(b=>b.disabled=true);try{await call(name,state.editing?'PUT':'POST',state.editing?.[config[name].fields[0]]||'',body);state.editing=null;await load();form();message('Đã lưu thành công.');}catch(e){message(e.message,true);}finally{state.busy=false;$('#entity-form').querySelectorAll('button').forEach(b=>b.disabled=false);render();}};
function setMenu(open){document.body.classList.toggle('nav-open',open);$('#nav-backdrop').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));}
$('#menu-toggle').onclick=()=>setMenu(!document.body.classList.contains('nav-open'));$('#nav-backdrop').onclick=()=>setMenu(false);document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false);});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('#search').oninput=renderTable;$('#refresh').onclick=()=>{if(state.busy)return;message('');load();};window.addEventListener('hashchange',()=>view(location.hash.replace(/^#\/?/,'')||'overview'));view(location.hash.replace(/^#\/?/,'')||'overview');load();



