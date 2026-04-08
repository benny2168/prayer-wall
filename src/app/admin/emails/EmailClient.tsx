"use client";

import { useState } from "react";
import { EmailAudit, EmailTemplate } from "@prisma/client";
import { format } from "date-fns";
import { 
  Mail, 
  History, 
  Settings, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Loader2,
  Save,
  Info
} from "lucide-react";
import Link from "next/link";
import { updateEmailTemplate, clearEmailAudits } from "./actions";

interface EmailClientProps {
  audits: EmailAudit[];
  templates: EmailTemplate[];
}

export default function EmailClient({ audits, templates }: EmailClientProps) {
  const [activeTab, setActiveTab] = useState<"AUDIT" | "TEMPLATES">("AUDIT");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setLoading(true);
    try {
      await updateEmailTemplate(editingTemplate.type, editingTemplate.subject, editingTemplate.content);
      setEditingTemplate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAudits = async () => {
    if (!confirm("Are you sure you want to clear all email audit logs?")) return;
    setLoading(true);
    try {
      await clearEmailAudits();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/members" 
              className="p-3 bg-[--color-bg-panel] text-[--color-text-muted] hover:text-[--color-text-base] rounded-2xl border border-[--color-border-base] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-[--color-text-base] tracking-tight">Email Center</h1>
              <p className="text-[--color-text-muted] mt-1">Audit communications and manage messaging.</p>
            </div>
          </div>

          <div className="flex bg-[--color-bg-panel] p-1.5 rounded-2xl border border-[--color-border-base]">
            <button
              onClick={() => setActiveTab("AUDIT")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "AUDIT"
                  ? "bg-theme-600 text-white shadow-lg"
                  : "text-[--color-text-muted] hover:text-[--color-text-base]"
              }`}
            >
              <History className="w-4 h-4" />
              Audit Log
            </button>
            <button
              onClick={() => setActiveTab("TEMPLATES")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "TEMPLATES"
                  ? "bg-theme-600 text-white shadow-lg"
                  : "text-[--color-text-muted] hover:text-[--color-text-base]"
              }`}
            >
              <Settings className="w-4 h-4" />
              Templates
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "AUDIT" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[--color-text-muted]">
                <Info className="w-4 h-4" />
                <span>Showing last {audits.length} transactions</span>
              </div>
              {audits.length > 0 && (
                <button 
                  onClick={handleClearAudits}
                  className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors bg-red-500/10 px-4 py-2 rounded-xl"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Logs
                </button>
              )}
            </div>

            <div className="bg-[--color-bg-panel] rounded-3xl border border-[--color-border-base] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[--color-bg-base]/50 border-b border-[--color-border-base]">
                      <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Timestamp</th>
                      <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Type</th>
                      <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Recipient</th>
                      <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Subject</th>
                      <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--color-border-base]">
                    {audits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center text-[--color-text-muted]">
                          <Mail className="w-12 h-12 mx-auto mb-4 opacity-10" />
                          <p className="text-lg">No email activity recorded yet.</p>
                        </td>
                      </tr>
                    ) : (
                      audits.map((audit) => (
                        <tr key={audit.id} className="hover:bg-[--color-bg-base]/30 transition-colors group">
                          <td className="px-6 py-5 text-sm font-medium text-[--color-text-muted]">
                            {format(new Date(audit.createdAt), "MMM d, h:mm a")}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                              audit.type === "OTP" ? "bg-amber-500/10 text-amber-500" :
                              audit.type === "REMINDER" ? "bg-blue-500/10 text-blue-500" :
                              "bg-emerald-500/10 text-emerald-500"
                            }`}>
                              {audit.type}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm font-semibold text-[--color-text-base] truncate max-w-[200px]">
                            {audit.recipient}
                          </td>
                          <td className="px-6 py-5 text-sm text-[--color-text-muted] truncate max-w-[300px]">
                            {audit.subject}
                          </td>
                          <td className="px-6 py-5">
                            {audit.status === "SENT" ? (
                              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                                <CheckCircle className="w-4 h-4" />
                                Success
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-500 font-bold text-xs" title={audit.error || "Unknown error"}>
                                <XCircle className="w-4 h-4" />
                                Failed
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["OTP", "REMINDER", "NOTIFICATION", "SIGNUP"].map((type) => {
              const template = templates.find(t => t.type === type) || {
                type,
                subject: type === "OTP" ? "Your Login Code" : type === "REMINDER" ? "Prayer Reminder" : type === "SIGNUP" ? "Signup Confirmation" : "Encouragement",
                content: type === "OTP" ? "Default code message..." : type === "REMINDER" ? "Default reminder..." : type === "SIGNUP" ? "Default confirmation..." : "Default encouragement..."
              };

              return (
                <div key={type} className="bg-[--color-bg-panel] rounded-3xl border border-[--color-border-base] p-8 flex flex-col h-full shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${
                      type === "OTP" ? "bg-amber-500/10 text-amber-500" :
                      type === "REMINDER" ? "bg-blue-500/10 text-blue-500" :
                      "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={() => setEditingTemplate(template as EmailTemplate)}
                      className="p-2 text-[--color-text-muted] hover:text-theme-500 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="text-xl font-black text-[--color-text-base] mb-2">{type} Template</h3>
                  <div className="text-sm font-semibold text-[--color-text-muted] mb-4">Subject: {template.subject}</div>
                  <p className="text-sm text-[--color-text-muted] line-clamp-4 bg-[--color-bg-base]/50 p-4 rounded-xl italic">
                    "{template.content}"
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-[--color-bg-base]/80 backdrop-blur-xl" onClick={() => setEditingTemplate(null)} />
            <div className="relative bg-[--color-bg-panel] w-full max-w-2xl rounded-3xl border border-[--color-border-base] shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <form onSubmit={handleSaveTemplate}>
                <div className="p-8 border-b border-[--color-border-base]">
                  <h3 className="text-2xl font-black text-[--color-text-base]">Edit {editingTemplate.type} Template</h3>
                  <p className="text-[--color-text-muted] text-sm mt-1">You can use text placeholders to personalize the message.</p>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[--color-text-muted] mb-3">Email Subject Line</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded-xl px-5 py-4 text-[--color-text-base] outline-none focus:ring-2 focus:ring-theme-500/20 focus:border-theme-500 transition-all font-bold"
                      placeholder="Enter subject..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[--color-text-muted] mb-3">Message Body Content</label>
                    <textarea
                      value={editingTemplate.content}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                      rows={6}
                      className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded-2xl px-5 py-4 text-[--color-text-base] outline-none focus:ring-2 focus:ring-theme-500/20 focus:border-theme-500 transition-all resize-none font-medium leading-relaxed"
                      placeholder="Enter message content..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-theme-500/5 p-4 rounded-xl border border-theme-500/10">
                      <div className="text-[10px] font-black uppercase text-theme-500 mb-1">Tip</div>
                      <div className="text-xs text-[--color-text-muted] font-medium leading-relaxed">
                        Use <span className="text-theme-500 font-bold">{"{{name}}"}</span> to automatically include the recipient's name in reminders.
                      </div>
                    </div>
                    <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                      <div className="text-[10px] font-black uppercase text-emerald-500 mb-1">Live Update</div>
                      <div className="text-xs text-[--color-text-muted] font-medium leading-relaxed">
                        Changes take effect immediately for all subsequent emails sent.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-[--color-bg-base]/50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-8 py-3.5 rounded-xl text-sm font-bold text-[--color-text-muted] hover:text-[--color-text-base] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-theme-600 hover:bg-theme-500 text-white shadow-xl shadow-theme-500/20 px-10 py-3.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Template
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
