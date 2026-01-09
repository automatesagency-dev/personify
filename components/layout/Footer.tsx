import Image from "next/image"

export const Footer = () => {
    return (
        <footer className="py-12 px-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Image className="h-8 w-8 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" src="/logo/light.png" alt="Logo" width={1000} height={1000} />
                        <Image className="h-8 w-8 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" src="/logo/dark.png" alt="Logo" width={1000} height={1000} />
                        <span className="text-xl font-questrial font-bold letter-spacing-[2px]">Personify</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                        AI-Powered Personal Branding That Makes
                        <br />
                        You Stand Out. Coming Soon.
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        © 2026 Personify - All Rights Reserved
                    </p>
                </div>
            </div>
        </footer>
    )

}