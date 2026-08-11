import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Trash2,
  Search,
  Users,
  CheckSquare,
  Square,
  X,
  UserPlus,
  Pencil,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
});

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const [importRes, setImportRes] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [addForm, setAddForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    domain: "",
  });
  const [addErr, setAddErr] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const fileRef = useRef();
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT, search });
    const r = await fetch(`${API}/cold-email/contacts?${params}`, {
      headers: auth(),
    });
    const d = await r.json();
    setContacts(d.contacts || []);
    setTotal(d.total || 0);
    setStats(d.stats || {});
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page on search change
  useEffect(() => {
    setPage(1);
  }, [search]);

  async function handleFile(file) {
    if (!file || !file.name.endsWith(".csv")) return;
    setUploading(true);
    setImportRes(null);
    const form = new FormData();
    form.append("file", file);
    const r = await fetch(`${API}/cold-email/contacts/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
      },
      body: form,
    });
    const d = await r.json();
    setImportRes(d);
    setUploading(false);
    load();
  }

  function onFilePick(e) {
    handleFile(e.target.files[0]);
    e.target.value = "";
  }
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (
      !confirm(
        `Delete ${selected.size} contact${selected.size > 1 ? "s" : ""}? This cannot be undone.`,
      )
    )
      return;
    setDeleting(true);
    await fetch(`${API}/cold-email/contacts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setSelected(new Set());
    setDeleting(false);
    load();
  }

  async function deleteSingle(id) {
    await fetch(`${API}/cold-email/contacts/${id}`, {
      method: "DELETE",
      headers: auth(),
    });
    load();
  }

  function resetAddForm() {
    setAddForm({
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      domain: "",
    });
    setAddErr("");
  }

  function openAddModal() {
    setEditingContact(null);
    resetAddForm();
    setAddOpen(true);
  }

  function openEditModal(contact) {
    setEditingContact(contact);
    setAddForm({
      email: contact.email || "",
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      company: contact.company || "",
      domain: contact.domain || "",
    });
    setAddErr("");
    setAddOpen(true);
  }

  async function submitAdd(e) {
    e.preventDefault();
    setAddErr("");
    if (!addForm.email.trim()) {
      setAddErr("Email is required");
      return;
    }
    setAddSaving(true);
    try {
      const method = editingContact ? "PUT" : "POST";
      const url = editingContact
        ? `${API}/cold-email/contacts/${editingContact._id}`
        : `${API}/cold-email/contacts`;
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify(addForm),
      });
      const d = await r.json();
      if (!r.ok) {
        setAddErr(
          d.message ||
            (editingContact
              ? "Failed to update contact"
              : "Failed to add contact"),
        );
        setAddSaving(false);
        return;
      }
      setAddOpen(false);
      setEditingContact(null);
      resetAddForm();
      load();
    } catch {
      setAddErr("Network error — check connection");
    }
    setAddSaving(false);
  }

  const allSelected =
    contacts.length > 0 && contacts.every((c) => selected.has(c._id));
  function toggleAll() {
    if (allSelected) {
      const s = new Set(selected);
      contacts.forEach((c) => s.delete(c._id));
      setSelected(s);
    } else {
      const s = new Set(selected);
      contacts.forEach((c) => s.add(c._id));
      setSelected(s);
    }
  }
  function toggleOne(id) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const activeCount = stats.active || 0;
  const suppressedCount = stats.suppressed || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white font-black text-lg">Contacts</h2>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/40 font-medium">
            <span>{total.toLocaleString()} total</span>
            <span className="text-emerald-400">
              {activeCount.toLocaleString()} active
            </span>
            <span className="text-rose-400">
              {suppressedCount.toLocaleString()} suppressed
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-40"
            >
              <Trash2 size={13} />{" "}
              {deleting ? "Deleting…" : `Delete ${selected.size}`}
            </button>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-white/6 border border-white/10 text-white/70 text-sm font-bold rounded-xl hover:bg-white/10 transition-all cursor-pointer"
          >
            <UserPlus size={14} /> Add Contact
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Upload size={14} /> Import CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={onFilePick}
            className="hidden"
          />
        </div>
      </div>

      {/* Import result */}
      {importRes && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 ${
            importRes.message
              ? "bg-rose-500/10 border border-rose-500/20"
              : "bg-emerald-500/10 border border-emerald-500/20"
          }`}
        >
          {importRes.message ? (
            <span className="text-rose-400 text-sm font-semibold">
              {importRes.message}
            </span>
          ) : (
            <span className="text-emerald-400 text-sm font-semibold">
              ✓ {importRes.imported} imported
              {importRes.duplicates > 0 && (
                <span className="text-white/40">
                  {" "}
                  · {importRes.duplicates} duplicates skipped
                </span>
              )}
              {importRes.invalid > 0 && (
                <span className="text-amber-400">
                  {" "}
                  · {importRes.invalid} invalid emails
                </span>
              )}
              <span className="text-white/30">
                {" "}
                — {importRes.total} rows processed
              </span>
            </span>
          )}
          <button
            onClick={() => setImportRes(null)}
            className="text-white/30 hover:text-white/60 ml-4 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* CSV Drop zone (when empty) */}
      {!loading && contacts.length === 0 && !search && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl py-16 flex flex-col items-center text-center cursor-pointer transition-all ${
            dragOver
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-white/10 hover:border-emerald-500/40 hover:bg-white/[0.02]"
          }`}
        >
          {uploading ? (
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          ) : (
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Upload size={24} className="text-emerald-400/60" />
            </div>
          )}
          <h3 className="text-white font-bold text-base mb-1">
            {uploading ? "Importing…" : "Import your first contacts"}
          </h3>
          <p className="text-white/30 text-sm max-w-sm">
            Drag & drop a CSV file here or click to browse. Required column:{" "}
            <code className="text-emerald-400">email</code>. Optional:{" "}
            <code className="text-white/40">first_name</code>,{" "}
            <code className="text-white/40">last_name</code>,{" "}
            <code className="text-white/40">company</code>,{" "}
            <code className="text-white/40">domain</code>.
          </p>
        </div>
      )}

      {/* Contacts table */}
      {(loading || contacts.length > 0 || search) && (
        <div className="bg-[#0B2D22] border border-white/6 rounded-2xl overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-white/6 flex items-center gap-3">
            <button
              onClick={toggleAll}
              className="p-1 text-white/40 hover:text-white/80 cursor-pointer"
            >
              {allSelected ? (
                <CheckSquare size={16} className="text-emerald-400" />
              ) : (
                <Square size={16} />
              )}
            </button>
            <div className="flex-1 relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or company…"
                className="w-full bg-white/[0.04] border border-white/6 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-white/30 hover:text-white/60 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm">
              No contacts match your search
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="grid grid-cols-[40px_1.2fr_1.2fr_1fr_1fr_80px_40px] gap-x-4 px-4 py-2 border-b border-white/[0.04] text-[10px] font-bold text-white/30 uppercase tracking-wider">
                <span />
                <span>Name</span>
                <span>Email</span>
                <span>Company</span>
                <span>Domain</span>
                <span>Status</span>
                <span />
              </div>

              <div className="max-h-[480px] overflow-y-auto">
                {contacts.map((c) => {
                  const name =
                    `${c.firstName || ""} ${c.lastName || ""}`.trim() || "—";
                  const sel = selected.has(c._id);
                  return (
                    <div
                      key={c._id}
                      className={`grid grid-cols-[40px_1.2fr_1.2fr_1fr_1fr_80px_40px] gap-x-4 px-4 py-3 border-b border-white/[0.03] items-center transition-colors ${sel ? "bg-emerald-500/[0.06]" : "hover:bg-white/[0.02]"}`}
                    >
                      <button
                        onClick={() => toggleOne(c._id)}
                        className="cursor-pointer text-white/40 hover:text-white/80"
                      >
                        {sel ? (
                          <CheckSquare size={14} className="text-emerald-400" />
                        ) : (
                          <Square size={14} />
                        )}
                      </button>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.07] flex items-center justify-center text-xs font-black text-white/50 shrink-0">
                          {(name[0] || "?").toUpperCase()}
                        </div>
                        <span className="text-white/80 text-sm font-medium truncate">
                          {name}
                        </span>
                      </div>
                      <span className="text-white/50 text-sm truncate">
                        {c.email}
                      </span>
                      <span className="text-white/40 text-sm truncate">
                        {c.company || "—"}
                      </span>
                      <span className="text-white/40 text-sm truncate">
                        {c.domain || "—"}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider w-fit ${
                          c.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {c.status}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="text-white/20 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Edit contact"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteSingle(c._id)}
                          className="text-white/20 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete contact"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/6">
                  <p className="text-white/30 text-xs">
                    {total.toLocaleString()} contacts · page {page} of{" "}
                    {totalPages}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.07] text-white/50 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.07] text-white/50 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Drop zone overlay during upload */}
      {uploading && contacts.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#0B2D22] border border-white/10 rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-bold text-sm">Importing contacts…</p>
          </div>
        </div>
      )}

      {/* Add single contact modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-[#0a1f16] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
              <h3 className="text-white font-black text-base">
                {editingContact ? "Edit Contact" : "Add Contact"}
              </h3>
              <button
                onClick={() => {
                  setAddOpen(false);
                  setEditingContact(null);
                  resetAddForm();
                }}
                className="text-white/30 hover:text-white/70 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitAdd} className="px-6 py-5 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-white/50 text-xs font-bold mb-1.5 uppercase tracking-wider">
                  Email address *
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-xs font-bold mb-1.5 uppercase tracking-wider">
                    First name
                  </label>
                  <input
                    type="text"
                    value={addForm.firstName}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="John"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-bold mb-1.5 uppercase tracking-wider">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={addForm.lastName}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    placeholder="Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-white/50 text-xs font-bold mb-1.5 uppercase tracking-wider">
                  Company
                </label>
                <input
                  type="text"
                  value={addForm.company}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, company: e.target.value }))
                  }
                  placeholder="Acme Ltd"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-white/50 text-xs font-bold mb-1.5 uppercase tracking-wider">
                  Domain
                </label>
                <input
                  type="text"
                  value={addForm.domain}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, domain: e.target.value }))
                  }
                  placeholder="acme.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {addErr && (
                <p className="text-rose-400 text-sm font-semibold">{addErr}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddOpen(false);
                    setEditingContact(null);
                    resetAddForm();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  {addSaving
                    ? editingContact
                      ? "Saving…"
                      : "Adding…"
                    : editingContact
                      ? "Save Contact"
                      : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
