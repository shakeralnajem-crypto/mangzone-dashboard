import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuthStore } from '@/store/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "How many patients do we have?",
  "What's today's appointment count?",
  "Show me unpaid invoices count",
  "What's this month's revenue?",
];

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

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm your MANGZONE assistant. Ask me about patients, appointments, revenue, or any clinic stats.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: stats } = useDashboardStats();
  const { profile } = useAuthStore();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildSystemPrompt = () => {
    const egp = stats ? new Intl.NumberFormat('en-EG').format(stats.monthlyRevenue) : 'N/A';
    return `You are a helpful AI assistant for MANGZONE, a dental clinic management system in Egypt.
You assist clinic staff (admins, doctors, receptionists, accountants) with clinic operations, patient management, appointments, billing, and general dental practice questions.

Current clinic stats:
- Total patients: ${stats?.totalPatients ?? 'unknown'}
- Today's appointments: ${stats?.todayAppointments ?? 'unknown'}
- Cancelled today: ${stats?.cancelledToday ?? 'unknown'}
- Unpaid invoices: ${stats?.unpaidInvoices ?? 'unknown'}
- New leads: ${stats?.newLeads ?? 'unknown'}
- Monthly revenue: ${egp} EGP

Logged-in user: ${profile?.full_name ?? 'Unknown'} (${profile?.role ?? 'Unknown'})

Respond concisely and helpfully. Use EGP for currency. Keep responses focused on dental clinic operations. If asked about something outside your knowledge, acknowledge it politely.`;
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

    if (!apiKey) {
      // Fallback: keyword-based responses when no API key
      const q = content.toLowerCase();
      let reply = "I can help with patient counts, appointments, revenue, and invoices. Try asking one of the suggestions above.";

      if (stats) {
        if (q.includes('patient')) reply = `The clinic has **${stats.totalPatients}** active patients.`;
        else if (q.includes('appointment')) reply = `There are **${stats.todayAppointments}** appointments today, with **${stats.cancelledToday}** cancelled.`;
        else if (q.includes('invoice') || q.includes('unpaid')) reply = `There are **${stats.unpaidInvoices}** unpaid/partially paid invoices.`;
        else if (q.includes('revenue') || q.includes('income')) {
          const egp = new Intl.NumberFormat('en-EG').format(stats.monthlyRevenue);
          reply = `This month's revenue is **${egp} EGP**.`;
        } else if (q.includes('lead')) reply = `There are **${stats.newLeads}** new leads awaiting follow-up.`;
        else if (q.includes('summary') || q.includes('overview')) {
          const egp = new Intl.NumberFormat('en-EG').format(stats.monthlyRevenue);
          reply = `**Clinic Summary**\n\n• Patients: **${stats.totalPatients}**\n• Today's appts: **${stats.todayAppointments}**\n• Unpaid invoices: **${stats.unpaidInvoices}**\n• New leads: **${stats.newLeads}**\n• Monthly revenue: **${egp} EGP**`;
        }
      }

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
      setIsLoading(false);
      return;
    }

    try {
      const historyForApi = messages
        .filter(m => m.id !== '0')
        .map(m => ({ role: m.role, content: m.content }));

      historyForApi.push({ role: 'user', content });

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 512,
          system: buildSystemPrompt(),
          messages: historyForApi,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const data = await res.json() as { content: { type: string; text: string }[] };
      const reply = data.content.find(b => b.type === 'text')?.text ?? 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key or try again.',
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

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:opacity-90 hover:scale-105 transition-all duration-200"
        title="Open AI Assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 end-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">MANGZONE AI</p>
                <p className="text-xs text-indigo-200">Clinic Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
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

          {/* Suggestions */}
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

          {/* Input */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-3 flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
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
