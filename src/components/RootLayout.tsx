"use client";
import { useEffect, useState } from "react";


const AppLayout = ({ children }: { children: React.ReactNode }) => {


  useEffect(() => {
    if (typeof window === "undefined") return;

    // Service Worker registration is needed for PWA functionality in browsers

    if ("serviceWorker" in navigator) {
      (async () => {
        try {
          const isSecure = window.isSecureContext;

          if (!isSecure) {
            return;
          }

          const reg = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          });
          console.log(reg)
          if (reg.installing) {
            reg.installing.addEventListener("statechange", (e: Event) => {
              const sw = e.target as ServiceWorker;
              console.log("📡 SW state changed:", sw.state);
            });
          }

          await navigator.serviceWorker.ready;
        } catch (err) {
          console.error(" Service Worker registration failed:", err);
        }
      })();
    }
  }, []);

  useEffect(() => {
    console.log('listener registered');

    const handler = (e: any) => {
      e.preventDefault();
      console.log('beforeinstallprompt fired');
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
    <>
    {children}
    </>
  );
};

export default AppLayout;
