import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ className = "w-32 h-32" }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link to="/" className={`block drop-shadow-sm transition-transform hover:scale-105 active:scale-95 ${className}`}>
      {!imgError ? (
        <img 
          src="/logo.png" 
          alt="Nevara Logo" 
          className="w-full h-full object-contain drop-shadow-md rounded-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full bg-white rounded-full">
          {/* Outer Circle */}
          <circle cx="250" cy="250" r="230" stroke="#8fa78d" strokeWidth="2.5" fill="none"/>
          
          {/* V (Lavender) */}
          <text x="250" y="315" textAnchor="middle" fontFamily="'Times New Roman', Times, serif" fontSize="200" fill="#c0b5e0" fontWeight="normal">V</text>
          
          {/* N (Sage Green) */}
          <text x="250" y="315" textAnchor="middle" fontFamily="'Times New Roman', Times, serif" fontSize="200" fill="#8fa78d" fontWeight="normal">N</text>
          
          {/* Top Elements */}
          {/* Left Dot (Lavender) */}
          <circle cx="180" cy="140" r="10" fill="#c0b5e0"/>
          {/* Right Dot (Sage) */}
          <circle cx="320" cy="140" r="10" fill="#8fa78d"/>
          
          {/* Delicate Heart */}
          <path d="M 250 155 C 235 155, 220 130, 250 115 C 280 130, 265 155, 250 155 Z" stroke="#c0b5e0" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Leaves at the bottom of N */}
          <path d="M 235 325 C 225 330, 225 345, 240 345 C 248 335, 245 325, 235 325 Z" fill="#8fa78d"/>
          <path d="M 265 325 C 275 330, 275 345, 260 345 C 252 335, 255 325, 265 325 Z" fill="#8fa78d"/>
          
          {/* Brand Name */}
          <text x="250" y="380" fontFamily="'DM Sans', system-ui, sans-serif" fontSize="56" fill="#4a5d5a" textAnchor="middle" fontWeight="400" letterSpacing="2">nevara</text>
          
          {/* Slogan */}
          <text x="250" y="415" fontFamily="'DM Sans', system-ui, sans-serif" fontSize="14" fill="#b1a6d3" textAnchor="middle" letterSpacing="4" fontWeight="600">MIND. SUPPORT. GROW.</text>
          
          {/* Bottom Line & Dot */}
          <path d="M 160 435 Q 200 440 250 435 Q 300 430 340 435" stroke="#8fa78d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <circle cx="250" cy="435" r="5" fill="#c0b5e0"/>
        </svg>
      )}
    </Link>
  );
}
