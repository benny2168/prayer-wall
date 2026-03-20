"use client";

import { useTransition } from "react";

export default function DeleteButton({
  id,
  action,
  itemType,
}: {
  id: string;
  action: (id: string) => Promise<{ success?: boolean; error?: string }>;
  itemType: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`)) {
      startTransition(async () => {
        const res = await action(id);
        if (res?.error) {
          alert(res.error);
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={`text-red-500 hover:text-red-400 font-medium text-sm transition-colors ${
        isPending ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
