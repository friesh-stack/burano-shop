// ═══════════════════════════════════════════════════
// format.js - Format-System fuer Burano Shop
// 4 Formate: 4:3 / 16:9 / 3:4 / 9:16
// Admin bestimmt Format beim Upload
// ═══════════════════════════════════════════════════

var FMTS = {
  "4:3":  {id:"f1", ar:"4/3",  w:720, h:540,  label:"Format 1 (4:3 Querformat)"},
  "16:9": {id:"f2", ar:"16/9", w:800, h:450,  label:"Format 2 (16:9 Breitbild)"},
  "3:4":  {id:"f3", ar:"3/4",  w:600, h:800,  label:"Format 3 (3:4 Hochformat)"},
  "9:16": {id:"f4", ar:"9/16", w:540, h:960,  label:"Format 4 (9:16 Stories)"}
};

var activeFmt = "4:3";

// ── localStorage Helfer ──
function getFmtPhotos(fmt) {
  try {
    return JSON.parse(localStorage.getItem("bl_fp_" + fmt.replace(/:/g,"")) || "[]");
  } catch(e) { return []; }
}
function saveFmtPhotos(fmt, arr) {
  try {
    localStorage.setItem("bl_fp_" + fmt.replace(/:/g,""), JSON.stringify(arr));
    return true;
  } catch(e) { return false; }
}

// ── Format waehlen (Admin-Buttons) ──
function selectFmt(fmt) {
  activeFmt = fmt;
  Object.keys(FMTS).forEach(function(f) {
    var btn = document.getElementById("fbtn_" + f.replace(/:/g,""));
    if (!btn) return;
    if (f === fmt) {
      btn.style.background   = "var(--gold)";
      btn.style.color        = "#0A1628";
      btn.style.borderColor  = "var(--gold)";
    } else {
      btn.style.background   = "rgba(255,255,255,.06)";
      btn.style.color        = "#fff";
      btn.style.borderColor  = "rgba(255,255,255,.2)";
    }
  });
  var info = document.getElementById("fmt_info");
  if (info) info.textContent = "Aktiv: " + (FMTS[fmt] ? FMTS[fmt].label : fmt);
  // Admin-Vorschau-Canvas anpassen
  var cv = document.getElementById("pc_admin_preview");
  var cfg = FMTS[fmt];
  if (cv && cfg) { cv.width = cfg.w; cv.height = cfg.h; }
}

// ── Bild auf Ziel-Format zuschneiden ──
function cropToRatio(src, tw, th, cb) {
  var img = new Image();
  img.onload = function() {
    var sw = img.width, sh = img.height;
    var tr = tw / th, sr = sw / sh;
    var cw, ch, cx, cy;
    if (sr > tr) {
      // Breiter als Ziel: seitlich beschneiden
      ch = sh; cw = Math.round(sh * tr);
      cx = Math.round((sw - cw) / 2); cy = 0;
    } else {
      // Hoeher als Ziel: oben/unten beschneiden (oben 1/3 behalten)
      cw = sw; ch = Math.round(sw / tr);
      cx = 0; cy = Math.round((sh - ch) / 3);
    }
    var cv = document.createElement("canvas");
    cv.width = tw; cv.height = th;
    cv.getContext("2d").drawImage(img, cx, cy, cw, ch, 0, 0, tw, th);
    cb(cv.toDataURL("image/jpeg", 0.88));
  };
  img.src = src;
}

// ── Foto hochladen (ueberschreibt loadPcPhotoFile) ──
function loadPcPhotoFile(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var raw = e.target.result;
    var cfg = FMTS[activeFmt] || FMTS["4:3"];
    cropToRatio(raw, cfg.w, cfg.h, function(cropped) {
      window.pcAdminImg = cropped;
      // Vorschau
      var prev = document.getElementById("pc_upload_preview");
      if (prev) {
        prev.innerHTML = "";
        var img = document.createElement("img");
        img.src = cropped;
        img.style.cssText = "max-width:100%;max-height:160px;border-radius:8px;display:block;margin:0 auto";
        prev.appendChild(img);
        var info = document.createElement("div");
        info.style.cssText = "font-size:.72rem;color:var(--gold);margin-top:6px;text-align:center;font-weight:700";
        info.textContent = cfg.label + " - bereit zum Speichern";
        prev.appendChild(info);
      }
      // Admin-Canvas anpassen
      var cv = document.getElementById("pc_admin_preview");
      if (cv) { cv.width = cfg.w; cv.height = cfg.h; cv.style.display = "block"; }
      var btn = document.getElementById("pc_save_btn");
      if (btn) btn.style.display = "block";
      // Vorschau aktualisieren falls Funktion vorhanden
      if (typeof updatePcPreview === "function") updatePcPreview();
    });
  };
  reader.readAsDataURL(file);
}

// ── Foto speichern ──
function savePcPhoto() {
  var img = window.pcAdminImg;
  if (!img) { alert("Bitte zuerst ein Foto hochladen."); return; }
  var arr = getFmtPhotos(activeFmt);
  arr.push(img);
  if (saveFmtPhotos(activeFmt, arr)) {
    alert("Gespeichert!\n" + (FMTS[activeFmt] ? FMTS[activeFmt].label : activeFmt) + "\nFoto " + arr.length + " in diesem Format.");
    window.pcAdminImg = null;
    var prev = document.getElementById("pc_upload_preview");
    if (prev) prev.innerHTML = "<div style='font-size:2rem'>&#128444;</div><div style='font-size:.85rem;opacity:.6'>Naechstes Foto hochladen</div>";
    var cv = document.getElementById("pc_admin_preview");
    if (cv) cv.style.display = "none";
    var btn = document.getElementById("pc_save_btn");
    if (btn) btn.style.display = "none";
    // Galerie und Liste neu rendern
    renderFmtGallery();
    renderAdminPhotoList();
  } else {
    alert("Speicherfehler - Foto zu gross?\nBitte JPG unter 400KB verwenden.");
  }
}

// ── Galerie rendern (4 Sektionen) ──
function renderFmtGallery() {
  Object.keys(FMTS).forEach(function(fmt) {
    var cfg  = FMTS[fmt];
    var grid = document.getElementById("ggrid_" + cfg.id);
    var sec  = document.getElementById("sec_"  + cfg.id);
    if (!grid) return;

    var photos = getFmtPhotos(fmt);
    var items  = [];

    // Standard-Fotos (aus photos.js) nur in 4:3
    if (fmt === "4:3" && typeof PHOTOS !== "undefined" && typeof GDEFS !== "undefined") {
      GDEFS.forEach(function(d) {
        items.push({src: PHOTOS[d.k] || "", lbl: d.l, isCustom: false});
      });
    }
    // Eigene hochgeladene Fotos
    photos.forEach(function(src, i) {
      items.push({src: src, lbl: "Foto " + (items.length + 1), idx: i, isCustom: true, fmt: fmt});
    });

    // Sektion ein-/ausblenden
    if (sec) sec.style.display = items.length ? "block" : "none";
    if (!items.length) { grid.innerHTML = ""; return; }

    // DOM aufbauen
    grid.innerHTML = "";
    items.forEach(function(item) {
      var div = document.createElement("div");
      div.className = "gi";
      div.style.cssText = "aspect-ratio:" + cfg.ar + ";position:relative;overflow:hidden;cursor:pointer";

      var img = document.createElement("img");
      img.src = item.src;
      img.loading = "lazy";
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
      div.appendChild(img);

      var lbl = document.createElement("div");
      lbl.className = "lbl";
      lbl.textContent = item.lbl;
      div.appendChild(lbl);

      // Klick oeffnet Kauf-Modal
      div.onclick = (function(l) { return function() {
        if (typeof openMdl === "function") openMdl(l, 0.99);
      }; })(item.lbl);

      // Drag & Drop fuer eigene Fotos
      if (item.isCustom) {
        var f2 = item.fmt, i2 = item.idx;
        div.draggable = true;
        div.ondragstart = function(e) {
          e.dataTransfer.setData("text/plain", f2 + "|" + i2);
          e.currentTarget.style.opacity = ".4";
        };
        div.ondragover  = function(e) {
          e.preventDefault();
          e.currentTarget.style.borderColor = "var(--gold)";
        };
        div.ondragleave = function(e) {
          e.currentTarget.style.borderColor = "transparent";
        };
        div.ondragend   = function(e) {
          e.currentTarget.style.opacity = "1";
        };
        div.ondrop = function(e) {
          e.preventDefault();
          e.currentTarget.style.borderColor = "transparent";
          var d   = e.dataTransfer.getData("text/plain").split("|");
          var sf  = d[0], si = parseInt(d[1]);
          if (sf === f2 && si !== i2) {
            var arr = getFmtPhotos(f2);
            var itm = arr.splice(si, 1)[0];
            arr.splice(i2, 0, itm);
            saveFmtPhotos(f2, arr);
            renderFmtGallery();
            renderAdminPhotoList();
          }
        };
      }
      grid.appendChild(div);
    });
  });
}

// ── Admin: Liste aller gespeicherten Fotos ──
function renderAdminPhotoList() {
  var el = document.getElementById("admin_photo_list");
  if (!el) return;
  var out = "";
  Object.keys(FMTS).forEach(function(fmt) {
    var arr = getFmtPhotos(fmt);
    var lbl = FMTS[fmt] ? FMTS[fmt].label : fmt;
    out += "<div style='margin-bottom:12px'>";
    out += "<b style='color:var(--gold);font-size:.78rem'>" + lbl + " (" + arr.length + " Fotos)</b><br>";
    if (!arr.length) {
      out += "<span style='opacity:.4;font-size:.75rem'>Noch keine Fotos</span>";
    }
    arr.forEach(function(src, i) {
      out += "<span style='display:inline-block;position:relative;margin:3px'>";
      out += "<img src='" + src + "' style='height:55px;border-radius:6px;vertical-align:top'>";
      out += "<button onclick=\"fmtDelPhoto('" + fmt + "'," + i + ")\" "
           + "style='position:absolute;top:-4px;right:-4px;background:#E53935;border:none;"
           + "border-radius:50%;width:18px;height:18px;color:#fff;font-size:.6rem;"
           + "cursor:pointer;line-height:18px;padding:0;font-weight:900'>x</button>";
      out += "</span>";
    });
    out += "</div>";
  });
  el.innerHTML = out;
}

// ── Foto loeschen ──
function fmtDelPhoto(fmt, idx) {
  if (!confirm("Foto loeschen?")) return;
  var arr = getFmtPhotos(fmt);
  arr.splice(idx, 1);
  saveFmtPhotos(fmt, arr);
  renderAdminPhotoList();
  renderFmtGallery();
}

// ── Beim Laden: Galerie rendern + Admin-Liste ──
window.addEventListener("load", function() {
  // Kurze Verzoegerung damit photos.js und der Haupt-Script geladen sind
  setTimeout(function() {
    renderFmtGallery();
    renderAdminPhotoList();
  }, 500);
});
