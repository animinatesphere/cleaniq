import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Printer,
  Building2,
  User,
  RefreshCw,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const emptyForm = { name: "", title: "", department: "", parentId: "" };

const nodeInitials = (node) => {
  if (!node.name) return node.title?.[0]?.toUpperCase() || "?";
  return node.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const OrgNode = ({ node, childrenMap, onEdit, onAddChild, onDelete, isRoot }) => {
  const children = childrenMap[node._id] || [];
  return (
    <div className="flex flex-col items-center">
      <div
        className={`group relative rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 min-w-[200px] text-center overflow-hidden ${
          isRoot
            ? "bg-gradient-to-b from-amber-300 to-amber-400 border-2 border-amber-500 shadow-amber-900/40"
            : "bg-[#0B2D22] border border-white/10"
        }`}
      >
        <div className="px-6 pt-5 pb-4 flex flex-col items-center">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center mb-2.5 font-bold text-sm ${
              isRoot
                ? "bg-slate-900 text-amber-300 shadow-sm"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            {isRoot ? <User size={18} /> : nodeInitials(node)}
          </div>
          <p
            className={`font-bold text-sm leading-tight ${isRoot ? "text-slate-900" : "text-white"}`}
          >
            {node.title}
          </p>
          <p
            className={`text-[12px] font-semibold mt-1 ${isRoot ? "text-slate-700" : "text-emerald-400"}`}
          >
            {node.name || "Vacant"}
          </p>
        </div>
        {node.department && (
          <div
            className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-wide ${
              isRoot
                ? "bg-amber-500/30 text-slate-900"
                : "bg-[#071D16] text-white/40 border-t border-white/[0.06]"
            }`}
          >
            {node.department}
          </div>
        )}
        <div className="print:hidden flex absolute -top-3 -right-3 gap-1">
          <button
            onClick={() => onAddChild(node._id)}
            title="Add report"
            className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow hover:bg-emerald-400"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={() => onEdit(node)}
            title="Edit"
            className="w-6 h-6 rounded-full bg-[#0B2D22] border border-white/10 text-white/60 flex items-center justify-center shadow hover:text-emerald-400"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => onDelete(node)}
            title="Delete"
            className="w-6 h-6 rounded-full bg-[#0B2D22] border border-white/10 text-white/60 flex items-center justify-center shadow hover:text-rose-400"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {children.length > 0 && (
        <>
          <div className="w-0 h-6 border-l-2 border-white/20" />
          <div className="flex">
            {children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === children.length - 1;
              return (
                <div key={child._id} className="flex flex-col items-center px-5 relative">
                  {children.length > 1 && (
                    <div
                      className="absolute top-0 h-0 border-t-2 border-white/20"
                      style={{
                        left: isFirst ? "50%" : 0,
                        right: isLast ? "50%" : 0,
                      }}
                    />
                  )}
                  <div className="w-0 h-6 border-l-2 border-white/20" />
                  <OrgNode
                    node={child}
                    childrenMap={childrenMap}
                    onEdit={onEdit}
                    onAddChild={onAddChild}
                    onDelete={onDelete}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const OrgChart = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPositions = () => {
    setLoading(true);
    fetch(`${API}/org-chart`)
      .then((r) => r.json())
      .then((data) => setPositions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const { roots, childrenMap } = useMemo(() => {
    const map = {};
    positions.forEach((p) => {
      const key = p.parentId || "root";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return { roots: map.root || [], childrenMap: map };
  }, [positions]);

  const openAdd = (parentId = "") => {
    setEditingId(null);
    setForm({ ...emptyForm, parentId: parentId || "" });
    setShowModal(true);
  };

  const openEdit = (node) => {
    setEditingId(node._id);
    setForm({
      name: node.name || "",
      title: node.title || "",
      department: node.department || "",
      parentId: node.parentId || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, parentId: form.parentId || null };
      const res = await fetch(
        editingId ? `${API}/org-chart/${editingId}` : `${API}/org-chart`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        setShowModal(false);
        fetchPositions();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (node) => {
    if (
      !window.confirm(
        `Remove "${node.title}"? Anyone reporting to them will move up to their manager.`,
      )
    )
      return;
    await fetch(`${API}/org-chart/${node._id}`, { method: "DELETE" });
    fetchPositions();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Organization Chart
          </h2>
          <p className="text-sm text-white/40 font-medium mt-1">
            Your company's reporting structure — printable for compliance or
            client requests.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/10 transition-all"
          >
            <Printer size={15} /> Print / Export PDF
          </button>
          <button
            onClick={() => openAdd("")}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-400 transition-all"
          >
            <Plus size={15} /> Add Top-Level Position
          </button>
        </div>
      </div>

      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl shadow-sm p-10 overflow-x-auto print:border-none print:shadow-none">
        {!loading && roots.length > 0 && (
          <h3 className="text-center text-lg font-bold text-white mb-10 print:block hidden">
            Cleaniq Services — Organizational Structure
          </h3>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/40">
            <RefreshCw size={20} className="animate-spin" />
          </div>
        ) : roots.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={36} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/40 font-semibold mb-4">
              No organization structure yet
            </p>
            <button
              onClick={() => openAdd("")}
              className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-400 transition-all"
            >
              Add Your First Position (e.g. Director)
            </button>
          </div>
        ) : (
          <div className="flex justify-center gap-16 min-w-fit">
            {roots.map((root) => (
              <OrgNode
                key={root._id}
                node={root}
                childrenMap={childrenMap}
                onEdit={openEdit}
                onAddChild={openAdd}
                onDelete={handleDelete}
                isRoot
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-[#0B2D22] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
              <h3 className="text-base font-bold text-white">
                {editingId ? "Edit Position" : "Add Position"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations Manager"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-[#071D16] border border-white/10 text-white placeholder:text-white/20 font-medium text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                  Person's Name (leave blank if vacant)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-[#071D16] border border-white/10 text-white placeholder:text-white/20 font-medium text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operations"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-[#071D16] border border-white/10 text-white placeholder:text-white/20 font-medium text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-white/40 mb-1.5 block">
                  Reports To
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-[#071D16] border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                >
                  <option value="">No one (top of chart)</option>
                  {positions
                    .filter((p) => p._id !== editingId)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title} {p.name ? `(${p.name})` : ""}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-sm hover:bg-emerald-400 transition-all disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Position"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgChart;
