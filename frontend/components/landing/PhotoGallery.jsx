'use client'

import Image from 'next/image';
import { motion } from 'framer-motion';

const photos = [
  '/images/0c7b50abf828cca1b6b2c423ebc8f683c1d84227.png',
  '/images/2e485f5ef577d3610fb5c0bbd2902f624e4786d2.png',
  '/images/3fe48d19d4b4c7a00847b1cb0b2dd970dc699985.png',
  '/images/ad7189a71e7abd66c78b71d24b748c1c04d05b44.png',
  '/images/c342b53ae3383ca2355cf9fab2f80dfd0d7da339.png',
  '/images/d9cdc9204ed0cd0624b55d2c0a9ff230e79e87aa.png',
];

export function PhotoGallery() {
  return (
    <div className="relative h-64 mb-8 flex items-center justify-center">
      <div className="flex items-center justify-center">
        {photos.map((photo, index) => (
          <motion.div
            key={index}
            className="relative w-32 h-44 sm:w-40 sm:h-52 flex-shrink-0"
            animate={{
              rotate: (index - 2.5) * 5,
              translateY: Math.abs(index - 2.5) * 8,
              y: index % 2 === 0 ? 5 : 0,
            }}
            whileHover={{ scale: 1.1, rotate: 4, y: -15 }}
            whileTap={{ scale: 0.9, rotate: -4 }}
          >
            <Image
              src={photo}
              alt={`AI Generated Photo ${index + 1}`}
              fill
              sizes="(max-width: 640px) 128px, 160px"
              className="object-cover rounded-2xl shadow-2xl border dark:border-zinc-800"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
