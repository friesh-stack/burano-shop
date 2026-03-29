// format.js v4 - Burano Shop
var FMTS = {
  "4:3":  {id:"f1",ar:"4/3", w:720,h:540, label:"Format 1 (4:3)"},
  "16:9": {id:"f2",ar:"16/9",w:800,h:450, label:"Format 2 (16:9)"},
  "3:4":  {id:"f3",ar:"3/4", w:600,h:800, label:"Format 3 (3:4)"},
  "9:16": {id:"f4",ar:"9/16",w:540,h:960, label:"Format 4 (9:16)"}
};
var activeFmt = "4:3";
window.pcSelectedPhoto = null;

function getFmtPhotos(fmt){try{return JSON.parse(localStorage.getItem("bl_fp_"+fmt.replace(/:/g,""))||"[]");}catch(e){return[];}}
function saveFmtPhotos(fmt,arr){try{localStorage.setItem("bl_fp_"+fmt.replace(/:/g,""),JSON.stringify(arr));return true;}catch(e){return false;}}

function selectFmt(fmt){
  activeFmt=fmt;
  Object.keys(FMTS).forEach(function(f){
    var btn=document.getElementById("fbtn_"+f.replace(/:/g,""));if(!btn)return;
    if(f===fmt){btn.style.background="var(--gold)";btn.style.color="#0A1628";btn.style.borderColor="var(--gold)";}
    else{btn.style.background="rgba(255,255,255,.06)";btn.style.color="#fff";btn.style.borderColor="rgba(255,255,255,.2)";}
  });
  var info=document.getElementById("fmt_info");
  if(info)info.textContent="Aktiv: "+(FMTS[fmt]||{label:fmt}).label;
  var cv=document.getElementById("pc_admin_preview"),cfg=FMTS[fmt];
  if(cv&&cfg){cv.width=cfg.w;cv.height=cfg.h;}
}

function setPcPos(pos){
  localStorage.setItem("bl_pc_pos",pos);
  ["sky","middle","water"].forEach(function(p){
    var btn=document.getElementById("pcpos_"+p);if(!btn)return;
    if(p===pos){btn.style.background="var(--gold)";btn.style.color="#0A1628";btn.style.borderColor="var(--gold)";}
    else{btn.style.background="rgba(255,255,255,.06)";btn.style.color="#fff";btn.style.borderColor="rgba(255,255,255,.2)";}
  });
  if(typeof renderPC==="function")renderPC(true);
}

function cropToRatio(src,tw,th,cb){
  var img=new Image();
  img.onload=function(){
    var sw=img.width,sh=img.height,tr=tw/th,sr=sw/sh,cw,ch,cx,cy;
    if(sr>tr){ch=sh;cw=Math.round(sh*tr);cx=Math.round((sw-cw)/2);cy=0;}
    else{cw=sw;ch=Math.round(sw/tr);cx=0;cy=Math.round((sh-ch)/3);}
    var cv=document.createElement("canvas");cv.width=tw;cv.height=th;
    cv.getContext("2d").drawImage(img,cx,cy,cw,ch,0,0,tw,th);
    cb(cv.toDataURL("image/jpeg",0.88));
  };img.src=src;
}

function updatePcPreview(){
  if(typeof renderPC==="function") renderPC(true);
}

function loadPcPhotoFile(file){
  var reader=new FileReader();
  reader.onload=function(e){
    var raw=e.target.result,cfg=FMTS[activeFmt]||FMTS["4:3"];
    cropToRatio(raw,cfg.w,cfg.h,function(cropped){
      window.pcAdminImg=cropped;
      var prev=document.getElementById("pc_upload_preview");
      if(prev){prev.innerHTML="";var i=document.createElement("img");i.src=cropped;i.style.cssText="max-width:100%;max-height:160px;border-radius:8px;display:block;margin:0 auto";prev.appendChild(i);var inf=document.createElement("div");inf.style.cssText="font-size:.72rem;color:var(--gold);margin-top:6px;text-align:center;font-weight:700";inf.textContent=(FMTS[activeFmt]||{label:activeFmt}).label+" - bereit";prev.appendChild(inf);}
      var cv=document.getElementById("pc_admin_preview");if(cv){cv.width=cfg.w;cv.height=cfg.h;cv.style.display="block";}
      // Button immer anzeigen - mehrfach sichern
      var btn=document.getElementById("pc_save_btn");
      if(btn){ btn.style.display="block"; btn.style.visibility="visible"; }
      if(typeof updatePcPreview==="function")updatePcPreview();
    });
  };reader.readAsDataURL(file);
}

function savePcPhoto(){
  var img=window.pcAdminImg;
  if(!img){alert("Bitte zuerst ein Foto hochladen.");return;}
  var arr=getFmtPhotos(activeFmt);arr.push(img);
  if(saveFmtPhotos(activeFmt,arr)){
    alert("Gespeichert!\n"+(FMTS[activeFmt]||{label:activeFmt}).label+"\n("+arr.length+" Fotos in diesem Format)");
    window.pcAdminImg=null;
    var prev=document.getElementById("pc_upload_preview");
    if(prev)prev.innerHTML="<div style='font-size:2rem'>&#128444;</div><div style='font-size:.85rem;opacity:.6'>Naechstes Foto hochladen</div>";
    var cv=document.getElementById("pc_admin_preview");if(cv)cv.style.display="none";
    var btn=document.getElementById("pc_save_btn");if(btn)btn.style.display="none";
    renderFmtGallery();renderAdminPhotoList();buildPcThumbs();
  }else{alert("Speicherfehler - Foto zu gross? Max ca. 400KB.");}
}

function initFormatJs(){
  if(typeof PHOTOS!=="undefined") ensureHeroSlides();
  initPosButtons();
  renderFmtGallery();
  renderAdminPhotoList();
  buildPcThumbs();
  buildIslandStrip("mazz_strip","bl_mazz_photos");
  buildIslandStrip("torc_strip","bl_torc_photos");
}

function renderFmtGallery(){
  Object.keys(FMTS).forEach(function(fmt){
    var cfg=FMTS[fmt],grid=document.getElementById("ggrid_"+cfg.id),sec=document.getElementById("sec_"+cfg.id);
    if(!grid)return;
    var photos=getFmtPhotos(fmt),items=[];
    // Standard-Fotos NUR in 9:16 anzeigen (einziges Format)
    if(fmt==="9:16"&&typeof PHOTOS!=="undefined"&&typeof GDEFS!=="undefined"){
      GDEFS.forEach(function(d){if(PHOTOS[d.k])items.push({src:PHOTOS[d.k],lbl:d.l,isCustom:false});});
    }
    photos.forEach(function(src,i){items.push({src:src,lbl:"Foto "+(items.length+1),idx:i,isCustom:true,fmt:fmt});});
    if(sec){sec.style.display=items.length?"block":"none";}
    if(!items.length){grid.innerHTML="";return;}
    grid.innerHTML="";
    items.forEach(function(item){
      var div=document.createElement("div");div.className="gi";
      div.setAttribute("data-fmt",fmt);
      // gi-inner: 9:16 Wrapper
      var inner=document.createElement("div");inner.className="gi-inner";
      var img=document.createElement("img");
      img.src=item.src;img.loading="lazy";
      inner.appendChild(img);
      div.appendChild(inner);
      var lbl=document.createElement("div");lbl.className="lbl";
      lbl.textContent=item.lbl;inner.appendChild(lbl);
      div.onclick=(function(l){return function(){if(typeof openMdl==="function")openMdl(l,0.99);};})(item.lbl);
      if(item.isCustom){
        var f2=item.fmt,i2=item.idx;div.draggable=true;
        div.ondragstart=function(e){e.dataTransfer.setData("text/plain",f2+"|"+i2);e.currentTarget.style.opacity=".4";};
        div.ondragover=function(e){e.preventDefault();e.currentTarget.style.borderColor="var(--gold)";};
        div.ondragleave=function(e){e.currentTarget.style.borderColor="transparent";};
        div.ondragend=function(e){e.currentTarget.style.opacity="1";};
        div.ondrop=function(e){e.preventDefault();e.currentTarget.style.borderColor="transparent";var d=e.dataTransfer.getData("text/plain").split("|"),sf=d[0],si=parseInt(d[1]);if(sf===f2&&si!==i2){var arr=getFmtPhotos(f2);var itm=arr.splice(si,1)[0];arr.splice(i2,0,itm);saveFmtPhotos(f2,arr);renderFmtGallery();renderAdminPhotoList();}};
      }
      grid.appendChild(div);
    });
  });
  buildPcThumbs();
}

function renderAdminPhotoList(){
  var el=document.getElementById("admin_photo_list");if(!el)return;
  var out="";
  Object.keys(FMTS).forEach(function(fmt){
    var arr=getFmtPhotos(fmt),lbl=(FMTS[fmt]||{label:fmt}).label;
    out+="<div style='margin-bottom:12px'><b style='color:var(--gold);font-size:.78rem'>"+lbl+" ("+arr.length+")</b><br>";
    if(!arr.length)out+="<span style='opacity:.4;font-size:.75rem'>Keine Fotos</span>";
    arr.forEach(function(src,i){out+="<span style='display:inline-block;position:relative;margin:3px'><img src='"+src+"' style='height:55px;border-radius:6px;vertical-align:top'><button onclick=\"fmtDelPhoto('"+fmt+"',"+i+")\" style='position:absolute;top:-4px;right:-4px;background:#E53935;border:none;border-radius:50%;width:18px;height:18px;color:#fff;font-size:.6rem;cursor:pointer;line-height:18px;padding:0;font-weight:900'>x</button></span>";});
    out+="</div>";
  });
  el.innerHTML=out;
}

function fmtDelPhoto(fmt,idx){
  if(!confirm("Foto loeschen?"))return;
  var arr=getFmtPhotos(fmt);arr.splice(idx,1);saveFmtPhotos(fmt,arr);
  renderAdminPhotoList();renderFmtGallery();
}

// ════════════════════════════════════════
// POSTKARTEN-LAUFBAND
// ════════════════════════════════════════
function buildPcThumbs(){
  var row=document.getElementById("pc_thumb_row");if(!row)return;
  var items=[];
  if(typeof PHOTOS!=="undefined"&&typeof GDEFS!=="undefined"){
    GDEFS.forEach(function(d){if(PHOTOS[d.k])items.push({src:PHOTOS[d.k],lbl:d.l,fmt:"4:3"});});
  }
  Object.keys(FMTS).forEach(function(fmt){
    getFmtPhotos(fmt).forEach(function(src,i){items.push({src:src,lbl:"Foto "+(i+1),fmt:fmt});});
  });
  if(!items.length){row.innerHTML="<span style='opacity:.4;font-size:.82rem;padding:10px;white-space:normal'>Noch keine Fotos vorhanden.</span>";return;}
  row.innerHTML="";
  var ratios={"4:3":4/3,"16:9":16/9,"3:4":3/4,"9:16":9/16};
  items.forEach(function(item,idx){
    var div=document.createElement("div");
    var h=72,w=Math.round(h*(ratios[item.fmt]||1));
    div.style.cssText="position:relative;cursor:pointer;border-radius:8px;overflow:hidden;border:3px solid transparent;transition:border-color .2s;flex-shrink:0;width:"+w+"px;height:"+h+"px";
    var img=document.createElement("img");
    img.src=item.src;img.loading="lazy";img.title=item.lbl;
    img.style.cssText="width:100%;height:100%;object-fit:cover;display:block";
    div.appendChild(img);
    div.onclick=(function(s,d,f){return function(){
      document.querySelectorAll("#pc_thumb_row > div").forEach(function(el){el.style.borderColor="transparent";});
      d.style.borderColor="var(--gold)";
      window.pcSelectedPhoto=s;
      var cfg=FMTS[f]||FMTS["4:3"];
      var cv=document.getElementById("pcanv");if(cv){cv.width=cfg.w;cv.height=cfg.h;}
      if(typeof renderPC==="function")renderPC(true);
      var pc=document.getElementById("postcard");if(pc)pc.scrollIntoView({behavior:"smooth"});
    };})(item.src,div,item.fmt);
    row.appendChild(div);
    if(idx===0&&!window.pcSelectedPhoto){
      div.style.borderColor="var(--gold)";window.pcSelectedPhoto=item.src;
      var cfg0=FMTS[item.fmt]||FMTS["4:3"];
      var cv0=document.getElementById("pcanv");if(cv0){cv0.width=cfg0.w;cv0.height=cfg0.h;}
    }
  });
}

// ════════════════════════════════════════
// POSTKARTE RENDERN
// ════════════════════════════════════════
function renderPC(withWatermark){
  withWatermark=(withWatermark!==false);
  var cv=document.getElementById("pcanv");if(!cv)return;
  var ctx=cv.getContext("2d"),W=cv.width,H=cv.height;
  ctx.clearRect(0,0,W,H);
  var src=window.pcSelectedPhoto||"";
  if(!src){
    ctx.fillStyle="#0D2B5E";ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(255,255,255,.35)";ctx.font="16px sans-serif";ctx.textAlign="center";
    ctx.fillText("Bitte ein Foto auswaehlen",W/2,H/2);return;
  }
  var img=new Image();
  img.onload=function(){
    // Foto
    ctx.drawImage(img,0,0,W,H);
    // Vignette
    var vg=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.9);
    vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.4)");
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    // Rahmen
    ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=8;ctx.strokeRect(4,4,W-8,H-8);
    // Poststempel
    drawPostmark(ctx,W,H);
    // Gruss-Text Position
    var pos=localStorage.getItem("bl_pc_pos")||"water";
    var textY=pos==="sky"?H*.15:pos==="middle"?H*.45:H*.72;
    // Gruss geschwungen in Schreibschrift
    var greet=getSelectedGreeting();
    drawCurvedGreeting(ctx,greet,W,H,textY);
    // Namens-Linie
    var lineY=Math.min(textY+H*.13,H*.9);
    drawDashedLine(ctx,W,lineY);
    var name=((document.getElementById("pc_customer_name")||{}).value||"").trim();
    if(name){
      ctx.save();
      ctx.font="italic "+Math.round(W/30)+"px 'Brush Script MT',cursive";
      ctx.fillStyle="rgba(255,255,255,.92)";ctx.textAlign="center";
      ctx.shadowColor="rgba(0,0,0,.8)";ctx.shadowBlur=8;
      ctx.fillText(name,W/2,lineY+20);ctx.restore();
    }
    // Footer
    ctx.font="bold 10px sans-serif";ctx.fillStyle="rgba(255,255,255,.5)";
    ctx.textAlign="center";ctx.shadowBlur=0;
    ctx.fillText("my-burano.com - Terra Nova 112",W/2,H-7);
    // WASSERZEICHEN: nur shop.myburano.com in gold, mehrfach diagonal
    if(withWatermark){
      ctx.save();
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.font="bold "+Math.round(W/13)+"px Arial,sans-serif";
      ctx.shadowColor="rgba(0,0,0,0.8)";ctx.shadowBlur=10;
      ctx.fillStyle="rgba(255,210,63,0.85)";
      ctx.strokeStyle="rgba(0,0,0,0.55)";ctx.lineWidth=2;
      // 6 diagonale Positionen
      var wp=[[W*.25,H*.18],[W*.72,H*.32],[W*.18,H*.52],[W*.75,H*.62],[W*.35,H*.82],[W*.68,H*.88]];
      wp.forEach(function(p){
        ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(-Math.PI/7);
        ctx.strokeText("shop.myburano.com",0,0);
        ctx.fillText("shop.myburano.com",0,0);
        ctx.restore();
      });
      ctx.restore();
    }
  };
  img.src=src;
}

function drawPostmark(ctx,W,H){
  // Grosser sichtbarer Poststempel oben rechts (keine Briefmarke)
  var cx=W-80,cy=80,r=68;
  ctx.save();
  ctx.globalAlpha=0.92;
  // Aeusserer Kreis
  ctx.strokeStyle="#1565C0";ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  // Innerer Kreis
  ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(cx,cy,r-14,0,Math.PI*2);ctx.stroke();
  // Wellenlinien links
  ctx.lineWidth=3;
  for(var i=0;i<4;i++){
    var ly=cy-22+i*15;
    ctx.beginPath();ctx.moveTo(cx-r-50,ly);ctx.lineTo(cx-r+3,ly);ctx.stroke();
  }
  // Texte
  ctx.fillStyle="#1565C0";ctx.textAlign="center";
  ctx.font="bold 13px sans-serif";ctx.fillText("BURANO",cx,cy-26);
  var now=new Date();
  ctx.font="bold 15px sans-serif";
  ctx.fillText(now.getDate()+"."+(now.getMonth()+1)+"."+now.getFullYear(),cx,cy-6);
  ctx.font="bold 12px sans-serif";ctx.fillText("VENEZIA",cx,cy+12);
  ctx.font="10px sans-serif";ctx.fillText("ITALIA",cx,cy+28);
  ctx.globalAlpha=1;ctx.restore();
}

function drawCurvedGreeting(ctx,text,W,H,centerY){
  ctx.save();
  // Schreibschrift - mehrere Fallbacks fuer alle Geraete
  var fs=Math.max(18,Math.round(W/21));
  ctx.font="italic bold "+fs+"px 'Brush Script MT','Segoe Script','Comic Sans MS',cursive";
  ctx.fillStyle="rgba(255,255,255,0.98)";
  ctx.shadowColor="rgba(0,0,0,0.95)";
  ctx.shadowBlur=12;ctx.shadowOffsetX=1;ctx.shadowOffsetY=2;
  ctx.textBaseline="alphabetic";
  // Stark gebogener Bogen (kleiner Radius = staerkere Kruemmung)
  var radius=W*0.85;
  var chars=text.split("");
  var widths=chars.map(function(c){return ctx.measureText(c).width;});
  var totalW=widths.reduce(function(a,b){return a+b;},0);
  // Bogenmitte unter centerY
  var startAngle=-Math.PI/2-totalW/(2*radius);
  var x0=W/2, y0=centerY+radius;
  var angle=startAngle;
  chars.forEach(function(ch,i){
    var cw=widths[i];
    var a=angle+cw/(2*radius);
    ctx.save();
    ctx.translate(x0+Math.cos(a)*radius, y0+Math.sin(a)*radius);
    ctx.rotate(a+Math.PI/2);
    ctx.fillText(ch,0,0);
    ctx.restore();
    angle+=cw/radius;
  });
  ctx.restore();
}

function drawDashedLine(ctx,W,y){
  ctx.save();
  ctx.setLineDash([8,6]);ctx.strokeStyle="rgba(255,255,255,0.65)";ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(W*0.1,y);ctx.lineTo(W*0.9,y);ctx.stroke();
  ctx.setLineDash([]);
  ctx.font="10px sans-serif";ctx.fillStyle="rgba(255,255,255,.55)";ctx.textAlign="center";
  ctx.fillText("- Ihr Name -",W/2,y-9);
  ctx.restore();
}

function updateGreetingSelect(){
  var lang=document.getElementById("pclang"),sel=document.getElementById("pcgreeting");
  if(!lang||!sel)return;
  var l=lang.value;
  var opts={
    de:["Herzliche Gruesse von der Insel Burano","Die Farben Buranos bleiben unvergesslich","Die schoenste Insel der Welt gruest Dich","Erinnerungen an Burano - fuer immer","Buono viaggio! Bis bald in Burano"],
    en:["Warm greetings from the island of Burano","The colours of Burano are unforgettable","The most beautiful island says hello","Memories of Burano - forever in my heart","See you soon in Burano"],
    it:["Cordiali saluti dalla bellissima Burano","I colori di Burano rimarranno nel cuore","La piu bella isola del mondo ti saluta","Ricordi di Burano - per sempre","Buono viaggio! A presto a Burano"],
    fr:["Chaleureuses salutations de Burano","Les couleurs de Burano sont inoubliables","La plus belle ile du monde vous salue","Souvenirs de Burano pour toujours","Buono viaggio! A bientot a Burano"],
    es:["Cordiales saludos desde Burano","Los colores de Burano son inolvidables","La isla mas bella te saluda","Recuerdos de Burano para siempre","Buono viaggio! Hasta pronto"],
    ja:["\u30D6\u30E9\u30FC\u30CE\u304B\u3089\u306E\u5FC3\u6E29\u307E\u308B\u3054\u6328\u62F6","\u30D6\u30E9\u30FC\u30CE\u306E\u8272\u5F69\u306F\u6C38\u9060\u306B","\u4E16\u754C\u3067\u6700\u3082\u7F8E\u3057\u3044\u5CF6\u304B\u3089","\u30D6\u30E9\u30FC\u30CE\u306E\u601D\u3044\u51FA","\u307E\u305F\u30D6\u30E9\u30FC\u30CE\u3067\uFF01"],
    zh:["\u6765\u81EA\u5E03\u62C9\u8BFA\u7684\u8BDA\u631A\u95EE\u5019","\u5E03\u62C9\u8BFA\u7684\u8272\u5F69\u4EE4\u4EBA\u96BE\u5FD8","\u6700\u7F8E\u4E3D\u7684\u5C9B\u5C3F\u5411\u60A8\u95EE\u5019","\u5E03\u62C9\u8BFA\u7684\u7F8E\u597D\u56DE\u5FC6","\u671F\u5F85\u518D\u4F1A\uFF01"],
    pl:["Serdeczne pozdrowienia z Burano","Kolory Burano sa niezapomniane","Najpieksza wyspa pozdrawia Cie","Wspomnienia z Burano na zawsze","Do zobaczenia na Burano"]
  };
  var arr=opts[l]||opts.de;
  var cur=sel.selectedIndex;
  sel.innerHTML=arr.map(function(t,i){return "<option value='"+i+"'>"+t+"</option>";}).join("");
  sel.selectedIndex=Math.min(cur,arr.length-1);
}

function getSelectedGreeting(){
  updateGreetingSelect();
  var sel=document.getElementById("pcgreeting");if(!sel)return"Herzliche Gruesse von Burano";
  return sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:sel.options[0].text;
}

// ════════════════════════════════════════
// INSEL-LAUFBAENDER (Mazzorbo / Torcello)
// ════════════════════════════════════════
function buildIslandStrip(stripId,storageKey){
  var strip=document.getElementById(stripId);if(!strip)return;
  var photos=[];
  // Array-Version (neu)
  try{photos=JSON.parse(localStorage.getItem(storageKey)||"[]");}catch(e){}
  // Einzel-Foto-Version (alt, Kompatibilität)
  var single=localStorage.getItem(storageKey.replace("_photos","_photo"));
  if(single&&photos.indexOf(single)<0)photos.unshift(single);
  // Auch direkte Key-Variante
  var direct=localStorage.getItem(storageKey);
  if(direct&&direct[0]!=="["){photos.unshift(direct);}
  if(!photos.length){strip.innerHTML="<span style='opacity:.4;font-size:.78rem'>Im Admin Fotos hochladen.</span>";return;}
  strip.innerHTML="";
  photos.forEach(function(src){
    var img=document.createElement("img");
    img.src=src;img.loading="lazy";
    img.style.cssText="height:110px;border-radius:10px;object-fit:cover;cursor:pointer;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,.3)";
    img.onclick=function(){window.open(src,"_blank");};
    strip.appendChild(img);
  });
}

// ════════════════════════════════════════
// HERO SLIDESHOW
// ════════════════════════════════════════
function ensureHeroSlides(){
  var cont=document.getElementById("hslides");if(!cont)return;
  if(cont.querySelectorAll(".hslide").length>1)return;
  if(typeof PHOTOS==="undefined")return;
  var keys=["canal_wide","canal_winter","canal_lagoon","canal_sunset","canal_morning","canal_wide2","waterfront","piazza"];
  cont.innerHTML="";var added=0;
  keys.forEach(function(k){
    if(!PHOTOS[k])return;
    var div=document.createElement("div");
    div.className="hslide"+(added===0?" on":"");
    div.style.backgroundImage="url("+PHOTOS[k]+")";
    cont.appendChild(div);added++;
  });
  if(!added)return;
  var idx=0;
  setInterval(function(){
    var slides=cont.querySelectorAll(".hslide");if(slides.length<2)return;
    slides[idx].classList.remove("on");idx=(idx+1)%slides.length;slides[idx].classList.add("on");
  },4000);
}

function initPosButtons(){
  var pos=localStorage.getItem("bl_pc_pos")||"water";
  ["sky","middle","water"].forEach(function(p){
    var btn=document.getElementById("pcpos_"+p);if(!btn)return;
    if(p===pos){btn.style.background="var(--gold)";btn.style.color="#0A1628";btn.style.borderColor="var(--gold)";}
    else{btn.style.background="rgba(255,255,255,.06)";btn.style.color="#fff";btn.style.borderColor="rgba(255,255,255,.2)";}
  });
}

// ════════════════════════════════════════
// INSEL-FOTO ADMIN HELPER
// ════════════════════════════════════════
function saveIslandPhotoToStrip(storageKey, dataUrl) {
  var arr = [];
  try { arr = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch(e) {}
  arr.push(dataUrl);
  try { localStorage.setItem(storageKey, JSON.stringify(arr)); return true; }
  catch(e) { return false; }
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
window.addEventListener("load",function(){
  setTimeout(function(){
    ensureHeroSlides();
    initPosButtons();
    renderFmtGallery();
    renderAdminPhotoList();
    buildPcThumbs();
    buildIslandStrip("mazz_strip","bl_mazz_photos");
    buildIslandStrip("torc_strip","bl_torc_photos");
    if(window.pcSelectedPhoto&&typeof renderPC==="function")renderPC(true);
  },700);
});
