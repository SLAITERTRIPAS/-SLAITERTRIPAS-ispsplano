import React from "react";
import { motion } from "motion/react";

interface ProcessingCircleProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const ProcessingCircle = ({
  size = 24,
  strokeWidth = 0.8,
  className = "",
}: ProcessingCircleProps) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <motion.div
        className="w-full h-full rounded-full"
        style={{
          background: `conic-gradient(
            from 0deg,
            #FF0000, 
            #FF7F00, 
            #FFFF00, 
            #00FF00, 
            #0000FF, 
            #4B0082, 
            #9400D3, 
            #FF0000
          )`,
          WebkitMask: `radial-gradient(transparent calc(50% - ${strokeWidth}px), black calc(50% - ${strokeWidth}px + 0.5px))`,
          mask: `radial-gradient(transparent calc(50% - ${strokeWidth}px), black calc(50% - ${strokeWidth}px + 0.5px))`,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};


