import { useState } from 'react';
import { Share2, Plus, X, Copy, Check, Edit2, Trash2, List, CalendarDays } from 'lucide-react';
import { useContentPosts, useCreateContentPost, useUpdateContentPost, useDeleteContentPost } from '@/hooks/useContent';
import { useTranslation } from 'react-i18next';
import { useT, getStatusLabel } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { Database } from '@/types/supabase';

type ContentPost = Database['public']['Tables']['content_posts']['Row'];
type PostStatus = ContentPost['status'];
type PostPlatform = ContentPost['platform'];
type PostType = ContentPost['post_type'];

const STATUS_CLS: Record<PostStatus, string> = {
  IDEA:      'ds-badge ds-badge-neutral',
  DRAFT:     'ds-badge ds-badge-warn',
  READY:     'ds-badge ds-badge-a',
  PUBLISHED: 'ds-badge ds-badge-ok',
};

const PLATFORMS: PostPlatform[] = ['INSTAGRAM', 'FACEBOOK', 'BOTH'];
const POST_TYPES: PostType[] = ['EDUCATIONAL', 'PROMOTIONAL', 'BEFORE_AFTER', 'TESTIMONIAL', 'TEAM', 'OFFER'];
const STATUSES: PostStatus[] = ['IDEA', 'DRAFT', 'READY', 'PUBLISHED'];

const POST_TYPE_LABELS: Record<PostType, { en: string; ar: string }> = {
  EDUCATIONAL:  { en: 'Educational',  ar: 'تعليمي' },
  PROMOTIONAL:  { en: 'Promotional',  ar: 'ترويجي' },
  BEFORE_AFTER: { en: 'Before/After', ar: 'قبل/بعد' },
  TESTIMONIAL:  { en: 'Testimonial',  ar: 'تقييم' },
  TEAM:         { en: 'Team',         ar: 'الفريق' },
  OFFER:        { en: 'Offer',        ar: 'عرض' },
};

const PLATFORM_LABELS: Record<PostPlatform, { en: string; ar: string }> = {
  INSTAGRAM: { en: 'Instagram', ar: 'إنستغرام' },
  FACEBOOK:  { en: 'Facebook',  ar: 'فيسبوك' },
  BOTH:      { en: 'Both',      ar: 'كلاهما' },
};

const emptyForm: {
  title: string; caption: string; hashtags: string;
  platform: PostPlatform; post_type: PostType;
  scheduled_date: string; status: PostStatus; notes: string;
} = {
  title: '', caption: '', hashtags: '',
  platform: 'INSTAGRAM', post_type: 'EDUCATIONAL',
  scheduled_date: '', status: 'IDEA', notes: '',
};

function CopyButton({ text, isAr }: { text: string; isAr: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} title={isAr ? 'نسخ النص' : 'Copy caption'} className="ds-icon-btn">
      {copied ? <Check size={13} style={{ color: 'var(--ok)' }} /> : <Copy size={13} />}
    </button>
  );
}

// ─── Post Modal ───────────────────────────────────────────────────────────────

function PostModal({ post, isAr, onClose }: { post: ContentPost | null; isAr: boolean; onClose: () => void }) {
  const t = useT(isAr);
  const [form, setForm] = useState(
    post
      ? { title: post.title, caption: post.caption ?? '', hashtags: post.hashtags ?? '', platform: post.platform, post_type: post.post_type, scheduled_date: post.scheduled_date ?? '', status: post.status, notes: post.notes ?? '' }
      : { ...emptyForm }
  );

  const create = useCreateContentPost();
  const update = useUpdateContentPost();
  const isPending = create.isPending || update.isPending;
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const payload = {
      title: form.title, caption: form.caption || null, hashtags: form.hashtags || null,
      platform: form.platform, post_type: form.post_type,
      scheduled_date: form.scheduled_date || null, status: form.status, notes: form.notes || null,
    };
    try {
      if (post) { await update.mutateAsync({ id: post.id, ...payload }); }
      else { await create.mutateAsync(payload); }
      onClose();
    } catch (err) {
      setSubmitError((err as { message?: string })?.message ?? (isAr ? 'حدث خطأ.' : 'An error occurred.'));
    }
  };

  return (
    <div className="ds-overlay">
      <div className="ds-modal" style={{ maxWidth: 520 }}>
        <div className="ds-modal-hd">
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>
            {post ? t.editPost : t.addPost}
          </span>
          <button className="ds-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="ds-label">{isAr ? 'العنوان' : 'Title'} *</label>
            <input required className="ds-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="ds-label">{t.platform}</label>
              <select className="ds-input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as PostPlatform }))}>
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p][isAr ? 'ar' : 'en']}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ds-label">{t.type}</label>
              <select className="ds-input" value={form.post_type} onChange={e => setForm(f => ({ ...f, post_type: e.target.value as PostType }))}>
                {POST_TYPES.map(pt => (
                  <option key={pt} value={pt}>{POST_TYPE_LABELS[pt][isAr ? 'ar' : 'en']}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ds-label">{t.status}</label>
              <select className="ds-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PostStatus }))}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{getStatusLabel(s, isAr)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ds-label">{t.scheduledDate}</label>
              <input type="date" className="ds-input" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="ds-label">{t.caption}</label>
            <textarea
              className="ds-input" style={{ resize: 'none' }} rows={3}
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder={isAr ? 'اكتب نص المنشور...' : 'Write your post caption...'}
            />
          </div>

          <div>
            <label className="ds-label">{t.hashtags}</label>
            <input className="ds-input" value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))} placeholder="#dentist #dental #egypt" />
          </div>

          <div>
            <label className="ds-label">{t.notes}</label>
            <textarea className="ds-input" style={{ resize: 'none' }} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          {submitError && <p className="ds-error">{submitError}</p>}

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={isPending} className="ds-btn ds-btn-primary" style={{ flex: 1 }}>
              {isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : post ? t.save : t.addPost}
            </button>
            <button type="button" onClick={onClose} className="ds-btn ds-btn-ghost">{t.cancel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DAY_NAMES_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_NAMES_AR = ['أح','إث','ثل','أر','خم','جم','سب'];

function CalendarView({ posts, isAr, onEdit }: { posts: ContentPost[]; isAr: boolean; onEdit: (p: ContentPost) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const postsByDate: Record<string, ContentPost[]> = {};
  for (const p of posts) {
    if (!p.scheduled_date) continue;
    const d = p.scheduled_date.slice(0, 10);
    if (!postsByDate[d]) postsByDate[d] = [];
    postsByDate[d].push(p);
  }

  const monthNames = isAr ? MONTH_NAMES_AR : MONTH_NAMES_EN;
  const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
          className="ds-btn ds-btn-ghost" style={{ padding: '6px 12px' }}
        >←</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{monthNames[month]} {year}</span>
        <button
          onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
          className="ds-btn ds-btn-ghost" style={{ padding: '6px 12px' }}
        >→</button>
      </div>

      <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--brd)' }}>
          {dayNames.map(d => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--txt3)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: 80, borderBottom: '1px solid var(--brd)', borderRight: '1px solid var(--brd)' }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayPosts = postsByDate[dateStr] ?? [];
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
            return (
              <div key={day} style={{
                minHeight: 80, borderBottom: '1px solid var(--brd)', borderRight: '1px solid var(--brd)',
                padding: 6, background: isToday ? 'var(--p-ultra)' : 'transparent',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isToday ? 'var(--p2)' : 'var(--txt3)' }}>{day}</span>
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dayPosts.slice(0, 2).map(p => (
                    <div
                      key={p.id}
                      onClick={() => onEdit(p)}
                      className={STATUS_CLS[p.status]}
                      style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}
                    >
                      {p.title}
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>+{dayPosts.length - 2} {isAr ? 'أكثر' : 'more'}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ContentPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);

  const { data: posts = [], isLoading } = useContentPosts({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });

  const deletePost = useDeleteContentPost();
  const createPost = useCreateContentPost();
  const { pushAction } = useHistoryStore();
  const { can } = usePermissions();

  const handleDelete = async (post: ContentPost) => {
    if (!confirm(isAr ? 'حذف هذا المنشور؟' : 'Delete this post?')) return;
    await deletePost.mutateAsync(post.id);
    let restoredId = post.id;
    pushAction({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Deleted post: ${post.title ?? post.platform}`,
      description_ar: `حُذف منشور: ${post.title ?? post.platform}`,
      undo: async () => {
        const created = await createPost.mutateAsync({
          title: post.title,
          caption: post.caption,
          hashtags: post.hashtags,
          platform: post.platform,
          status: post.status,
          scheduled_date: post.scheduled_date,
          post_type: post.post_type,
          notes: post.notes,
        });
        restoredId = created.id;
      },
      redo: async () => { await deletePost.mutateAsync(restoredId); },
    });
  };

  const openAdd = () => { setEditingPost(null); setModalOpen(true); };
  const openEdit = (p: ContentPost) => { setEditingPost(p); setModalOpen(true); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease' }}>

      {/* Toolbar */}
      <div className="ds-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <span className="ds-badge ds-badge-p" style={{ fontSize: 12, padding: '4px 10px' }}>
            {posts.length} {isAr ? 'منشور' : 'posts'}
          </span>
          <div style={{ flex: 1 }} />

          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: 8, border: '1px solid var(--brd)', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('list')}
              title={t.listView}
              style={{
                padding: '6px 10px', border: 'none', cursor: 'pointer', display: 'flex',
                background: viewMode === 'list' ? 'var(--p2)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--txt3)',
                transition: 'all 0.15s',
              }}
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              title={t.calendarView}
              style={{
                padding: '6px 10px', border: 'none', cursor: 'pointer', display: 'flex',
                background: viewMode === 'calendar' ? 'var(--p2)' : 'transparent',
                color: viewMode === 'calendar' ? '#fff' : 'var(--txt3)',
                transition: 'all 0.15s',
              }}
            >
              <CalendarDays size={15} />
            </button>
          </div>

          <button onClick={openAdd} className="ds-btn ds-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t.addPost}
          </button>
        </div>

        {/* Status filter */}
        <div className="ds-tabs" style={{ marginTop: 14, borderTop: '1px solid var(--brd)', paddingTop: 12 }}>
          {(['ALL', ...STATUSES] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`ds-tab${statusFilter === s ? ' active' : ''}`}
            >
              {s === 'ALL' ? t.allPosts : getStatusLabel(s, isAr)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="ds-card" style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="ds-spinner" />
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView posts={posts} isAr={isAr} onEdit={openEdit} />
      ) : posts.length === 0 ? (
        <div className="ds-empty">
          <Share2 size={40} style={{ color: 'var(--txt3)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--txt3)' }}>{t.noPostsFound}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="ds-card hidden md:block" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="ds-th">{isAr ? 'العنوان' : 'Title'}</th>
                  <th className="ds-th">{t.platform}</th>
                  <th className="ds-th">{t.type}</th>
                  <th className="ds-th">{t.status}</th>
                  <th className="ds-th">{t.scheduledDate}</th>
                  <th className="ds-th" style={{ textAlign: 'right' }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id} className="ds-tbody-row">
                    <td className="ds-td">
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{post.title}</p>
                      {post.caption && (
                        <p style={{ fontSize: 11, color: 'var(--txt3)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {post.caption}
                        </p>
                      )}
                    </td>
                    <td className="ds-td" style={{ fontSize: 12, color: 'var(--txt2)' }}>
                      {PLATFORM_LABELS[post.platform][isAr ? 'ar' : 'en']}
                    </td>
                    <td className="ds-td" style={{ fontSize: 12, color: 'var(--txt2)' }}>
                      {POST_TYPE_LABELS[post.post_type][isAr ? 'ar' : 'en']}
                    </td>
                    <td className="ds-td">
                      <span className={STATUS_CLS[post.status]}>{getStatusLabel(post.status, isAr)}</span>
                    </td>
                    <td className="ds-td" style={{ fontSize: 12, color: 'var(--txt3)' }}>
                      {post.scheduled_date ?? '—'}
                    </td>
                    <td className="ds-td">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        {post.caption && <CopyButton text={`${post.caption}\n\n${post.hashtags ?? ''}`} isAr={isAr} />}
                        <button onClick={() => openEdit(post)} className="ds-icon-btn"><Edit2 size={13} /></button>
                        {can('delete:content') && (
                          <button onClick={() => handleDelete(post)} className="ds-icon-btn-err"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {posts.map(post => (
              <div key={post.id} className="ds-card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 2 }}>{post.title}</p>
                    {post.caption && (
                      <p style={{ fontSize: 12, color: 'var(--txt3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.caption}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {post.caption && <CopyButton text={`${post.caption}\n\n${post.hashtags ?? ''}`} isAr={isAr} />}
                    <button type="button" title="Edit" onClick={() => openEdit(post)} className="ds-icon-btn"><Edit2 size={14} /></button>
                    {can('delete:content') && (
                      <button type="button" title="Delete" onClick={() => handleDelete(post)} className="ds-icon-btn-err"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <span className={STATUS_CLS[post.status]}>{getStatusLabel(post.status, isAr)}</span>
                  <span className="ds-badge ds-badge-neutral">{PLATFORM_LABELS[post.platform][isAr ? 'ar' : 'en']}</span>
                  <span className="ds-badge ds-badge-neutral">{POST_TYPE_LABELS[post.post_type][isAr ? 'ar' : 'en']}</span>
                  {post.scheduled_date && (
                    <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{post.scheduled_date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <PostModal post={editingPost} isAr={isAr} onClose={() => { setModalOpen(false); setEditingPost(null); }} />
      )}
    </div>
  );
}
