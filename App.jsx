import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Package, LayoutDashboard, Boxes, ClipboardList, AlertTriangle, Plus, Search, Trash2, Pencil, TrendingUp, ArrowDownRight, ArrowUpRight, X } from "lucide-react";

const seed = [
  { id: 1, sku: "WH-1042", name: "Kafe Espresso 1kg", category: "Kafe", stock: 142, min: 40, price: 14.5, currency: "EUR", sold: 380 },
  { id: 2, sku: "WH-1077", name: "Vaj Ulliri Ekstra i Virgjër 5L", category: "Ushqimore", stock: 18, min: 25, price: 39.0, currency: "EUR", sold: 122 },
  { id: 3, sku: "WH-1101", name: "Ujë Mineral 6 copë", category: "Pije", stock: 540, min: 120, price: 3.2, currency: "EUR", sold: 1480 },
  { id: 4, sku: "WH-1133", name: "Miell Tipi 00, 25kg", category: "Ushqimore", stock: 9, min: 15, price: 21.0, currency: "EUR", sold: 96 },
  { id: 5, sku: "WH-1188", name: "Gota Letre 250ml (1000)", category: "Furnizime", stock: 64, min: 30, price: 18.75, currency: "EUR", sold: 210 },
  { id: 6, sku: "WH-1204", name: "Salcë Domate 700g", category: "Ushqimore", stock: 230, min: 60, price: 1.9, currency: "EUR", sold: 640 },
  { id: 7, sku: "WH-1259", name: "Detergjent Industrial 10L", category: "Furnizime", stock: 4, min: 10, price: 27.4, currency: "EUR", sold: 58 },
  { id: 8, sku: "WH-1290", name: "Pije Energjike 250ml", category: "Pije", stock: 312, min: 100, price: 1.1, currency: "EUR", sold: 980 },
];

const seedOrders = [
  { id: "ORD-2041", customer: "Bar Alpina", items: 12, total: 286.4, status: "Dorëzuar", date: "8 Qer" },
  { id: "ORD-2042", customer: "Market Luna", items: 34, total: 912.0, status: "Në rrugë", date: "9 Qer" },
  { id: "ORD-2043", customer: "Hotel Adriatik", items: 8, total: 154.2, status: "Në pritje", date: "9 Qer" },
  { id: "ORD-2044", customer: "Restorant Vila", items: 21, total: 488.9, status: "Në pritje", date: "10 Qer" },
  { id: "ORD-2045", customer: "Cafe Tirana", items: 5, total: 92.5, status: "Dorëzuar", date: "10 Qer" },
];

const C = {
  ink: "#10211F", petrol: "#0E5B53", petrolDk: "#093F3A", paper: "#F4F6F5",
  card: "#FFFFFF", amber: "#D97A0B", red: "#C2402A", line: "#DEE5E3", mute: "#5E6E6B",
};

const fontHead = "'Archivo', 'Inter', system-ui, sans-serif";
const fontMono = "'IBM Plex Mono', ui-monospace, monospace";

function StockBar({ stock, min }) {
  const cap = Math.max(stock, min * 4, 1);
  const pct = Math.min(100, (stock / cap) * 100);
  const low = stock <= min;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 72, height: 6, background: "#E6ECEA", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: low ? C.red : stock <= min * 2 ? C.amber : C.petrol, borderRadius: 3, transition: "width .3s" }} />
      </div>
      <span style={{ fontFamily: fontMono, fontSize: 13, fontWeight: 600, color: low ? C.red : C.ink }}>{stock}</span>
    </div>
  );
}

function Chip({ children, tone }) {
  const tones = {
    ok: { bg: "#E3F0EC", fg: C.petrolDk }, warn: { bg: "#FBEFDB", fg: "#8A5005" },
    bad: { bg: "#FAE7E2", fg: C.red }, info: { bg: "#E8EDF6", fg: "#2C4A7C" },
  };
  const t = tones[tone] || tones.ok;
  return <span style={{ background: t.bg, color: t.fg, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>{children}</span>;
}

function Stat({ label, value, sub, up }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: C.mute }}>{label}</div>
      <div style={{ fontFamily: fontMono, fontSize: 28, fontWeight: 700, color: C.ink, margin: "6px 0 2px" }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, color: up === false ? C.red : C.petrol, display: "flex", alignItems: "center", gap: 4 }}>
          {up === false ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{sub}
        </div>
      )}
    </div>
  );
}

const emptyForm = { name: "", sku: "", category: "Ushqimore", stock: "", min: "", price: "", currency: "EUR" };
const emptyOrder = { customer: "", location: "", status: "Në pritje", lines: [] };
const TAB_TITLES = { dashboard: "Paneli", inventory: "Inventari", orders: "Porositë", alerts: "Njoftimet" };

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [cur, setCur] = useState("EUR");
  const RATE = 98; // 1 EUR ≈ 98 Lekë
  const toEUR = (v, c) => (c === "ALL" ? v / RATE : v);
  const fmt = (v, c = "EUR") => { const e = toEUR(v, c); return cur === "EUR" ? `€${e.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${Math.round(e * RATE).toLocaleString()} L`; };
  const fmt0 = (v, c = "EUR") => { const e = toEUR(v, c); return cur === "EUR" ? `€${e.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `${Math.round(e * RATE).toLocaleString()} L`; };

  const [products, setProducts] = useState(seed);
  const [orders, setOrders] = useState(seedOrders);
  const [live, setLive] = useState(false);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [orderModal, setOrderModal] = useState(false);
  const [oForm, setOForm] = useState(emptyOrder);
  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: p } = await supabase.from("products").select("*").order("id");
      const { data: o } = await supabase.from("orders").select("*").order("id");
      if (p) setProducts(p);
      if (o && o.length) setOrders(o);
      setLive(true);
    })();
  }, []);

  const lowStock = products.filter((p) => p.stock <= p.min);
  const totalValue = products.reduce((s, p) => s + p.stock * toEUR(p.price, p.currency || "EUR"), 0);
  const filtered = useMemo(
    () => products.filter((p) => (p.name + p.sku + p.category).toLowerCase().includes(q.toLowerCase())),
    [products, q]
  );
  const chartData = [...products].sort((a, b) => b.sold - a.sold).slice(0, 6).map((p) => ({ name: p.name.split(" ").slice(0, 2).join(" "), sold: p.sold }));

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit = (p) => { setForm({ ...p, stock: String(p.stock), min: String(p.min), price: String(p.price), currency: p.currency || "EUR" }); setEditId(p.id); setModal(true); };

  const save = async () => {
    if (!form.name || !form.sku) return;
    const rec = { name: form.name, sku: form.sku, category: form.category, stock: +form.stock || 0, min: +form.min || 0, price: +form.price || 0, currency: form.currency || "EUR" };
    if (supabase) {
      if (editId) {
        const { data } = await supabase.from("products").update(rec).eq("id", editId).select();
        if (data) setProducts(products.map((p) => (p.id === editId ? data[0] : p)));
      } else {
        const { data } = await supabase.from("products").insert({ ...rec, sold: 0 }).select();
        if (data) setProducts([...products, data[0]]);
      }
    } else {
      if (editId) setProducts(products.map((p) => (p.id === editId ? { ...p, ...rec } : p)));
      else setProducts([...products, { ...rec, id: Date.now(), sold: 0 }]);
    }
    setModal(false);
  };

  const remove = async (id) => {
    if (supabase) await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter((p) => p.id !== id));
  };

  const addLine = () => {
    const p = products.find((x) => String(x.id) === String(pickId));
    const qty = +pickQty || 1;
    if (!p || qty < 1) return;
    const exists = oForm.lines.find((l) => l.productId === p.id);
    const lines = exists
      ? oForm.lines.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + qty } : l))
      : [...oForm.lines, { productId: p.id, name: p.name, sku: p.sku, qty, price: p.price, currency: p.currency || "EUR" }];
    setOForm({ ...oForm, lines });
    setPickId(""); setPickQty("1");
  };

  const removeLine = (productId) => setOForm({ ...oForm, lines: oForm.lines.filter((l) => l.productId !== productId) });

  const orderTotalEUR = (lines) => lines.reduce((s, l) => s + toEUR(l.price, l.currency) * l.qty, 0);

  const saveOrder = async () => {
    if (!oForm.customer || oForm.lines.length === 0) return;
    const today = new Date();
    const months = ["Jan", "Shk", "Mar", "Pri", "Maj", "Qer", "Korr", "Gush", "Sht", "Tet", "Nën", "Dhj"];
    const rec = {
      id: "ORD-" + String(Date.now()).slice(-5),
      customer: oForm.customer,
      location: oForm.location,
      items: oForm.lines.reduce((s, l) => s + l.qty, 0),
      total: orderTotalEUR(oForm.lines),
      status: oForm.status,
      date: today.getDate() + " " + months[today.getMonth()],
      lines: oForm.lines,
    };
    if (supabase) await supabase.from("orders").insert(rec);
    // deduct stock
    const updated = products.map((p) => {
      const l = oForm.lines.find((x) => x.productId === p.id);
      return l ? { ...p, stock: Math.max(0, p.stock - l.qty), sold: (p.sold || 0) + l.qty } : p;
    });
    setProducts(updated);
    if (supabase) {
      for (const l of oForm.lines) {
        const p = updated.find((x) => x.id === l.productId);
        if (p) await supabase.from("products").update({ stock: p.stock, sold: p.sold }).eq("id", p.id);
      }
    }
    setOrders([...orders, rec]);
    setOForm(emptyOrder);
    setOrderModal(false);
  };

  const nav = [
    { id: "dashboard", label: "Paneli", icon: LayoutDashboard },
    { id: "inventory", label: "Inventari", icon: Boxes },
    { id: "orders", label: "Porositë", icon: ClipboardList },
    { id: "alerts", label: "Njoftimet", icon: AlertTriangle, badge: lowStock.length },
  ];

  const th = { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.mute, borderBottom: `1px solid ${C.line}` };
  const td = { padding: "12px 14px", borderBottom: `1px solid ${C.line}`, fontSize: 14, color: C.ink };
  const input = { width: "100%", padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const label = { display: "block", marginBottom: 12, fontSize: 13, fontWeight: 600, color: C.mute };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.paper, fontFamily: fontHead, color: C.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
        button{cursor:pointer;font-family:inherit} button:focus-visible,input:focus-visible{outline:2px solid ${C.petrol};outline-offset:2px}`}</style>

      {/* Sidebar */}
      <aside style={{ width: 220, background: C.petrolDk, color: "#DCE9E6", display: "flex", flexDirection: "column", padding: "22px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 24px" }}>
          <div style={{ background: "#fff", color: C.petrolDk, borderRadius: 10, width: 36, height: 36, display: "grid", placeItems: "center" }}><Package size={20} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>Magazina</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Sistemi i Inventarit</div>
          </div>
        </div>
        {nav.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 10, border: "none", marginBottom: 4, fontSize: 14, fontWeight: 600, textAlign: "left", background: tab === n.id ? "rgba(255,255,255,.14)" : "transparent", color: tab === n.id ? "#fff" : "#BFD3CF" }}>
            <n.icon size={17} /> {n.label}
            {n.badge ? <span style={{ marginLeft: "auto", background: C.amber, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "1px 7px" }}>{n.badge}</span> : null}
          </button>
        ))}
        <div style={{ marginTop: "auto", fontSize: 11, opacity: 0.55, padding: "0 8px" }}>
          Magazina A · Tiranë<br />
          <span style={{ color: live ? "#7FD4B8" : "#E0B36A" }}>{live ? "● Të dhënat ruhen (Supabase)" : "● Modaliteti demo — pa ruajtje"}</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "26px 30px", maxWidth: 1100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>{TAB_TITLES[tab]}</h1>
          <div style={{ marginLeft: "auto", position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: 11, color: C.mute }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko SKU, produkt, kategori…"
              style={{ ...input, width: 260, paddingLeft: 34, background: "#fff" }} />
          </div>
          <div role="group" aria-label="Monedha" style={{ display: "flex", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
            {["EUR", "ALL"].map((c) => (
              <button key={c} onClick={() => setCur(c)} style={{ border: "none", padding: "9px 14px", fontSize: 13, fontWeight: 700, background: cur === c ? C.petrol : "transparent", color: cur === c ? "#fff" : C.mute }}>
                {c === "EUR" ? "€" : "Lekë"}
              </button>
            ))}
          </div>
          <button onClick={() => (tab === "orders" ? setOrderModal(true) : openAdd())} style={{ background: C.petrol, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> {tab === "orders" ? "Shto porosi" : "Shto produkt"}
          </button>
        </div>

        {tab === "dashboard" && (
          <>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
              <Stat label="Vlera e stokut" value={fmt0(totalValue)} sub="+4.2% këtë javë" />
              <Stat label="Produkte" value={products.length} sub="2 shtuar këtë muaj" />
              <Stat label="Porosi të hapura" value={orders.filter((o) => o.status !== "Dorëzuar").length} sub="3 për sot" />
              <Stat label="Stok i ulët" value={lowStock.length} sub={lowStock.length ? "duhet riporosi" : "gjithçka në rregull"} up={lowStock.length === 0} />
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <TrendingUp size={16} color={C.petrol} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Më të shiturat — njësi të shitura (30 ditë)</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ left: -18 }}>
                  <CartesianGrid stroke={C.line} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.mute }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.mute, fontFamily: fontMono }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#EDF2F0" }} />
                  <Bar dataKey="sold" fill={C.petrol} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {lowStock.length > 0 && (
              <div style={{ background: "#FBF3E4", border: `1px solid #EBD9B4`, borderRadius: 14, padding: "14px 18px", display: "flex", gap: 10, alignItems: "center" }}>
                <AlertTriangle size={18} color={C.amber} />
                <span style={{ fontSize: 14 }}><b>{lowStock.length} produkte</b> janë nën pikën e riporosisë — shiko skedën Njoftimet.</span>
              </div>
            )}
          </>
        )}

        {(tab === "inventory" || tab === "alerts") && (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead><tr>
                <th style={th}>SKU</th><th style={th}>Produkti</th><th style={th}>Kategoria</th>
                <th style={th}>Stoku</th><th style={th}>Çmimi</th><th style={th}>Statusi</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {(tab === "alerts" ? lowStock : filtered).map((p) => (
                  <tr key={p.id}>
                    <td style={{ ...td, fontFamily: fontMono, fontSize: 13, color: C.mute }}>{p.sku}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                    <td style={td}>{p.category}</td>
                    <td style={td}><StockBar stock={p.stock} min={p.min} /></td>
                    <td style={{ ...td, fontFamily: fontMono }}>{fmt(p.price, p.currency || "EUR")}</td>
                    <td style={td}>{p.stock <= p.min ? <Chip tone="bad">Riporosit</Chip> : p.stock <= p.min * 2 ? <Chip tone="warn">I ulët</Chip> : <Chip tone="ok">Në stok</Chip>}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button onClick={() => openEdit(p)} style={{ background: "none", border: "none", color: C.mute, padding: 6 }} aria-label="Ndrysho"><Pencil size={15} /></button>
                      <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: C.red, padding: 6 }} aria-label="Fshi"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
                {(tab === "alerts" ? lowStock : filtered).length === 0 && (
                  <tr><td style={{ ...td, textAlign: "center", padding: 40, color: C.mute }} colSpan={7}>
                    {tab === "alerts" ? "Asnjë produkt me stok të ulët — gjithçka është mbi pikën e riporosisë." : "Asnjë produkt nuk përputhet me kërkimin. Shto një me butonin lart."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "orders" && (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead><tr><th style={th}>Porosia</th><th style={th}>Klienti</th><th style={th}>Vendndodhja</th><th style={th}>Artikuj</th><th style={th}>Totali</th><th style={th}>Data</th><th style={th}>Statusi</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} onClick={() => setInvoice(o)} style={{ cursor: "pointer" }} title="Kliko për faturën">
                    <td style={{ ...td, fontFamily: fontMono, fontSize: 13 }}>{o.id}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{o.customer}</td>
                    <td style={td}>{o.location || "—"}</td>
                    <td style={{ ...td, fontFamily: fontMono }}>{o.items}</td>
                    <td style={{ ...td, fontFamily: fontMono }}>{fmt(o.total)}</td>
                    <td style={td}>{o.date}</td>
                    <td style={td}>{o.status === "Dorëzuar" ? <Chip tone="ok">Dorëzuar</Chip> : o.status === "Në rrugë" ? <Chip tone="info">Në rrugë</Chip> : <Chip tone="warn">Në pritje</Chip>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Product modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(9,30,27,.45)", display: "grid", placeItems: "center", zIndex: 50 }} onClick={() => setModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, width: 380, maxWidth: "92vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editId ? "Ndrysho produktin" : "Shto produkt"}</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: C.mute }} aria-label="Mbyll"><X size={18} /></button>
            </div>
            {[["name", "Emri i produktit"], ["sku", "SKU"], ["category", "Kategoria"], ["stock", "Sasia në stok"], ["min", "Pika e riporosisë"]].map(([k, l]) => (
              <label key={k} style={label}>
                {l}
                <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  type={["stock", "min"].includes(k) ? "number" : "text"} style={{ ...input, marginTop: 5 }} />
              </label>
            ))}
            <label style={label}>
              Çmimi për njësi
              <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" style={{ ...input, flex: 1 }} />
                <div role="group" aria-label="Monedha e çmimit" style={{ display: "flex", border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
                  {["EUR", "ALL"].map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, currency: c })}
                      style={{ border: "none", padding: "0 14px", fontSize: 13, fontWeight: 700, background: form.currency === c ? C.petrol : "#fff", color: form.currency === c ? "#fff" : C.mute }}>
                      {c === "EUR" ? "€" : "Lekë"}
                    </button>
                  ))}
                </div>
              </div>
            </label>
            <button onClick={save} style={{ width: "100%", background: C.petrol, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 700, marginTop: 4 }}>
              {editId ? "Ruaj ndryshimet" : "Shto produkt"}
            </button>
          </div>
        </div>
      )}

      {/* Order modal */}
      {orderModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(9,30,27,.45)", display: "grid", placeItems: "center", zIndex: 50 }} onClick={() => setOrderModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, width: 380, maxWidth: "92vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Shto porosi</h2>
              <button onClick={() => setOrderModal(false)} style={{ background: "none", border: "none", color: C.mute }} aria-label="Mbyll"><X size={18} /></button>
            </div>
            <label style={label}>
              Klienti
              <input value={oForm.customer} onChange={(e) => setOForm({ ...oForm, customer: e.target.value })} style={{ ...input, marginTop: 5 }} />
            </label>
            <label style={label}>
              Vendndodhja
              <input value={oForm.location} onChange={(e) => setOForm({ ...oForm, location: e.target.value })} placeholder="p.sh. Rruga e Durrësit 12, Tiranë" style={{ ...input, marginTop: 5 }} />
            </label>
            <label style={label}>
              Shto produkte
              <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                <select value={pickId} onChange={(e) => setPickId(e.target.value)} style={{ ...input, flex: 1 }}>
                  <option value="">Zgjidh produktin…</option>
                  {products.filter((p) => p.stock > 0).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.stock} në stok)</option>
                  ))}
                </select>
                <input value={pickQty} onChange={(e) => setPickQty(e.target.value)} type="number" min="1" style={{ ...input, width: 64 }} aria-label="Sasia" />
                <button type="button" onClick={addLine} style={{ background: C.petrol, color: "#fff", border: "none", borderRadius: 10, padding: "0 14px", fontWeight: 700 }}>+</button>
              </div>
            </label>
            {oForm.lines.length > 0 && (
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
                {oForm.lines.map((l) => (
                  <div key={l.productId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
                    <span style={{ flex: 1, fontWeight: 600 }}>{l.name}</span>
                    <span style={{ fontFamily: fontMono }}>{l.qty} × {fmt(l.price, l.currency)}</span>
                    <button type="button" onClick={() => removeLine(l.productId)} style={{ background: "none", border: "none", color: C.red, padding: 2 }} aria-label="Hiq"><X size={14} /></button>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", fontWeight: 800, fontSize: 14 }}>
                  <span>Totali</span>
                  <span style={{ fontFamily: fontMono }}>{fmt(orderTotalEUR(oForm.lines))}</span>
                </div>
              </div>
            )}
            <label style={label}>
              Statusi
              <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                {["Në pritje", "Në rrugë", "Dorëzuar"].map((s) => (
                  <button key={s} type="button" onClick={() => setOForm({ ...oForm, status: s })}
                    style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 0", fontSize: 13, fontWeight: 700, background: oForm.status === s ? C.petrol : "#fff", color: oForm.status === s ? "#fff" : C.mute }}>
                    {s}
                  </button>
                ))}
              </div>
            </label>
            <button onClick={saveOrder} style={{ width: "100%", background: C.petrol, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 700, marginTop: 4 }}>
              Shto porosi
            </button>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {invoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(9,30,27,.45)", display: "grid", placeItems: "center", zIndex: 60 }} onClick={() => setInvoice(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440, maxWidth: "94vw", maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Faturë</h2>
                <div style={{ fontFamily: fontMono, fontSize: 13, color: C.mute }}>{invoice.id} · {invoice.date}</div>
              </div>
              <button onClick={() => setInvoice(null)} style={{ background: "none", border: "none", color: C.mute }} aria-label="Mbyll"><X size={18} /></button>
            </div>
            <div style={{ fontSize: 14, marginBottom: 14 }}>
              <b>{invoice.customer}</b>
              {invoice.location ? <div style={{ color: C.mute }}>{invoice.location}</div> : null}
              <div style={{ marginTop: 4 }}>{invoice.status === "Dorëzuar" ? <Chip tone="ok">Dorëzuar</Chip> : invoice.status === "Në rrugë" ? <Chip tone="info">Në rrugë</Chip> : <Chip tone="warn">Në pritje</Chip>}</div>
            </div>
            {invoice.lines && invoice.lines.length > 0 ? (
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ display: "flex", padding: "8px 12px", background: C.paper, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.mute }}>
                  <span style={{ flex: 1 }}>Produkti</span><span style={{ width: 110, textAlign: "right" }}>Sasia × Çmimi</span><span style={{ width: 90, textAlign: "right" }}>Shuma</span>
                </div>
                {invoice.lines.map((l) => (
                  <div key={l.productId} style={{ display: "flex", padding: "9px 12px", borderTop: `1px solid ${C.line}`, fontSize: 13 }}>
                    <span style={{ flex: 1, fontWeight: 600 }}>{l.name}</span>
                    <span style={{ width: 110, textAlign: "right", fontFamily: fontMono }}>{l.qty} × {fmt(l.price, l.currency)}</span>
                    <span style={{ width: 90, textAlign: "right", fontFamily: fontMono }}>{fmt(toEUR(l.price, l.currency) * l.qty)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.mute, marginBottom: 14 }}>Kjo porosi nuk ka artikuj të detajuar ({invoice.items} artikuj gjithsej).</div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 800, marginBottom: 16 }}>
              <span>Totali</span>
              <span style={{ fontFamily: fontMono }}>{fmt(invoice.total)}</span>
            </div>
            <button onClick={() => window.print()} style={{ width: "100%", background: C.petrol, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 700 }}>
              Printo faturën
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
