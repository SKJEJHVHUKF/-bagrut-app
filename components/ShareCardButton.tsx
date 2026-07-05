'use client';

// ShareCardButton — renders the achievement card, shows a preview modal,
// then shares (Web Share files) or downloads. Used from insights (streak)
// and practice completion screens.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Share2, X, Download, Loader2 } from 'lucide-react';
import { renderShareCard, shareOrDownload, type ShareCardInput } from '@/lib/share-card';

export default function ShareCardButton({
  card,
  className = '',
  label = 'שתף',
}: {
  card: ShareCardInput;
  className?: string;
  label?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  const openPreview = async () => {
    setBusy(true);
    try {
      const b = await renderShareCard(card);
      setBlob(b);
      setPreviewUrl(URL.createObjectURL(b));
    } catch {
      toast.error('לא הצלחנו ליצור את התמונה');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
  };

  const doShare = async () => {
    if (!blob) return;
    const outcome = await shareOrDownload(blob);
    toast.success(outcome === 'shared' ? 'שותף! 🎉' : 'התמונה ירדה — שתף אותה בוואטסאפ!');
    close();
  };

  return (
    <>
      <button
        onClick={openPreview}
        disabled={busy}
        className={
          className ||
          'inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 rounded-full px-3 py-1.5 transition-colors disabled:opacity-60'
        }
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
        <span>{label}</span>
      </button>

      <AnimatePresence>
        {previewUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              dir="rtl"
              className="fixed inset-x-4 top-[8vh] z-[81] max-w-sm mx-auto bg-[#FDFDFB] border border-slate-900/10 rounded-2xl shadow-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-slate-900">ככה זה ייראה</div>
                <button onClick={close} aria-label="סגור" className="w-7 h-7 rounded-lg hover:bg-slate-900/5 flex items-center justify-center text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="כרטיס הישג" className="w-full rounded-xl border border-slate-900/[0.08] max-h-[55vh] object-contain" />
              <button
                onClick={doShare}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-white"
              >
                <Download className="w-4 h-4" />
                <span>שתף / הורד</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
