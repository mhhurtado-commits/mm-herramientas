/* visual-suite/publicacion.js
 * (1) "Publicación Web" — miniweb autónoma (chart/mapa/timeline/infografia)
 * (2) "Publicación Rica" — igual que la anterior PERO agrega una
 *     galería de recursos gráficos descargables individualmente
 *     (iconos SVG + ilustraciones PNG generadas desde los datos actuales).
 * Reutiliza los estados globales sin tocar el worker ni el modelo de Gemini.
 */

/* ---------- Estilos de la publicación generada ---------- */
const PAGE_CSS = `
:root{
  --v:#a6ce39; --v-dark:#7da31f; --ink:#16201b; --paper:#ffffff;
  --paper2:#f3f5f2; --gold:#c9a227; --text:#1c241f; --muted:#5e6b62;
  --line:#e4e9e2; --maxw:1040px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--text);background:var(--paper);line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2{font-family:'DM Serif Display',Georgia,serif;font-weight:400;line-height:1.15;margin:0}
.mmw-nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 24px;background:rgba(22,32,27,.92);backdrop-filter:blur(8px);color:#fff;border-bottom:1px solid rgba(255,255,255,.08)}
.mmw-brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:1px;font-size:15px}
.mmw-brand .dot{width:10px;height:10px;border-radius:50%;background:var(--v);box-shadow:0 0 10px var(--v)}
.mmw-nav nav{display:flex;gap:20px;flex-wrap:wrap}
.mmw-nav a{color:#dfe6df;text-decoration:none;font-size:14px;font-weight:500}
.mmw-nav a:hover{color:var(--v)}
.mmw-hero{position:relative;padding:80px 24px 60px;background:linear-gradient(160deg,var(--ink),#0c1410);color:#fff;overflow:hidden}
.mmw-hero::after{content:"";position:absolute;right:-90px;top:-90px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(166,206,57,.16),transparent 70%)}
.mmw-kicker{display:inline-block;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--v);font-weight:700;margin-bottom:16px}
.mmw-hero h1{font-size:clamp(30px,5vw,54px);max-width:900px;margin:0 0 18px;position:relative}
.mmw-dateline{font-size:13px;color:#a9b8ab;position:relative}
.mmw-wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px}
section.mmw-sec{padding:60px 0;border-bottom:1px solid var(--line)}
.mmw-sec h2{font-size:clamp(24px,3vw,34px);margin:0 0 6px}
.mmw-sec .sub{color:var(--muted);margin:0 0 28px;font-size:15px}
.mmw-reveal{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
.mmw-reveal.in{opacity:1;transform:none}
.mmw-chart-box{background:var(--paper2);border:1px solid var(--line);border-radius:16px;padding:22px;box-shadow:0 8px 30px rgba(20,30,25,.06)}
#map{height:440px;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 8px 30px rgba(20,30,25,.06)}
.mmw-tl{position:relative;margin:0;padding:0 0 0 8px;list-style:none}
.mmw-tl::before{content:"";position:absolute;left:11px;top:8px;bottom:8px;width:2px;background:linear-gradient(var(--v),var(--gold))}
.mmw-tl li{position:relative;padding:0 0 30px 34px}
.mmw-tl li::before{content:"";position:absolute;left:3px;top:6px;width:16px;height:16px;border-radius:50%;background:var(--v);border:3px solid #fff;box-shadow:0 0 0 2px var(--v)}
.mmw-tl .date{font-size:12px;font-weight:700;color:var(--v-dark);letter-spacing:1px;text-transform:uppercase}
.mmw-tl .t{font-family:'DM Serif Display',serif;font-size:21px;margin:2px 0 6px;line-height:1.2}
.mmw-tl .d{color:var(--muted);font-size:15px}
.mmw-cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.mmw-card{background:var(--paper2);border:1px solid var(--line);border-left:4px solid var(--v);border-radius:12px;padding:18px 20px}
.mmw-card .lbl{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:600}
.mmw-card .val{font-family:'DM Serif Display',serif;font-size:22px;margin-top:4px;line-height:1.2}
.mmw-list{list-style:none;margin:0;padding:0;display:grid;gap:14px}
.mmw-list li{display:flex;gap:16px;align-items:flex-start;background:var(--paper2);border:1px solid var(--line);border-radius:12px;padding:16px 20px}
.mmw-num{flex:0 0 auto;width:30px;height:30px;border-radius:50%;background:var(--v);color:#16201b;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px}
.mmw-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;margin-bottom:14px}
.mmw-vs-badge{width:42px;height:42px;border-radius:50%;background:var(--ink);color:var(--v);font-weight:700;display:flex;align-items:center;justify-content:center;font-size:13px;letter-spacing:1px}
.mmw-footer{background:var(--ink);color:#cfd9d0;padding:44px 24px;text-align:center}
.mmw-footer img{height:44px;margin-bottom:14px;display:inline-block}
.mmw-footer .small{font-size:12px;color:#8c9a90;letter-spacing:1px}
.mmw-sec.destacado{background:linear-gradient(160deg,var(--ink),#0a0d12);color:#fff;border-bottom:none}
.mmw-sec.destacado h2{color:#fff}
.mmw-sec.destacado .sub{color:#a9b8ab}
.mmw-sec.destacado .mmw-card{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);border-left-color:var(--v)}
.mmw-sec.destacado .mmw-card .lbl{color:#9fb0a4}
.mmw-sec.destacado .mmw-card .val{color:#fff}
/* galería de recursos */
.mmw-gallery{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-top:10px}
.mmw-rescard{position:relative;background:var(--paper2);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.mmw-rescard .mmw-badge{position:absolute;top:10px;right:10px;background:var(--v);color:#16201b;font-size:10px;font-weight:700;padding:3px 9px;border-radius:12px;letter-spacing:.05em}
.mmw-rescard .mmw-badge.png{background:var(--gold);color:#16201b}
.mmw-resprev{width:100%;min-height:120px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px}
.mmw-resprev svg{max-width:100%;height:auto}
.mmw-resprev img{max-width:100%;max-height:160px;border-radius:6px}
.mmw-resname{font-size:12px;color:var(--muted);word-break:break-all}
.mmw-resbtn{background:var(--v);color:#16201b;border:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:background .2s}
.mmw-resbtn:hover{background:var(--v-dark);color:#fff}
@media(max-width:640px){.mmw-nav nav{display:none}.mmw-vs{grid-template-columns:1fr}.mmw-vs-badge{margin:0 auto}}
`;

/* ---------- Lógica de init embebida en la página generada ---------- */
const INIT_JS = `
(function(){
  var D = window.MM_DATA || {};
  var navLinks = document.querySelectorAll('.mmw-nav a');
  navLinks.forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if(id && id.charAt(0)==='#'){
        var el = document.querySelector(id);
        if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
      }
    });
  });
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:0.12});
    document.querySelectorAll('.mmw-reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.mmw-reveal').forEach(function(el){ el.classList.add('in'); });
  }
  if(D.chart && window.Chart){
    try{
      var type = D.chart.tipo || 'bar';
      var opts = {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:'top'}, title:{display:false} },
        animation:{duration:700}
      };
      if(type==='bar' || type==='line'){
        opts.scales = {
          x:{grid:{color:'rgba(0,0,0,.06)'}},
          y:{grid:{color:'rgba(0,0,0,.06)'}, beginAtZero:true}
        };
      }
      new Chart(document.getElementById('mmwChart'), {
        type: type,
        data:{ labels:D.chart.labels, datasets:(D.chart.datasets||[]).map(function(ds){ return {
          label: ds.label, data: ds.data,
          backgroundColor: ds.backgroundColor, borderColor: ds.borderColor,
          borderWidth: ds.borderWidth, fill: ds.fill, tension:0.3,
          pointBackgroundColor:'#a6ce39', pointBorderColor:'#fff', pointRadius:3
        }; }) },
        options: opts
      });
    }catch(err){ console.error('Chart init failed', err); }
  }
  if(D.mapa && D.mapa.length && window.L){
    try{
      var map = L.map('map', {scrollWheelZoom:false}).setView([-34.6,-68.3], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom:19, attribution:'&copy; OpenStreetMap'
      }).addTo(map);
      var pts = [];
      D.mapa.forEach(function(m){
        var lat = parseFloat(m.lat), lng = parseFloat(m.lng);
        if(isNaN(lat)||isNaN(lng)) return;
        var mk = L.marker([lat,lng]).addTo(map);
        mk.bindPopup('<strong>'+(m.title||'')+'</strong><br>'+(m.desc||''));
        pts.push([lat,lng]);
      });
      if(pts.length){ map.fitBounds(pts, {padding:[40,40], maxZoom:14}); }
    }catch(err){ console.error('Map init failed', err); }
  }
})();
`;

/* ---------- Utilidades ---------- */
function escapeHtml(s){
  if(s===null||s===undefined) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function formatearFecha(iso, corto){
  try{
    var d = iso ? new Date(iso) : new Date();
    if(isNaN(d.getTime()) && typeof iso==='string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)){
      var p=iso.split('-'); d=new Date(p[0], p[1]-1, p[2]);
    }
    if(isNaN(d.getTime())) return String(iso||'');
    var meses=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    var dia=d.getDate(), mes=meses[d.getMonth()], anio=d.getFullYear();
    return corto ? (dia+' '+mes+' '+anio) : (dia+' de '+mes+' de '+anio);
  }catch(e){ return String(iso||''); }
}

function getLogoDataUri(){
  try{
    var ls = window.logoState;
    if(ls && ls.img && ls.img.complete && ls.img.naturalWidth){
      var c=document.createElement('canvas');
      c.width=ls.img.naturalWidth; c.height=ls.img.naturalHeight;
      var x=c.getContext('2d'); x.drawImage(ls.img,0,0);
      return c.toDataURL('image/png');
    }
  }catch(e){}
  return '';
}

/* ---------- Recolección de datos (sin tocar el worker) ---------- */
function recogerDatos(){
  var gt=function(id){ var e=document.getElementById(id); return e?e.value:''; };

  var chart=null;
  if(typeof chartInstance!=='undefined' && chartInstance && chartInstance.data
     && chartInstance.data.labels && chartInstance.data.labels.length){
    chart={
      titulo: gt('chartTitle'),
      tipo: gt('chartType')||'bar',
      labels: chartInstance.data.labels,
      datasets: (chartInstance.data.datasets||[]).map(function(d){ return {
        label:d.label, data:d.data,
        backgroundColor:d.backgroundColor, borderColor:d.borderColor,
        borderWidth:d.borderWidth, fill:d.fill
      };})
    };
  }

  var mapa=null;
  if(typeof markerList!=='undefined' && markerList && markerList.length){
    mapa = markerList.map(function(m){ return {lat:m.lat,lng:m.lng,title:m.title,desc:m.desc}; });
  }

  var timeline=null;
  if(typeof timelineEvents!=='undefined' && timelineEvents && timelineEvents.length){
    timeline = timelineEvents.map(function(e){ return {date:e.date,title:e.title,desc:e.desc}; });
  }

  var infoLineas = (gt('infoContent')||'').split('\n').map(function(s){return s.trim();})
                    .filter(function(s){return s.length;});
  var infografia=null;
  if(infoLineas.length){
    infografia={
      titulo: gt('infoTitle'),
      lineas: infoLineas,
      template: (typeof templateActual!=='undefined' && templateActual) ? templateActual : 'simple',
      color1: gt('infoColor1')||'#a6ce39',
      color2: gt('infoColor2')||'#1a1a1a'
    };
  }

  var titulo = gt('chartTitle') || gt('infoTitle') || 'Publicación Media Mendoza';

  return {
    titulo: titulo,
    chart: chart, mapa: mapa, timeline: timeline, infografia: infografia,
    logo: getLogoDataUri(),
    generado: new Date().toISOString()
  };
}

/* ---------- Render de secciones (HTML estático) ---------- */
function splitLinea(s){
  var i=s.indexOf(':');
  if(i>0){ return {lbl:s.slice(0,i), val:s.slice(i+1).trim()}; }
  return {lbl:'', val:s};
}

function buildTimeline(events){
  var items = events.slice().sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); })
    .map(function(e){
      var d=formatearFecha(e.date,true);
      var t=escapeHtml(e.title||'');
      var desc=escapeHtml(e.desc||'');
      return '<li class="mmw-reveal"><div class="date">'+d+'</div><div class="t">'+t+'</div><div class="d">'+desc+'</div></li>';
    }).join('');
  return '<section class="mmw-sec" id="sec-timeline"><div class="mmw-wrap">'
    + '<h2 class="mmw-reveal">Cronología</h2>'
    + '<p class="sub mmw-reveal">Los hechos en orden cronológico.</p>'
    + '<ul class="mmw-tl">'+items+'</ul></div></section>';
}

function buildInfografia(info){
  var tmpl = info.template || 'simple';
  var lines = (info.lineas||[]).map(escapeHtml);
  var cards='';

  if(tmpl==='comparativa'){
    var rows='';
    for(var i=0;i<lines.length;i+=2){
      var left=splitLinea(lines[i]);
      var right = (i+1<lines.length) ? splitLinea(lines[i+1]) : {lbl:'',val:''};
      rows += '<div class="mmw-vs mmw-reveal">'
        + '<div class="mmw-card"><div class="lbl">'+left.lbl+'</div><div class="val">'+left.val+'</div></div>'
        + '<div class="mmw-vs-badge">VS</div>'
        + '<div class="mmw-card"><div class="lbl">'+right.lbl+'</div><div class="val">'+right.val+'</div></div>'
        + '</div>';
    }
    cards=rows;
  } else if(tmpl==='listado'){
    cards = '<ol class="mmw-list">' + lines.map(function(ln,idx){
      var s=splitLinea(ln);
      return '<li class="mmw-reveal"><span class="mmw-num">'+(idx+1)+'</span><div><div class="lbl">'+s.lbl+'</div><div class="val">'+s.val+'</div></div></li>';
    }).join('') + '</ol>';
  } else {
    cards = '<div class="mmw-cards">' + lines.map(function(ln){
      var s=splitLinea(ln);
      return '<div class="mmw-card mmw-reveal"><div class="lbl">'+s.lbl+'</div><div class="val">'+s.val+'</div></div>';
    }).join('') + '</div>';
  }

  var isDark = tmpl==='destacado';
  var title = escapeHtml(info.titulo||'Datos clave');
  var secCls = isDark ? 'mmw-sec destacado' : 'mmw-sec';
  return '<section class="'+secCls+'" id="sec-info"><div class="mmw-wrap">'
    + '<h2 class="mmw-reveal">'+title+'</h2>'
    + '<p class="sub mmw-reveal">Información destacada.</p>'+cards+'</div></section>';
}

/* ---------- Ensamblado del HTML autónomo (web o rica) ---------- */
function headComun(titulo){
  return '<!doctype html><html lang="es"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>'+escapeHtml(titulo)+'</title>'
    + '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">'
    + '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">'
    + '<style>'+PAGE_CSS+'</style></head><body>';
}

function navYHero(D){
  var titulo=escapeHtml(D.titulo||'Publicación Media Mendoza');
  var dateline=formatearFecha(D.generado);
  var secciones=[];
  if(D.chart) secciones.push(['sec-chart','Gráfico']);
  if(D.mapa&&D.mapa.length) secciones.push(['sec-map','Mapa']);
  if(D.timeline&&D.timeline.length) secciones.push(['sec-timeline','Cronología']);
  if(D.infografia&&D.infografia.lineas&&D.infografia.lineas.length) secciones.push(['sec-info','Datos']);
  var navLinks = secciones.map(function(s){ return '<a href="#'+s[0]+'">'+s[1]+'</a>'; }).join('');
  return '<header class="mmw-nav"><div class="mmw-brand"><span class="dot"></span>MEDIA MENDOZA</div><nav>'+navLinks+'</nav></header>'
    + '<section class="mmw-hero"><div class="mmw-wrap"><span class="mmw-kicker">Publicación interactiva</span>'
    + '<h1>'+titulo+'</h1><div class="mmw-dateline">Publicado '+dateline+'</div></div></section>';
}

function seccionesComunes(D){
  var chartSec = D.chart
    ? ('<section class="mmw-sec" id="sec-chart"><div class="mmw-wrap">'
       + '<h2 class="mmw-reveal">'+escapeHtml(D.chart.titulo||'Gráfico')+'</h2>'
       + '<p class="sub mmw-reveal">Visualización interactiva de los datos.</p>'
       + '<div class="mmw-chart-box mmw-reveal"><div style="position:relative;height:380px"><canvas id="mmwChart"></canvas></div></div>'
       + '</div></section>')
    : '';
  var mapSec = (D.mapa&&D.mapa.length)
    ? ('<section class="mmw-sec" id="sec-map"><div class="mmw-wrap">'
       + '<h2 class="mmw-reveal">Mapa</h2>'
       + '<p class="sub mmw-reveal">Ubicaciones relacionadas con la nota.</p>'
       + '<div id="map" class="mmw-reveal"></div></div></section>')
    : '';
  var tlSec = (D.timeline&&D.timeline.length) ? buildTimeline(D.timeline) : '';
  var infoSec = (D.infografia&&D.infografia.lineas&&D.infografia.lineas.length) ? buildInfografia(D.infografia) : '';
  return chartSec + mapSec + tlSec + infoSec;
}

function footerComun(D){
  var logo=D.logo||'';
  return '<footer class="mmw-footer"><div class="mmw-wrap">'
    + (logo ? '<img src="'+logo+'" alt="Media Mendoza">' : '')
    + '<div class="small">MEDIA MENDOZA · mmherramientas.media</div>'
    + '<div class="small" style="margin-top:6px">Generado con Visual Suite</div></div></footer>';
}

/* ---------- (1) Publicación Web ---------- */
function construirHTMLWeb(D){
  var safeJson = JSON.stringify(D).replace(/</g, '\\u003c');
  return headComun(D.titulo)
    + navYHero(D)
    + seccionesComunes(D)
    + footerComun(D)
    + '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"><\/script>'
    + '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>'
    + '<script>window.MM_DATA='+safeJson+';<\/script>'
    + '<script>'+INIT_JS+'<\/script>'
    + '</body></html>';
}

/* ---------- (2) Publicación Rica (con galería de recursos) ---------- */
function construirHTMLRica(D, recursos){
  recursos = recursos || {svgs:[], pngs:[]};
  var svgs = recursos.svgs || [];
  var pngs = recursos.pngs || [];

  var gallery = '';
  if(svgs.length || pngs.length){
    var cards = svgs.map(function(s){
      return '<div class="mmw-rescard mmw-reveal"><span class="mmw-badge">SVG</span>'
        + '<div class="mmw-resprev">'+s.svg+'</div>'
        + '<div class="mmw-resname">'+escapeHtml(s.nombreArchivo)+'</div>'
        + '<button class="mmw-resbtn" onclick="MM_descargarSVG(\''+s.nombreArchivo+'\')">Descargar SVG</button></div>';
    }).join('');
    cards += pngs.map(function(p){
      return '<div class="mmw-rescard mmw-reveal"><span class="mmw-badge png">PNG</span>'
        + '<div class="mmw-resprev"><img src="'+p.dataUrl+'" alt=""></div>'
        + '<div class="mmw-resname">'+escapeHtml(p.nombreArchivo)+'</div>'
        + '<button class="mmw-resbtn" onclick="MM_descargarPNG(\''+p.nombreArchivo+'\')">Descargar PNG</button></div>';
    }).join('');

    gallery = '<section class="mmw-sec" id="sec-recursos"><div class="mmw-wrap">'
      + '<h2 class="mmw-reveal">Recursos para tu nota</h2>'
      + '<p class="sub mmw-reveal">Elementos gráficos listos para descargar y usar en la publicación.</p>'
      + '<div class="mmw-gallery">'+cards+'</div></div></section>';
  }

  // Datos de recursos embebidos para los handlers de descarga
  var recData = { svgs:{}, pngs:{} };
  svgs.forEach(function(s){ recData.svgs[s.nombreArchivo] = s.svg; });
  pngs.forEach(function(p){ recData.pngs[p.nombreArchivo] = p.dataUrl; });
  var recJson = JSON.stringify(recData).replace(/</g, '\\u003c');

  var safeJson = JSON.stringify(D).replace(/</g, '\\u003c');

  var dlScript = 'window.MM_REC='+recJson+';'
    + 'function MM_descargarSVG(fn){var s=window.MM_REC.svgs[fn];if(!s)return;var b=new Blob([s],{type:"image/svg+xml"});var u=URL.createObjectURL(b);var a=document.createElement("a");a.href=u;a.download=fn;document.body.appendChild(a);a.click();setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(u);},200);}'
    + 'function MM_descargarPNG(fn){var d=window.MM_REC.pngs[fn];if(!d)return;var a=document.createElement("a");a.href=d;a.download=fn;document.body.appendChild(a);a.click();setTimeout(function(){document.body.removeChild(a);},200);}';

  return headComun(D.titulo)
    + navYHero(D)
    + seccionesComunes(D)
    + gallery
    + footerComun(D)
    + '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"><\/script>'
    + '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>'
    + '<script>window.MM_DATA='+safeJson+';<\/script>'
    + '<script>'+INIT_JS+'<\/script>'
    + '<script>'+dlScript+'<\/script>'
    + '</body></html>';
}

/* ---------- Interfaz (botones + modales) ---------- */
var ultimoWebHTML='';
var ultimoRicaHTML='';

function generarPublicacionWeb(){
  var D=recogerDatos();
  if(!D.chart && !D.mapa && !D.timeline && !D.infografia){
    alert('No hay datos para generar la publicación. Creá un gráfico, mapa, cronología o infografía primero.');
    return;
  }
  ultimoWebHTML=construirHTMLWeb(D);
  var modal=document.getElementById('webPreview');
  var frame=document.getElementById('webPreviewFrame');
  if(frame) frame.srcdoc=ultimoWebHTML;
  if(modal) modal.classList.add('show');
}
function cerrarWebPreview(){
  var modal=document.getElementById('webPreview');
  var frame=document.getElementById('webPreviewFrame');
  if(frame) frame.srcdoc='';
  if(modal) modal.classList.remove('show');
}
function descargarPublicacionWeb(){
  if(!ultimoWebHTML){ return; }
  var blob=new Blob([ultimoWebHTML],{type:'text/html'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url; a.download='publicacion-media-mendoza.html';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
}

function generarPublicacionRica(){
  var D=recogerDatos();
  if(!D.chart && !D.mapa && !D.timeline && !D.infografia){
    alert('No hay datos para generar la publicación. Creá un gráfico, mapa, cronología o infografía primero.');
    return;
  }
  var promptManual = (document.getElementById('ricaPrompt')||{}).value || '';
  var svgs = (window.recursos && recursos.generarIconosSVG) ? recursos.generarIconosSVG(D) : [];
  var pngs = (window.recursos && recursos.generarIlustracionesPNG) ? recursos.generarIlustracionesPNG(D, promptManual) : [];
  ultimoRicaHTML = construirHTMLRica(D, {svgs:svgs, pngs:pngs});

  var modal=document.getElementById('ricaPreview');
  var frame=document.getElementById('ricaPreviewFrame');
  if(frame) frame.srcdoc=ultimoRicaHTML;
  if(modal) modal.classList.add('show');
}
function cerrarRicaPreview(){
  var modal=document.getElementById('ricaPreview');
  var frame=document.getElementById('ricaPreviewFrame');
  if(frame) frame.srcdoc='';
  if(modal) modal.classList.remove('show');
}
function descargarPublicacionRica(){
  if(!ultimoRicaHTML){ return; }
  var blob=new Blob([ultimoRicaHTML],{type:'text/html'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url; a.download='publicacion-rica-media-mendoza.html';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
}
