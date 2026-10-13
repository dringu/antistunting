(function () {
  var LN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  var COL = ["--c0","--c1","--c2","--c3","--c4"], BATAS = [15,30,60,100], LAB = ["kurang dari 15","15–29","30–59","60–99","100 atau lebih"];
  var GEO, DATA = {}, BLN = [], cur, sel = null, proj;
  var $ = function (id) { return document.getElementById(id); }, NS = "http://www.w3.org/2000/svg";
  function nama(b) { return LN[+b.slice(5) - 1] + " " + b.slice(0, 4); }
  function nice(s) { return s.charAt(0) + s.slice(1).toLowerCase().replace("opo-opo", "Opo-Opo"); }
  function kls(n) { var i = 0; while (i < BATAS.length && n >= BATAS[i]) i++; return i; }
  function val(n) { var v = DATA[cur].desa[n]; return v ? v.total : null; }
  function el(tag, attrs, txt) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function buatProyeksi() {
    var xs = [], ys = [];
    GEO.features.forEach(function (f) { f.geometry.coordinates.forEach(function (r) { r.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); }); });
    var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys), k = Math.cos((y0 + y1) / 2 * Math.PI / 180);
    var W = (x1 - x0) * k, H = y1 - y0, S = Math.min(380 / W, 380 / H), ox = (400 - W * S) / 2, oy = (400 - H * S) / 2;
    proj = function (p) { return [ox + (p[0] - x0) * k * S, oy + (y1 - p[1]) * S]; };
  }
  function d(f) { return f.geometry.coordinates.map(function (r) { return "M" + r.map(function (p) { var q = proj(p); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join("L") + "Z"; }).join(""); }
  function titik(f) { var r = f.geometry.coordinates[0], s = [0, 0]; r.forEach(function (p) { s[0] += p[0]; s[1] += p[1]; }); return proj([s[0] / r.length, s[1] / r.length]); }
  function kartu() {
    var D = DATA[cur].kecamatan, i = BLN.indexOf(cur), prev = i > 0 ? DATA[BLN[i - 1]].kecamatan : null, box = $("kartu"); box.textContent = "";
    function k(l, n, s) { var t = h("div", "kt"); t.appendChild(h("div", "l", l)); t.appendChild(h("div", "n", n)); t.appendChild(h("div", "s", s)); box.appendChild(t); }
    var sel = prev ? D.total - prev.total : null;
    k("Anak stunting tercatat", String(D.total), prev ? (sel === 0 ? "sama dengan bulan lalu" : (sel > 0 ? "naik " : "turun ") + Math.abs(sel) + " dari bulan lalu") : nama(cur));
    k("Sangat pendek", D.sangat_pendek == null ? "<5" : String(D.sangat_pendek), "anak dengan z-score di bawah -3");
    k("Laki-laki / perempuan", (D.jk.L == null ? "<5" : D.jk.L) + " / " + (D.jk.P == null ? "<5" : D.jk.P), "jumlah anak");
  }
  function gambar() {
    var m = $("m"); m.textContent = "";
    GEO.features.forEach(function (f) { var n = f.properties.desa, v = val(n), p = el("path", { "class": "p" + (sel === n ? " on" : ""), "data-d": n, d: d(f), fill: v == null ? "var(--line)" : "var(" + COL[kls(v)] + ")" }); p.appendChild(el("title", {}, nice(n))); m.appendChild(p); });
    GEO.features.forEach(function (f) { var n = f.properties.desa, v = val(n), c = titik(f); m.appendChild(el("text", { "class": "lb", x: c[0].toFixed(1), y: (c[1] + 2.5).toFixed(1) }, v == null ? "<5" : String(v))); });
    var rows = GEO.features.map(function (f) { return f.properties.desa; }).sort(function (a, b) { return (val(b) || 0) - (val(a) || 0); });
    var mx = Math.max.apply(0, rows.map(function (n) { return val(n) || 0; })) || 1, r = $("r"); r.textContent = "";
    rows.forEach(function (n) { var v = val(n), b = h("button", sel === n ? "on" : ""); b.setAttribute("data-d", n); b.appendChild(h("span", "", nice(n))); b.appendChild(h("b", "", v == null ? "<5" : String(v)));
      var bt = h("span", "bt"); bt.style.width = "calc(" + ((v || 0) / mx * 100).toFixed(0) + "% - 24px)"; b.appendChild(bt); r.appendChild(b); });
    var t = $("tip");
    if (sel) { var x = DATA[cur].desa[sel], sp = x.sangat_pendek; t.textContent = nice(sel) + " · " + nama(cur) + ": " + (x.total == null ? "kurang dari 5 anak" : x.total + " anak stunting, " + (sp == null ? "kurang dari 5" : sp) + " di antaranya sangat pendek") + ". ";
      var a = h("a", "", "Buka rapor desa"); a.href = "rapor.html?desa=" + encodeURIComponent(sel) + "&bulan=" + cur; a.style.fontWeight = "700"; a.style.color = "var(--btn)"; t.appendChild(a); }
    else t.textContent = "Pilih desa di peta atau daftar.";
    kartu(); tren();
  }
  function tren() {
    var sv = $("tr"); sv.textContent = ""; $("trj").textContent = sel ? nice(sel) : "Seluruh kecamatan";
    var A = BLN.map(function (b) { var x = sel ? DATA[b].desa[sel] : DATA[b].kecamatan; return x ? x.total : null; });
    var S = BLN.map(function (b) { var x = sel ? DATA[b].desa[sel] : DATA[b].kecamatan; return x ? x.sangat_pendek : null; });
    var mx = Math.ceil((Math.max.apply(0, A.concat(S).filter(function (v) { return v != null; }).concat([1]))) * 1.15), L = 40, R = 385, T = 18, Bm = 168, n = BLN.length;
    function X(i) { return n === 1 ? (L + R) / 2 : L + (R - L) * i / (n - 1); } function Y(v) { return Bm - (Bm - T) * v / mx; }
    [0, mx / 2, mx].forEach(function (g) { sv.appendChild(el("line", { x1: L, x2: R, y1: Y(g), y2: Y(g), stroke: "var(--line)" })); sv.appendChild(el("text", { x: L - 6, y: Y(g) + 3, "text-anchor": "end", "font-size": 9, fill: "var(--mut)" }, String(Math.round(g)))); });
    function seri(v, col, dash, lab) {
      var dd = "", pen = false; v.forEach(function (y, i) { if (y == null) { pen = false; return; } dd += (pen ? "L" : "M") + X(i).toFixed(1) + "," + Y(y).toFixed(1); pen = true; });
      var p = el("path", { d: dd, fill: "none", stroke: col, "stroke-width": 2.5 }); if (dash) p.setAttribute("stroke-dasharray", "6 4"); sv.appendChild(p);
      v.forEach(function (y, i) { if (y == null) return; sv.appendChild(el("circle", { cx: X(i), cy: Y(y), r: 3.5, fill: col })); if (lab) sv.appendChild(el("text", { x: X(i), y: Y(y) - 8, "text-anchor": "middle", "font-size": 10, "font-weight": 700, fill: "var(--ink)" }, String(y))); });
    }
    seri(A, "var(--acc)", false, true); seri(S, "var(--btn)", true, false);
    BLN.forEach(function (b, i) { sv.appendChild(el("text", { x: X(i), y: 188, "text-anchor": "middle", "font-size": 10, fill: "var(--mut)" }, LN[+b.slice(5) - 1].slice(0, 3))); });
    if (A.some(function (v) { return v == null; })) sv.appendChild(el("text", { x: R, y: 10, "text-anchor": "end", "font-size": 9, fill: "var(--mut)" }, "titik kosong = kurang dari 5 anak"));
  }
  function pasang() {
    buatProyeksi(); var bar = $("bln");
    BLN.forEach(function (b) { var x = h("button", "", nama(b)); x.setAttribute("data-b", b); x.setAttribute("aria-pressed", b === cur); bar.appendChild(x); });
    LAB.forEach(function (t, i) { var s = h("span"), c = h("i"); c.style.background = "var(" + COL[i] + ")"; s.appendChild(c); s.appendChild(document.createTextNode(t)); $("lg").appendChild(s); });
    var s = h("span"), c = h("i"); c.style.background = "var(--line)"; s.appendChild(c); s.appendChild(document.createTextNode("<5 (disembunyikan)")); $("lg").appendChild(s);
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-b]"); if (b) { cur = b.dataset.b; document.querySelectorAll("[data-b]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); gambar(); return; }
      var z = e.target.closest("[data-d]"); if (z) { sel = sel === z.dataset.d ? null : z.dataset.d; gambar(); }
    });
    $("upd").textContent = "Data terbaru: " + nama(cur) + "."; gambar();
  }
  function muat(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  Promise.all([muat("geo/desa.geojson"), muat("data/index.json")]).then(function (a) {
    GEO = a[0]; BLN = a[1].bulan; cur = a[1].terbaru;
    return Promise.all(BLN.map(function (b) { return muat("data/" + b + ".json").then(function (j) { DATA[b] = j; }); }));
  }).then(pasang).catch(function () { $("galat").hidden = false; });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
})();
