# Browser regression: selection must preserve route widths, continuous casings and crossing order.
# Authoring/test environment only: requires Python Playwright and /usr/bin/chromium.
# Run against a static server: python scripts/check-singapore-route-casings.py URL
from pathlib import Path
from playwright.sync_api import sync_playwright
import sys,re
root=Path(__file__).resolve().parents[1]
v=re.search(r'var v = "(\d{6}\.\d{6})"', (root/'main.html').read_text()).group(1)
url=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8080/main.html?city=singapore&v='+v
cases=[('NS27','NS27'),('CC32','CC32'),('TE19','TE19'),('CC4','CC4'),('CC3','CC3'),('EW33','EW33'),('NE18','NE18'),('CC1','NS24'),('DT1','DT1'),('BP3','BP3'),('STC','NE16'),('PTC','NE17'),('CG2','CG2'),('怡丰城','SENTOSA_VIVO'),('TE22','TE22')]
PAINT_UNION_TEST = r"""async()=>{
 const ns='http://www.w3.org/2000/svg',report=[];
 for(const family of document.querySelectorAll('#lines-layer .sg-route-family')){
  if(family.querySelectorAll('.line-visual-group').length<2)continue;
  const box=family.getBBox(),width=Math.ceil(box.width+24),height=Math.ceil(box.height+24);
  async function raster(original){
   const svg=document.createElementNS(ns,'svg');svg.setAttribute('xmlns',ns);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('viewBox',`${box.x-12} ${box.y-12} ${width} ${height}`);
   const copy=original.cloneNode(true),sources=[original,...original.querySelectorAll('*')],targets=[copy,...copy.querySelectorAll('*')];
   sources.forEach((e,i)=>{const style=getComputedStyle(e);for(const key of ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','display','visibility','filter','opacity'])targets[i].style.setProperty(key,style.getPropertyValue(key));});svg.append(copy);
   const image=new Image(),url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');context.drawImage(image,0,0);URL.revokeObjectURL(url);return context.getImageData(0,0,width,height).data;
  }
  const actual=await raster(family),expected=await raster(family.querySelector('.sg-family-ink'));let lost=0,checked=0;
  for(let i=0;i<expected.length;i+=4){if(expected[i+3]!==255)continue;checked++;if(Math.max(...[0,1,2].map(c=>Math.abs(actual[i+c]-expected[i+c])))>2)lost++;}
  report.push({routes:family.dataset.routeIds,lost,checked});
 }
 return report;
}"""
FUTURE_ROUTE_TEST = r"""async()=>{
 const ns='http://www.w3.org/2000/svg',layer=document.getElementById('lines-layer');
 const fixtures=[{id:'QA_JOIN',color:'#fa9e0d',stationIds:['CC4','QA_A']},{id:'QA_SEPARATE',color:'#fa9e0d',stationIds:['QA_B']},{id:'QA_DIFFERENT',color:'#ff00ff',stationIds:['CC4','QA_C']}];
 for(const line of fixtures){linesData.push(line);const g=document.createElementNS(ns,'g');g.classList.add('line-visual-group');g.dataset.visualId=line.id;for(const d of ['M30 30 L60 60','M60 60 L100 60']){const p=document.createElementNS(ns,'path');p.classList.add('line-visual-inner');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke',line.color);g.append(p);}layer.append(g);}
 await window.SINGAPORE_CITY.renderReferenceGeometry();
 let valid=true;
 for(const line of fixtures){const g=layer.querySelector('[data-visual-id="'+line.id+'"]'),c=layer.querySelector('.sg-route-casing[data-route-id="'+line.id+'"]'),members=g.closest('.sg-route-family').dataset.routeIds.split(' ');valid&&=c.querySelectorAll('path').length===2&&g.querySelectorAll('.sg-reference-geometry path').length===2&&[...c.querySelectorAll('path')].every(p=>Number(p.getAttribute('stroke-width'))>0);valid&&=line.id==='QA_JOIN'?members.includes('CC')&&members.includes('CCE'):members.length===1;}
 for(const line of fixtures){linesData.splice(linesData.indexOf(line),1);layer.querySelector('[data-visual-id="'+line.id+'"]').remove();}
 await window.SINGAPORE_CITY.renderReferenceGeometry();return valid;
}"""
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width,height in [(1280,900),(430,932)]:
  c=b.new_context(viewport={'width':width,'height':height},is_mobile=width<600,has_touch=width<600);pg=c.new_page();pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('console',lambda m:errors.append(m.text) if m.type=='error' else None);pg.goto(url);pg.wait_for_selector('[data-source="community-sentosa"]');pg.evaluate('document.fonts.ready.then(()=>true)');pg.wait_for_timeout(800);assert pg.evaluate('window.CGO_ASSET_VERSION')==v
  if pg.locator('.nal-notice-close:visible').count():pg.locator('.nal-notice-close:visible').click()
  pg.evaluate("window.CGoWMAdapter?.close('legend')")
  snapshot="""()=>[...document.querySelectorAll('#lines-layer .sg-official-geometry')].map(e=>{const c=document.querySelector('#lines-layer .sg-route-casing[data-route-id="'+e.dataset.visualId+'"]'),ps=[...e.querySelectorAll('.sg-reference-geometry path')],cs=[...c.querySelectorAll('path')];return {id:e.dataset.visualId,paths:ps.map(p=>p.getAttribute('d')),casingPaths:cs.map(p=>p.getAttribute('d')),ink:ps.map(p=>[p.getAttribute('fill'),p.getAttribute('stroke'),p.getAttribute('stroke-width')]),casing:cs.map(p=>[p.getAttribute('fill'),p.getAttribute('stroke'),p.getAttribute('stroke-width')]),family:e.closest('.sg-route-family').dataset.routeIds}})"""
  baseline=pg.evaluate(snapshot);expected=pg.evaluate('linesData.filter(l=>!l.isPointOnly).map(l=>l.id)');assert {x['id'] for x in baseline}==set(expected);assert all(x['paths']==x['casingPaths'] for x in baseline)
  assert pg.locator('#lines-layer mask,.sg-reference-separations,.sg-crossing-gaps,.sg-water-crossing-casings,.sg-separation-defs').count()==0
  assert pg.locator('.sg-construction-casing').evaluate_all('(es)=>es.length===NOT_OPEN_LINES.length&&es.every(e=>!e.hasAttribute("mask")&&Number(e.getAttribute("stroke-width"))>0)')
  assert pg.locator('#lines-layer .sg-route-casing').evaluate_all('(es)=>es.every(g=>g.querySelectorAll("path").length>0&&[...g.querySelectorAll("path")].every(p=>Number(p.getAttribute("stroke-width"))>0)&&!g.closest(".sg-family-ink"))')

  for theme in ['light','dark']:
   pg.evaluate(f"document.documentElement.setAttribute('data-theme','{theme}')")
   assert pg.locator('#lines-layer .sg-route-casing path').evaluate_all('(es)=>{const p=document.createElement("span");p.style.color="var(--map-bg)";document.body.append(p);const colour=getComputedStyle(p).color;p.remove();return es.every(e=>getComputedStyle(e).stroke===colour)}')
   for query,sid in cases:
    pg.locator('#mz-menu').click();pg.locator('#station-search-input').fill(query);pg.locator('.search-item[data-sid="'+sid+'"]').click();pg.wait_for_timeout(120)
    assert pg.evaluate(snapshot)==baseline,(width,theme,sid,'selection changes route geometry or order')
    assert pg.locator('#highlight-layer .sg-official-geometry').evaluate_all('(es)=>es.every(e=>getComputedStyle(e).display==="none")')
    assert pg.locator('#lines-layer .sg-route-family').evaluate_all("""families=>families.every(f=>{const casing=f.querySelector('.sg-family-casings'),ink=f.querySelector('.sg-family-ink'),routes=[...ink.children],active=routes.filter(r=>r.classList.contains('active')),all=active.length===routes.length&&active.length>0;return getComputedStyle(f).filter==='none'&&getComputedStyle(casing).filter==='none'&&[...casing.querySelectorAll('*')].every(e=>getComputedStyle(e).filter==='none')&&getComputedStyle(ink).filter.includes('drop-shadow')===all&&routes.every(r=>getComputedStyle(r).filter==='none'&&getComputedStyle(r.querySelector('.sg-reference-geometry')).filter.includes('drop-shadow')===(!all&&r.classList.contains('active')))&&!ink.querySelector('.sg-route-casing')})""")
    assert pg.locator('#lines-layer .sg-official-geometry > .line-visual-outer').evaluate_all('(es)=>es.every(e=>getComputedStyle(e).display==="none")')
  pg.evaluate('window.resetMapState()')
  if width==1280:
   report=pg.evaluate(PAINT_UNION_TEST);assert report and all(x['lost']==0 for x in report),report;print('PASS connected paint unions:',report,flush=True)
   fixtures=pg.evaluate(FUTURE_ROUTE_TEST);assert fixtures,fixtures
   assert pg.evaluate(snapshot)==baseline
  pg.evaluate('window.resetMapState();window.SINGAPORE_CITY.renderReferenceGeometry();window.SINGAPORE_CITY.renderReferenceGeometry()');assert pg.evaluate(snapshot)==baseline
  for scale in [1,2,4,1]:pg.evaluate('(scale)=>window.setMapView({scale,x:100-1800*scale,y:250-1900*scale})',scale)
  if width==430 and url.startswith('http://127.0.0.1'):
   pg.evaluate('navigator.serviceWorker.ready.then(()=>true)');pg.reload();pg.wait_for_selector('.sg-route-casing');c.set_offline(True);pg.reload();pg.wait_for_selector('.sg-route-casing');assert pg.evaluate(snapshot)==baseline;assert pg.locator('.sg-construction-casing').evaluate_all('(es)=>es.length===NOT_OPEN_LINES.length&&es.every(e=>!e.hasAttribute("mask"))')
  c.close();print('PASS width',width,flush=True)
 assert not errors,errors
 print('PASS:',v,'every route/segment has a full casing; zero runtime masks or crossing patches; geometry, widths and over/under order identical across selection; colour-only shadows and connected same-service paint families; no painted highlight clone; both themes, idempotent rendering, zoom and offline. Chromium.')
 b.close()
