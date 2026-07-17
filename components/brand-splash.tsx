"use client";

import { useEffect, useRef, useState } from "react";

const TAGLINE = ["INTELLIGENCE.", "PRECISION.", "CONTROL."] as const;

const STAGGER_MS = 320;
const FADE_IN_MS = 750;
const HOLD_MS = 1500;
const FADE_OUT_MS = 600;

type BrandSplashProps = {
  onFinish?: () => void;
};

export function BrandSplash({ onFinish }: BrandSplashProps) {
  const onFinishRef = useRef(onFinish);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState({
    text: false,
    logo: false,
    tagline: false,
  });

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const textTimer = window.setTimeout(() => {
      setVisible((v) => ({ ...v, text: true }));
    }, 50);

    const logoTimer = window.setTimeout(() => {
      setVisible((v) => ({ ...v, logo: true }));
    }, STAGGER_MS);

    const taglineTimer = window.setTimeout(() => {
      setVisible((v) => ({ ...v, tagline: true }));
    }, STAGGER_MS * 2);

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, STAGGER_MS * 2 + FADE_IN_MS + HOLD_MS);

    const finishTimer = window.setTimeout(() => {
      onFinishRef.current?.();
    }, STAGGER_MS * 2 + FADE_IN_MS + HOLD_MS + FADE_OUT_MS);

    return () => {
      window.clearTimeout(textTimer);
      window.clearTimeout(logoTimer);
      window.clearTimeout(taglineTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
    };
  }, []);

  return (
    <div
      className={`brand-splash${exiting ? " brand-splash--exit" : ""}`}
      aria-label="Drishx loading"
      role="status"
    >
      <div className="brand-splash__stack">
        <div
          className={`brand-splash__item brand-splash__text-wrap${
            visible.text ? " brand-splash__item--visible" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/DrishX-text-removebg-preview.png"
            alt="DrishX"
            className="brand-splash__text"
            draggable={false}
          />
        </div>

        <div
          className={`brand-splash__item brand-splash__logo-wrap${
            visible.logo ? " brand-splash__item--visible" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.png"
            alt="DrishX logo"
            className="brand-splash__logo"
            draggable={false}
          />
        </div>

        <div
          className={`brand-splash__tagline${
            visible.tagline ? " brand-splash__item--visible" : ""
          }`}
        >
          {TAGLINE.map((line) => (
            <p key={line} className="brand-splash__tagline-line">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
