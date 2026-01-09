'use client'
import { useState } from "react";
import Button from "../ui/button/Button";

export const Subscribe = () => {
    const [email, setEmail] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href =
            "https://docs.google.com/forms/d/e/1FAIpQLScoMDwkY20BYzFSSq6KTgEBwMKEM3j9OmCbcTbqTvIo2I9gFw/viewform?usp=pp_url&entry.1022303469=" +
            encodeURIComponent(email);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-4 font-medium text-sm ">
            <input
                type="email" required
                placeholder="Enter your email address"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-3 rounded-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-600 text-zinc-900 dark:text-white placeholder:text-zinc-500"
            />
            <Button type="submit"> Join Waitlist</Button>
        </form>
    )
}