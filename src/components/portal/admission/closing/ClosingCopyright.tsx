import Link from "next/link";
import type { AdmissionClosingCopyrightData } from "@/types/admission-closing";
import { ClosingSealPills } from "./ClosingSeal";

interface ClosingCopyrightProps {
  data: AdmissionClosingCopyrightData;
  sealLines?: string[];
}

export function ClosingCopyright({ data, sealLines }: ClosingCopyrightProps) {
  if (!data.primaryText.trim() && !data.secondaryText?.trim() && !sealLines?.length) {
    return null;
  }

  return (
    <div className="admission-closing__copyright">
      {sealLines?.length ? <ClosingSealPills lines={sealLines} /> : null}
      {data.primaryText ? <p className="admission-closing__copyright-primary">{data.primaryText}</p> : null}
      {data.secondaryText ? (
        <p className="admission-closing__copyright-secondary">{data.secondaryText}</p>
      ) : null}
      {data.developerText ? (
        <p className="admission-closing__copyright-developer">{data.developerText}</p>
      ) : data.developerName ? (
        <p className="admission-closing__copyright-developer">
          {data.developerUrl ? (
            <Link href={data.developerUrl} target="_blank" rel="noopener noreferrer">
              {data.developerName}
            </Link>
          ) : (
            data.developerName
          )}
        </p>
      ) : null}
    </div>
  );
}
