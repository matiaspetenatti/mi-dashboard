"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

export function HoverLift({
  children,
  ...props
}: HTMLMotionProps<"div">) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
