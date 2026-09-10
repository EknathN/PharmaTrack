"use client";

import { useState, useRef } from "react";

interface ProofUploadProps {
  label: string;
  accept?: string;
  required?: boolean;
  onUploaded: (url: string) => void;
  hint?: string;
}

export default function ProofUpload({ label, accept = "image/*", required = false, onUploaded, hint }: ProofUploadProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setStatus('done');
        setUploadedUrl(data.url);
        onUploaded(data.url);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
          ${status === 'done' ? 'border-emerald-400 bg-emerald-50' : 
            status === 'error' ? 'border-red-400 bg-red-50' :
            'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'}`}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
        
        {status === 'idle' && (
          <div className="space-y-1">
            <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-slate-500">Click to upload file</p>
          </div>
        )}
        {status === 'uploading' && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-sm">Uploading...</span>
          </div>
        )}
        {status === 'done' && (
          <div className="space-y-2">
            {preview && <img src={preview} className="h-24 mx-auto rounded-lg object-cover" alt="preview" />}
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              <span className="text-sm font-medium">Uploaded successfully</span>
            </div>
            <button type="button" className="text-xs text-slate-500 underline" onClick={(e) => { e.stopPropagation(); setStatus('idle'); setPreview(null); }}>Change file</button>
          </div>
        )}
        {status === 'error' && (
          <div className="text-red-500 text-sm">Upload failed. Click to try again.</div>
        )}
      </div>
    </div>
  );
}
