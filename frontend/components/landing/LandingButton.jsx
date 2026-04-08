import { cn } from '../../lib/utils';

export default function LandingButton({ onClick, type, className, children }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        'w-full sm:w-auto px-8 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity whitespace-nowrap font-medium text-sm font-poppins',
        className
      )}
    >
      {children}
    </button>
  );
}
