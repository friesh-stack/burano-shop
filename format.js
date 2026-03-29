// format.js v5 - NUR 9:16 Format, Laufband
// ═══════════════════════════════════════════

var activeFmt = "9:16";
window.pcSelectedPhoto = null;

// Storage
function getPhotos916() {
  try { return JSON.parse(localStorage.getItem("bl_photos_916") || "[]"); } catch(e) { return []; }
}
function savePhotos916(arr) {
  try { localStorage.setItem("bl_photos_916", JSON.stringify(arr)); return true; } catch(e) { return false; }
}

// Alle Fotos (Standard + Custom)
function getAllPhotos() {
  var all = [];
  // Standard-Fotos aus photos.js
  if (typeof PHOTOS !== "undefined" && typeof GDEFS !== "undefined") {
    GDEFS.forEach(function(d) {
      if (PHOTOS[d.k]) all.push({ src: PHOTOS[d.k], lbl: d.l, custom: false });
    });
  }
  // Hochgeladene Fotos
  getPhotos916().forEach(function(src, i) {
    all.push({ src: src, lbl: "Foto " + (i+1), custom: true, idx: i });
  });
  return all;
}

// ═══════════════════════════════════════════
// GALERIE als LAUFBAND (horizontal scrollbar)
// ═══════════════════════════════════════════
function renderFmtGallery() {
  var grid = document.getElementById("ggrid_f4");
  var sec  = document.getElementById("sec_f4");
  if (!grid) return;

  var photos = getAllPhotos();
  if (!photos.length) {
    grid.innerHTML = "<p style='opacity:.4;padding:16px'>Noch keine Fotos.</p>";
    if (sec) sec.style.display = "block";
    return;
  }

  // Laufband-Container
  grid.innerHTML = "";
  grid.style.cssText = "display:flex;flex-direction:row;overflow-x:auto;gap:10px;padding:6px 0 10px;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory;";

  photos.forEach(function(item) {
    var card = document.createElement("div");
    card.style.cssText = "flex-shrink:0;width:160px;cursor:pointer;position:relative;border-radius:12px;overflow:hidden;border:3px solid transparent;transition:border-color .2s;scroll-snap-align:start;";

    // 9:16 Spacer
    var spacer = document.createElement("div");
    spacer.style.cssText = "position:relative;width:160px;padding-top:284.4px;"; // 160 * 16/9

    var img = document.createElement("img");
    img.src = item.src;
    img.loading = "lazy";
    img.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;";
    spacer.appendChild(img);

    // Label
    var lbl = document.createElement("div");
    lbl.style.cssText = "position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.75));color:#fff;font-size:.72rem;padding:20px 8px 6px;text-align:center;";
    lbl.textContent = item.lbl;
    spacer.appendChild(lbl);

    card.appendChild(spacer);
    card.onclick = (function(s, l) {
      return function() {
        // Großansicht öffnen
        card.style.borderColor = "var(--gold)";
        window.pcSelectedPhoto = s;
        if (typeof renderPC === "function") renderPC(true);
        if (typeof openMdl === "function") openMdl(l, 0.99);
      };
    })(item.src, item.lbl);

    grid.appendChild(card);
  });

  if (sec) sec.style.display = "block";
  buildPcThumbs();
}

// ═══════════════════════════════════════════
// ADMIN: Foto hochladen
// ═══════════════════════════════════════════
function loadPcPhotoFile(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var raw = e.target.result;
    // Auf 9:16 zuschneiden
    var img = new Image();
    img.onload = function() {
      var tw = 540, th = 960;
      var sr = img.width / img.height;
      var tr = tw / th;
      var cx, cy, cw, ch;
      if (sr > tr) { ch = img.height; cw = Math.round(ch * tr); cx = Math.round((img.width - cw) / 2); cy = 0; }
      else          { cw = img.width;  ch = Math.round(cw / tr); cx = 0; cy = Math.round((img.height - ch) / 3); }
      var cv = document.createElement("canvas");
      cv.width = tw; cv.height = th;
      cv.getContext("2d").drawImage(img, cx, cy, cw, ch, 0, 0, tw, th);
      window.pcAdminImg = cv.toDataURL("image/jpeg", 0.88);
      // Vorschau
      var prev = document.getElementById("pc_upload_preview");
      if (prev) {
        prev.innerHTML = "";
        var pi = document.createElement("img");
        pi.src = window.pcAdminImg;
        pi.style.cssText = "max-height:180px;border-radius:8px;display:block;margin:0 auto";
        prev.appendChild(pi);
        var inf = document.createElement("div");
        inf.style.cssText = "font-size:.72rem;color:var(--gold);margin-top:5px;text-align:center;font-weight:700";
        inf.textContent = "9:16 - Bereit zum Speichern";
        prev.appendChild(inf);
      }
      // Save-Button
      var btn = document.getElementById("pc_save_btn");
      if (btn) { btn.style.display = "block"; btn.style.visibility = "visible"; }
    };
    img.src = raw;
  };
  reader.readAsDataURL(file);
}

function savePcPhoto() {
  if (!window.pcAdminImg) { alert("Bitte zuerst ein Foto hochladen."); return; }
  var arr = getPhotos916();
  arr.push(window.pcAdminImg);
  if (savePhotos916(arr)) {
    alert("Gespeichert! (" + arr.length + " Fotos)");
    window.pcAdminImg = null;
    var prev = document.getElementById("pc_upload_preview");
    if (prev) prev.innerHTML = "<div style='font-size:2rem'>🖼️</div><div style='opacity:.5;font-size:.85rem'>Nächstes Foto hochladen</div>";
    var btn = document.getElementById("pc_save_btn");
    if (btn) btn.style.display = "none";
    renderFmtGallery();
    renderAdminPhotoList();
    buildPcThumbs();
  } else {
    alert("Speicherfehler – Foto zu groß?");
  }
}

function fmtDelPhoto(fmt, idx) {
  if (!confirm("Foto löschen?")) return;
  var arr = getPhotos916();
  arr.splice(idx, 1);
  savePhotos916(arr);
  renderFmtGallery();
  renderAdminPhotoList();
}

function renderAdminPhotoList() {
  var el = document.getElementById("admin_photo_list");
  if (!el) return;
  var arr = getPhotos916();
  if (!arr.length) { el.innerHTML = "<span style='opacity:.4;font-size:.75rem'>Keine eigenen Fotos</span>"; return; }
  el.innerHTML = "";
  arr.forEach(function(src, i) {
    var wrap = document.createElement("span");
    wrap.style.cssText = "display:inline-block;position:relative;margin:3px";
    var img = document.createElement("img");
    img.src = src;
    img.style.cssText = "height:70px;border-radius:6px;vertical-align:top;object-fit:cover;width:40px";
    var del = document.createElement("button");
    del.textContent = "x";
    del.style.cssText = "position:absolute;top:-4px;right:-4px;background:#E53935;border:none;border-radius:50%;width:18px;height:18px;color:#fff;font-size:.6rem;cursor:pointer;line-height:18px;padding:0;font-weight:900";
    del.onclick = (function(n) { return function() { fmtDelPhoto("9:16", n); }; })(i);
    wrap.appendChild(img);
    wrap.appendChild(del);
    el.appendChild(wrap);
  });
}

// ═══════════════════════════════════════════
// POSTKARTEN-LAUFBAND (für Postkarten-Generator)
// ═══════════════════════════════════════════
function buildPcThumbs() {
  var row = document.getElementById("pc_thumb_row");
  if (!row) return;
  var photos = getAllPhotos();
  if (!photos.length) {
    row.innerHTML = "<span style='opacity:.4;font-size:.82rem;padding:10px;white-space:normal'>Noch keine Fotos.</span>";
    return;
  }
  row.innerHTML = "";
  photos.forEach(function(item, idx) {
    var div = document.createElement("div");
    div.style.cssText = "flex-shrink:0;width:45px;height:80px;border-radius:8px;overflow:hidden;cursor:pointer;border:3px solid transparent;transition:border-color .2s;";
    var img = document.createElement("img");
    img.src = item.src;
    img.loading = "lazy";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    div.appendChild(img);
    div.onclick = (function(s, d) {
      return function() {
        document.querySelectorAll("#pc_thumb_row > div").forEach(function(el) { el.style.borderColor = "transparent"; });
        d.style.borderColor = "var(--gold)";
        window.pcSelectedPhoto = s;
        var cv = document.getElementById("pcanv");
        if (cv) { cv.width = 540; cv.height = 960; }
        if (typeof renderPC === "function") renderPC(true);
      };
    })(item.src, div);
    row.appendChild(div);
    if (idx === 0 && !window.pcSelectedPhoto) {
      div.style.borderColor = "var(--gold)";
      window.pcSelectedPhoto = item.src;
    }
  });
}

// ═══════════════════════════════════════════
// INSEL-LAUFBÄNDER
// ═══════════════════════════════════════════
function buildIslandStrip(stripId, storageKey) {
  var strip = document.getElementById(stripId);
  if (!strip) return;
  var photos = [];
  try { photos = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch(e) {}
  var single = localStorage.getItem(storageKey.replace("_photos","_photo"));
  if (single && photos.indexOf(single) < 0) photos.unshift(single);
  if (!photos.length) { strip.innerHTML = "<span style='opacity:.4;font-size:.78rem'>Im Admin Fotos hochladen.</span>"; return; }
  strip.innerHTML = "";
  photos.forEach(function(src) {
    var img = document.createElement("img");
    img.src = src; img.loading = "lazy";
    img.style.cssText = "height:110px;border-radius:10px;object-fit:cover;cursor:pointer;flex-shrink:0;";
    img.onclick = function() { window.open(src, "_blank"); };
    strip.appendChild(img);
  });
}

// ═══════════════════════════════════════════
// HERO SLIDESHOW
// ═══════════════════════════════════════════
function ensureHeroSlides() {
  var cont = document.getElementById("hslides");
  if (!cont) return;
  if (cont.querySelectorAll(".hslide").length > 1) return;
  if (typeof PHOTOS === "undefined") return;
  var keys = ["canal_wide","canal_winter","canal_lagoon","canal_sunset","canal_morning","canal_wide2","waterfront"];
  cont.innerHTML = "";
  var added = 0;
  keys.forEach(function(k) {
    if (!PHOTOS[k]) return;
    var div = document.createElement("div");
    div.className = "hslide" + (added === 0 ? " on" : "");
    div.style.backgroundImage = "url(" + PHOTOS[k] + ")";
    cont.appendChild(div);
    added++;
  });
  if (!added) return;
  var idx = 0;
  setInterval(function() {
    var slides = cont.querySelectorAll(".hslide");
    if (slides.length < 2) return;
    slides[idx].classList.remove("on");
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add("on");
  }, 4000);
}

// ═══════════════════════════════════════════
// POSTKARTE RENDERN (9:16 Canvas)
// ═══════════════════════════════════════════
function renderPC(withWatermark) {
  withWatermark = (withWatermark !== false);
  var cv = document.getElementById("pcanv");
  if (!cv) return;
  cv.width = 540; cv.height = 960;
  var ctx = cv.getContext("2d"), W = 540, H = 960;
  ctx.clearRect(0, 0, W, H);
  var src = window.pcSelectedPhoto || "";
  if (!src) {
    ctx.fillStyle = "#0D2B5E"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.font = "16px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Bitte ein Foto wählen", W/2, H/2);
    return;
  }
  var img = new Image();
  img.onload = function() {
    ctx.drawImage(img, 0, 0, W, H);
    // Vignette
    var vg = ctx.createRadialGradient(W/2, H/2, H*.2, W/2, H/2, H*.9);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.4)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // Rahmen
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 8; ctx.strokeRect(4, 4, W-8, H-8);
    // Poststempel
    drawPostmark(ctx, W, H);
    // Gruss
    var pos = localStorage.getItem("bl_pc_pos") || "water";
    var textY = pos === "sky" ? H*.15 : pos === "middle" ? H*.45 : H*.72;
    drawCurvedGreeting(ctx, getSelectedGreeting(), W, H, textY);
    drawDashedLine(ctx, W, Math.min(textY + H*.13, H*.9));
    // Name
    var name = ((document.getElementById("pc_customer_name") || {}).value || "").trim();
    if (name) {
      ctx.save(); ctx.font = "italic 18px 'Brush Script MT',cursive";
      ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 8;
      ctx.fillText(name, W/2, Math.min(textY + H*.13, H*.9) + 22); ctx.restore();
    }
    // Footer
    ctx.font = "bold 10px sans-serif"; ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.textAlign = "center"; ctx.shadowBlur = 0;
    ctx.fillText("my-burano.com - Terra Nova 112", W/2, H-7);
    // Wasserzeichen
    if (withWatermark) {
      ctx.save();
      ctx.font = "bold 38px Arial,sans-serif";
      ctx.fillStyle = "rgba(255,210,63,0.82)"; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 10;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      [[W*.25,H*.15],[W*.72,H*.3],[W*.18,H*.5],[W*.75,H*.65],[W*.4,H*.82]].forEach(function(p) {
        ctx.save(); ctx.translate(p[0],p[1]); ctx.rotate(-Math.PI/7);
        ctx.strokeText("shop.myburano.com",0,0); ctx.fillText("shop.myburano.com",0,0);
        ctx.restore();
      });
      ctx.restore();
    }
  };
  img.src = src;
}

function drawPostmark(ctx, W, H) {
  var cx = W-70, cy = 70, r = 58;
  ctx.save(); ctx.globalAlpha = 0.92;
  ctx.strokeStyle = "#1565C0"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r-12, 0, Math.PI*2); ctx.stroke();
  ctx.lineWidth = 2.5;
  for (var i=0; i<4; i++) { var ly=cy-20+i*14; ctx.beginPath(); ctx.moveTo(cx-r-40,ly); ctx.lineTo(cx-r+3,ly); ctx.stroke(); }
  ctx.fillStyle="#1565C0"; ctx.textAlign="center";
  ctx.font="bold 11px sans-serif"; ctx.fillText("BURANO",cx,cy-22);
  var now=new Date(); ctx.font="bold 13px sans-serif";
  ctx.fillText(now.getDate()+"."+(now.getMonth()+1)+"."+now.getFullYear(),cx,cy-4);
  ctx.font="bold 11px sans-serif"; ctx.fillText("VENEZIA",cx,cy+12);
  ctx.font="9px sans-serif"; ctx.fillText("ITALIA",cx,cy+26);
  ctx.globalAlpha=1; ctx.restore();
}

function drawCurvedGreeting(ctx, text, W, H, centerY) {
  ctx.save();
  var fs = Math.max(18, Math.round(W/22));
  ctx.font = "italic bold "+fs+"px 'Brush Script MT',Georgia,serif";
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 14;
  ctx.textBaseline = "alphabetic";
  var radius = W*0.9;
  var chars = text.split("");
  var widths = chars.map(function(c){return ctx.measureText(c).width;});
  var totalW = widths.reduce(function(a,b){return a+b;},0);
  var angle = -Math.PI/2 - totalW/(2*radius);
  var x0=W/2, y0=centerY+radius;
  chars.forEach(function(ch,i){
    var cw=widths[i], a=angle+cw/(2*radius);
    ctx.save(); ctx.translate(x0+Math.cos(a)*radius, y0+Math.sin(a)*radius);
    ctx.rotate(a+Math.PI/2); ctx.fillText(ch,0,0); ctx.restore();
    angle+=cw/radius;
  });
  ctx.restore();
}

function drawDashedLine(ctx, W, y) {
  ctx.save(); ctx.setLineDash([8,6]);
  ctx.strokeStyle="rgba(255,255,255,0.6)"; ctx.lineWidth=1.8;
  ctx.beginPath(); ctx.moveTo(W*0.1,y); ctx.lineTo(W*0.9,y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font="10px sans-serif"; ctx.fillStyle="rgba(255,255,255,.5)"; ctx.textAlign="center";
  ctx.fillText("- Ihr Name -",W/2,y-9); ctx.restore();
}

function setPcPos(pos) {
  localStorage.setItem("bl_pc_pos", pos);
  ["sky","middle","water"].forEach(function(p){
    var btn=document.getElementById("pcpos_"+p); if(!btn)return;
    if(p===pos){btn.style.background="var(--gold)";btn.style.color="#0A1628";btn.style.borderColor="var(--gold)";}
    else{btn.style.background="rgba(255,255,255,.06)";btn.style.color="#fff";btn.style.borderColor="rgba(255,255,255,.2)";}
  });
  renderPC(true);
}

function updateGreetingSelect() {
  var lang=document.getElementById("pclang"),sel=document.getElementById("pcgreeting");
  if(!lang||!sel)return;
  var opts={
    de:["Herzliche Grüße von der Insel Burano","Die Farben Buranos bleiben unvergesslich","Die schönste Insel der Welt grüßt Dich","Erinnerungen an Burano - für immer","Buono viaggio! Bis bald in Burano"],
    en:["Warm greetings from Burano","The colours of Burano are unforgettable","The most beautiful island says hello","Memories of Burano forever","See you soon in Burano"],
    it:["Cordiali saluti da Burano","I colori di Burano nel cuore","La più bella isola ti saluta","Ricordi di Burano per sempre","A presto a Burano"],
    fr:["Chaleureuses salutations de Burano","Les couleurs de Burano inoubliables","La plus belle île vous salue","Souvenirs de Burano pour toujours","À bientôt à Burano"],
    es:["Cordiales saludos desde Burano","Los colores de Burano inolvidables","La isla más bella te saluda","Recuerdos de Burano para siempre","Hasta pronto en Burano"],
    ja:["ブラーノ島からの温かいご挨拶","ブラーノの色彩は永遠に","世界で最も美しい島より","ブラーノの思い出は永遠に","またブラーノで"],
    zh:["来自布拉诺的诚挚问候","布拉诺的色彩令人难忘","最美丽的岛屿向您问好","布拉诺的记忆永远留存","期待再会布拉诺"],
    pl:["Serdeczne pozdrowienia z Burano","Kolory Burano niezapomniane","Najpiękniejsza wyspa pozdrawia","Wspomnienia z Burano na zawsze","Do zobaczenia na Burano"]
  };
  var arr=opts[lang.value]||opts.de, cur=sel.selectedIndex;
  sel.innerHTML=arr.map(function(t,i){return "<option value='"+i+"'>"+t+"</option>";}).join("");
  sel.selectedIndex=Math.min(cur,arr.length-1);
}

function getSelectedGreeting() {
  updateGreetingSelect();
  var sel=document.getElementById("pcgreeting");
  if(!sel)return"Herzliche Grüße von Burano";
  return sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:sel.options[0].text;
}

function updatePcPreview() { renderPC(true); }

function selectFmt(fmt) { activeFmt = fmt; }
function getFmtPhotos(fmt) { return getPhotos916(); }
function saveFmtPhotos(fmt, arr) { return savePhotos916(arr); }
function saveIslandPhotoToStrip(key, url) {
  var arr=[]; try{arr=JSON.parse(localStorage.getItem(key)||"[]");}catch(e){}
  arr.push(url); try{localStorage.setItem(key,JSON.stringify(arr));return true;}catch(e){return false;}
}

// INIT
window.addEventListener("load", function() {
  setTimeout(function() {
    ensureHeroSlides();
    // Pos-Buttons
    var pos=localStorage.getItem("bl_pc_pos")||"water";
    ["sky","middle","water"].forEach(function(p){
      var btn=document.getElementById("pcpos_"+p);if(!btn)return;
      if(p===pos){btn.style.background="var(--gold)";btn.style.color="#0A1628";btn.style.borderColor="var(--gold)";}
      else{btn.style.background="rgba(255,255,255,.06)";btn.style.color="#fff";btn.style.borderColor="rgba(255,255,255,.2)";}
    });
    renderFmtGallery();
    renderAdminPhotoList();
    buildPcThumbs();
    buildIslandStrip("mazz_strip","bl_mazz_photos");
    buildIslandStrip("torc_strip","bl_torc_photos");
  }, 500);
});
