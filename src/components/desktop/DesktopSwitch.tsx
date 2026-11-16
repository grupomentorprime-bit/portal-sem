"use client";

import type { ReactNode } from "react";

export function DesktopSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <input
      className="desk-switch"
      type="checkbox"
      role="switch"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}

export function DesktopSwitchRow({
  checked,
  disabled,
  title,
  detail,
  mark,
  badge,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  title: string;
  detail?: string;
  mark?: string;
  badge?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`desk-switch-row${disabled ? " is-disabled" : ""}`}>
      {mark ? <span className={`desk-app-mark is-${mark}`} aria-hidden="true" /> : null}
      <span className="desk-switch-copy">
        <strong>
          {title}
          {badge ? <em>{badge}</em> : null}
        </strong>
        {detail ? <small>{detail}</small> : null}
      </span>
      <DesktopSwitch checked={checked} disabled={disabled} label={title} onChange={onChange} />
    </label>
  );
}

export function DesktopSwitchGroup({
  label,
  note,
  children,
}: {
  label?: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="desk-setting">
      {label ? <p className="desk-group-label">{label}</p> : null}
      <div className="desk-group">{children}</div>
      {note ? <p className="desk-group-note">{note}</p> : null}
    </div>
  );
}
