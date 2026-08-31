// Avatar da Vi — assistente da Vidah Prime. SVG amigável, com fone de atendente.
import React from "react";

export default function ViAvatar({ size = 44, bg = true, talking = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <linearGradient id="viBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5A3A86" />
          <stop offset="1" stopColor="#14A08B" />
        </linearGradient>
        <clipPath id="viClip"><circle cx="50" cy="50" r="50" /></clipPath>
      </defs>

      <g clipPath={bg ? "url(#viClip)" : undefined}>
        {bg && <rect width="100" height="100" fill="url(#viBg)" />}

        {/* ombros / uniforme */}
        <path d="M18 100 C18 80 32 72 50 72 C68 72 82 80 82 100 Z" fill="#14A08B" />
        <path d="M42 70 h16 v8 c0 4 -16 4 -16 0 Z" fill="#E8C4A0" />

        {/* cabelo (atrás) */}
        <path d="M24 52 C22 28 34 16 50 16 C66 16 78 28 76 52 C74 44 70 40 66 40 L34 40 C30 40 26 44 24 52 Z" fill="#45256E" />

        {/* rosto */}
        <ellipse cx="50" cy="46" rx="21" ry="23" fill="#EFC9A9" />
        {/* orelhas */}
        <circle cx="29.5" cy="47" r="4.2" fill="#EFC9A9" />
        <circle cx="70.5" cy="47" r="4.2" fill="#EFC9A9" />

        {/* franja */}
        <path d="M29 44 C30 30 40 22 50 22 C60 22 70 30 71 44 C66 34 58 32 50 32 C42 32 34 34 29 44 Z" fill="#45256E" />

        {/* sobrancelhas */}
        <path d="M38 40 q4 -2.5 8 0" fill="none" stroke="#45256E" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 40 q4 -2.5 8 0" fill="none" stroke="#45256E" strokeWidth="2" strokeLinecap="round" />

        {/* olhos (piscam) */}
        <g className="vi-eyes">
          <ellipse cx="42" cy="47" rx="2.8" ry="3.4" fill="#2E1B4A" />
          <ellipse cx="58" cy="47" rx="2.8" ry="3.4" fill="#2E1B4A" />
          <circle cx="43" cy="46" r="1" fill="#fff" />
          <circle cx="59" cy="46" r="1" fill="#fff" />
        </g>

        {/* bochechas */}
        <circle cx="35" cy="54" r="4" fill="#E86B5E" opacity="0.35" />
        <circle cx="65" cy="54" r="4" fill="#E86B5E" opacity="0.35" />

        {/* boca */}
        {talking
          ? <ellipse className="vi-talk" cx="50" cy="57" rx="4.5" ry="3.2" fill="#B84A44" />
          : <path d="M44 56 q6 6 12 0" fill="none" stroke="#B84A44" strokeWidth="2.4" strokeLinecap="round" />}

        {/* fone de atendente */}
        <path d="M27 46 C27 30 38 22 50 22 C62 22 73 30 73 46" fill="none" stroke="#0F8C79" strokeWidth="3.4" strokeLinecap="round" />
        <rect x="24" y="44" width="7" height="12" rx="3.5" fill="#0F8C79" />
        <rect x="69" y="44" width="7" height="12" rx="3.5" fill="#0F8C79" />
        <path d="M27 56 C27 66 34 66 40 62" fill="none" stroke="#0F8C79" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="41" cy="61" r="2.4" fill="#E86B5E" />
      </g>
    </svg>
  );
}
