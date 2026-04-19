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
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

const WELCOME_MSG = (isAr: boolean) =>
  isAr
    ? 'مرحباً! أنا مساعد MANGZONE. اسألني عن المرضى، المواعيد، الإيرادات، أو أي إحصائيات.'
    : "Hello! I'm your MANGZONE assistant. Ask me about patients, appointments, revenue, or any clinic stats.";

const SUGGESTIONS_EN = [
  'How many patients do we have?',
  "What's today's appointment count?",
  'Show me unpaid invoices count',
  "What's this month's revenue?",
];

const SUGGESTIONS_AR = [
  'كم عدد المرضى؟',
  'كم عدد مواعيد اليوم؟',
  'أظهر لي الفواتير غير المدفوعة',
  'ما هي إيرادات هذا الشهر؟',
];

function makeMessage(role: 'user' | 'assistant', content: string): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  };
}

export function AiChat() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { profile } = useAuthStore();
  const { data: stats } = useDashboardStats();

  const userId = profile?.id ?? null;
  const lastUserIdRef = useRef<string | null>(null);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MSG(isAr),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MSG(isAr),
        },
      ]);
      setOpen(false);
      setInput('');
      setIsLoading(false);
    }
  }, [userId, isAr]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === 'welcome') {
        return [
          {
            id: 'welcome',
            role: 'assistant',
            content: WELCOME_MSG(isAr),
          },
        ];
      }
      return prev;
    });
  }, [isAr]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const buildSystemPrompt = () => {
    const egp = stats
      ? new Intl.NumberFormat('en-EG').format(stats.monthlyRevenue)
      : 'N/A';

    return `You are a helpful AI assistant for MANGZONE, a dental clinic management system in Egypt.
You assist clinic staff with clinic operations, patient management, appointments, billing, and dental practice questions.

Respond in the same language as the user's latest message.
If the user's language is unclear, default to ${isAr ? 'Arabic' : 'English'}.

Current clinic stats:
- Total patients: ${stats?.totalPatients ?? 'unknown'}
- Today's appointments: ${stats?.todayAppointments ?? 'unknown'}
- Cancelled today: ${stats?.cancelledToday ?? 'unknown'}
- Unpaid invoices: ${stats?.unpaidInvoices ?? 'unknown'}
- New leads: ${stats?.newLeads ?? 'unknown'}
- Monthly revenue: ${egp} EGP

Logged-in user:
- Name: ${profile?.full_name ?? 'Unknown'}
- Role: ${profile?.role ?? 'Unknown'}

Rules:
- Be concise and helpful
- Use EGP for currency
- Stay focused on dental clinic operations
- If exact data is unavailable, say so clearly
- Do not invent numbers not present in the provided stats`;
  };

  const getFallbackReply = (q: string): string => {
    const normalized = q.trim().toLowerCase();

    if (!stats) {
      return isAr
        ? 'لا تتوفر إحصائيات حالياً.'
        : 'No stats available right now.';
    }

    const egp = new Intl.NumberFormat('en-EG').format(stats.monthlyRevenue);

    if (
      normalized.includes('patient') ||
      normalized.includes('مريض') ||
      normalized.includes('مرضى')
    ) {
      return isAr
        ? `عدد المرضى النشطين: **${stats.totalPatients}** مريض.`
        : `The clinic has **${stats.totalPatients}** active patients.`;
    }

    if (
      normalized.includes('appointment') ||
      normalized.includes('appts') ||
      normalized.includes('موعد') ||
      normalized.includes('مواعيد')
    ) {
      return isAr
        ? `مواعيد اليوم: **${stats.todayAppointments}**، منها **${stats.cancelledToday}** ملغي.`
        : `There are **${stats.todayAppointments}** appointments today, with **${stats.cancelledToday}** cancelled.`;
    }

    if (
      normalized.includes('invoice') ||
      normalized.includes('unpaid') ||
      normalized.includes('فاتورة') ||
      normalized.includes('فواتير') ||
      normalized.includes('مدفوع') ||
      normalized.includes('غير مدفوعة')
    ) {
      return isAr
        ? `عدد الفواتير غير المدفوعة أو الجزئية: **${stats.unpaidInvoices}**.`
        : `There are **${stats.unpaidInvoices}** unpaid or partially paid invoices.`;
    }

    if (
      normalized.includes('revenue') ||
      normalized.includes('income') ||
      normalized.includes('إيراد') ||
      normalized.includes('إيرادات') ||
      normalized.includes('دخل')
    ) {
      return isAr
        ? `إيرادات هذا الشهر: **${egp} جنيه**.`
        : `This month's revenue is **${egp} EGP**.`;
    }

    if (
      normalized.includes('lead') ||
      normalized.includes('عميل') ||
      normalized.includes('عملاء') ||
      normalized.includes('leads')
    ) {
      return isAr
        ? `عدد العملاء المحتملين الجدد: **${stats.newLeads}**.`
        : `There are **${stats.newLeads}** new leads awaiting follow-up.`;
    }

    if (
      normalized.includes('summary') ||
      normalized.includes('overview') ||
      normalized.includes('ملخص')
    ) {
      return isAr
        ? `**ملخص العيادة**\n\n• المرضى: **${stats.totalPatients}**\n• مواعيد اليوم: **${stats.todayAppointments}**\n• الفواتير غير المدفوعة: **${stats.unpaidInvoices}**\n• العملاء الجدد: **${stats.newLeads}**\n• إيرادات الشهر: **${egp} جنيه**`
        : `**Clinic Summary**\n\n• Patients: **${stats.totalPatients}**\n• Today's appointments: **${stats.todayAppointments}**\n• Unpaid invoices: **${stats.unpaidInvoices}**\n• New leads: **${stats.newLeads}**\n• Monthly revenue: **${egp} EGP**`;
    }

    return isAr
      ? 'يمكنني مساعدتك في عدد المرضى، المواعيد، الإيرادات، والفواتير. جرّب أحد الاقتراحات.'
      : 'I can help with patient counts, appointments, revenue, and invoices. Try one of the suggestions.';
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const currentMessages = [...messages];
    const userMsg = makeMessage('user', content);

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

    if (!geminiKey) {
      const reply = getFallbackReply(content);
      setMessages((prev) => [...prev, makeMessage('assistant', reply)]);
      setIsLoading(false);
      return;
    }

    try {
      const systemPrompt = buildSystemPrompt();

      const historyParts = currentMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));

      historyParts.push({
        role: 'user',
        parts: [{ text: content }],
      });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: historyParts,
            generationConfig: {
              maxOutputTokens: 512,
              temperature: 0.7,
            },
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Gemini API error ${res.status}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const reply =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .filter(Boolean)
          .join('\n')
          .trim() ||
        (isAr
          ? 'عذراً، لم أتمكن من إنشاء رد مناسب.'
          : 'Sorry, I could not generate a proper response.');

      setMessages((prev) => [...prev, makeMessage('assistant', reply)]);
    } catch (error) {
      console.error('[AiChat] send error:', error);

      setMessages((prev) => [
        ...prev,
        makeMessage(
          'assistant',
          isAr
            ? 'حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.'
            : 'An error occurred while sending the message. Please try again.'
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = isAr ? SUGGESTIONS_AR : SUGGESTIONS_EN;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:opacity-90"
        title={isAr ? 'المساعد الذكي' : 'Open AI Assistant'}
        aria-label={isAr ? 'فتح المساعد الذكي' : 'Open AI Assistant'}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {open && (
        <div
          className="fixed bottom-24 end-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">MANGZONE AI</p>
                <p className="text-xs text-indigo-200">
                  {isAr ? 'المساعد الذكي' : 'Clinic Assistant'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={isAr ? 'تصغير الشات' : 'Minimize chat'}
              title={isAr ? 'تصغير' : 'Minimize'}
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'rounded-tl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      : 'rounded-tr-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                  }`}
                >
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                  <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <div className="flex gap-1">
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-slate-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAr ? 'اسأل أي شيء...' : 'Ask anything...'}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label={isAr ? 'إرسال الرسالة' : 'Send message'}
              title={isAr ? 'إرسال' : 'Send'}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
