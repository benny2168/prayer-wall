"use client";

import { updatePrayerChain, clearPrayerChainThumbnail } from "../../actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditChainForm({ chain }: { chain: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Pass the FormData directly to support file uploads
    const res = await updatePrayerChain(chain.id, formData);
    
    setLoading(false);
    
    if (res?.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
  };

  // Helper to format Date objects to YYYY-MM-DD for input type="date"
  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-[--color-text-muted] mb-1">Chain Title</label>
        <input 
          type="text" 
          name="title" 
          required 
          className="input-field" 
          defaultValue={chain.title} 
        />
      </div>

      <div>
        <label className="block text-sm text-[--color-text-muted] mb-1">Public Description (Optional)</label>
        <textarea 
          name="description" 
          className="input-field min-h-[80px]" 
          placeholder="A short description of this prayer chain that people will see when they sign up..." 
          defaultValue={chain.description || ""}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[--color-text-muted] mb-1">Start Date</label>
          <input 
            type="date" 
            name="start_time" 
            required 
            className="input-field [color-scheme:dark]" 
            defaultValue={formatDate(chain.start_time)}
          />
        </div>
        <div>
          <label className="block text-sm text-[--color-text-muted] mb-1">End Date</label>
          <input 
            type="date" 
            name="end_time" 
            required 
            className="input-field [color-scheme:dark]" 
            defaultValue={formatDate(chain.end_time)}
          />
        </div>
        <div>
          <label className="block text-sm text-[--color-text-muted] mb-1">Daily Start (24h)</label>
          <input 
            type="time" 
            name="daily_start" 
            required 
            className="input-field [color-scheme:dark]" 
            defaultValue={chain.daily_start}
          />
        </div>
        <div>
          <label className="block text-sm text-[--color-text-muted] mb-1">Daily End (24h)</label>
          <input 
            type="time" 
            name="daily_end" 
            required 
            className="input-field [color-scheme:dark]" 
            defaultValue={chain.daily_end}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-[--color-text-muted] mb-1">Block Duration</label>
        <select 
          name="block_duration_mins" 
          className="input-field appearance-none bg-[--color-bg-panel]"
          defaultValue={chain.block_duration_mins.toString()}
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 Hour</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-[--color-text-muted] mb-1">Max Signups per Block</label>
        <input 
          type="number" 
          name="max_people_per_block" 
          required 
          min="1" 
          className="input-field" 
          defaultValue={chain.max_people_per_block}
        />
      </div>

      <div>
        <label className="block text-sm text-[--color-text-muted] mb-1">Thumbnail Image (Optional)</label>
        {chain.thumbnailUrl && (
          <div className="mb-3">
            <div className="relative w-48 aspect-video rounded-lg overflow-hidden border border-[--color-border-base] group mb-2">
              <img src={chain.thumbnailUrl} alt="Thumbnail preview" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">Current Image</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={async () => {
                if (confirm("Are you sure you want to remove this thumbnail?")) {
                  const res = await clearPrayerChainThumbnail(chain.id);
                  if (res.success) window.location.reload();
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Thumbnail</span>
            </button>
          </div>
        )}
        <input 
          type="file" 
          name="thumbnail" 
          accept="image/*" 
          className="input-field py-2 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input 
              type="checkbox" 
              name="isPublic" 
              defaultChecked={chain.isPublic} 
              className="rounded border-[--color-border-base] bg-[--color-bg-panel]/50 text-primary w-5 h-5" 
            />
            <span className="text-[--color-text-base] group-hover:text-primary transition-colors font-medium">Show on organization page</span>
          </label>
        </div>
        <div>
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input 
              type="checkbox" 
              name="isActive" 
              defaultChecked={chain.isActive} 
              className="rounded border-[--color-border-base] bg-[--color-bg-panel]/50 text-primary w-5 h-5" 
            />
            <span className="text-[--color-text-base] group-hover:text-primary transition-colors font-medium">Active Status</span>
          </label>
        </div>
      </div>
      <p className="text-xs text-[--color-text-muted] -mt-4">
        Only active and public chains are displayed to the public. If inactive, no one can sign up.
      </p>

      <div className="pt-4 border-t border-[--color-border-base]">
        <button 
          type="submit" 
          className="btn-primary w-full flex justify-center py-2.5"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
