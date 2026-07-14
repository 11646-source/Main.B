import React from 'react';

interface BetzLogoProps {
  className?: string;
}

export default function BetzLogo({ className = 'w-6 h-6' }: BetzLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left-pointing E bars */}
      <path
        d="M45 22H22M45 50H26M45 78H22"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Shared vertical stem */}
      <path
        d="M45 22V78"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Right-pointing B loops */}
      <path
        d="M45 22H58C67.5 22 74 27.5 74 36C74 44.5 67.5 50 58 50H45"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45 50H60C69.5 50 76 55.5 76 64C76 72.5 69.5 78 60 78H45"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
