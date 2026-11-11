import clsx from 'clsx';
import type { ProviderId } from '@/content';

export interface ProviderOption {
  id: ProviderId;
  label: string;
}

interface ProviderSwitchProps {
  options: ProviderOption[];
  value: ProviderId;
  onChange(provider: ProviderId): void;
}

/**
 * Segmented control that picks the platform whose examples the theory shows.
 */
export function ProviderSwitch({ options, value, onChange }: ProviderSwitchProps) {
  return (
    <div role="radiogroup" aria-label="Platform for the examples" className="sticky top-0 z-10 -mx-6.5 mb-5 flex flex-wrap items-center gap-2 border-b border-line bg-panel/95 px-6.5 py-2.5 backdrop-blur max-wide:static max-wide:mx-0 max-wide:px-0">
      <span className="text-[13px] font-semibold text-ink-muted">Examples for</span>
      {options.map((option, index) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
              }
              event.preventDefault();
              const direction = event.key === 'ArrowRight' ? 1 : -1;
              const next = options[(index + direction + options.length) % options.length];
              onChange(next.id);
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[(index + direction + options.length) % options.length]?.focus();
            }}
            className={clsx(
              'inline-flex h-8 cursor-pointer items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-(--dur-fast)',
              selected ? 'bg-accent/15 text-accent ring-1 ring-accent/45 ring-inset' : 'text-ink-muted ring-1 ring-line-strong ring-inset hover:bg-hover hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
