"use client";

import { useState } from "react";
import { preguntas } from "@/sites/cumple/content";

export function FaqList() {
  const [open, setOpen] = useState(0);

  return (
    <div>
      {preguntas.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q} className="border-b border-cline last:border-b-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : index)}
            >
              <span className="font-cdisplay text-base font-bold text-cink">{item.q}</span>
              <span className="font-cdisplay text-xl leading-none text-cviolet" aria-hidden="true">
                {isOpen ? "–" : "+"}
              </span>
            </button>
            {isOpen ? <p className="max-w-xl pb-5 text-sm leading-6 text-cmuted">{item.a}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
