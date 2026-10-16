const config = {
 sinhvien:{title:'Sinh viên',description:'Quản lý hồ sơ sinh viên tham gia đồ án tốt nghiệp.',fields:['maSV','hoTen','lop'],port:3001},
 detai:{title:'Đề tài',description:'Tổ chức danh mục đề tài và nội dung nghiên cứu.',fields:['maDT','tenDeTai','moTa'],port:3002},
 dangky:{title:'Đăng ký',description:'Kết nối sinh viên với đề tài thông qua các dịch vụ HTTP.',fields:['maDK','maSV','maDT','ngayDangKy'],port:3003}
};
const labels={maSV:'Mã sinh viên',hoTen:'Họ và tên',lop:'Lớp',maDT:'Mã đề tài',tenDeTai:'Tên đề tài',moTa:'Mô tả',maDK:'Mã đăng ký',ngayDangKy:'Ngày đăng ký'};
const state={view:'overview',data:{},errors:{},health:[],editing:null,busy:false,loading:false};
const $=s=>document.querySelector(s);
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
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
 await Promise.all(Object.keys(config).map(async name=>{try{state.data[name]=await call(name,'GET','',undefined,false);delete state.errors[name];}catch(e){state.data[name]=null;state.errors[name]=e.message;}}));
 try{state.health=await (await fetch('/api/health',{signal:AbortSignal.timeout(5000)})).json();}catch{state.health=[];}
 render();if(state.view==='dangky')refreshRegistrationOptions();state.loading=false;$('#refresh').disabled=false;
 const failed=Object.keys(state.errors);if(failed.length)message('Không tải được: '+failed.map(n=>config[n].title).join(', ')+'. Các dịch vụ còn lại vẫn có thể sử dụng.',true);
}
function table(name,rows,actions=true){
 const wrap=el('div',undefined,'table-wrap');
 if(!rows){wrap.append(el('p','Dịch vụ chưa sẵn sàng. Hãy kiểm tra tiến trình rồi làm mới.','empty'));return wrap;}
 if(!rows.length){wrap.append(el('p','Chưa có dữ liệu phù hợp.','empty'));return wrap;}
 const t=el('table'),head=el('thead'),tr=el('tr');config[name].fields.forEach(f=>tr.append(el('th',labels[f])));if(actions)tr.append(el('th','Thao tác'));head.append(tr);t.append(head);const tbody=el('tbody');
 for(const item of rows){const row=el('tr');for(const f of config[name].fields){let text=item[f];if(f==='ngayDangKy')text=new Date(text).toLocaleString('vi-VN');if(f==='maDK')text=item[f].slice(0,11)+'…';const td=el('td',text);td.title=String(item[f]??'');row.append(td);}
 if(actions){const td=el('td');for(const action of ['Xem','Sửa','Xóa']){const b=el('button',action,action==='Xóa'?'danger':'');b.disabled=state.busy;b.onclick=()=>handle(name,item,action);td.append(b);}row.append(td);}tbody.append(row);}t.append(tbody);wrap.append(t);return wrap;
}
function render(){
 $('#stats').replaceChildren(...Object.entries(config).map(([name,c])=>{const card=el('div',undefined,'stat');card.append(el('div',c.title,'stat-label'),el('strong',state.data[name]?.length??'—'),el('small',state.errors[name]?'Chưa kết nối':'Bản ghi trong hệ thống'));return card;}));
 $('#recent').replaceChildren(table('dangky',state.data.dangky?[...state.data.dangky].reverse().slice(0,4):null,false));
 $('#services').replaceChildren(...Object.entries(config).map(([name,c])=>{const card=el('div',undefined,'service');const up=state.health.find(s=>s.name===name)?.status==='up';card.append(el('strong',c.title+' Service'),el('small',`HTTP :${c.port} · /${name}`),el('small',`SQLite · ${name}.sqlite`),el('div',up?'● Đang hoạt động':'● Chưa kết nối','status'+(up?'':' down')));return card;}));
 if(config[state.view])renderTable();
}
function renderTable(){const name=state.view,q=$('#search').value.toLocaleLowerCase('vi');const rows=state.data[name];$('#table').replaceChildren(table(name,rows?.filter(r=>Object.values(r).some(v=>String(v).toLocaleLowerCase('vi').includes(q)))));}
function form(){
 const name=state.view,c=config[name],f=$('#entity-form');f.replaceChildren();$('#form-title').textContent=state.editing?'Chỉnh sửa bản ghi':'Thêm '+c.title.toLowerCase();
 for(const key of c.fields.filter(k=>!['maDK','ngayDangKy'].includes(k))){const label=el('label',labels[key]);let input;
 if(name==='dangky'){input=el('select');input.append(new Option('Chọn '+labels[key].toLowerCase(),''));const source=key==='maSV'?'sinhvien':'detai';for(const r of state.data[source]||[])input.append(new Option(r[key]+' · '+(r.hoTen||r.tenDeTai),r[key]));if(state.editing&&!Array.from(input.options).some(o=>o.value===state.editing[key]))input.append(new Option(state.editing[key],state.editing[key]));}
 else{input=el('input');input.maxLength=key==='moTa'?2000:200;}
 input.name=key;input.required=key!=='moTa';input.value=state.editing?.[key]||'';input.disabled=!!state.editing&&name!=='dangky'&&key===c.fields[0];label.append(input);f.append(label);}
 const submit=el('button',state.editing?'Lưu thay đổi':'＋ Thêm mới','primary');submit.type='submit';f.append(submit);if(state.editing){const cancel=el('button','Hủy sửa','secondary');cancel.type='button';cancel.onclick=()=>{state.editing=null;form();};f.append(cancel);}
}
function refreshRegistrationOptions(){
 for(const select of $('#entity-form').querySelectorAll('select')){
  const value=select.value,key=select.name,source=key==='maSV'?'sinhvien':'detai';
  select.replaceChildren(new Option('Chọn '+labels[key].toLowerCase(),''));
  for(const row of state.data[source]||[])select.append(new Option(row[key]+' · '+(row.hoTen||row.tenDeTai),row[key]));
  if(value&&!Array.from(select.options).some(option=>option.value===value)&&state.editing)select.append(new Option(value+' (không còn khả dụng)',value));
  select.value=value;
 }
}
function view(name){if(state.busy)return;state.view=name;state.editing=null;$('#search').value='';$('#overview').hidden=name!=='overview';$('#architecture').hidden=name!=='architecture';$('#manager').hidden=!config[name];$('#title').textContent=config[name]?.title||(name==='overview'?'Tổng quan':'Kiến trúc dịch vụ');$('#subtitle').textContent=config[name]?.description||(name==='overview'?'Theo dõi sinh viên, đề tài và hoạt động đăng ký tại một nơi.':'Quan sát ranh giới và trạng thái của từng dịch vụ.');document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(config[name]){form();$('#list-title').textContent='Danh sách '+config[name].title.toLowerCase();renderTable();}}
async function handle(name,item,action){if(state.busy)return;const id=item[config[name].fields[0]];state.busy=true;render();try{if(action==='Xem'){await call(name,'GET',id);$('.api').open=true;$('.api').scrollIntoView({behavior:'smooth',block:'center'});}if(action==='Sửa'){state.editing=await call(name,'GET',id);form();$('#entity-form').scrollIntoView({behavior:'smooth',block:'center'});}if(action==='Xóa'&&confirm(`Xóa ${id}? Hãy xóa các đăng ký liên quan trước khi xóa sinh viên hoặc đề tài.`)){state.busy=true;await call(name,'DELETE',id);if(state.editing?.[config[name].fields[0]]===id){state.editing=null;form();}await load();message('Đã xóa bản ghi.');}}catch(e){message(e.message,true);}finally{state.busy=false;render();}}
$('#entity-form').onsubmit=async event=>{event.preventDefault();if(state.busy)return;const name=state.view,body=Object.fromEntries(new FormData(event.target));Object.keys(body).forEach(k=>body[k]=body[k].trim());state.busy=true;event.target.querySelectorAll('button').forEach(b=>b.disabled=true);try{await call(name,state.editing?'PUT':'POST',state.editing?.[config[name].fields[0]]||'',body);state.editing=null;await load();form();message('Đã lưu thành công.');}catch(e){message(e.message,true);}finally{state.busy=false;$('#entity-form').querySelectorAll('button').forEach(b=>b.disabled=false);render();}};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('#search').oninput=renderTable;$('#refresh').onclick=()=>{if(state.busy)return;message('');load();};load();
