import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Printer,
  Building2,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const emptyForm = { name: "", title: "", department: "", email: "", phone: "", parentId: "" };

// Recursively render a position and its children as a classic org-chart tree.
const OrgNode = ({ node, childrenMap, onEdit, onAddChild, onDelete, isRoot }) => {
  const children = childrenMap[node._id] || [];
  return (
    <div className="flex flex-col items-center">
      <div className="group relative bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all min-w-[200px] text-center">
        <p className="font-bold text-slate-900 text-sm">{node.title}</p>
        <p className="text-[13px] text-primary font-semibold mt-0.5">
          {node.name || "Vacant"}
        </p>
        {node.department && (
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1">
            {node.department}
          </p>
        )}
        {(node.email || node.phone) && (
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
            {node.email && (
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Mail size={9} /> {node.email}
              </p>
            )}
            {node.phone && (
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Phone size={9} /> {node.phone}
              </p>
            )}
          </div>
        )}
        <div className="hidden print:hidden group-hover:flex absolute -top-3 -right-3 gap-1">
          <button
            onClick={() => onAddChild(node._id)}
            title="Add report"
            className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary-dark"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={() => onEdit(node)}
            title="Edit"
            className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow hover:text-primary"
          >
            <Pencil size={11} />
          </button>
          {!isRoot && (
            <button
              onClick={() => onDelete(node)}
              title="Delete"
              className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow hover:text-rose-500"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {children.length > 0 && (
        <>
          <div className="w-px h-8 bg-slate-300" />
          <div className="flex gap-10 relative">
            {children.length > 1 && (
              <div className="absolute -top-0 left-0 right-0 h-px bg-slate-300" />
            )}
            {children.map((child) => (
              <div key={child._id} className="flex flex-col items-center">
                <div className="w-px h-0 bg-slate-300" />
                <OrgNode
                  node={child}
                  childrenMap={childrenMap}
                  onEdit={onEdit}
                  onAddChild={onAddChild}
                  onDelete={onDelete}
                />
              </div>
            ))}
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
      email: node.email || "",
      phone: node.phone || "",
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Organization Chart
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Your company's reporting structure — printable for compliance or
            client requests.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Printer size={15} /> Print / Export PDF
          </button>
          <button
            onClick={() => openAdd("")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-dark transition-all"
          >
            <Plus size={15} /> Add Top-Level Position
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-10 overflow-x-auto print:border-none print:shadow-none">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw size={20} className="animate-spin" />
          </div>
        ) : roots.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={36} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-semibold mb-4">
              No organization structure yet
            </p>
            <button
              onClick={() => openAdd("")}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-dark transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Position" : "Add Position"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations Manager"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                  Person's Name (leave blank if vacant)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operations"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                  Reports To
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary-dark transition-all disabled:opacity-60"
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
