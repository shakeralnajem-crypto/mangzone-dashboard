import { useState } from 'react';
import { Share2, Plus, X, Copy, Check, Edit2, Trash2, List, CalendarDays } from 'lucide-react';
import { useContentPosts, useCreateContentPost, useUpdateContentPost, useDeleteContentPost } from '@/hooks/useContent';
import type { Database } from '@/types/supabase';

type ContentPost = Database['public']['Tables']['content_posts']['Row'];
type PostStatus = ContentPost['status'];
type PostPlatform = ContentPost['platform'];
type PostType = ContentPost['post_type'];

const STATUS_COLORS: Record<PostStatus, string> = {
  IDEA: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  DRAFT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  READY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const PLATFORMS: PostPlatform[] = ['INSTAGRAM', 'FACEBOOK', 'BOTH'];
const POST_TYPES: PostType[] = ['EDUCATIONAL', 'PROMOTIONAL', 'BEFORE_AFTER', 'TESTIMONIAL', 'TEAM', 'OFFER'];
const STATUSES: PostStatus[] = ['IDEA', 'DRAFT', 'READY', 'PUBLISHED'];

const emptyForm: {
  title: string;
  caption: string;
  hashtags: string;
  platform: PostPlatform;
  post_type: PostType;
  scheduled_date: string;
  status: PostStatus;
  notes: string;
} = {
  title: '',
  caption: '',
  hashtags: '',
  platform: 'INSTAGRAM',
  post_type: 'EDUCATIONAL',
  scheduled_date: '',
  status: 'IDEA',
  notes: '',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} title="Copy caption"
      className="rounded p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

interface PostModalProps {
  post: ContentPost | null;
  onClose: () => void;
}

function PostModal({ post, onClose }: PostModalProps) {
  const [form, setForm] = useState(
    post
      ? {
          title: post.title,
          caption: post.caption ?? '',
          hashtags: post.hashtags ?? '',
          platform: post.platform,
          post_type: post.post_type,
          scheduled_date: post.scheduled_date ?? '',
          status: post.status,
          notes: post.notes ?? '',
        }
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
      title: form.title,
      caption: form.caption || null,
      hashtags: form.hashtags || null,
      platform: form.platform,
      post_type: form.post_type,
      scheduled_date: form.scheduled_date || null,
      status: form.status,
      notes: form.notes || null,
    };
    try {
      if (post) {
        await update.mutateAsync({ id: post.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'حدث خطأ، حاول مرة أخرى.';
      setSubmitError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {post ? 'Edit Post' : 'New Content Post'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Platform</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as PostPlatform }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Post Type</label>
              <select value={form.post_type} onChange={e => setForm(f => ({ ...f, post_type: e.target.value as PostType }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500">
                {POST_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PostStatus }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Scheduled Date</label>
              <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Caption</label>
            <textarea value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              rows={3} placeholder="Write your post caption..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Hashtags</label>
            <input value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
              placeholder="#dentist #dental #egypt"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {submitError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60">
              {isPending ? 'Saving...' : post ? 'Save Changes' : 'Add Post'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ posts, onEdit }: { posts: ContentPost[]; onEdit: (p: ContentPost) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const postsByDate: Record<string, ContentPost[]> = {};
  for (const p of posts) {
    if (!p.scheduled_date) continue;
    const d = p.scheduled_date.slice(0, 10);
    if (!postsByDate[d]) postsByDate[d] = [];
    postsByDate[d].push(p);
  }

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
          className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">←</button>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{monthNames[month]} {year}</span>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
          className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">→</button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-100 dark:border-slate-800" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayPosts = postsByDate[dateStr] ?? [];
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
            return (
              <div key={day}
                className={`min-h-[80px] border-b border-r border-slate-100 dark:border-slate-800 p-1.5 ${
                  isToday ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
                }`}>
                <span className={`text-xs font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 2).map(p => (
                    <div key={p.id} onClick={() => onEdit(p)}
                      className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer hover:opacity-80 ${STATUS_COLORS[p.status]}`}>
                      {p.title}
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <div className="text-[10px] text-slate-400 pl-1">+{dayPosts.length - 2} more</div>
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);

  const { data: posts = [], isLoading } = useContentPosts({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });

  const deletePost = useDeleteContentPost();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await deletePost.mutateAsync(id);
  };

  const openAdd = () => { setEditingPost(null); setModalOpen(true); };
  const openEdit = (p: ContentPost) => { setEditingPost(p); setModalOpen(true); };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Share2 className="h-6 w-6 text-pink-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Content Planner</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{posts.length} posts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'calendar' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Post
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-1 overflow-x-auto">
        {['ALL', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>
      ) : viewMode === 'calendar' ? (
        <CalendarView posts={posts} onEdit={openEdit} />
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <Share2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">No content posts yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Scheduled</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{post.title}</p>
                    {post.caption && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs">{post.caption}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{post.platform}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{post.post_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
                    {post.scheduled_date ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {post.caption && <CopyButton text={`${post.caption}\n\n${post.hashtags ?? ''}`} />}
                      <button onClick={() => openEdit(post)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <PostModal
          post={editingPost}
          onClose={() => { setModalOpen(false); setEditingPost(null); }}
        />
      )}
    </div>
  );
}
