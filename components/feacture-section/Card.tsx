import Image from "next/image"

interface Feature {
    title: string;
    description: string;
    icon: string;
}

const Card = ({ feature }: { feature: Feature }) => {

    return (
        <div >
            <div className="min-h-64 group relative p-8 rounded-3xl transition-all duration-700
                border border-pink-100 dark:border-zinc-800 dark:hover:border-black hover:border-[#CC6391] 
                bg-gradient-to-br from-white to-[#CC6391]/10 
                 dark:from-zinc-900 dark:to-zinc-800 
                 dark:hover:from-white dark:hover:to-white
                 hover:shadow-2xl hover:shadow-pink-500/10  "
            >
                {/* Icon */}
                <div className=' w-14 h-14 mb-5 rounded-2xl bg-gradient-to-br from-[#CC6391] to-[#F7B758]  dark:to-white dark:from-white group-hover:dark:from-black group-hover:dark:to-black flex items-center justify-center shadow-lg shadow-pink-500/30 dark:shadow-white/0 group-hover:bg-black'>
                    <Image
                        src={feature.icon}
                        alt={feature.title}
                        width={24}
                        height={24}
                        className="brightness-0 dark:brightness-100 invert group-hover:brightness-0"
                    />
                </div>

                {/* Content */}
                <h3 className="text-lg font-medium mb-3 group-hover:text-black">{feature.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {feature.description}
                </p>

                {/* Hover Gradient */}
                {/* <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div> */}
            </div>

        </div>
    )
}

export default Card