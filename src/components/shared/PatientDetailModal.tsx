import { useState } from 'react';
import { X, Calendar, ReceiptText, CreditCard, ClipboardList, Phone, User, AlertTriangle } from 'lucide-react';
import {
  usePatientAppointments,
  usePatientInvoices,
  usePatientPayments,
  usePatientSummary,
} from '@/hooks/usePatientDetail';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { formatEGP } from '@/lib/currency';
import type { Database } from '@/types/supabase';

type Patient = Database['public']['Tables']['patients']['Row'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─── Treatment Plans Hook ────────────────────────────────────────────────────
function usePatientTreatments(patientId: string | null) {
  const clinicId = useAuthStore((s) => s.profile?.clinic_id);
  return useQuery({
    queryKey: ['patient-treatments', clinicId, patientId],
    enabled: !!patientId && !!clinicId,
    queryFn: async () => {
      const { data, error } = await db
        .from('treatment_plans')
        .select('id, title, name, status, total_estimated_cost, start_date, end_date, created_at')
        .eq('patient_id', patientId!)
        .eq('clinic_id', clinicId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  SCHEDULED:      { bg: 'var(--p-soft)',   color: 'var(--p2)',  label: 'Scheduled' },
  ARRIVED:        { bg: 'var(--a-soft)',   color: 'var(--a)',   label: 'Arrived' },
  IN_PROGRESS:    { bg: 'var(--warn-soft)',color: 'var(--warn)',label: 'In Progress' },
  COMPLETED:      { bg: 'var(--ok-soft)',  color: 'var(--ok)',  label: 'Completed' },
  CANCELLED:      { bg: 'var(--err-soft)', color: 'var(--err)', label: 'Cancelled' },
  NO_SHOW:        { bg: 'rgba(0,0,0,0.06)',color: 'var(--txt3)',label: 'No Show' },
  PAID:           { bg: 'var(--ok-soft)',  color: 'var(--ok)',  label: 'Paid' },
  UNPAID:         { bg: 'var(--err-soft)', color: 'var(--err)', label: 'Unpaid' },
  PARTIALLY_PAID: { bg: 'var(--warn-soft)',color: 'var(--warn)',label: 'Partial' },
  PLANNED:        { bg: 'var(--p-soft)',   color: 'var(--p2)',  label: 'Planned' },
  DRAFT:          { bg: 'rgba(0,0,0,0.06)',color: 'var(--txt3)',label: 'Draft' },
};

const PAY_LABELS: Record<string, string> = {
  CASH: 'Cash', CARD: 'Card', INSTAPAY: 'InstaPay', VODAFONE_CASH: 'Vodafone Cash',
};

function Badge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { bg: 'rgba(0,0,0,0.06)', color: 'var(--txt3)', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><div className="ds-spinner" /></div>;
}

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 10 }}>
      <Icon size={32} style={{ color: 'var(--txt3)' }} />
      <p style={{ fontSize: 13, color: 'var(--txt3)' }}>{text}</p>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--txt3)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: color ?? 'var(--txt)' }}>{value}</p>
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--txt3)',
    background: 'var(--bg3)', borderBottom: '1px solid var(--brd)' }}>{children}</th>;
}
function TD({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--txt2)',
    borderBottom: '1px solid var(--brd)', textAlign: right ? 'right' : 'left' }}>{children}</td>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
// Accept full Patient row OR a minimal shape with just id + display fields
type PatientLike = Pick<Patient, 'id'> & Partial<Omit<Patient, 'id'>>;
interface Props { patient: PatientLike | null; onClose: () => void; }
type Tab = 'summary' | 'appointments' | 'treatments' | 'invoices' | 'payments';

export function PatientDetailModal({ patient, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const { data: appointments = [], isLoading: apptLoading } = usePatientAppointments(patient?.id ?? null);
  const { data: invoices = [], isLoading: invLoading } = usePatientInvoices(patient?.id ?? null);
  const { data: payments = [], isLoading: payLoading } = usePatientPayments(patient?.id ?? null);
  const { data: treatments = [], isLoading: treatLoading } = usePatientTreatments(patient?.id ?? null);
  const { data: summary } = usePatientSummary(patient?.id ?? null);

  if (!patient) return null;

  const age = patient.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const totalInvoiced = invoices.reduce((s, i) => s + i.total_amount, 0);
  const totalPaid = summary?.totalPaid ?? 0;
  const totalDiscount = invoices.reduce((s, i) => {
    const discount = (i as { discount?: number | null }).discount;
    return s + (discount ?? 0);
  }, 0);

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'summary',      label: 'Overview',    icon: User },
    { id: 'appointments', label: 'Visits',      icon: Calendar,     count: appointments.length },
    { id: 'treatments',   label: 'Treatments',  icon: ClipboardList, count: treatments.length },
    { id: 'invoices',     label: 'Invoices',    icon: ReceiptText,   count: invoices.length },
    { id: 'payments',     label: 'Payments',    icon: CreditCard,    count: payments.length },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 780,
        background: 'var(--bg2)', border: '1px solid var(--brd)',
        borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--brd)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--p-soft), var(--p-ultra))',
              border: '1px solid var(--brd2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'var(--p2)',
            }}>
              {(patient.first_name ?? '?').charAt(0)}{(patient.last_name ?? '?').charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt)', marginBottom: 4 }}>
                {patient.first_name ?? ''} {patient.last_name ?? ''}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                {patient.phone && (
                  <a href={`tel:${patient.phone}`} style={{ fontSize: 12, color: 'var(--txt2)',
                    display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    <Phone size={12} /> {patient.phone}
                  </a>
                )}
                {patient.gender && (
                  <span style={{ fontSize: 11, background: 'var(--bg3)', color: 'var(--txt2)',
                    padding: '2px 8px', borderRadius: 20 }}>{patient.gender}</span>
                )}
                {age !== null && (
                  <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{age} years old</span>
                )}
                {patient.dob && (
                  <span style={{ fontSize: 11, color: 'var(--txt3)' }}>
                    DOB: {new Date(patient.dob).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                  </span>
                )}
              </div>
              {/* Medical alerts */}
              {patient.notes && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6,
                  background: 'var(--warn-soft)', borderRadius: 8, padding: '6px 10px' }}>
                  <AlertTriangle size={13} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: 'var(--warn)', fontWeight: 500 }}>{patient.notes}</p>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="ds-modal-close"><X size={16} /></button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--brd)',
          padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 14px', fontSize: 13, fontWeight: 600, border: 'none',
              cursor: 'pointer', whiteSpace: 'nowrap', background: 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid var(--p2)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--p2)' : 'var(--txt3)',
              marginBottom: -1, transition: 'all 0.15s',
            }}>
              <tab.icon size={14} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 20,
                  padding: '1px 6px', marginLeft: 2,
                  background: activeTab === tab.id ? 'var(--p-soft)' : 'var(--bg3)',
                  color: activeTab === tab.id ? 'var(--p2)' : 'var(--txt3)',
                }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* OVERVIEW TAB */}
          {activeTab === 'summary' && (() => {
            const now = new Date().toISOString();
            const upcoming = appointments
              .filter(a => a.start_time > now && a.status === 'SCHEDULED')
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            const noUpcoming = upcoming.length === 0;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Upcoming Appointments Banner */}
                {noUpcoming ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--err-soft)', borderRadius: 12, padding: '12px 16px',
                    border: '1px solid var(--err)',
                  }}>
                    <Calendar size={18} style={{ color: 'var(--err)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--err)' }}>No Upcoming Appointments</p>
                      <p style={{ fontSize: 11, color: 'var(--err)', opacity: 0.8, marginTop: 2 }}>
                        This patient has no scheduled visits. Consider booking a follow-up.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--p-soft)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--brd2)' }}>
                    <p style={{ fontSize: 11, color: 'var(--p2)', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Upcoming Appointments ({upcoming.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {upcoming.slice(0, 3).map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'var(--bg2)', borderRadius: 10, padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--p-ultra)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, border: '1px solid var(--brd2)' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--p2)', lineHeight: 1 }}>
                                {new Date(a.start_time).getDate()}
                              </span>
                              <span style={{ fontSize: 9, color: 'var(--p3)', textTransform: 'uppercase' }}>
                                {new Date(a.start_time).toLocaleString('en-EG', { month: 'short' })}
                              </span>
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                                {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                                {' · '}{a.service?.name ?? 'No service'}
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
                                {a.doctor?.full_name ?? 'Unassigned'}
                              </p>
                            </div>
                          </div>
                          <Badge status="SCHEDULED" />
                        </div>
                      ))}
                      {upcoming.length > 3 && (
                        <p style={{ fontSize: 11, color: 'var(--p2)', textAlign: 'center' }}>
                          +{upcoming.length - 3} more — see Visits tab
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* KPI Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <StatBox label="Total Visits"     value={String(summary?.visitCount ?? appointments.length)} />
                  <StatBox label="Completed"        value={String(summary?.completedVisitsCount ?? 0)} color="var(--ok)" />
                  <StatBox label="No Shows"         value={String(appointments.filter(a => a.status === 'NO_SHOW').length)} color="var(--err)" />
                  <StatBox label="Total Invoiced"   value={formatEGP(totalInvoiced)} />
                  <StatBox label="Total Paid"       value={formatEGP(totalPaid)} color="var(--ok)" />
                  <StatBox label="Balance Due"      value={formatEGP(summary?.balanceDue ?? 0)} color={summary?.balanceDue ? 'var(--warn)' : 'var(--ok)'} />
                  {totalDiscount > 0 && <StatBox label="Discounts Given" value={formatEGP(totalDiscount)} color="var(--p2)" />}
                  <StatBox label="Treatment Plans"  value={String(treatments.length)} />
                  <StatBox label="Payment Status"   value={summary?.paymentStatus?.replace('_', ' ') ?? '—'} />
                </div>

                {/* Last Visit */}
                {summary?.latestAppointment && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Visit</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>
                          {new Date(summary.latestAppointment.start_time).toLocaleDateString('en-EG', { dateStyle: 'full' })}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>
                          {summary.latestAppointment.service?.name ?? '—'} · {summary.latestAppointment.doctor?.full_name ?? '—'}
                        </p>
                      </div>
                      <Badge status={summary.latestAppointment.status ?? 'SCHEDULED'} />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* VISITS TAB */}
          {activeTab === 'appointments' && (
            apptLoading ? <Spinner /> :
            appointments.length === 0 ? <Empty icon={Calendar} text="No visits on record." /> :
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <TH>Date & Time</TH><TH>Service</TH><TH>Doctor</TH>
                  <TH>Notes</TH><TH>Status</TH>
                </tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <TD>
                        <p style={{ fontWeight: 700, color: 'var(--txt)', fontSize: 13 }}>
                          {new Date(a.start_time).toLocaleDateString('en-EG', { dateStyle: 'medium' })}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--txt3)' }}>
                          {new Date(a.start_time).toLocaleTimeString('en-EG', { timeStyle: 'short' })}
                        </p>
                      </TD>
                      <TD>{a.service?.name ?? '—'}</TD>
                      <TD>{a.doctor?.full_name ?? '—'}</TD>
                      <TD>{(a as { notes?: string | null }).notes ?? '—'}</TD>
                      <TD><Badge status={a.status ?? 'SCHEDULED'} /></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TREATMENTS TAB */}
          {activeTab === 'treatments' && (
            treatLoading ? <Spinner /> :
            treatments.length === 0 ? <Empty icon={ClipboardList} text="No treatment plans on record." /> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(treatments as {
                id: string; title: string | null; name: string | null;
                status: string | null; total_estimated_cost: number | null;
                start_date: string | null; end_date: string | null;
              }[]).map(tp => (
                <div key={tp.id} className="ds-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>
                        {tp.title ?? tp.name ?? 'Treatment Plan'}
                      </p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--txt3)' }}>
                        {tp.start_date && <span>Start: {new Date(tp.start_date).toLocaleDateString('en-EG', { dateStyle: 'medium' })}</span>}
                        {tp.end_date && <span>End: {new Date(tp.end_date).toLocaleDateString('en-EG', { dateStyle: 'medium' })}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <Badge status={tp.status ?? 'PLANNED'} />
                      {tp.total_estimated_cost != null && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p2)' }}>
                          {formatEGP(tp.total_estimated_cost)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INVOICES TAB */}
          {activeTab === 'invoices' && (
            invLoading ? <Spinner /> :
            invoices.length === 0 ? <Empty icon={ReceiptText} text="No invoices on record." /> :
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <TH>Invoice #</TH><TH>Date</TH>
                  <TH>Total</TH><TH>Paid</TH><TH>Balance</TH><TH>Status</TH>
                </tr></thead>
                <tbody>
                  {invoices.map(inv => {
                    const paid = inv.total_amount - inv.balance_due;
                    return (
                      <tr key={inv.id}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        <TD><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--txt)' }}>{inv.invoice_number || '—'}</span></TD>
                        <TD>{new Date(inv.created_at).toLocaleDateString('en-EG', { dateStyle: 'medium' })}</TD>
                        <TD right><span style={{ fontWeight: 700, color: 'var(--txt)' }}>{formatEGP(inv.total_amount)}</span></TD>
                        <TD right><span style={{ color: 'var(--ok)', fontWeight: 600 }}>{formatEGP(paid)}</span></TD>
                        <TD right><span style={{ color: inv.balance_due > 0 ? 'var(--warn)' : 'var(--ok)', fontWeight: 600 }}>{formatEGP(inv.balance_due)}</span></TD>
                        <TD><Badge status={inv.status ?? 'UNPAID'} /></TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Totals row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24,
                padding: '12px 16px', background: 'var(--bg3)', borderTop: '2px solid var(--brd)', marginTop: 1 }}>
                <span style={{ fontSize: 13, color: 'var(--txt3)' }}>
                  Total Invoiced: <strong style={{ color: 'var(--txt)' }}>{formatEGP(totalInvoiced)}</strong>
                </span>
                <span style={{ fontSize: 13, color: 'var(--txt3)' }}>
                  Total Paid: <strong style={{ color: 'var(--ok)' }}>{formatEGP(totalPaid)}</strong>
                </span>
                <span style={{ fontSize: 13, color: 'var(--txt3)' }}>
                  Balance: <strong style={{ color: summary?.balanceDue ? 'var(--warn)' : 'var(--ok)' }}>{formatEGP(summary?.balanceDue ?? 0)}</strong>
                </span>
              </div>
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            payLoading ? <Spinner /> :
            payments.length === 0 ? <Empty icon={CreditCard} text="No payments on record." /> :
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <TH>Date</TH><TH>Amount</TH><TH>Method</TH><TH>Notes</TH>
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                      <TD>{new Date(p.payment_date).toLocaleDateString('en-EG', { dateStyle: 'medium' })}</TD>
                      <TD right><span style={{ fontWeight: 700, color: 'var(--ok)', fontSize: 14 }}>{formatEGP(p.amount)}</span></TD>
                      <TD>
                        <span style={{ background: 'var(--bg3)', color: 'var(--txt2)',
                          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {PAY_LABELS[p.payment_method] ?? p.payment_method}
                        </span>
                      </TD>
                      <TD>{p.notes ?? '—'}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end',
                padding: '12px 16px', background: 'var(--bg3)', borderTop: '2px solid var(--brd)' }}>
                <span style={{ fontSize: 13, color: 'var(--txt3)' }}>
                  Total Collected: <strong style={{ color: 'var(--ok)', fontSize: 15 }}>{formatEGP(payments.reduce((s, p) => s + p.amount, 0))}</strong>
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
