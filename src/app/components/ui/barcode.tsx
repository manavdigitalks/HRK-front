"use client";
import { useEffect, useRef } from "react";
import bwipjs from "bwip-js";

interface BarcodeProps {
  value: string;
  displayText?: string;
  className?: string;
}

export function Barcode({ value, displayText, className = "" }: BarcodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "code128",
          text: value,
          scale: 3,
          height: 10,
          includetext: false,
        });
      } catch (e) {
        // console.error("Barcode generation failed:", e);
      }
    }
  }, [value]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <canvas ref={canvasRef} className="max-w-full h-auto" />
      <span className="text-[10px] font-mono mt-1.5 font-bold text-gray-400">
        ID: {displayText || value}
      </span>
    </div>
  );
}
