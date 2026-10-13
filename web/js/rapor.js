(function () {
  var LN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"], NS = "http://www.w3.org/2000/svg";
  var $ = function (i) { return document.getElementById(i); }, GEO, DATA = {}, BLN = [], proj;
  function nama(b) { return LN[+b.slice(5) - 1] + " " + b.slice(0, 4); }
  function nice(s) { return s.charAt(0) + s.slice(1).toLowerCase().replace("opo-opo", "Opo-Opo"); }
  function el(t, a, x) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (x != null) e.textContent = x; return e; }
  function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function proyeksi() {
    var xs = [], ys = []; GEO.features.forEach(function (f) { f.geometry.coordinates.forEach(function (r) { r.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); }); });
    var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys), k = Math.cos((y0 + y1) / 2 * Math.PI / 180);
    var W = (x1 - x0) * k, H = y1 - y0, S = Math.min(380 / W, 380 / H), ox = (400 - W * S) / 2, oy = (400 - H * S) / 2;
    proj = function (p) { return [ox + (p[0] - x0) * k * S, oy + (y1 - p[1]) * S]; };
  }
  function dpath(f) { return f.geometry.coordinates.map(function (r) { return "M" + r.map(function (p) { var q = proj(p); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join("L") + "Z"; }).join(""); }
  function peta(desa) {
    var m = $("rm"); m.textContent = "";
    GEO.features.forEach(function (f) { if (f.properties.desa !== desa) m.appendChild(el("path", { d: dpath(f), fill: "#F1EEE4", stroke: "#B9B3A2", "stroke-width": .8 })); });
    GEO.features.forEach(function (f) { if (f.properties.desa === desa) { m.appendChild(el("path", { d: dpath(f), fill: "#B4531F", stroke: "#17251F", "stroke-width": 1.6 })); } });
  }
  function tren(desa) {
    var sv = $("rt"); sv.textContent = "";
    var A = BLN.map(function (b) { var x = DATA[b].desa[desa]; return x ? x.total : null; }), S = BLN.map(function (b) { var x = DATA[b].desa[desa]; return x ? x.sangat_pendek : null; });
    var mx = Math.ceil(Math.max.apply(0, A.concat(S).filter(function (v) { return v != null; }).concat([1])) * 1.15), L = 40, R = 385, T = 18, Bm = 168, n = BLN.length;
    function X(i) { return n === 1 ? (L + R) / 2 : L + (R - L) * i / (n - 1); } function Y(v) { return Bm - (Bm - T) * v / mx; }
    [0, mx / 2, mx].forEach(function (g) { sv.appendChild(el("line", { x1: L, x2: R, y1: Y(g), y2: Y(g), stroke: "#D9D4C6" })); sv.appendChild(el("text", { x: L - 6, y: Y(g) + 3, "text-anchor": "end", "font-size": 9, fill: "#5B665F" }, String(Math.round(g)))); });
    function seri(v, col, dash, lab) {
      var d = "", pen = false; v.forEach(function (y, i) { if (y == null) { pen = false; return; } d += (pen ? "L" : "M") + X(i).toFixed(1) + "," + Y(y).toFixed(1); pen = true; });
      var p = el("path", { d: d, fill: "none", stroke: col, "stroke-width": 2.5 }); if (dash) p.setAttribute("stroke-dasharray", "6 4"); sv.appendChild(p);
      v.forEach(function (y, i) { if (y == null) return; sv.appendChild(el("circle", { cx: X(i), cy: Y(y), r: 3.5, fill: col })); if (lab) sv.appendChild(el("text", { x: X(i), y: Y(y) - 8, "text-anchor": "middle", "font-size": 10, "font-weight": 700, fill: "#17251F" }, String(y))); });
    }
    seri(A, "#B4531F", false, true); seri(S, "#0E5A4B", true, false);
    BLN.forEach(function (b, i) { sv.appendChild(el("text", { x: X(i), y: 188, "text-anchor": "middle", "font-size": 10, fill: "#5B665F" }, LN[+b.slice(5) - 1].slice(0, 3))); });
    if (A.some(function (v) { return v == null; })) sv.appendChild(el("text", { x: R, y: 10, "text-anchor": "end", "font-size": 9, fill: "#5B665F" }, "titik kosong = kurang dari 5 anak"));
  }
  function render() {
    var desa = $("sd").value, bln = $("sb").value, D = DATA[bln].desa[desa] || { total: null, sangat_pendek: null }, i = BLN.indexOf(bln), P = i > 0 ? (DATA[BLN[i - 1]].desa[desa] || { total: null }) : null, K = DATA[bln].kecamatan;
    $("rj").textContent = "Rapor Gizi Balita Desa " + nice(desa); $("rb").textContent = "Data bulan " + nama(bln);
    var kt = $("rk"); kt.textContent = "";
    function k(l, n, s) { var t = h("div", "kt"); t.appendChild(h("div", "l", l)); t.appendChild(h("div", "n", n)); t.appendChild(h("div", "s", s)); kt.appendChild(t); }
    var sel = (D.total != null && P && P.total != null) ? D.total - P.total : null;
    k("Anak stunting tercatat", D.total == null ? "<5" : String(D.total), nama(bln));
    k("Sangat pendek", D.sangat_pendek == null ? "<5" : String(D.sangat_pendek), "z-score di bawah -3");
    k("Dari bulan lalu", sel == null ? "–" : (sel > 0 ? "+" : sel < 0 ? "−" : "") + Math.abs(sel), sel == null ? "tidak tersedia" : sel === 0 ? "sama" : sel > 0 ? "anak bertambah" : "anak berkurang");
    k("Bagian dari kecamatan", D.total == null ? "–" : Math.round(D.total / K.total * 100) + "%", "dari " + K.total + " anak se-kecamatan");
    var t = []; var d1 = nice(desa);
    if (D.total == null) t.push("Pada " + nama(bln) + " tercatat kurang dari 5 anak stunting di Desa " + d1 + ". Jumlah pastinya tidak ditampilkan untuk melindungi privasi anak.");
    else {
      t.push("Pada " + nama(bln) + " tercatat " + D.total + " anak dengan tinggi badan pendek atau sangat pendek di Desa " + d1 + (D.sangat_pendek == null ? "." : ", " + D.sangat_pendek + " di antaranya sangat pendek."));
      if (sel != null) t.push("Bulan lalu tercatat " + P.total + " anak, sehingga jumlahnya " + (sel === 0 ? "tidak berubah." : (sel > 0 ? "bertambah " : "berkurang ") + Math.abs(sel) + " anak."));
      t.push("Desa ini mencakup " + Math.round(D.total / K.total * 100) + "% dari " + K.total + " anak stunting yang tercatat di Kecamatan Krejengan.");
    }
    t.push("Angka ini adalah jumlah anak, bukan persentase, sehingga belum dapat dibandingkan langsung dengan desa lain yang jumlah balitanya berbeda. Anak yang tidak muncul pada bulan berikutnya belum tentu membaik, karena bisa saja tidak ditimbang atau sudah berusia 5 tahun.");
    $("rn").textContent = t.join(" ");
    peta(desa); tren(desa); $("tgl").textContent = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    var u = new URL(location.href); u.searchParams.set("desa", desa); u.searchParams.set("bulan", bln); history.replaceState(null, "", u);
    document.title = "Rapor " + nice(desa) + " " + nama(bln);
  }
  function muat(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  Promise.all([muat("geo/desa.geojson"), muat("data/index.json")]).then(function (a) {
    GEO = a[0]; BLN = a[1].bulan;
    return Promise.all(BLN.map(function (b) { return muat("data/" + b + ".json").then(function (j) { DATA[b] = j; }); }));
  }).then(function () {
    proyeksi(); var q = new URLSearchParams(location.search), ds = GEO.features.map(function (f) { return f.properties.desa; }).sort();
    ds.forEach(function (n) { var o = h("option", "", nice(n)); o.value = n; $("sd").appendChild(o); });
    BLN.forEach(function (b) { var o = h("option", "", nama(b)); o.value = b; $("sb").appendChild(o); });
    $("sd").value = ds.indexOf(q.get("desa")) >= 0 ? q.get("desa") : ds[0]; $("sb").value = BLN.indexOf(q.get("bulan")) >= 0 ? q.get("bulan") : BLN[BLN.length - 1];
    $("sd").onchange = $("sb").onchange = render; $("cetak").onclick = function () { window.print(); };
    $("sheet").hidden = false; render();
  }).catch(function () { $("galat").hidden = false; });
})();
