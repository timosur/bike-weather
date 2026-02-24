interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function TextInput({ error, className, ...props }: TextInputProps) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors ${error ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
        } ${className ?? ''}`}
    />
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function TextArea({ error, className, ...props }: TextAreaProps) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors resize-y ${error ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
        } ${className ?? ''}`}
    />
  )
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  error?: boolean
}

export function SelectInput({ options, error, className, ...props }: SelectInputProps) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors ${error ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
        } ${className ?? ''}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function NumberInput({ error, className, ...props }: NumberInputProps) {
  return (
    <input
      {...props}
      type="number"
      className={`w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors ${error ? 'border-red-400 dark:border-red-500' : 'border-stone-200 dark:border-stone-700'
        } ${className ?? ''}`}
    />
  )
}

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
          }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
        />
      </button>
      {label && (
        <span className="text-sm text-stone-700 dark:text-stone-300">{label}</span>
      )}
    </label>
  )
}
