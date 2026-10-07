const demoOrders=[
{order_id:'10001',sku:'ABC123',quantity:1,pod_id:'P102',floor:'2',location:'A-12',cpt_minutes:12,customer_shipment:'yes'},
{order_id:'10002',sku:'ABC123',quantity:2,pod_id:'P102',floor:'2',location:'A-12',cpt_minutes:35,customer_shipment:'no'},
{order_id:'10003',sku:'XYZ555',quantity:1,pod_id:'P221',floor:'2',location:'B-08',cpt_minutes:8,customer_shipment:'yes'},
{order_id:'10004',sku:'ABC123',quantity:1,pod_id:'P102',floor:'2',location:'A-12',cpt_minutes:20,customer_shipment:'yes'},
{order_id:'10005',sku:'XYZ555',quantity:1,pod_id:'P221',floor:'2',location:'B-08',cpt_minutes:42,customer_shipment:'no'},
{order_id:'10006',sku:'LMN900',quantity:1,pod_id:'P310',floor:'3',location:'C-14',cpt_minutes:7,customer_shipment:'yes'},
{order_id:'10007',sku:'ABC123',quantity:1,pod_id:'P102',floor:'2',location:'A-12',cpt_minutes:28,customer_shipment:'yes'},
{order_id:'10008',sku:'QRS410',quantity:3,pod_id:'P402',floor:'3',location:'D-02',cpt_minutes:18,customer_shipment:'no'}];
let orders=[];let queue=[];let analysis=null;
const $=id=>document.getElementById(id); const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)};
function n(v){const x=Number(v);return Number.isFinite(x)?x:0}
function normalise(o){return {...o,quantity:n(o.quantity),cpt_minutes:n(o.cpt_minutes),floor:String(o.floor??'').trim(),customer_shipment:String(o.customer_shipment??'').toLowerCase()}}
function priority(o){let s=0; if(o.cpt_minutes<=10)s+=100;else if(o.cpt_minutes<=20)s+=80;else if(o.cpt_minutes<=30)s+=60;else if(o.cpt_minutes<=45)s+=40;else s+=20;if(['yes','true','1'].includes(o.customer_shipment))s+=25;return s}
function analyse(){
 const groups=new Map();const podGroups=new Map();const floors=new Map();
 orders.forEach(o=>{const k=`${o.sku}|${o.pod_id}|${o.floor}`;(groups.get(k)||groups.set(k,[]).get(k)).push(o);(podGroups.get(o.pod_id)||podGroups.set(o.pod_id,[]).get(o.pod_id)).push(o);(floors.get(o.floor)||floors.set(o.floor,[]).get(o.floor)).push(o)});
 queue=[...groups.values()].map(items=>{const first=items[0];const cpt=Math.min(...items.map(x=>x.cpt_minutes));const customer=items.some(x=>['yes','true','1'].includes(x.customer_shipment));const score=Math.max(...items.map(priority))+Math.min(items.length-1,4)*8;return{...first,order_ids:items.map(x=>x.order_id),group_count:items.length,group_qty:items.reduce((a,x)=>a+x.quantity,0),cpt_minutes:cpt,priority_score:score,customer,reason:items.length>1?`Group ${items.length} orders from the same pod`:customer?'Customer shipment + CPT urgency':'CPT urgency'}}).sort((a,b)=>b.priority_score-a.priority_score);
 const repeated=[...groups.entries()].filter(([,v])=>v.length>1);const podRepeated=[...podGroups.entries()].filter(([k,v])=>k&&v.length>1);
 analysis={summary:`${orders.length} orders analysed. ${repeated.length} same-SKU/pod/floor groups can potentially be consolidated, covering ${repeated.reduce((a,[,v])=>a+v.length,0)} orders. ${podRepeated.length} pods have multiple orders in the current list.`,repeated,podRepeated,floors:[...floors.entries()].map(([floor,v])=>({floor,count:v.length,qty:v.reduce((a,x)=>a+x.quantity,0)}))};
 render();
}
function render(){
 const totalQty=orders.reduce((a,o)=>a+o.quantity,0), urgent=orders.filter(o=>o.cpt_minutes<=20).length, shipments=orders.filter(o=>['yes','true','1'].includes(o.customer_shipment)).length, groups=queue.filter(q=>q.group_count>1).length;
 $('metrics').innerHTML=[['Orders',orders.length],['Units',totalQty],['≤20m CPT',urgent],['Customer shipments',shipments],['Group opportunities',groups]].map(x=>`<div class="metric"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join('');
 $('queue').innerHTML=queue.map((q,i)=>`<tr><td class="rank">${i+1}</td><td>${q.order_ids.join(', ')}</td><td><strong>${q.sku}</strong></td><td>${q.pod_id||'—'}</td><td>${q.floor||'—'}</td><td>${q.cpt_minutes}m</td><td class="reason">${q.reason}</td><td><button class="secondary mini" onclick="toast('Demo only — send to your authorised Force Pick workflow')">Queue</button></td></tr>`).join('');
 $('patterns').innerHTML=(analysis?.repeated?.length?analysis.repeated.slice(0,6).map(([k,v])=>{const [sku,pod,floor]=k.split('|');return `<div class="signal"><strong>${v.length} orders can be grouped</strong><span>${sku} • ${pod} • Floor ${floor}</span></div>`}).join(''):`<div class="signal"><strong>No grouping pattern detected</strong><span>Load more orders to reveal opportunities.</span></div>`);
 $('brief').className='brief';$('brief').innerHTML=analysis?`<strong>Recommended operating pattern</strong><br>${analysis.summary}<br><br><span style="color:#687585">The queue is ranked by deterministic rules first. AI can be added through the optional backend for pattern explanations and recommendations.</span>`:'No analysis yet.';
}
function parseCSV(text){const lines=text.trim().split(/\r?\n/);if(!lines.length)return[];const headers=lines.shift().split(',').map(x=>x.trim());return lines.filter(Boolean).map(line=>{const vals=line.split(',');return Object.fromEntries(headers.map((h,i)=>[h,(vals[i]??'').trim()]))}).map(normalise)}
$('loadDemo').onclick=()=>{orders=demoOrders.map(normalise);analyse();toast('Demo orders loaded')};
$('analyzeBtn').onclick=()=>{if(!orders.length){orders=demoOrders.map(normalise);toast('No file loaded — demo data used')}analyse();$('aiStatus').textContent='Pattern analysis complete';};
$('fileInput').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{orders=parseCSV(r.result);analyse();toast(`${orders.length} orders loaded`)}catch(err){toast('Could not read CSV')}};r.readAsText(f)};
$('dropzone').ondragover=e=>{e.preventDefault();$('dropzone').style.borderColor='#2457ff'};$('dropzone').ondragleave=()=>{$('dropzone').style.borderColor=''};$('dropzone').ondrop=e=>{e.preventDefault();$('dropzone').style.borderColor='';const f=e.dataTransfer.files[0];if(f){const r=new FileReader();r.onload=()=>{orders=parseCSV(r.result);analyse()};r.readAsText(f)}};
$('exportBtn').onclick=()=>{if(!queue.length)return toast('Analyse orders first');const blob=new Blob([JSON.stringify({generated_at:new Date().toISOString(),queue,analysis},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='force-pick-queue.json';a.click();URL.revokeObjectURL(a.href);toast('Queue exported')};
window.toast=toast;orders=demoOrders.map(normalise);analyse();
