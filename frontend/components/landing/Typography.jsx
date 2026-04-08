import { cn } from '../../lib/utils';
import { tv } from 'tailwind-variants';

export const text = tv({
  base: 'font-poppins',
  variants: {
    type: {
      primary: 'text-md tracking-wider',
      title: 'text-lg text-zinc-600 dark:text-zinc-400',
      muted: 'text-center text-sm text-zinc-500 dark:text-zinc-500',
      heading: 'text-3xl md:text-[45px] font-semibold font-questrial text-center leading-snug bg-gradient-to-r from-black to-[#1D1D1D] dark:from-white dark:to-zinc-300 bg-clip-text text-transparent',
      subHeading: 'text-3xl md:text-[45px] text-[#1D1D1D] dark:text-white font-medium font-questrial text-center leading-tight',
      subtitle: 'text-3xl md:text-[45px] font-semibold font-questrial text-center leading-tight',
      paragraph: 'text-center text-md leading-relaxed',
    },
  },
  defaultVariants: {
    type: 'primary',
  },
});

export function Typography({ variant, className, children }) {
  return <p className={cn(text({ type: variant }), className)}>{children}</p>;
}
