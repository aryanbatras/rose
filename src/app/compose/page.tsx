'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MAX_IMAGES = 4;

export default function ComposePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const selected = files.slice(0, remaining);

    setImages((prev) => [...prev, ...selected]);
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagePreviews((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) {
      toast.error('Add some text or an image');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      images.forEach((img) => formData.append('images', img));

      const res = await fetch('/api/compose', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        toast.success('Posted!');
        router.push('/feed');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to post');
      }
    } catch {
      toast.error('Failed to post. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-[53px]">
          <button onClick={() => router.back()} className="text-sm text-foreground hover:text-muted-foreground transition-colors">
            Cancel
          </button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || (!text.trim() && images.length === 0)}>
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </header>

      <div className="flex gap-3 p-4">
        <div className="h-10 w-10 rounded-full bg-brand/20 shrink-0" />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            maxLength={300}
            className="w-full resize-none bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none border-none leading-normal"
            autoFocus
          />

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className={`mt-3 grid gap-2 ${imagePreviews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {imagePreviews.map((preview, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-border">
                  <img src={preview} alt="" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Image button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                className="p-2 text-muted-foreground hover:text-blue hover:bg-blue-subtle rounded-full transition-colors disabled:opacity-30"
                aria-label="Add images"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <span className="text-xs text-muted-foreground">
                {images.length}/{MAX_IMAGES}
              </span>
            </div>
            <div className="text-sm text-muted-foreground tabular-nums">
              {text.length}/300
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
