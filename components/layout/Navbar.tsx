import Image from "next/image"
import { ThemeToggle } from "../../common/theme-toggle"

export const Navbar = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/50 dark:border-zinc-800/50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Image className="h-8 w-8 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" src="/logo/light.png" alt="Logo" width={1000} height={1000} />
                    <Image className="h-8 w-8 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" src="/logo/dark.png" alt="Logo" width={1000} height={1000} />
                    <span className="text-xl font-questrial font-bold letter-spacing-[2px]">Personify</span>
                </div>
                <ThemeToggle />
            </div>
        </header>
    )
}    