'use client';

interface FormFieldProps {
  label: string;
  id: string;
  name?: string;
  type?: string;
  value?: string | number;
  options?: Array<string | { v: string; l: string }>;
  required?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export default function FormField({ label, id, name, type, value, options, required, placeholder, onChange }: FormFieldProps) {
  if (options) {
    return (
      <div className="form-field">
        <label className="form-label" htmlFor={id}>{label}{required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
        <select id={id} name={name || id} className="form-input" defaultValue={value?.toString() || ''} onChange={e => onChange?.(e.target.value)}>
          {options.map((o, i) => {
            if (typeof o === 'string') return <option key={i} value={o}>{o}</option>;
            return <option key={i} value={o.v}>{o.l}</option>;
          })}
        </select>
      </div>
    );
  }
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>{label}{required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
      <input id={id} name={name || id} className="form-input" type={type || 'text'} defaultValue={value || ''} placeholder={placeholder} onChange={e => onChange?.(e.target.value)} />
    </div>
  );
}
