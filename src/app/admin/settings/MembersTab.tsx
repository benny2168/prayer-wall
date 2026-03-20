"use client";

import { useState } from "react";
import Image from "next/image";
import * as motion from "framer-motion/client";

type OrgRole = { id: string; organization: { id: string; name: string; slug: string } };
type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "GLOBAL_ADMIN";
  organizations: OrgRole[];
};
type Org = { id: string; name: string; slug: string };

export default function MembersTab({
  users: initialUsers,
  organizations,
}: {
  users: User[];
  organizations: Org[];
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const toggleGlobalAdmin = async (user: User) => {
    const newRole = user.role === "GLOBAL_ADMIN" ? "USER" : "GLOBAL_ADMIN";
    setLoading(`role-${user.id}`);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const grantOrgAccess = async (userId: string, organizationId: string) => {
    setLoading(`org-${userId}-${organizationId}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}/orgs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        const newRole = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, organizations: [...u.organizations, newRole] } : u
          )
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const revokeOrgAccess = async (userId: string, organizationId: string) => {
    setLoading(`org-${userId}-${organizationId}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}/orgs`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, organizations: u.organizations.filter((o) => o.organization.id !== organizationId) }
              : u
          )
        );
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[--color-text-base]">Members</h2>
          <p className="text-[--color-text-muted] text-sm mt-1">
            Manage who has access to the admin portal and at what level.
          </p>
        </div>
        <span className="text-xs text-[--color-text-muted] bg-[--color-bg-panel] px-3 py-1 rounded-full">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-[--color-text-muted]">
          No users have logged in yet. Users appear here after their first Planning Center login.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const isExpanded = expandedUser === user.id;
            const userOrgIds = new Set(user.organizations.map((o) => o.organization.id));

            return (
              <motion.div
                key={user.id}
                layout
                className="border border-[--color-border-base] rounded-xl bg-[--color-bg-panel]/50 overflow-hidden"
              >
                {/* User Row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[--color-border-base] flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {user.image ? (
                      <Image 
                        src={user.image} 
                        alt="" 
                        fill
                        className="object-cover" 
                      />
                    ) : (
                      <span className="text-[--color-text-muted] text-sm font-medium">
                        {(user.name || user.email || "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[--color-text-base] font-medium truncate">{user.name || "Unknown"}</p>
                    <p className="text-[--color-text-muted] text-sm truncate">{user.email}</p>
                  </div>

                  {/* Global Admin Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-[--color-text-muted]">Global Admin</p>
                      <p className={`text-xs font-medium ${user.role === "GLOBAL_ADMIN" ? "text-theme-400" : "text-[--color-text-faint]"}`}>
                        {user.role === "GLOBAL_ADMIN" ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleGlobalAdmin(user)}
                      disabled={loading === `role-${user.id}`}
                      className={`relative flex items-center w-11 h-6 rounded-full transition-colors duration-200 p-0.5 flex-shrink-0 ${
                        user.role === "GLOBAL_ADMIN" ? "bg-theme-600" : "bg-[--color-border-base]"
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          user.role === "GLOBAL_ADMIN" ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>

                    {/* Expand Org Access */}
                    {organizations.length > 0 && user.role !== "GLOBAL_ADMIN" && (
                      <button
                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                        className="ml-1 text-[--color-text-muted] hover:text-[--color-text-base] transition-colors text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[--color-bg-panel]"
                      >
                        <span>Orgs</span>
                        <span>{isExpanded ? "▲" : "▼"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Org Access Panel */}
                {isExpanded && user.role !== "GLOBAL_ADMIN" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-[--color-border-base] p-4 bg-[--color-bg-base]"
                  >
                    <p className="text-xs text-[--color-text-muted] mb-3 font-medium uppercase tracking-wide">
                      Organization Admin Access
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {organizations.map((org) => {
                        const hasAccess = userOrgIds.has(org.id);
                        const key = `org-${user.id}-${org.id}`;
                        return (
                          <div
                            key={org.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                              hasAccess
                                ? "border-theme-500/40 bg-theme-500/10"
                                : "border-[--color-border-base] bg-[--color-bg-panel]"
                            }`}
                          >
                            <span className="text-sm text-[--color-text-muted]">{org.name}</span>
                            <button
                              onClick={() =>
                                hasAccess
                                  ? revokeOrgAccess(user.id, org.id)
                                  : grantOrgAccess(user.id, org.id)
                              }
                              disabled={loading === key}
                              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
                                hasAccess
                                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                  : "bg-theme-500/20 text-theme-400 hover:bg-theme-500/30"
                              }`}
                            >
                              {loading === key ? "..." : hasAccess ? "Revoke" : "Grant"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
