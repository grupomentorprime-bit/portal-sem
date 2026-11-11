"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function EscritorioReturn() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let gone = false;
    fetch("/api/identity/me")
      .then((res) => {
        if (!gone && res.ok) setShow(true);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, []);

  if (!show) return null;
  return (
    <Link
      href="/escritorio"
      className="fixed left-3 top-3 z-40 rounded-full bg-white/90 px-3 py-1 text-[13px] font-medium text-stone-900 shadow"
    >
      Escritorio
    </Link>
  );
}
