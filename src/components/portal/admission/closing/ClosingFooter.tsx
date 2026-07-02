import Link from "next/link";
import type { AdmissionClosingFooterData } from "@/types/admission-closing";
import {
  resolveClosingFooterHref,
  sortClosingBlocks,
} from "@/lib/portal/admission-closing-utils";

interface ClosingFooterProps {
  data: AdmissionClosingFooterData;
}

export function ClosingFooter({ data }: ClosingFooterProps) {
  const columns = sortClosingBlocks(data.columns).filter(
    (column) => column.visible && column.title.trim()
  );

  if (columns.length === 0) return null;

  return (
    <nav className="admission-closing__footer" aria-label="Enlaces del cierre institucional">
      <div className="admission-closing__footer-grid">
        {columns.map((column) => {
          const items = sortClosingBlocks(column.items).filter((item) => item.text.trim());
          if (items.length === 0) return null;

          return (
            <div key={column.id} className="admission-closing__footer-column">
              <h4 className="admission-closing__footer-title">{column.title}</h4>
              <ul className="admission-closing__footer-links">
                {items.map((item) => {
                  const { href, external } = resolveClosingFooterHref(item.type, item.url);
                  return (
                    <li key={item.id}>
                      {external ? (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {item.text}
                        </a>
                      ) : (
                        <Link href={href}>{item.text}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
