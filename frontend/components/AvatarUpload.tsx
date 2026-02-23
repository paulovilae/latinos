"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";

export function AvatarUpload() {
  const { data: session, update } = useSession();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Since we rely on a custom session object or UserOut, we extract avatar_url if present
  // If next-auth session user object has `image` or `avatar_url`, we use it.
  const user = session?.user as any;
  const currentAvatar = user?.avatar_url || user?.image;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Using the session token
      const token = user?.accessToken;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL_PRIMARY || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${baseUrl}/api/users/me/avatar`, {
        method: "POST",
        headers, // Do NOT set Content-Type; FormData will handle the boundary automatically
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      const updatedUser = await res.json();
      
      // Update session explicitly so the Avatar updates anywhere else in the app referencing `session`
      await update({
        ...session,
        user: { ...session?.user, ...updatedUser, image: updatedUser.avatar_url, avatar_url: updatedUser.avatar_url }
      });
      
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setError(err.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <div className="relative group">
        <div className={`w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden transition-all ${uploading ? 'opacity-50 blur-sm' : ''}`}>
          {currentAvatar ? (
             // eslint-disable-next-line @next/next/no-img-element
            <img src={currentAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-slate-500 font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        )}

        <button 
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-2 -right-2 bg-indigo-500 hover:bg-indigo-400 text-white p-1.5 rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
          title="Upload new avatar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="flex-1">
        <h3 className="text-white font-medium mb-1">Profile Photo</h3>
        <p className="text-xs text-slate-400 mb-2">Recommended: Square JPG, PNG. Max 5MB.</p>
        {error && <p className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2 rounded">{error}</p>}
      </div>

      <input 
        type="file" 
        accept="image/png, image/jpeg, image/webp" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
}
