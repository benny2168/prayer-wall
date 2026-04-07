"use client";

import { useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import { deleteOrganization, updateOrganizationBanner, clearOrganizationBanner, updateOrganizationTimezone } from "@/app/admin/actions";
import { Globe } from "lucide-react";

interface OrgProps {
  org: any;
  isAdmin: boolean;
}

export default function OrganizationCard({ org, isAdmin }: OrgProps) {
  const [loading, setLoading] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("banner", file);

    const res = await updateOrganizationBanner(org.id, formData);
    if (!res.success) {
      alert(res.error || "Failed to upload banner");
    }
    setLoading(false);
  };

  const handleClearBanner = async () => {
    if (confirm(`Are you sure you want to remove the banner for ${org.name}?`)) {
      setLoading(true);
      const res = await clearOrganizationBanner(org.id);
      if (!res.success) {
        alert(res.error || "Failed to clear banner");
      }
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex-1 w-full">
        {org.bannerUrl && (
          <div className="mb-3 relative group rounded-lg overflow-hidden border border-[--color-border-base] h-24 w-full md:w-64">
            <img src={org.bannerUrl} alt={`${org.name} Banner`} className="w-full h-full object-cover" />
          </div>
        )}
        
        <h3 className="font-bold text-xl text-[--color-text-base]">{org.name}</h3>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-[--color-text-muted] text-xs font-bold uppercase tracking-widest bg-[--color-bg-panel]/50 px-2.5 py-1 rounded-lg border border-[--color-border-base]">/{org.slug}</p>
          <a 
            href={`/${org.slug}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary py-1 px-3 text-[10px] flex items-center gap-2"
          >
            <Globe className="w-3 h-3" />
            View Live Wall
          </a>
        </div>

        {isAdmin && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-[--color-bg-panel] border border-[--color-border-base] rounded-lg px-3 py-1.5 focus-within:border-theme-500 transition-colors">
              <Globe className="w-3.5 h-3.5 text-theme-500" />
              <select 
                defaultValue={org.timezone}
                onChange={(e) => updateOrganizationTimezone(org.id, e.target.value)}
                className="bg-transparent text-xs font-bold text-[--color-text-base] outline-none"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Europe/London">London</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="file" 
                id={`banner-upload-${org.id}`}
                accept="image/*" 
                className="hidden"
                onChange={handleBannerUpload}
                disabled={loading}
              />
              <label 
                htmlFor={`banner-upload-${org.id}`}
                className="text-xs font-medium text-[--color-text-muted] hover:text-[--color-text-base] cursor-pointer transition-colors px-2 py-1 rounded bg-[--color-bg-panel] border border-[--color-border-base] hover:border-theme-500"
              >
                {loading ? "Uploading..." : org.bannerUrl ? "Change Banner" : "Upload Banner"}
              </label>
              
              {org.bannerUrl && (
                <button 
                  onClick={handleClearBanner}
                  disabled={loading}
                  className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-6 text-sm w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-[--color-border-base] justify-around md:justify-end">
        <div className="text-center">
          <span className="block text-xl font-semibold text-theme-400">{org._count.prayers}</span>
          <span className="text-[--color-text-muted] font-medium">Prayers</span>
        </div>
        <div className="text-center">
          <span className="block text-xl font-semibold text-theme-400">{org._count.chains}</span>
          <span className="text-[--color-text-muted] font-medium">Chains</span>
        </div>
        
        {isAdmin && (
          <>
            <div className="hidden md:block w-px bg-[--color-border-base] h-8 mx-2 self-center"></div>
            <div className="self-center">
              <DeleteButton id={org.id} action={deleteOrganization} itemType="organization" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
