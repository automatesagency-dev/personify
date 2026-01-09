"use client";
import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
};

gsap.registerPlugin(ScrollTrigger);

const CustomLayout = ({ children, className }: Props) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 1, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useGSAP(
    () => {
      if (scrollRef.current) {
        const boxes = gsap.utils.toArray(
          scrollRef.current.children
        ) as HTMLElement[];
        boxes.forEach((box) => {
          gsap.from(box, {
            y: 80,
            scale: 1,
            scrollTrigger: {
              trigger: box,
              start: "top bottom",
              end: "top 70%",
              scrub: true,
            },
            ease: "power1.inOut",
          });
        });
      }
    },
    { scope: scrollRef }
  );

  return (
    <motion.main
      initial={{ scale: 0.99, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ ease: [0.43, 0.13, 0.23, 0.96], duration: 0.3 }}
      ref={scrollRef}
      className={cn(" relative overflow-hidden ", className)}
    >
      {children}
    </motion.main>
  );
};

export default CustomLayout;
