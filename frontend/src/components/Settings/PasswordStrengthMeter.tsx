import React from 'react';
import { Check, X, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  confirmPassword?: string;
}

export function evaluatePassword(pwd: string, confirmPwd?: string) {
  const hasMinLen = pwd.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const hasMixedCase = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);

  const isMatch = confirmPwd !== undefined ? pwd.length > 0 && pwd === confirmPwd : true;

  let score = 0;
  if (pwd.length > 0) {
    if (hasMinLen) score++;
    if (hasLetter && hasDigit) score++;
    if (hasSpecial || hasMixedCase) score++;
    if (pwd.length >= 12 && hasSpecial && hasMixedCase) score++;
  }

  // Level mapping: 0 = Sangat Lemah, 1 = Lemah, 2 = Sedang, 3 = Kuat, 4 = Sangat Kuat
  let level: 'none' | 'weak' | 'medium' | 'strong' = 'none';
  let label = 'Belum diisi';
  let barColor = 'bg-slate-700';

  if (score === 1 || (pwd.length > 0 && !hasMinLen)) {
    level = 'weak';
    label = 'Lemah';
    barColor = 'bg-red-500';
  } else if (score === 2) {
    level = 'medium';
    label = 'Sedang';
    barColor = 'bg-amber-400';
  } else if (score >= 3) {
    level = 'strong';
    label = score >= 4 ? 'Sangat Kuat' : 'Kuat';
    barColor = 'bg-emerald-500';
  }

  // Backend requirement: len >= 8 AND hasLetter AND hasDigit
  const isValidPolicy = hasMinLen && hasLetter && hasDigit;
  const isReady = isValidPolicy && isMatch;

  return {
    score,
    level,
    label,
    barColor,
    hasMinLen,
    hasLetter,
    hasDigit,
    isMatch,
    isValidPolicy,
    isReady,
  };
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  confirmPassword,
}) => {
  const evalResult = evaluatePassword(password, confirmPassword);

  if (!password) return null;

  return (
    <div className="space-y-2.5 pt-1">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            {evalResult.level === 'strong' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            ) : evalResult.level === 'medium' ? (
              <Shield className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            )}
            Kekuatan Kata Sandi:
          </span>
          <span
            className={`font-bold uppercase tracking-wider text-[11px] ${
              evalResult.level === 'strong'
                ? 'text-emerald-600 dark:text-emerald-400'
                : evalResult.level === 'medium'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {evalResult.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          <div
            className={`rounded-full transition-all duration-300 ${
              evalResult.score >= 1 ? evalResult.barColor : 'bg-slate-200 dark:bg-slate-700/60'
            }`}
          />
          <div
            className={`rounded-full transition-all duration-300 ${
              evalResult.score >= 2 ? evalResult.barColor : 'bg-slate-200 dark:bg-slate-700/60'
            }`}
          />
          <div
            className={`rounded-full transition-all duration-300 ${
              evalResult.score >= 3 ? evalResult.barColor : 'bg-slate-200 dark:bg-slate-700/60'
            }`}
          />
          <div
            className={`rounded-full transition-all duration-300 ${
              evalResult.score >= 4 ? evalResult.barColor : 'bg-slate-200 dark:bg-slate-700/60'
            }`}
          />
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
        <div
          className={`flex items-center gap-1.5 transition-colors ${
            evalResult.hasMinLen
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {evalResult.hasMinLen ? (
            <Check className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          )}
          <span>Minimal 8 karakter</span>
        </div>

        <div
          className={`flex items-center gap-1.5 transition-colors ${
            evalResult.hasLetter && evalResult.hasDigit
              ? 'text-emerald-600 dark:text-emerald-400 font-medium'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {evalResult.hasLetter && evalResult.hasDigit ? (
            <Check className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          )}
          <span>Kombinasi huruf & angka</span>
        </div>

        {confirmPassword !== undefined && confirmPassword.length > 0 && (
          <div
            className={`flex items-center gap-1.5 transition-colors sm:col-span-2 ${
              evalResult.isMatch
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-red-600 dark:text-red-400 font-medium'
            }`}
          >
            {evalResult.isMatch ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 text-red-500" />
            )}
            <span>
              {evalResult.isMatch
                ? 'Konfirmasi kata sandi cocok'
                : 'Konfirmasi kata sandi tidak cocok'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
