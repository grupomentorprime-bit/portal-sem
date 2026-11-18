"use client";

import { useEffect, useState } from "react";
import { isSafeEscritorioHref } from "@/lib/connect/policy";

export function EscritorioReturn({
  href = "/escritorio",
  deskOrigin = "",
}: {
  href?: string;
  deskOrigin?: string;
}) {
  const [show, setShow] = useState(false);
  const target = isSafeEscritorioHref(href, deskOrigin) ? href : "/escritorio";

  useEffect(() => {
    let gone = false;
    fetch("/api/connect/session")
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
    <a
      href={target}
      className="fixed left-3 top-3 z-[70] rounded-full bg-white/90 px-3 py-1 text-[13px] font-medium text-stone-900 shadow"
    >
      Escritorio
    </a>
  );
}
