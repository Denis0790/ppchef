"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  adminGetRecipes, adminDeleteRecipe, adminPublishRecipe,
  adminUnpublishRecipe, adminGetRecipe, adminUpdateRecipe,
  adminCreateRecipe, getMe, RecipeAdmin, RecipeCreateData,
  getAdminStats, AdminStats,
} from "@/lib/api";

const CATEGORIES = [
  { key: "breakfast", label: "Завтрак", emoji: "🌅" },
  { key: "lunch", label: "Обед", emoji: "☀️" },
  { key: "dinner", label: "Ужин", emoji: "🌙" },
  { key: "snack", label: "Перекус", emoji: "🍵" },
  { key: "dessert", label: "Десерт", emoji: "🍰" },
  { key: "soup", label: "Суп", emoji: "🍲" },
  { key: "salad", label: "Салат", emoji: "🥗" },
  { key: "smoothie", label: "Смузи", emoji: "🥤" },
];

const CAT_EMOJI: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.key, c.emoji]));
const CAT_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.key, c.label]));

type Tab = "funnel" | "published" | "suggest";

const EMPTY_FORM: RecipeCreateData = {
  title: "", category: "breakfast", status: "draft",
  calories: null, protein: null, fat: null, carbs: null,
  cook_time_minutes: null, servings: null,
  benefit: null, nutritionist_tips: null, vitamins: null,
  image_url: null, author_credit: null,
  tags: [], ingredients: [], steps: [],
};

const css = `
:root{--bg:#F5F0E8;--bg2:#EDE8DE;--white:#fff;--marsh:#7A9E7E;--marsh-d:#4F7453;--marsh-l:#B8D4BA;--marsh-pale:#E4EFE4;--text:#333333;--muted:#888880;--gold:#C4975A;--red:#E07070;--red-l:#FDEAEA;--blue:#6B8FCC;--blue-l:#E4ECFB;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);}
.a-item-hover:hover{background:var(--bg);color:var(--text);}
.btn-hover:hover{opacity:.88;transform:translateY(-1px);}
.rrow-hover:hover{background:#F5F0E8;}
.act-eye:hover svg{animation:eyeBlink .3s ease;}
.act-del:hover svg{animation:trashShake .3s ease;}
.act-edit:hover svg{animation:penWrite .4s ease;}
.act-pub:hover svg{animation:upBounce .35s ease;}
@keyframes eyeBlink{50%{transform:scaleY(0.2);}}
@keyframes trashShake{0%,100%{transform:rotate(0);}25%{transform:rotate(-8deg);}75%{transform:rotate(8deg);}}
@keyframes penWrite{0%{transform:translate(0,0);}25%{transform:translate(1px,-1px);}75%{transform:translate(-1px,1px);}100%{transform:translate(0,0);}}
@keyframes upBounce{0%{transform:translateY(0);}40%{transform:translateY(-3px);}70%{transform:translateY(1px);}100%{transform:translateY(0);}}
.modal-enter{animation:modalIn .25s ease;}
@keyframes modalIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
.add-ing:hover{background:#E4EFE4;}
input:focus,select:focus,textarea:focus{border-color:#7A9E7E!important;background:#fff!important;}
`;

const IcoFilter = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17,stroke:"currentColor"}}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IcoBook = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17,stroke:"currentColor"}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IcoUsers = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17,stroke:"currentColor"}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoGear = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17,stroke:"currentColor"}}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IcoSearch = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,stroke:"#888880",position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoEye = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,stroke:"currentColor"}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoEdit = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,stroke:"currentColor"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoPub = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,stroke:"currentColor"}}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const IcoTrash = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,stroke:"currentColor"}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IcoPlus = () => <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" style={{width:15,height:15,stroke:"currentColor"}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, letterSpacing: ".8px", textTransform: "uppercase" as const, color: "#888880", fontWeight: 500, marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { token, isReady, isLoggedIn } = useAuth();

  const [tab, setTab] = useState<Tab>("funnel");
  const [recipes, setRecipes] = useState<RecipeAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecipeCreateData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isLoggedIn || !token) { router.push("/"); return; }
    getMe(token).then(user => {
      if (!user.is_superuser) router.push("/");
    }).catch(() => router.push("/"));
  }, [isReady, isLoggedIn, token, router]);

  useEffect(() => {
    if (!token) return;
    getAdminStats(token).then(setStats).catch(() => {});
    const interval = setInterval(() => {
      getAdminStats(token).then(setStats).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const statusForTab = (t: Tab) => {
    if (t === "funnel") return "draft";
    if (t === "published") return "published";
    if (t === "suggest") return "suggested";
    return "";
  };

  const loadRecipes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminGetRecipes(token, {
        search, category: categoryFilter,
        status: statusForTab(tab),
        page, page_size: 15,
      });
      setRecipes(data.items as RecipeAdmin[]);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [token, search, categoryFilter, tab, page]);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  async function openEdit(id: string) {
    if (!token) return;
    const r = await adminGetRecipe(token, id);
    setForm({
      title: r.title, category: r.category, status: r.status,
      calories: r.calories, protein: r.protein, fat: r.fat, carbs: r.carbs,
      cook_time_minutes: r.cook_time_minutes, servings: r.servings,
      benefit: r.benefit, nutritionist_tips: r.nutritionist_tips, vitamins: r.vitamins,
      image_url: r.image_url, author_credit: r.author_credit,
      tags: r.tags.map(t => t.name),
      ingredients: r.ingredients.map(i => ({ name: i.name, amount: i.amount })),
      steps: r.steps.map(s => ({ step_number: s.step_number, text: s.text, image_url: s.image_url })),
    });
    setEditingId(id);
    setModal(true);
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModal(true);
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      if (editingId) {
        await adminUpdateRecipe(token, editingId, form);
        showToast("✅ Рецепт сохранён");
      } else {
        await adminCreateRecipe(token, form);
        showToast("✅ Рецепт создан");
      }
      setModal(false);
      loadRecipes();
    } catch (e: unknown) {
      showToast("❌ " + (e instanceof Error ? e.message : "Ошибка"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndPublish() {
    if (!token) return;
    setSaving(true);
    try {
      let id = editingId;
      if (id) {
        await adminUpdateRecipe(token, id, { ...form, status: "published" });
      } else {
        const r = await adminCreateRecipe(token, { ...form, status: "draft" });
        id = r.id;
      }
      if (id) await adminPublishRecipe(token, id);
      showToast("✅ Опубликовано!");
      setModal(false);
      loadRecipes();
    } catch (e: unknown) {
      showToast("❌ " + (e instanceof Error ? e.message : "Ошибка"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Удалить "${title}"?`)) return;
    await adminDeleteRecipe(token!, id);
    showToast("🗑 Удалено");
    loadRecipes();
  }

  async function handlePublishToggle(id: string, isPublished: boolean) {
    if (isPublished) {
      await adminUnpublishRecipe(token!, id);
      showToast("⏸ Снято с публикации");
    } else {
      await adminPublishRecipe(token!, id);
      showToast("✅ Опубликовано");
    }
    loadRecipes();
  }

  const totalPages = Math.ceil(total / 15);

  const S = {
    aside: { width: 220, flexShrink: 0, background: "#fff", borderRight: "1px solid rgba(0,0,0,0.07)", padding: "28px 16px", display: "flex", flexDirection: "column" as const, gap: 2, position: "fixed" as const, top: 0, bottom: 0, left: 0, boxShadow: "2px 0 20px rgba(0,0,0,0.04)", zIndex: 100 },
    main: { marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" as const, minHeight: "100vh" },
    topbar: { position: "sticky" as const, top: 0, zIndex: 50, background: "rgba(245,240,232,0.94)", backdropFilter: "blur(16px)", padding: "16px 32px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" },
    content: { padding: "28px 32px 60px", flex: 1 },
    aLabel: { fontSize: 10, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "#888880", padding: "14px 10px 6px", fontWeight: 500 },
    aItem: (on: boolean) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: on ? "#4F7453" : "#888880", background: on ? "#E4EFE4" : "transparent", fontWeight: on ? 500 : 400, transition: "all .2s" }),
    aBadge: { marginLeft: "auto", background: "#C4975A", color: "#fff", fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20 },
    btn: (variant: "primary" | "outline" | "danger") => ({
      display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "'DM Sans',sans-serif", transition: "opacity .2s, transform .15s",
      ...(variant === "primary" ? { background: "linear-gradient(135deg,#7A9E7E,#4F7453)", color: "#fff" } : {}),
      ...(variant === "outline" ? { background: "#fff", color: "#333", border: "1.5px solid rgba(0,0,0,0.1)" } : {}),
      ...(variant === "danger" ? { background: "#FDEAEA", color: "#E07070", border: "1.5px solid rgba(224,112,112,0.2)" } : {}),
    }),
    tabs: { display: "flex", gap: 4, marginBottom: 24, background: "#fff", padding: 4, borderRadius: 12, width: "fit-content", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" },
    tab: (on: boolean) => ({ padding: "8px 18px", borderRadius: 9, fontSize: 13, cursor: "pointer", color: on ? "#fff" : "#888880", background: on ? "#7A9E7E" : "transparent", fontWeight: on ? 500 : 400, display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }),
    tabCount: (on: boolean) => ({ background: on ? "rgba(255,255,255,0.25)" : "#EDE8DE", borderRadius: 10, padding: "1px 7px", fontSize: 11, color: on ? "#fff" : "#888880" }),
    statCard: (accent?: boolean) => ({ flex: 1, background: accent ? "linear-gradient(135deg,#7A9E7E,#4F7453)" : "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }),
    rtable: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", overflow: "hidden" },
    actBtn: (variant: "view" | "edit" | "pub" | "del") => ({
      width: 32, height: 32, borderRadius: 8, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform .2s",
      ...(variant === "view" ? { background: "#F5F0E8", color: "#888880" } : {}),
      ...(variant === "edit" ? { background: "#E4ECFB", color: "#6B8FCC" } : {}),
      ...(variant === "pub" ? { background: "#E4EFE4", color: "#4F7453" } : {}),
      ...(variant === "del" ? { background: "#FDEAEA", color: "#E07070" } : {}),
    }),
    badge: (v: "cat" | "pub" | "draft" | "pend") => ({
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
      ...(v === "cat" ? { background: "#E4EFE4", color: "#4F7453" } : {}),
      ...(v === "pub" ? { background: "#E4F4E4", color: "#3A7040" } : {}),
      ...(v === "draft" ? { background: "#EDE8DE", color: "#888880" } : {}),
      ...(v === "pend" ? { background: "#FFF8E0", color: "#A08020" } : {}),
    }),
    fieldInput: { width: "100%", background: "#F5F0E8", border: "1.5px solid transparent", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "#333" } as React.CSSProperties,
    ingRow: { display: "flex", gap: 8, alignItems: "center", background: "#F5F0E8", borderRadius: 9, padding: "8px 12px" },
  };

  const GRID_FUNNEL = "2fr 1fr 1fr 1fr 120px";
  const GRID_PUBLISHED = "2fr 1fr 1fr 1fr 1fr 140px";
  const GRID_SUGGEST = "2fr 1fr 1fr 1fr 140px";
  const gridForTab = tab === "published" ? GRID_PUBLISHED : tab === "suggest" ? GRID_SUGGEST : GRID_FUNNEL;

  return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans',sans-serif" }}>

        {/* SIDEBAR */}
        <aside style={S.aside}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#7A9E7E,#4F7453)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🌿</div>
            ПП Шеф
            <span style={{ fontSize: 10, color: "#888880", marginLeft: 4, fontFamily: "'DM Sans',sans-serif" }}>admin</span>
          </div>

          <div style={S.aLabel}>Рецепты</div>
          <div className="a-item-hover" onClick={() => { setTab("funnel"); setPage(1); }} style={S.aItem(tab === "funnel")}>
            <IcoFilter /> Воронка {tab === "funnel" && total > 0 && <span style={S.aBadge}>{total}</span>}
          </div>
          <div className="a-item-hover" onClick={() => { setTab("published"); setPage(1); }} style={S.aItem(tab === "published")}>
            <IcoBook /> Опубликованные {tab === "published" && total > 0 && <span style={S.aBadge}>{total}</span>}
          </div>
          <div className="a-item-hover" onClick={() => { setTab("suggest"); setPage(1); }} style={S.aItem(tab === "suggest")}>
            <IcoUsers /> Предложенные {tab === "suggest" && total > 0 && <span style={S.aBadge}>{total}</span>}
          </div>

          <div style={{ height: 1, background: "#EDE8DE", margin: "12px 0" }} />
          <div style={S.aLabel}>Система</div>
          <div className="a-item-hover" style={S.aItem(false)}><IcoGear /> Настройки</div>

          <div style={{ marginTop: "auto" }}>
            <div onClick={() => router.push("/")} className="a-item-hover" style={{ ...S.aItem(false), fontSize: 12 }}>← На сайт</div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={S.main}>
          <div style={S.topbar}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 600 }}>
              {tab === "funnel" ? "🔽 Воронка рецептов" : tab === "published" ? "📗 Опубликованные" : "💬 Предложенные"}
            </div>
            <button className="btn-hover" onClick={openNew} style={S.btn("primary")}>
              <IcoPlus /> Добавить рецепт
            </button>
          </div>

          <div style={S.content}>
            {/* STATS */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Всего пользователей", value: stats?.total_users ?? "—", accent: true },
              { label: "Сегодня зарегалось", value: stats?.today_users ?? "—" },
              { label: "Premium", value: stats?.premium_users ?? "—" },
              { label: "Опубликовано", value: stats?.published_recipes ?? "—" },
              { label: "В воронке", value: stats?.draft_recipes ?? "—" },
              { label: "RPS (ср/сек)", value: stats ? stats.rps.toFixed(1) : "—" },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ ...S.statCard(!!accent), minWidth: 120, flex: "1 1 120px" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: accent ? "#fff" : "#333" }}>
                  {value}
                </div>
                <div style={{ fontSize: 12, color: accent ? "rgba(255,255,255,0.6)" : "#888880", marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

            {/* TABS */}
            <div style={S.tabs}>
              {([["funnel", "Воронка"], ["published", "Опубликованные"], ["suggest", "Предложенные"]] as const).map(([t, label]) => (
                <div key={t} style={S.tab(tab === t)} onClick={() => { setTab(t); setPage(1); }}>
                  {label} <span style={S.tabCount(tab === t)}>{tab === t ? total : 0}</span>
                </div>
              ))}
            </div>

            {/* TOOLBAR */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 360 }}>
                <IcoSearch />
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
                  placeholder="Поиск по названию..."
                  style={{ width: "100%", background: "#fff", border: "1.5px solid transparent", borderRadius: 9, padding: "9px 14px 9px 34px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: "#333", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", outline: "none" }} />
              </div>
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.09)", borderRadius: 9, padding: "9px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: "#333", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", cursor: "pointer", outline: "none" }}>
                <option value="">Все категории</option>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
              </select>
              <button className="btn-hover" onClick={() => { setSearch(searchInput); setPage(1); }} style={S.btn("outline")}>Найти</button>
            </div>

            {/* TABLE */}
            <div style={S.rtable}>
              <div style={{ display: "grid", gridTemplateColumns: gridForTab, padding: "12px 20px", background: "#F5F0E8", fontSize: 11, letterSpacing: ".8px", textTransform: "uppercase", color: "#888880", fontWeight: 500, borderBottom: "1px solid #EDE8DE" }}>
                <span>Рецепт</span>
                {tab === "funnel" && <><span>Категория</span><span>Статус</span><span>Картинка</span><span style={{ textAlign: "right" }}>Действия</span></>}
                {tab === "published" && <><span>Категория</span><span>Калории</span><span>КБЖУ</span><span>Добавлен</span><span style={{ textAlign: "right" }}>Действия</span></>}
                {tab === "suggest" && <><span>Автор</span><span>Категория</span><span>Дата</span><span style={{ textAlign: "right" }}>Действия</span></>}
              </div>

              {loading ? (
                <div style={{ padding: 60, textAlign: "center", color: "#888880" }}>Загрузка...</div>
              ) : recipes.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "#888880" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
                  <div>Рецептов не найдено</div>
                </div>
              ) : recipes.map((r, i) => (
                <div key={r.id} className="rrow-hover" onClick={() => openEdit(r.id)}
                  style={{ display: "grid", gridTemplateColumns: gridForTab, padding: "14px 20px", borderBottom: i < recipes.length - 1 ? "1px solid #F5F0E8" : "none", alignItems: "center", cursor: "pointer", transition: "background .15s" }}>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 10, background: "#E4EFE4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, overflow: "hidden" }}>
                      {r.image_url ? <img src={r.image_url} style={{ width: 46, height: 46, objectFit: "cover" }} alt="" /> : (CAT_EMOJI[r.category] || "🍽")}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "#888880" }}>
                        {r.calories ? `${Math.round(r.calories)} ккал · ` : ""}
                        {r.protein ? `Б${Math.round(r.protein)} ` : ""}
                        {r.fat ? `Ж${Math.round(r.fat)} ` : ""}
                        {r.carbs ? `У${Math.round(r.carbs)}` : ""}
                        {r.cook_time_minutes ? ` · ⏱ ${r.cook_time_minutes} мин` : ""}
                      </div>
                    </div>
                  </div>

                  {tab === "funnel" && <>
                    <span><span style={S.badge("cat")}>{CAT_EMOJI[r.category]} {CAT_LABEL[r.category]}</span></span>
                    <span><span style={S.badge(r.status === "published" ? "pub" : r.status === "draft" ? "draft" : "pend")}>
                      {r.status === "published" ? "✓ Готово" : r.status === "draft" ? "Черновик" : "На правках"}
                    </span></span>
                    <div onClick={e => e.stopPropagation()}>
                      <input defaultValue={r.image_url || ""} placeholder="s3://путь/к/фото"
                        style={{ fontSize: 11, fontFamily: "monospace", background: "#F5F0E8", border: "1px solid transparent", borderRadius: 6, padding: "4px 8px", color: "#4F7453", outline: "none", width: 150 }} />
                    </div>
                  </>}

                  {tab === "published" && <>
                    <span><span style={S.badge("cat")}>{CAT_EMOJI[r.category]} {CAT_LABEL[r.category]}</span></span>
                    <span style={{ fontWeight: 500 }}>{r.calories ? `${Math.round(r.calories)} ккал` : "—"}</span>
                    <span style={{ fontSize: 12, color: "#888880" }}>
                      {r.protein ? `Б${Math.round(r.protein)} ` : ""}
                      {r.fat ? `Ж${Math.round(r.fat)} ` : ""}
                      {r.carbs ? `У${Math.round(r.carbs)}` : ""}
                    </span>
                    <span style={{ fontSize: 12, color: "#888880" }}>{new Date(r.created_at).toLocaleDateString("ru")}</span>
                  </>}

                  {tab === "suggest" && <>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.author_credit || "Аноним"}</div>
                      <div style={{ fontSize: 11, color: "#888880" }}>Ждёт разрешения</div>
                    </div>
                    <span><span style={S.badge("cat")}>{CAT_EMOJI[r.category]} {CAT_LABEL[r.category]}</span></span>
                    <span style={{ fontSize: 12, color: "#888880" }}>{new Date(r.created_at).toLocaleDateString("ru")}</span>
                  </>}

                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                    <button className="act-eye" onClick={() => openEdit(r.id)} style={S.actBtn("view")} title="Просмотр"><IcoEye /></button>
                    <button className="act-edit" onClick={() => openEdit(r.id)} style={S.actBtn("edit")} title="Редактировать"><IcoEdit /></button>
                    <button className="act-pub" onClick={() => handlePublishToggle(r.id, r.status === "published")} style={S.actBtn("pub")} title="Публикация"><IcoPub /></button>
                    <button className="act-del" onClick={() => handleDelete(r.id, r.title)} style={S.actBtn("del")} title="Удалить"><IcoTrash /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* ПАГИНАЦИЯ */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} style={{ width: 32, height: 32, background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#888880" }}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, background: p === page ? "#7A9E7E" : "#fff", color: p === page ? "#fff" : "#888880", border: p === page ? "none" : "1px solid rgba(0,0,0,0.09)", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ width: 32, height: 32, background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#888880" }}>›</button>
              </div>
            )}
          </div>
        </main>

        {/* MODAL */}
        {modal && (
          <div onClick={e => { if (e.target === e.currentTarget) setModal(false); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div className="modal-enter" style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #EDE8DE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600 }}>
                  {editingId ? "✏️ Редактировать рецепт" : "➕ Новый рецепт"}
                </h3>
                <button onClick={() => setModal(false)} style={{ width: 32, height: 32, background: "#F5F0E8", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>

              <div style={{ padding: "24px 28px" }}>
                <div style={{ width: "100%", height: 160, background: "#E4EFE4", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, marginBottom: 10, border: "2px dashed #B8D4BA", overflow: "hidden" }}>
                  {form.image_url ? <img src={form.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : (CAT_EMOJI[form.category] || "🍽")}
                </div>
                <Fld label="Путь к картинке (S3)">
                  <input style={S.fieldInput} value={form.image_url || ""} placeholder="https://s3.../recipes/name.jpg" onChange={e => setForm(f => ({ ...f, image_url: e.target.value || null }))} />
                </Fld>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Fld label="Название">
                    <input style={S.fieldInput} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </Fld>
                  <Fld label="Категория">
                    <select style={S.fieldInput} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                    </select>
                  </Fld>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  {(["calories", "protein", "fat", "carbs"] as const).map((k, idx) => (
                    <Fld key={k} label={["Калории", "Белки (г)", "Жиры (г)", "Углеводы (г)"][idx]}>
                      <input style={S.fieldInput} type="number" value={form[k] ?? ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value ? Number(e.target.value) : null }))} />
                    </Fld>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <Fld label="Время (мин)">
                    <input style={S.fieldInput} type="number" value={form.cook_time_minutes ?? ""} onChange={e => setForm(f => ({ ...f, cook_time_minutes: e.target.value ? Number(e.target.value) : null }))} />
                  </Fld>
                  <Fld label="Порций">
                    <input style={S.fieldInput} type="number" value={form.servings ?? ""} onChange={e => setForm(f => ({ ...f, servings: e.target.value ? Number(e.target.value) : null }))} />
                  </Fld>
                  <Fld label="Статус">
                    <select style={S.fieldInput} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="draft">Черновик</option>
                      <option value="published">Опубликован</option>
                      <option value="archived">Архив</option>
                    </select>
                  </Fld>
                </div>

                <Fld label="Польза">
                  <textarea style={{ ...S.fieldInput, minHeight: 70, resize: "vertical" }} value={form.benefit || ""} onChange={e => setForm(f => ({ ...f, benefit: e.target.value || null }))} />
                </Fld>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Fld label="Советы нутрициолога">
                    <textarea style={{ ...S.fieldInput, minHeight: 70, resize: "vertical" }} value={form.nutritionist_tips || ""} onChange={e => setForm(f => ({ ...f, nutritionist_tips: e.target.value || null }))} />
                  </Fld>
                  <Fld label="Витамины и минералы">
                    <textarea style={{ ...S.fieldInput, minHeight: 70, resize: "vertical" }} value={form.vitamins || ""} onChange={e => setForm(f => ({ ...f, vitamins: e.target.value || null }))} />
                  </Fld>
                </div>

                <Fld label="Ингредиенты">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {form.ingredients.map((ing, i) => (
                      <div key={i} style={S.ingRow}>
                        <input style={{ background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#333", flex: 2 }}
                          value={ing.name} placeholder="ингредиент"
                          onChange={e => setForm(f => ({ ...f, ingredients: f.ingredients.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
                        <input style={{ background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#333", maxWidth: 90 }}
                          value={ing.amount || ""} placeholder="кол-во"
                          onChange={e => setForm(f => ({ ...f, ingredients: f.ingredients.map((x, j) => j === i ? { ...x, amount: e.target.value || null } : x) }))} />
                        <button onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))}
                          style={{ width: 24, height: 24, background: "#FDEAEA", border: "none", borderRadius: 6, cursor: "pointer", color: "#E07070", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                    ))}
                    <button className="add-ing" onClick={() => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: "", amount: null }] }))}
                      style={{ background: "transparent", border: "1.5px dashed #B8D4BA", borderRadius: 9, padding: 8, fontSize: 12, color: "#4F7453", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", width: "100%", transition: "background .2s" }}>
                      + Добавить ингредиент
                    </button>
                  </div>
                </Fld>

                <Fld label="Шаги приготовления">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {form.steps.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#E4EFE4", color: "#4F7453", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 4 }}>{i + 1}</div>
                        <textarea style={{ ...S.fieldInput, flex: 1, minHeight: 60, resize: "vertical" }}
                          value={step.text} placeholder={`Шаг ${i + 1}`}
                          onChange={e => setForm(f => ({ ...f, steps: f.steps.map((x, j) => j === i ? { ...x, text: e.target.value } : x) }))} />
                        <button onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, step_number: j + 1 })) }))}
                          style={{ width: 24, height: 24, background: "#FDEAEA", border: "none", borderRadius: 6, cursor: "pointer", color: "#E07070", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>✕</button>
                      </div>
                    ))}
                    <button className="add-ing" onClick={() => setForm(f => ({ ...f, steps: [...f.steps, { step_number: f.steps.length + 1, text: "", image_url: null }] }))}
                      style={{ background: "transparent", border: "1.5px dashed #B8D4BA", borderRadius: 9, padding: 8, fontSize: 12, color: "#4F7453", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", width: "100%", transition: "background .2s" }}>
                      + Добавить шаг
                    </button>
                  </div>
                </Fld>

                <Fld label="Теги (через запятую)">
                  <input style={S.fieldInput} value={form.tags.join(", ")} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))} placeholder="пп, белковый, без глютена" />
                </Fld>

                <Fld label="Автор / источник">
                  <input style={S.fieldInput} value={form.author_credit || ""} onChange={e => setForm(f => ({ ...f, author_credit: e.target.value || null }))} placeholder="@username или название источника" />
                </Fld>
              </div>

              <div style={{ padding: "16px 28px 24px", borderTop: "1px solid #EDE8DE", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="btn-hover" onClick={() => setModal(false)} style={S.btn("outline")} disabled={saving}>Отмена</button>
                {editingId && (
                  <button className="btn-hover" onClick={() => { handleDelete(editingId, form.title); setModal(false); }} style={{ ...S.btn("danger"), padding: "6px 12px", fontSize: 12 }} disabled={saving}>Удалить</button>
                )}
                <button className="btn-hover" onClick={handleSave} style={S.btn("outline")} disabled={saving}>Сохранить черновик</button>
                <button className="btn-hover" onClick={handleSaveAndPublish} style={S.btn("primary")} disabled={saving}>{saving ? "Сохранение..." : "Сохранить и опубликовать"}</button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, background: "#333", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 14, zIndex: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}