"use client";

import { useState } from "react";
import { addPrayerChainSignup, removePrayerChainSignup, updatePrayerChainSignup } from "@/app/admin/actions";

export default function SignupManager({ 
  chainId, 
  allSlots, 
  existingSignups, 
  maxPeoplePerBlock 
}: { 
  chainId: string, 
  allSlots: Date[], 
  existingSignups: any[], 
  maxPeoplePerBlock: number 
}) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingSignupId, setEditingSignupId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (startTime: Date, index: number) => {
    if (!name) {
      setError("Name is required");
      return;
    }
    
    setLoading(`add-${index}`);
    setError(null);
    
    const res = await addPrayerChainSignup(chainId, startTime, name, email);
    
    setLoading(null);
    if (res?.error) {
      setError(res.error);
    } else {
      setName("");
      setEmail("");
      setActiveSlot(null);
    }
  };

  const handleRemove = async (signupId: string) => {
    if (!confirm("Are you sure you want to remove this person from the chain?")) return;
    
    setLoading(`remove-${signupId}`);
    await removePrayerChainSignup(signupId);
    setLoading(null);
  };

  const handleUpdate = async (signupId: string) => {
    if (!editName) {
      setError("Name is required");
      return;
    }
    
    setLoading(`update-${signupId}`);
    setError(null);
    
    const res = await updatePrayerChainSignup(signupId, editName, editEmail);
    
    setLoading(null);
    if (res?.error) {
      setError(res.error);
    } else {
      setEditingSignupId(null);
    }
  };

  // Group slots by date for a better UI layout
  const groupedSlots: Record<string, Date[]> = {};
  allSlots.forEach(slot => {
    const dateStr = slot.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!groupedSlots[dateStr]) groupedSlots[dateStr] = [];
    groupedSlots[dateStr].push(slot);
  });

  return (
    <div className="flex flex-col h-full max-h-[800px]">
      <div className="overflow-y-auto p-4 space-y-8 flex-1">
        {allSlots.length === 0 && (
          <div className="text-center py-12 text-[--color-text-muted] italic">
            No time slots generated. Please check your schedule settings.
          </div>
        )}

        {Object.entries(groupedSlots).map(([dateStr, slots], dayIndex) => (
          <div key={dayIndex} className="space-y-4">
            <h3 className="font-semibold text-theme-400 sticky top-0 bg-[--color-bg-panel] py-1 px-2 rounded -mx-2 z-10 shadow-sm">
              {dateStr}
            </h3>
            
            <div className="space-y-3">
              {slots.map((slot, index) => {
                const globalIndex = dayIndex * 1000 + index; // unique ID generator for UI state
                const slotTime = slot.getTime();
                
                // Find existing signups for this exact millisecond timestamp block
                const signupsForThisSlot = existingSignups.filter(s => new Date(s.startTime).getTime() === slotTime);
                const isFull = signupsForThisSlot.length >= maxPeoplePerBlock;

                return (
                  <div key={globalIndex} className={`p-4 rounded-lg border ${isFull ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[--color-border-base] bg-[--color-bg-base]'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-[--color-text-base]">
                        {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isFull ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-[--color-text-muted]'}`}>
                        {signupsForThisSlot.length} / {maxPeoplePerBlock} Filled
                      </span>
                    </div>

                    {/* Existing Signups */}
                    {signupsForThisSlot.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {signupsForThisSlot.map((signup) => (
                          <div key={signup.id} className="bg-[--color-bg-panel] rounded-md text-sm border border-transparent">
                            {editingSignupId === signup.id ? (
                              <div className="p-3 space-y-3 border border-theme-500/50 rounded-md">
                                {error && <div className="text-xs text-red-400 bg-red-400/10 p-1.5 rounded">{error}</div>}
                                <input 
                                  type="text" 
                                  placeholder="Full Name" 
                                  value={editName} 
                                  onChange={e => setEditName(e.target.value)} 
                                  className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded px-3 py-1.5 text-sm text-[--color-text-base] focus:outline-none focus:border-theme-500"
                                />
                                <input 
                                  type="email" 
                                  placeholder="Email Address (Optional)" 
                                  value={editEmail} 
                                  onChange={e => setEditEmail(e.target.value)} 
                                  className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded px-3 py-1.5 text-sm text-[--color-text-base] focus:outline-none focus:border-theme-500"
                                />
                                <div className="flex justify-end gap-2 pt-1 border-t border-[--color-border-base]/50">
                                  <button 
                                    onClick={() => {
                                      setEditingSignupId(null);
                                      setError(null);
                                    }}
                                    className="text-xs text-[--color-text-muted] hover:text-[--color-text-base] px-2"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleUpdate(signup.id)}
                                    disabled={loading === `update-${signup.id}`}
                                    className="bg-theme-600 hover:bg-theme-500 text-white text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
                                  >
                                    {loading === `update-${signup.id}` ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center px-3 py-2">
                                <div className="flex flex-col">
                                  <span className="font-medium text-[--color-text-base]">{signup.name}</span>
                                  <span className="text-xs text-[--color-text-muted]">{signup.email || <span className="italic opacity-50">No email provided</span>}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingSignupId(signup.id);
                                      setEditName(signup.name);
                                      setEditEmail(signup.email || "");
                                      setActiveSlot(null);
                                      setError(null);
                                    }}
                                    className="text-theme-400 hover:text-theme-300 text-xs px-2 py-1 bg-theme-500/10 rounded transition-colors disabled:opacity-50"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleRemove(signup.id)}
                                    disabled={loading === `remove-${signup.id}`}
                                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                  >
                                    {loading === `remove-${signup.id}` ? "..." : "Drop"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Signup UI */}
                    {!isFull && (
                      <div>
                        {activeSlot === globalIndex ? (
                          <div className="bg-[--color-bg-panel] p-3 rounded-md border border-[--color-border-base] space-y-3 mt-2">
                            {error && <div className="text-xs text-red-400 bg-red-400/10 p-1.5 rounded">{error}</div>}
                            <input 
                              type="text" 
                              placeholder="Full Name" 
                              value={name} 
                              onChange={e => setName(e.target.value)} 
                              className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded px-3 py-1.5 text-sm text-[--color-text-base] focus:outline-none focus:border-theme-500"
                            />
                            <input 
                              type="email" 
                              placeholder="Email Address" 
                              value={email} 
                              onChange={e => setEmail(e.target.value)} 
                              className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded px-3 py-1.5 text-sm text-[--color-text-base] focus:outline-none focus:border-theme-500"
                            />
                            <div className="flex justify-end gap-2 pt-1 border-t border-[--color-border-base]/50">
                              <button 
                                onClick={() => {
                                  setActiveSlot(null);
                                  setError(null);
                                }}
                                className="text-xs text-[--color-text-muted] hover:text-[--color-text-base] px-2"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleAdd(slot, globalIndex)}
                                disabled={loading === `add-${globalIndex}`}
                                className="bg-theme-600 hover:bg-theme-500 text-white text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
                              >
                                {loading === `add-${globalIndex}` ? "Adding..." : "Add Person"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setActiveSlot(globalIndex);
                              setName("");
                              setEmail("");
                              setError(null);
                            }}
                            className="text-xs font-medium text-theme-400 hover:text-theme-300 transition-colors w-full text-left py-1"
                          >
                            + Add manually
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
