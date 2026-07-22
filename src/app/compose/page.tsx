'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Image, X } from 'lucide-react';

const MAX_IMAGES = 4;

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    }>
      <ComposeForm />
    </Suspense>
  );
}

function ComposeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reply context from query params
  const replyUri = searchParams.get('replyUri');
  const replyCid = searchParams.get('replyCid');
  const replyAuthor = searchParams.get('replyAuthor');
  const replyText = searchParams.get('replyText');

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

      // Add reply context if replying
      if (replyUri && replyCid) {
        formData.append('replyUri', replyUri);
        formData.append('replyCid', replyCid);
      }

      const res = await fetch('/api/compose', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        toast.success(replyUri ? 'Replied!' : 'Posted!');
        router.push(replyUri ? `/feed/${encodeURIComponent(replyUri)}` : '/feed');
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

      {/* Reply context */}
      {replyAuthor && replyText && (
        <div className="px-4 pt-3 pb-0 flex gap-3 items-start border-b border-border">
          <div className="w-10 shrink-0" />
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-sm text-muted-foreground">
              Replying to <span className="text-blue font-medium">@{replyAuthor}</span>
            </p>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {replyText}
            </p>
          </div>
        </div>
      )}

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
                    <X className="h-4 w-4" />
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
                <Image className="h-5 w-5" />
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
