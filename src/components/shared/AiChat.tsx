import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.includes('\n')) {
      return (
        <span key={i}>
          {part.split('\n').map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const WELCOME_MSG = (isAr: boolean) =>
  isAr
    ? "مرحباً! أنا مساعد MANGZONE. اسألني عن المرضى، المواعيد، الإيرادات، أو أي إحصائيات."
    : "Hello! I\'m your MANGZONE assistant. Ask me about patients, appointments, revenue, or any clinic stats.";

const SUGGESTIONS_EN = [
  "How many patients do we have?",
  "What\'s today\'s appointment count?",
  "Show me unpaid invoices count",
  "What\'s this month\'s revenue?",
];
const SUGGESTIONS_AR = [
  "كم عدد المرضى؟",
  "كم عدد مواعيد اليوم؟",
  "أظهر لي الفواتير غير المدفوعة",
  "ما هي إيرادات هذا الشهر؟",
];

export function AiChat() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { profile } = useAuthStore();
  const { data: stats } = useDashboardStats();

  // Reset messages when user changes
  const userId = profile?.id ?? null;
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const makeWelcome = (ar: boolean): Message => ({
    id: '0',
    role: 'assistant',
    content: WELCOME_MSG(ar),
  });

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([makeWelcome(isAr)]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear chat when user changes (login/logout/switch)
  useEffect(() => {
    if (userId !== lastUserId) {
      setLastUserId(userId);
      setMessages([makeWelcome(isAr)]);
      setOpen(false);
    }
  }, [userId]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === '0') {
        return [makeWelcome(isAr)];
      }
      return prev;
    });
  }, [isAr]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildSystemPrompt = () => {
    const egp = stats ? new Intl.NumberFormat('en-EG').format(stats.monthlyRevenue) : 'N/A';
    const lang = isAr ? 'Arabic' : 'English';
    return `You are a helpful AI assistant for MANGZONE, a dental clinic management system in Egypt.
You assist clinic staff with clinic operations, patient management, appointments, billing, and dental practice questions.

IMPORTANT: Always respond in ${lang}. If the user writes in Arabic, respond in Arabic. If in English, respond in English.

Current clinic stats:
- Total patients: ${stats?.totalPatients ?? 'unknown'}
- Today\'s appointments: ${stats?.todayAppointments ?? 'unknown'}
- Cancelled today: ${stats?.cancelledToday ?? 'unknown'}
- Unpaid invoices: ${stats?.unpaidInvoices ?? 'unknown'}
- New leads: ${stats?.newLeads ?? 'unknown'}
- Monthly revenue: ${egp} EGP

Logged-in user: ${profile?.full_name ?? 'Unknown'} (${profile?.role ?? 'Unknown'})

Respond concisely and helpfully. Use EGP for currency. Keep responses focused on dental clinic operations.`;
  };

  const getFallbackReply = (q: string): string => {
    const lower = q.toLowerCase();
    if (!stats) return isAr ? "لا تتوفر إحصائيات حالياً." : "No stats available right now.";

    const egp = new Intl.NumberFormat('en-EG').format(stats.monthlyRevenue);

    if (lower.includes('patient') || lower.includes('مريض') || lower.includes('مرضى'))
      return isAr ? `عدد المرضى النشطين: **${stats.totalPatients}** مريض.` : `The clinic has **${stats.totalPatients}** active patients.`;

    if (lower.includes('appointment') || lower.includes('موعد') || lower.includes('مواعيد'))
      return isAr
        ? `مواعيد اليوم: **${stats.todayAppointments}**، منها **${stats.cancelledToday}** ملغي.`
        : `There are **${stats.todayAppointments}** appointments today, with **${stats.cancelledToday}** cancelled.`;

    if (lower.includes('invoice') || lower.includes('unpaid') || lower.includes('فاتورة') || lower.includes('مدفوع'))
      return isAr ? `عدد الفواتير غير المدفوعة: **${stats.unpaidInvoices}**.` : `There are **${stats.unpaidInvoices}** unpaid/partially paid invoices.`;

    if (lower.includes('revenue') || lower.includes('income') || lower.includes('إيراد') || lower.includes('دخل'))
      return isAr ? `إيرادات الشهر: **${egp} جنيه**.` : `This month\'s revenue is **${egp} EGP**.`;

    if (lower.includes('lead') || lower.includes('عميل'))
      return isAr ? `عدد العملاء المحتملين الجدد: **${stats.newLeads}**.` : `There are **${stats.newLeads}** new leads awaiting follow-up.`;

    if (lower.includes('summary') || lower.includes('overview') || lower.includes('ملخص'))
      return isAr
        ? `**ملخص العيادة**\n\n• المرضى: **${stats.totalPatients}**\n• مواعيد اليوم: **${stats.todayAppointments}**\n• فواتير معلقة: **${stats.unpaidInvoices}**\n• عملاء جدد: **${stats.newLeads}**\n• إيرادات الشهر: **${egp} جنيه**`
        : `**Clinic Summary**\n\n• Patients: **${stats.totalPatients}**\n• Today\'s appts: **${stats.todayAppointments}**\n• Unpaid invoices: **${stats.unpaidInvoices}**\n• New leads: **${stats.newLeads}**\n• Monthly revenue: **${egp} EGP**`;

    return isAr
      ? "يمكنني مساعدتك في عدد المرضى، المواعيد، الإيرادات، والفواتير. جرب أحد الاقتراحات."
      : "I can help with patient counts, appointments, revenue, and invoices. Try asking one of the suggestions above.";
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

    if (!geminiKey) {
      const reply = getFallbackReply(content);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
      setIsLoading(false);
      return;
    }

    try {
      const systemPrompt = buildSystemPrompt();
      const historyParts = messages
        .filter(m => m.id !== '0')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));
      historyParts.push({ role: 'user', parts: [{ text: content }] });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: historyParts,
            generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
          }),
        }
      );

      if (!res.ok) throw new Error(`Gemini API error ${res.status}`);

      const data = await res.json() as {
        candidates: { content: { parts: { text: string }[] } }[];
      };
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        ?? (isAr ? 'عذراً، لم أتمكن من الرد.' : 'Sorry, I could not generate a response.');
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isAr ? 'حدث خطأ. حاول مرة أخرى.' : 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const SUGGESTIONS = isAr ? SUGGESTIONS_AR : SUGGESTIONS_EN;

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:opacity-90 hover:scale-105 transition-all duration-200"
        title={isAr ? 'المساعد الذكي' : 'Open AI Assistant'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 end-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">MANGZONE AI</p>
                <p className="text-xs text-indigo-200">{isAr ? 'المساعد الذكي' : 'Clinic Assistant'}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    : <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />}
                </div>
                <div className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm'
                }`}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                  <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 p-3 flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAr ? 'اسأل أي شيء...' : 'Ask anything...'}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-60"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
