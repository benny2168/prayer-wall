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
  Info,
  Clock,
  Eye,
  Monitor,
  Smartphone,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { updateEmailTemplate, clearEmailAudits } from "./actions";
import { generateThemedEmail } from "@/lib/email_shared";

interface EmailClientProps {
  audits: EmailAudit[];
  templates: EmailTemplate[];
  upcomingReminders: any[];
  siteTheme: { 
    primaryColor: string; 
    logoUrl: string | null;
  };
  orgName: string;
  testChainTitle: string;
}

export default function EmailClient({ 
  audits, 
  templates, 
  upcomingReminders, 
  siteTheme,
  orgName,
  testChainTitle
}: EmailClientProps) {
  const [activeTab, setActiveTab] = useState<"AUDIT" | "QUEUE" | "TEMPLATES" | "PREVIEW">("AUDIT");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewType, setPreviewType] = useState<string>("SIGNUP");
  const [viewMode, setViewMode] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
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

  const getPreviewContent = () => {
    const template = templates.find(t => t.type === previewType) || {
      subject: "Default Subject",
      content: "Default content for preview..."
    };

    let processedContent = template.content;
    if (previewType === "REMINDER") {
      processedContent = processedContent
        .replace("{{name}}", "Intercessor")
        .replace("{{chain}}", testChainTitle)
        .replace("{{time}}", "Monday • 8:00 AM");
    } else if (previewType === "OTP") {
      processedContent += `
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; font-size: 32px; font-weight: 800; color: ${siteTheme.primaryColor}; letter-spacing: 0.1em;">123456</p>
        </div>
      `;
    } else if (previewType === "SIGNUP") {
      processedContent += `
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${siteTheme.primaryColor}; truncate">Monday, May 12 • 8:00 AM</p>
        </div>
      `;
    }

    return {
      subject: template.subject,
      html: generateThemedEmail({
        title: previewType,
        name: "Intercessor",
        content: processedContent,
        logoUrl: siteTheme.logoUrl,
        primaryColor: siteTheme.primaryColor,
        footerText: `Faithfully serving the ${orgName} community`
      })
    };
  };

  const preview = getPreviewContent();

  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-12 gap-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/members" 
              className="p-3 bg-[--color-bg-panel] text-[--color-text-muted] hover:text-[--color-text-base] rounded-2xl border border-[--color-border-base] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-[--color-text-base] tracking-tight">Email Center</h1>
              <p className="text-[--color-text-muted] mt-1 font-medium">Enterprise communication command center.</p>
            </div>
          </div>

          <div className="flex flex-wrap bg-[--color-bg-panel] p-1.5 rounded-2xl border border-[--color-border-base]">
            {[
              { id: "AUDIT", label: "History", icon: History },
              { id: "QUEUE", label: "Queue", icon: Clock },
              { id: "TEMPLATES", label: "Editing", icon: Settings },
              { id: "PREVIEW", label: "Preview Lab", icon: Eye },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-theme-600 text-white shadow-lg"
                    : "text-[--color-text-muted] hover:text-[--color-text-base]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "AUDIT" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[--color-text-muted] font-medium">
                <Info className="w-4 h-4" />
                <span>Showing last {audits.length} transactions</span>
              </div>
              {audits.length > 0 && (
                <button 
                  onClick={handleClearAudits}
                  className="flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-400 transition-colors bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Logs
                </button>
              )}
            </div>

            <div className="bg-[--color-bg-panel] rounded-[32px] border border-[--color-border-base] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[--color-bg-base]/50 border-b border-[--color-border-base]">
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Timestamp</th>
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Type</th>
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Recipient</th>
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Subject</th>
                      <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-black text-[--color-text-muted]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--color-border-base]">
                    {audits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center text-[--color-text-muted]">
                          <Mail className="w-16 h-16 mx-auto mb-4 opacity-10" />
                          <p className="text-xl font-bold">No email activity recorded yet.</p>
                        </td>
                      </tr>
                    ) : (
                      audits.map((audit) => (
                        <tr key={audit.id} className="hover:bg-[--color-bg-base]/30 transition-colors group">
                          <td className="px-8 py-6 text-sm font-bold text-[--color-text-muted]">
                            {format(new Date(audit.createdAt), "MMM d, h:mm a")}
                          </td>
                          <td className="px-8 py-6">
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${
                              audit.type === "OTP" ? "bg-amber-500/10 text-amber-500" :
                              audit.type === "REMINDER" ? "bg-blue-500/10 text-blue-500" :
                              "bg-emerald-500/10 text-emerald-500"
                            }`}>
                              {audit.type}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-bold text-[--color-text-base] truncate max-w-[200px]">
                            {audit.recipient}
                          </td>
                          <td className="px-8 py-6 text-sm font-medium text-[--color-text-muted] truncate max-w-[300px]">
                            {audit.subject}
                          </td>
                          <td className="px-8 py-6">
                            {audit.status === "SENT" ? (
                              <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                                <CheckCircle className="w-4 h-4" />
                                Success
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest" title={audit.error || "Unknown error"}>
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
        )}

        {activeTab === "QUEUE" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-[--color-text-muted] font-medium px-2">
              <Clock className="w-4 h-4" />
              <span>Upcoming automated prayer reminders</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {upcomingReminders.length === 0 ? (
                <div className="bg-[--color-bg-panel] rounded-3xl border border-[--color-border-base] p-24 text-center">
                   <Clock className="w-16 h-16 mx-auto mb-4 opacity-10" />
                   <h2 className="text-xl font-bold text-[--color-text-base]">No Pending Reminders</h2>
                   <p className="text-[--color-text-muted] max-w-sm mx-auto mt-2">Scheduled notifications will appear here when users sign up for prayer slots.</p>
                </div>
              ) : (
                upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="bg-[--color-bg-panel] rounded-3xl border border-[--color-border-base] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-theme-500/30 transition-all shadow-xl shadow-black/5">
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="w-14 h-14 rounded-2xl bg-theme-500/10 text-theme-500 flex items-center justify-center border border-theme-500/20 shrink-0">
                        <Mail className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-[--color-text-base] truncate">{reminder.name}</h3>
                        <p className="text-sm font-bold text-[--color-text-muted] truncate">{reminder.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-theme-500 bg-theme-500/5 px-2 py-0.5 rounded border border-theme-500/10">
                            {reminder.prayerChain?.title}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-black text-[--color-text-base]">
                          {format(new Date(reminder.startTime), "MMM d • h:mm a")}
                        </p>
                        <p className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-widest mt-0.5">Scheduled Delivery</p>
                      </div>
                      <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                        Queued
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "TEMPLATES" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {["OTP", "REMINDER", "NOTIFICATION", "SIGNUP"].map((type) => {
              const template = templates.find(t => t.type === type) || {
                type,
                subject: type === "OTP" ? "Your Login Code" : type === "REMINDER" ? "Prayer Reminder" : type === "SIGNUP" ? "Signup Confirmation" : "Encouragement",
                content: type === "OTP" ? "Default code message..." : type === "REMINDER" ? "Default reminder..." : type === "SIGNUP" ? "Default confirmation..." : "Default encouragement..."
              };

              return (
                <div key={type} className="bg-[--color-bg-panel] rounded-[32px] border border-[--color-border-base] p-8 flex flex-col h-full shadow-2xl hover:border-theme-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-8">
                    <div className={`p-4 rounded-2xl ${
                      type === "OTP" ? "bg-amber-500/10 text-amber-500" :
                      type === "REMINDER" ? "bg-blue-500/10 text-blue-500" :
                      "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setPreviewType(type);
                          setActiveTab("PREVIEW");
                        }}
                        className="p-2.5 bg-white/5 text-[--color-text-muted] hover:text-theme-500 hover:bg-theme-500/5 rounded-xl transition-all"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setEditingTemplate(template as EmailTemplate)}
                        className="p-2.5 bg-white/5 text-[--color-text-muted] hover:text-theme-500 hover:bg-theme-500/5 rounded-xl transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-[--color-text-base] mb-1">{type}</h3>
                  <p className="text-xs font-bold text-[--color-text-muted] uppercase tracking-widest mb-6 border-b border-[--color-border-base] pb-4">Communication</p>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="text-[10px] font-black text-theme-500 uppercase tracking-widest mb-1">Subject</div>
                      <div className="text-sm font-bold text-[--color-text-base] line-clamp-1">{template.subject}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-theme-500 uppercase tracking-widest mb-1">Message</div>
                      <p className="text-xs font-medium text-[--color-text-muted] line-clamp-4 leading-relaxed italic">
                        "{template.content}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "PREVIEW" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
                <div className="flex bg-[--color-bg-panel] p-1.5 rounded-2xl border border-[--color-border-base] w-fit overflow-x-auto">
                   {["SIGNUP", "REMINDER", "OTP", "NOTIFICATION"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPreviewType(type)}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          previewType === type
                            ? "bg-theme-600 text-white shadow-lg shadow-theme-500/20"
                            : "text-[--color-text-muted] hover:text-[--color-text-base]"
                        }`}
                      >
                        {type}
                      </button>
                   ))}
                </div>

                <div className="flex bg-[--color-bg-panel] p-1 rounded-xl border border-[--color-border-base] w-fit self-end">
                  <button
                    onClick={() => setViewMode("DESKTOP")}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === "DESKTOP" ? "bg-white/10 text-theme-500 shadow-sm" : "text-[--color-text-muted] opacity-50 hover:opacity-100"}`}
                  >
                    <Monitor className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("MOBILE")}
                    className={`p-2.5 rounded-lg transition-all ${viewMode === "MOBILE" ? "bg-white/10 text-theme-500 shadow-sm" : "text-[--color-text-muted] opacity-50 hover:opacity-100"}`}
                  >
                    <Smartphone className="w-5 h-5" />
                  </button>
                </div>
             </div>

             <div className="relative group max-w-5xl mx-auto">
                {/* Browser Sim */}
                <div className="bg-[#f1f5f9] dark:bg-[#0f172a] border border-[--color-border-base] rounded-t-3xl p-4 flex items-center gap-6 shadow-2xl">
                   <div className="flex gap-2 ml-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                   </div>
                   <div className="flex-1 bg-white/50 dark:bg-black/20 rounded-xl px-4 py-2 text-[11px] text-[--color-text-muted] font-bold truncate flex items-center gap-3">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Subject: {preview.subject}
                   </div>
                </div>

                <div className={`mx-auto bg-white border-x border-b border-[--color-border-base] transition-all duration-700 ease-in-out overflow-hidden ${viewMode === "MOBILE" ? "max-w-[400px] rounded-b-[48px] border-b-[12px]" : "max-w-full rounded-b-3xl shadow-2xl"}`}>
                   <div className="p-0 bg-white overflow-y-auto max-h-[700px] min-h-[500px]">
                      <div dangerouslySetInnerHTML={{ __html: preview.html }} />
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-[--color-bg-base]/80 backdrop-blur-3xl" onClick={() => setEditingTemplate(null)} />
            <div className="relative bg-[--color-bg-panel] w-full max-w-2xl rounded-[40px] border border-[--color-border-base] shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <form onSubmit={handleSaveTemplate}>
                <div className="p-10 border-b border-[--color-border-base] flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-theme-600 text-white flex items-center justify-center shadow-xl shadow-theme-600/30">
                     <Settings className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-[--color-text-base] tracking-tight">Edit {editingTemplate.type}</h3>
                    <p className="text-[--color-text-muted] text-sm font-medium mt-1 uppercase tracking-widest opacity-60">Global Communication Template</p>
                  </div>
                </div>

                <div className="p-10 space-y-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-theme-500 mb-4 ml-1">Email Subject Line</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded-2xl px-6 py-5 text-[--color-text-base] outline-none focus:ring-4 focus:ring-theme-500/10 focus:border-theme-500 transition-all font-bold shadow-inner"
                      placeholder="Enter subject..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-theme-500 mb-4 ml-1">Message Body Content</label>
                    <textarea
                      value={editingTemplate.content}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                      rows={6}
                      className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded-[32px] px-6 py-5 text-[--color-text-base] outline-none focus:ring-4 focus:ring-theme-500/10 focus:border-theme-500 transition-all resize-none font-medium leading-relaxed shadow-inner"
                      placeholder="Enter message content..."
                    />
                  </div>
                  
                  <div className="bg-theme-500/5 p-6 rounded-3xl border border-theme-500/10 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-theme-500 text-white flex items-center justify-center shrink-0">
                       <Info className="w-5 h-5" />
                    </div>
                    <div className="text-sm text-[--color-text-muted] font-medium leading-relaxed">
                      You can use <span className="text-theme-600 font-black">{"{{name}}"}</span> or <span className="text-theme-600 font-black">{"{{time}}"}</span> placeholders. Changes will be mathematically applied to all future communications instantly.
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-[--color-bg-base]/50 border-t border-[--color-border-base] flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-8 py-4 rounded-2xl text-sm font-black text-[--color-text-muted] hover:text-[--color-text-base] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-theme-600 hover:bg-theme-500 text-white shadow-2xl shadow-theme-600/30 px-12 py-4 rounded-2xl text-sm font-black transition-all flex items-center gap-3 hover:scale-[1.03] active:scale-[0.97]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <Save className="w-5 h-5" />
                        Lock Changes
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
