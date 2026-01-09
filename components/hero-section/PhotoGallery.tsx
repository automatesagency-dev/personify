'use client'
import Image from "next/image";
import { motion } from "framer-motion";

export const PhotoGallery = ({ photos }: { photos: string[] }) => {
    return (
        <div className="relative h-64 mb-8 flex items-center justify-center">
            <div className="flex items-center justify-center  perspective-1000">
                {photos.map((photo, index) => (
                    <motion.div
                        key={index}
                        className="relative w-46 h-56"
                        animate={{
                            rotate: (index - 2.5) * 5,
                            translateY: Math.abs(index - 2.5) * 8,
                            y: index % 2 === 0 ? 5 : 0
                        }}
                        whileHover={{
                            scale: 1.1,
                            rotate: 4,
                            y: -15
                        }}
                        whileTap={{
                            scale: 0.9,
                            rotate: -4,
                        }}
                    >
                        <Image
                            src={photo}
                            alt={`AI Generated Photo ${index + 1}`}
                            fill
                            className="object-cover rounded-2xl shadow-2xl border dark:border-zinc-800"
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};