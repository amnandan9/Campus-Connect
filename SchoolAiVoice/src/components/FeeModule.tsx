import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Student, FeeTransaction, Role } from '../types';

interface FeeModuleProps {
  currentRole: Role;
}

export const FeeModule: React.FC<FeeModuleProps> = ({ currentRole }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('STU-1001');
  const [installmentAmount, setInstallmentAmount] = useState<number>(10000);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI / Online');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFeeData = async () => {
    try {
      const res = await fetch(`/api/v1/students?role=${currentRole}`);
      const data = await res.json();
      if (data.results) setStudents(data.results);

      if (currentRole !== 'teacher') {
        const txRes = await fetch('/api/v1/fees');
        const txData = await txRes.json();
        if (txData.results) setTransactions(txData.results);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchFeeData();
  }, [currentRole]);

  const handlePayInstallment = async () => {
    try {
      const res = await fetch('/api/v1/fees/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudentId,
          amount: installmentAmount,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.message || 'Payment failed.' });
      } else {
        setStatusMsg({ type: 'success', text: data.message });
        fetchFeeData();
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Error connecting to Django API.' });
    }
  };

  const isTeacherView = currentRole === 'teacher';

  return (
    <div className="space-y-8 animate-fade-in text-[#1A1A1A]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E1DB] pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#B19361] font-bold block mb-1">
            Role-Restricted Financial Desk
          </span>
          <h1 className="text-3xl font-bold serif text-[#1A1A1A]">
            Fee Management & Installment Ledger
          </h1>
          <p className="text-xs text-[#5C5855] mt-1">
            {isTeacherView
              ? 'STRICT SECURITY RULE: Teachers are restricted from viewing numerical fee amounts. Teachers only see "Fee Cleared" or "Fee Pending".'
              : 'Admin View: Full fee allocation, installment deductions, balance calculations, and receipt history.'}
          </p>
        </div>

        <div className="editorial-card-muted px-4 py-2.5 flex items-center space-x-3">
          {isTeacherView ? (
            <Lock className="w-5 h-5 text-[#B19361]" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-[#B19361]" />
          )}
          <div>
            <p className="text-xs font-bold serif text-[#1A1A1A]">{isTeacherView ? 'Teacher Mode' : 'Admin Mode'}</p>
            <p className="text-[10px] text-[#8C8885] font-mono">
              {isTeacherView ? 'Amounts Hidden' : 'Full Access'}
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 border text-xs font-mono flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-[#1A1A1A] text-emerald-400 border-emerald-600'
              : 'bg-[#1A1A1A] text-rose-400 border-rose-600'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="underline font-bold cursor-pointer text-[#B19361] hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Record Installment Form (Admin Only) */}
      {!isTeacherView && (
        <div className="editorial-card p-6 space-y-6">
          <h3 className="text-xl font-bold serif text-[#1A1A1A] flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-[#B19361]" />
            Record Fee Installment Payment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">Select Student:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-[#FDFCFB] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1A1A1A]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id}) - Remaining: ₹{s.remainingFee}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">Installment Amount (₹):</label>
              <input
                type="number"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(Number(e.target.value))}
                className="w-full bg-[#F2EDE8] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#8C8885] mb-2 block">Payment Mode:</label>
              <div className="flex space-x-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex-1 bg-[#FDFCFB] border border-[#E5E1DB] p-2.5 text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="UPI / Online">UPI / Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="Cheque">Cheque</option>
                </select>

                <button
                  onClick={handlePayInstallment}
                  className="bg-[#1A1A1A] hover:bg-[#B19361] text-white font-bold text-xs px-5 py-2.5 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Deduct
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Fee Roster Table */}
      <div className="editorial-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E5E1DB] pb-4 gap-2">
          <h3 className="text-xl font-bold serif text-[#1A1A1A]">
            Student Fee Ledger Roster
          </h3>
          <span className="text-[10px] font-mono text-[#8C8885]">
            {isTeacherView ? 'Restricted Status View' : 'Full Monetary View'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1A1A1A]">
            <thead className="bg-[#F2EDE8] text-[#8C8885] font-bold uppercase tracking-wider text-[10px] border-b border-[#E5E1DB]">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class</th>
                {!isTeacherView && <th className="px-4 py-3">Total Admission Fee</th>}
                {!isTeacherView && <th className="px-4 py-3">Paid Amount</th>}
                {!isTeacherView && <th className="px-4 py-3">Remaining Balance</th>}
                <th className="px-4 py-3">Fee Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1DB]">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-[#F2EDE8]/60 transition-colors">
                  <td className="px-4 py-3 font-bold serif text-[#1A1A1A]">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-[#5C5855]">
                    {s.grade}-{s.section}
                  </td>

                  {!isTeacherView && (
                    <td className="px-4 py-3 font-mono text-[#5C5855]">₹{s.totalFee.toLocaleString()}</td>
                  )}
                  {!isTeacherView && (
                    <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                      ₹{s.paidFee.toLocaleString()}
                    </td>
                  )}
                  {!isTeacherView && (
                    <td className="px-4 py-3 font-mono text-[#B19361] font-bold">
                      ₹{s.remainingFee.toLocaleString()}
                    </td>
                  )}

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        s.feeStatus === 'Cleared'
                          ? 'bg-[#1A1A1A] text-[#FDFCFB] border border-[#1A1A1A]'
                          : 'bg-[#F2EDE8] text-[#8C8885] border border-[#E5E1DB]'
                      }`}
                    >
                      {s.feeStatus === 'Cleared' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#B19361]" /> Fee Cleared
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 mr-1" /> Fee Pending
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

