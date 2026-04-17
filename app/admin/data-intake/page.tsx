'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import type { IntakeEntry, IntakeSource } from '../../../lib/supabase/database.types';

type Tab = 'ocr' | 'whatsapp' | 'csv' | 'mobile';

type ParsedNeed = {
  title: string;
  type: 'Medical' | 'Food' | 'Shelter' | 'Water' | 'Education';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  people_affected: number;
  description?: string;
  reporter?: string;
};

type QueueItem = IntakeEntry & {
  parsed_data: (Record<string, unknown> & ParsedNeed) | null;
};

type OcrProgress = {
  status: string;
  progress: number;
};

const SOURCE_COLORS: Record<string, string> = { whatsapp: '#10b981', ocr: '#6366f1', csv: '#f59e0b', mobile: '#06b6d4' };
const SOURCE_ICONS: Record<string, string> = { whatsapp: '💬', ocr: '📄', csv: '📊', mobile: '📱' };

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function inferType(text: string): ParsedNeed['type'] {
  const lower = text.toLowerCase();
  if (/(doctor|medicine|medical|fever|first aid|hospital|ors|health|clinic|inject|tablet|drug|wound|injury|blood|sick|ill|pain)/.test(lower)) return 'Medical';
  if (/(food|meal|ration|hunger|hungry|rice|dal|grain|nutrition|eat|cook|kitchen|bread|wheat)/.test(lower)) return 'Food';
  if (/(shelter|tent|roof|tarpaulin|bedding|house|home|housing|accommodation|displaced|flood|rain|sleep)/.test(lower)) return 'Shelter';
  if (/(water|drinking water|pipeline|thirsty|tanker|tap|well|bore|purif|contaminated|supply)/.test(lower)) return 'Water';
  return 'Education';
}

function inferSeverity(text: string): ParsedNeed['severity'] {
  const lower = text.toLowerCase();
  if (/(urgent|emergency|critical|immediately|outbreak|life|death|dying|severe|extreme|crisis|sos)/.test(lower)) return 'critical';
  if (/(high|serious|shortage|flood|damaged|badly|major|significant|required)/.test(lower)) return 'high';
  if (/(medium|soon|needed|necessary|moderate|some)/.test(lower)) return 'medium';
  return 'low';
}

function inferPeople(text: string) {
  const patterns = [
    /(\d{1,5})\s*(?:people|person|family|families|individuals|residents|victims|affected)/i,
    /(?:about|approximately|around|nearly|over)\s*(\d{1,5})/i,
    /(\d{1,5})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Math.min(Number(m[1]), 99999);
  }
  return 0;
}

function inferLocation(text: string) {
  const knownLocations = [
    'Dharavi Sector 4', 'Dharavi', 'Kurla West', 'Kurla', 'Bandra East', 'Bandra',
    'Andheri West', 'Andheri', 'Govandi', 'Worli', 'Dadar', 'Chembur', 'Mulund',
    'Thane', 'Borivali', 'Malad', 'Kandivali', 'Jogeshwari', 'Santacruz', 'Vile Parle',
    'Matunga', 'Sion', 'Ghatkopar', 'Vikhroli', 'Bhandup', 'Nahur',
  ];
  const found = knownLocations.find(loc => text.toLowerCase().includes(loc.toLowerCase()));
  return found || 'Location needs review';
}

function buildParsedNeed(rawText: string, fallbackTitle: string, reporter?: string): ParsedNeed {
  const clean = normalizeText(rawText);
  const sentences = clean.split(/[.\n]/);
  const titleCandidate = sentences.find(s => s.trim().length > 10 && s.trim().length < 80);
  return {
    title: titleCandidate?.trim() || fallbackTitle,
    type: inferType(clean),
    severity: inferSeverity(clean),
    location: inferLocation(clean),
    people_affected: inferPeople(clean),
    description: clean,
    reporter,
  };
}

function getPreview(item: QueueItem) {
  return item.raw_text || item.parsed_data?.description || item.parsed_data?.title || 'No preview available';
}

function getReporter(item: QueueItem) {
  return String(item.parsed_data?.reporter || 'Unknown source');
}

function getRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.round(diffHours / 24)} day ago`;
}

// ──────────────────────────────────────────────
// Real OCR Engine via Tesseract.js (browser)
// ──────────────────────────────────────────────
async function runTesseractOCR(
  imageFile: File,
  onProgress: (p: OcrProgress) => void
): Promise<string> {
  // Dynamically import to avoid SSR issues
  const Tesseract = (await import('tesseract.js')).default;

  const result = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' || m.status === 'loading language traineddata' || m.status === 'initializing tesseract') {
        onProgress({ status: m.status, progress: Math.round((m.progress || 0) * 100) });
      }
    },
  });
  return result.data.text;
}

// ──────────────────────────────────────────────
// Real CSV Parser
// ──────────────────────────────────────────────
function parseCSVText(text: string): ParsedNeed[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  return lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });

    const rawTitle = row['title'] || row['need'] || row['description'] || `Row ${idx + 2}`;
    const rawType = row['type'] || row['category'] || '';
    const rawSeverity = row['severity'] || row['urgency'] || row['priority'] || '';
    const rawLocation = row['location'] || row['area'] || row['region'] || '';
    const rawPeople = row['people'] || row['people_affected'] || row['count'] || '0';
    const rawDesc = row['description'] || row['notes'] || rawTitle;

    const validTypes: ParsedNeed['type'][] = ['Medical', 'Food', 'Shelter', 'Water', 'Education'];
    const validSeverities: ParsedNeed['severity'][] = ['critical', 'high', 'medium', 'low'];

    return {
      title: normalizeText(rawTitle),
      type: (validTypes.find(t => t.toLowerCase() === rawType.toLowerCase()) || inferType(rawTitle + ' ' + rawDesc)) as ParsedNeed['type'],
      severity: (validSeverities.find(s => s.toLowerCase() === rawSeverity.toLowerCase()) || inferSeverity(rawTitle + ' ' + rawDesc)) as ParsedNeed['severity'],
      location: rawLocation || inferLocation(rawTitle + ' ' + rawDesc),
      people_affected: Math.abs(parseInt(rawPeople, 10)) || inferPeople(rawTitle + ' ' + rawDesc),
      description: normalizeText(rawDesc),
      reporter: `${line.slice(0, 30)}... • Row ${idx + 2}`,
    };
  });
}

export default function DataIntakePage() {
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<Tab>('ocr');

  // OCR state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({ status: '', progress: 0 });
  const [ocrResult, setOcrResult] = useState('');

  // WhatsApp state
  const [whatsappSender, setWhatsappSender] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState('');

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsedRows, setCsvParsedRows] = useState<ParsedNeed[]>([]);
  const [csvError, setCsvError] = useState('');

  // Mobile state
  const [mobileForm, setMobileForm] = useState({
    title: '', reporter: '', people: '', type: 'Medical', severity: 'high', location: '', description: '',
  });

  // Queue
  const [pendingItems, setPendingItems] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch('/api/intake?status=pending');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load intake queue');
      setPendingItems(data.items || []);
    } catch (e: unknown) {
      toastError('Failed to load intake queue', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoadingQueue(false);
    }
  }, [toastError]);

  useEffect(() => { void fetchQueue(); }, [fetchQueue]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => { if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl); };
  }, [ocrPreviewUrl]);

  const handleOcrFileChange = (file: File) => {
    setOcrFile(file);
    setOcrResult('');
    if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl);
    const url = URL.createObjectURL(file);
    setOcrPreviewUrl(url);
    setOcrProgress({ status: '', progress: 0 });
  };

  const handleCsvFileChange = async (file: File) => {
    setCsvFile(file);
    setCsvParsedRows([]);
    setCsvError('');
    try {
      const text = await file.text();
      const rows = parseCSVText(text);
      if (rows.length === 0) {
        setCsvError('No valid rows found. Ensure CSV has headers: title, type, severity, location, people, description');
        return;
      }
      setCsvParsedRows(rows);
    } catch (e) {
      setCsvError('Failed to read CSV file. Make sure it is a valid .csv file.');
    }
  };

  const submitIntakeItems = useCallback(async (
    items: Array<{ source: IntakeSource; raw_text?: string | null; parsed_data?: Record<string, unknown> | null }>,
    successMessage: string
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add to review queue');
      setPendingItems(prev => [...(data.items || []), ...prev]);
      success('Added to review queue ✅', successMessage);
    } catch (e: unknown) {
      toastError('Queue submission failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }, [success, toastError]);

  // ─── Real OCR Processing ───────────────────────────────
  const runOCR = async () => {
    if (!ocrFile) return;
    setOcrProcessing(true);
    setOcrResult('');
    setOcrProgress({ status: 'Initializing OCR engine...', progress: 0 });
    try {
      const text = await runTesseractOCR(ocrFile, p => setOcrProgress(p));
      if (!text.trim()) {
        toastError('OCR returned empty result', 'Try a clearer scan or different image. Borders and background can affect accuracy.');
        return;
      }
      setOcrResult(text.trim());
      setOcrProgress({ status: 'complete', progress: 100 });
    } catch (e: unknown) {
      toastError('OCR failed', e instanceof Error ? e.message : 'Unknown error');
      setOcrProgress({ status: '', progress: 0 });
    } finally {
      setOcrProcessing(false);
    }
  };

  const addOcrToQueue = async () => {
    const parsed = buildParsedNeed(ocrResult, 'Document intake via OCR', ocrFile?.name || 'Uploaded form');
    await submitIntakeItems([{ source: 'ocr', raw_text: ocrResult, parsed_data: parsed }],
      'OCR extract is ready for admin review.');
    setOcrFile(null);
    setOcrResult('');
    if (ocrPreviewUrl) { URL.revokeObjectURL(ocrPreviewUrl); setOcrPreviewUrl(null); }
    setOcrProgress({ status: '', progress: 0 });
  };

  const addWhatsappToQueue = async () => {
    if (!whatsappMsg.trim()) return;
    const parsed = buildParsedNeed(whatsappMsg, 'WhatsApp assistance request', whatsappSender || 'WhatsApp sender');
    await submitIntakeItems([{ source: 'whatsapp', raw_text: whatsappMsg, parsed_data: parsed }],
      'WhatsApp message added to the queue.');
    setWhatsappMsg('');
    setWhatsappSender('');
  };

  const importCsvToQueue = async () => {
    if (csvParsedRows.length === 0) return;
    const items = csvParsedRows.map(row => ({
      source: 'csv' as const,
      raw_text: `${row.reporter || csvFile?.name}: ${row.title}. ${row.description}`,
      parsed_data: row,
    }));
    await submitIntakeItems(items, `${items.length} CSV rows added to the queue.`);
    setCsvFile(null);
    setCsvParsedRows([]);
  };

  const submitMobileToQueue = async () => {
    if (!mobileForm.title.trim() || !mobileForm.location.trim()) {
      toastError('Validation error', 'Need title and location are required.');
      return;
    }
    const parsed: ParsedNeed = {
      title: normalizeText(mobileForm.title),
      type: mobileForm.type as ParsedNeed['type'],
      severity: mobileForm.severity as ParsedNeed['severity'],
      location: normalizeText(mobileForm.location),
      people_affected: Number(mobileForm.people || 0),
      description: normalizeText(mobileForm.description || mobileForm.title),
      reporter: mobileForm.reporter || 'Mobile field worker',
    };
    await submitIntakeItems([{
      source: 'mobile',
      raw_text: `${parsed.reporter}: ${parsed.description}`,
      parsed_data: parsed,
    }], 'Mobile entry added to the queue.');
    setMobileForm({ title: '', reporter: '', people: '', type: 'Medical', severity: 'high', location: '', description: '' });
  };

  const updateQueueItem = async (id: string, status: 'approved' | 'rejected') => {
    setWorkingId(id);
    try {
      const res = await fetch(`/api/intake/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to mark item ${status}`);
      setPendingItems(items => items.filter(item => item.id !== id));
      if (status === 'approved') {
        success('Need created ✅', `"${data.need?.title}" was added to the needs database.`);
      } else {
        success('Item rejected', 'The intake item was removed from the review queue.');
      }
    } catch (e: unknown) {
      toastError('Queue update failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setWorkingId(null);
    }
  };

  const whatsappPreview = whatsappMsg
    ? buildParsedNeed(whatsappMsg, 'WhatsApp assistance request', whatsappSender || 'WhatsApp sender')
    : null;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'ocr', label: 'Paper Form (OCR)', icon: '📄' },
    { id: 'whatsapp', label: 'WhatsApp / SMS', icon: '💬' },
    { id: 'csv', label: 'CSV Upload', icon: '📊' },
    { id: 'mobile', label: 'Mobile Form', icon: '📱' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">📡 Multi-Source Data Intake</h1>
            <p className="page-subtitle">Digitize and process community data from all sources</p>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-sm)', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--brand-warm)' }}>
            ⏳ {loadingQueue ? 'Loading...' : `${pendingItems.length} inputs pending review`}
          </div>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {[
            { icon: '📄', label: 'Paper\n(OCR)', color: SOURCE_COLORS.ocr },
            null,
            { icon: '💬', label: 'WhatsApp\n/SMS', color: SOURCE_COLORS.whatsapp },
            null,
            { icon: '📱', label: 'Mobile\nForm', color: SOURCE_COLORS.mobile },
            null,
            { icon: '📊', label: 'CSV\nUpload', color: SOURCE_COLORS.csv },
            'arrow',
            { icon: '🔍', label: 'NLP Parse\n& Review', color: 'var(--brand-primary-light)' },
            'arrow',
            { icon: '✅', label: 'Admin\nApprove', color: 'var(--brand-accent)' },
            'arrow',
            { icon: '🗄️', label: 'Needs\nDatabase', color: 'var(--low)' },
          ].map((step, i) => {
            if (step === null) return <span key={i} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0 4px' }}>/</span>;
            if (typeof step === 'string') return <span key={i} style={{ color: 'var(--text-muted)', fontSize: '1.25rem', margin: '0 8px' }}>→</span>;
            const s = step as { icon: string; label: string; color: string };
            return (
              <div key={i} style={{ textAlign: 'center', padding: '6px 14px', background: `${s.color}15`, borderRadius: 'var(--radius-sm)', border: `1px solid ${s.color}30` }}>
                <div style={{ fontSize: '1.125rem' }}>{s.icon}</div>
                <div style={{ fontSize: '0.65rem', color: s.color, fontWeight: 600, whiteSpace: 'pre-line', marginTop: 2 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
        {/* Left: Input Tabs */}
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-border)' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                id={`intake-tab-${t.id}-btn`}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '8px 10px', border: 'none', borderRadius: 6,
                  background: tab === t.id ? `${SOURCE_COLORS[t.id]}20` : 'transparent',
                  color: tab === t.id ? SOURCE_COLORS[t.id] : 'var(--text-secondary)',
                  fontSize: '0.75rem', fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer',
                  transition: 'all var(--transition-fast)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>{t.icon}</span>
                <span>{t.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* ─── OCR TAB ─────────────────────────────── */}
          {tab === 'ocr' && (
            <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 className="h4">📄 Paper Form — Real OCR Engine</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Upload any scanned form or photograph. Tesseract.js extracts text directly in your browser.
                </p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleOcrFileChange(f); }}
                style={{
                  border: `2px dashed ${ocrFile ? 'var(--brand-primary)' : 'var(--bg-border-hover)'}`,
                  borderRadius: 'var(--radius-lg)', padding: ocrPreviewUrl ? 0 : '32px',
                  textAlign: 'center', cursor: 'pointer', overflow: 'hidden',
                  transition: 'border-color var(--transition-fast)',
                  background: ocrFile ? 'rgba(99,102,241,0.05)' : 'var(--bg-elevated)',
                  position: 'relative', minHeight: ocrPreviewUrl ? 200 : 'auto',
                }}
                id="ocr-upload-area"
              >
                {ocrPreviewUrl ? (
                  <img
                    src={ocrPreviewUrl}
                    alt="Uploaded form preview"
                    style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>📷</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Click or drag & drop image here</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>PNG, JPG, JPEG supported · Max 10MB</div>
                  </>
                )}
              </div>
              <input
                ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} id="ocr-file-input"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleOcrFileChange(f); e.target.value = ''; }}
              />

              {ocrFile && !ocrResult && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📎 {ocrFile.name} · {(ocrFile.size / 1024).toFixed(1)} KB
                  <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--critical)', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => { setOcrFile(null); setOcrResult(''); if (ocrPreviewUrl) { URL.revokeObjectURL(ocrPreviewUrl); setOcrPreviewUrl(null); } }}>✕ Remove</button>
                </div>
              )}

              {/* Progress */}
              {ocrProcessing && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    <span>🔍 {ocrProgress.status || 'Processing...'}</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand-primary-light)' }}>{ocrProgress.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${ocrProgress.progress}%`, transition: 'width 0.4s ease', background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>OCR running locally in your browser · No data leaves your device</div>
                </div>
              )}

              <button className="btn btn-primary" id="ocr-process-btn" onClick={runOCR} disabled={!ocrFile || ocrProcessing}>
                {ocrProcessing ? <><span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span> Processing OCR...</> : '🔍 Extract Text with OCR'}
              </button>

              {ocrResult && (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Extracted Text (editable)</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--low)' }}>✓ OCR complete</span>
                  </div>
                  <textarea
                    className="form-input" rows={8} value={ocrResult}
                    onChange={e => setOcrResult(e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                    id="ocr-result-textarea"
                  />
                  <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 10 }}>
                    🤖 <strong>Auto-parsed:</strong> Type: <strong>{inferType(ocrResult)}</strong> · Severity: <strong>{inferSeverity(ocrResult)}</strong> · Location: <strong>{inferLocation(ocrResult)}</strong> · People: <strong>{inferPeople(ocrResult) || 'needs review'}</strong>
                  </div>
                  <button className="btn btn-accent" id="ocr-parse-btn" style={{ marginTop: 12, width: '100%' }} onClick={addOcrToQueue} disabled={submitting}>
                    🤖 Parse & Add to Review Queue →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── WHATSAPP TAB ────────────────────────── */}
          {tab === 'whatsapp' && (
            <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 className="h4">💬 WhatsApp / SMS Parser</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>Paste a message and NLP will extract need data automatically.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Sender Number / Name</label>
                <input className="form-input" id="wa-sender-input" placeholder="+91 XXXXX XXXXX or Name" value={whatsappSender} onChange={e => setWhatsappSender(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Message Text *</label>
                <textarea
                  className="form-input" id="wa-message-input" rows={5}
                  placeholder='e.g. "Emergency!! Dharavi sector 4 mein urgent medical help chahiye, 120 log affected hain..."'
                  value={whatsappMsg} onChange={e => setWhatsappMsg(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
              {whatsappPreview && (
                <div className="animate-fade-in" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--low)', marginBottom: 8 }}>🤖 NLP Parsed Result (Live Preview)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <div><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Title:</span> {whatsappPreview.title}</div>
                    <div><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Type:</span> {whatsappPreview.type}</div>
                    <div><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Location:</span> {whatsappPreview.location}</div>
                    <div><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Urgency:</span> <span className={`badge badge-${whatsappPreview.severity}`}>{whatsappPreview.severity}</span></div>
                    <div><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>People:</span> {whatsappPreview.people_affected || 'Needs review'}</div>
                  </div>
                  <button className="btn btn-accent btn-sm" style={{ marginTop: 10, width: '100%' }} id="wa-add-queue-btn" onClick={addWhatsappToQueue} disabled={submitting || !whatsappMsg.trim()}>
                    Add to Review Queue →
                  </button>
                </div>
              )}
              {!whatsappPreview && whatsappMsg.length === 0 && (
                <button className="btn btn-primary" id="wa-parse-btn" disabled style={{ opacity: 0.5 }}>🤖 Parse & Extract Need Data →</button>
              )}
            </div>
          )}

          {/* ─── CSV TAB ─────────────────────────────── */}
          {tab === 'csv' && (
            <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 className="h4">📊 CSV / Spreadsheet Import</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Real CSV parsing — headers: <code>title, type, severity, location, people, description</code>
                </p>
              </div>
              <div
                onClick={() => csvRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCsvFileChange(f); }}
                style={{ border: `2px dashed ${csvFile ? 'var(--brand-warm)' : 'var(--bg-border-hover)'}`, borderRadius: 'var(--radius-lg)', padding: '28px', textAlign: 'center', cursor: 'pointer', background: csvFile ? 'rgba(245,158,11,0.05)' : 'var(--bg-elevated)' }}
                id="csv-upload-area"
              >
                {csvFile ? (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--brand-warm)', fontWeight: 600 }}>{csvFile.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{(csvFile.size / 1024).toFixed(1)} KB · {csvParsedRows.length} rows parsed</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>📤</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Upload CSV file</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>.csv supported · Drag & drop or click</div>
                  </>
                )}
              </div>
              <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} id="csv-file-input" onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFileChange(f); e.target.value = ''; }} />

              {csvError && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--critical)', fontSize: '0.8125rem' }}>
                  ⚠️ {csvError}
                </div>
              )}

              {csvParsedRows.length > 0 && (
                <div className="animate-fade-in">
                  <h4 className="h5" style={{ marginBottom: 10 }}>Preview — {csvParsedRows.length} rows parsed</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                    {csvParsedRows.map((row, i) => (
                      <div key={i} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', fontSize: '0.8125rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--brand-warm)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{row.title}</strong>
                        <div style={{ marginTop: 3 }}>{row.type} · <span className={`badge badge-${row.severity}`} style={{ fontSize: '0.65rem' }}>{row.severity}</span> · {row.location} · {row.people_affected} people</div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 14, width: '100%' }} id="csv-import-btn" onClick={importCsvToQueue} disabled={submitting}>
                    📥 Import {csvParsedRows.length} Records to Queue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── MOBILE TAB ──────────────────────────── */}
          {tab === 'mobile' && (
            <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h3 className="h4">📱 Mobile Quick Entry</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>Direct structured entry for field workers — goes straight to the review queue.</p>
              </div>
              {[
                { label: 'Need Title *', id: 'mob-title', key: 'title', placeholder: 'Brief description of the need', type: 'text' },
                { label: 'Reporter Name', id: 'mob-name', key: 'reporter', placeholder: 'Your name', type: 'text' },
                { label: 'People Affected', id: 'mob-people', key: 'people', placeholder: 'Estimate count', type: 'number' },
              ].map(f => (
                <div key={f.id} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" id={f.id} placeholder={f.placeholder} type={f.type} value={mobileForm[f.key as keyof typeof mobileForm]} onChange={e => setMobileForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" id="mob-type" value={mobileForm.type} onChange={e => setMobileForm(prev => ({ ...prev, type: e.target.value }))}>
                    {['Medical', 'Food', 'Shelter', 'Water', 'Education'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity *</label>
                  <select className="form-select" id="mob-severity" value={mobileForm.severity} onChange={e => setMobileForm(prev => ({ ...prev, severity: e.target.value }))}>
                    {['critical', 'high', 'medium', 'low'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <div className="flex gap-2">
                  <input className="form-input" id="mob-location" placeholder="Area, City" style={{ flex: 1 }} value={mobileForm.location} onChange={e => setMobileForm(prev => ({ ...prev, location: e.target.value }))} />
                  <button
                    className="btn btn-secondary" id="mob-gps-btn" title="Use GPS" type="button"
                    onClick={() => {
                      if (!navigator.geolocation) { toastError('GPS not available', 'Your browser does not support geolocation.'); return; }
                      navigator.geolocation.getCurrentPosition(
                        pos => setMobileForm(prev => ({ ...prev, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` })),
                        () => toastError('GPS failed', 'Could not get location. Type manually.')
                      );
                    }}
                  >📍</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes / Description</label>
                <textarea className="form-input" rows={4} id="mob-notes" value={mobileForm.description} onChange={e => setMobileForm(prev => ({ ...prev, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <button className="btn btn-primary" id="mob-submit-btn" onClick={submitMobileToQueue} disabled={submitting}>
                {submitting ? '⟳ Submitting...' : '📨 Submit to Review Queue'}
              </button>
            </div>
          )}
        </div>

        {/* ─── Right: Review Queue ─────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3">Review Queue</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-brand">{loadingQueue ? '...' : `${pendingItems.length} pending`}</span>
              <button className="btn btn-ghost btn-sm" onClick={fetchQueue} id="queue-refresh-btn">🔄</button>
            </div>
          </div>
          {loadingQueue ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: '16px', opacity: 0.5 }}>
                  <div style={{ height: 14, width: '35%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ height: 12, width: '80%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 12, width: '60%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon">✅</div>
              <p className="text-secondary">All inputs reviewed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingItems.map(item => (
                <div key={item.id} className="card" style={{ padding: '16px', borderLeft: `3px solid ${SOURCE_COLORS[item.source] || '#6366f1'}` }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                    <span className="badge" style={{ background: `${SOURCE_COLORS[item.source] || '#6366f1'}18`, color: SOURCE_COLORS[item.source] || '#6366f1', border: `1px solid ${SOURCE_COLORS[item.source] || '#6366f1'}30` }}>
                      {SOURCE_ICONS[item.source] || '📋'} {item.source}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getReporter(item)}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRelativeTime(item.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6, maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getPreview(item)}
                  </div>
                  {item.parsed_data && (
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 12 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>🤖 Parsed</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          ['title', item.parsed_data.title],
                          ['type', item.parsed_data.type],
                          ['severity', item.parsed_data.severity],
                          ['location', item.parsed_data.location],
                          ['people', item.parsed_data.people_affected],
                        ].map(([k, v]) => (
                          <span key={k} className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{k}: {String(v ?? '-')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button className="btn btn-accent btn-sm" id={`approve-${item.id}-btn`} style={{ flex: 1 }} onClick={() => updateQueueItem(item.id, 'approved')} disabled={workingId === item.id}>
                      {workingId === item.id ? 'Saving...' : '✓ Approve & Save to DB'}
                    </button>
                    <button className="btn btn-danger btn-sm" id={`reject-${item.id}-btn`} onClick={() => updateQueueItem(item.id, 'rejected')} disabled={workingId === item.id}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
