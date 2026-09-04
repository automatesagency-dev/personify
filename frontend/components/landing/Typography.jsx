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

// `as` chooses the element. It defaults to <p>, which is right for body copy,
// but headings must render as real heading elements: this component previously
// rendered <p> unconditionally, so the landing page had no <h1> at all and
// search engines saw no topic for it.
export function Typography({ as: Component = 'p', variant, className, children }) {
  return <Component className={cn(text({ type: variant }), className)}>{children}</Component>;
}
