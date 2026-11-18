import { PublicVendorCredit } from "@/components/portal/PublicVendorCredit";
import {
  VENDOR_CREDIT_LABEL,
  rewriteLegacyPlatformProductName,
} from "@/core/branding/display";
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

  const developerText = rewriteLegacyPlatformProductName(data.developerText);

  return (
    <div className="admission-closing__copyright">
      {sealLines?.length ? <ClosingSealPills lines={sealLines} /> : null}
      {data.primaryText ? <p className="admission-closing__copyright-primary">{data.primaryText}</p> : null}
      {data.secondaryText ? (
        <p className="admission-closing__copyright-secondary">{data.secondaryText}</p>
      ) : null}
      {developerText && developerText !== VENDOR_CREDIT_LABEL ? (
        <p className="admission-closing__copyright-developer">{developerText}</p>
      ) : null}
      <PublicVendorCredit className="admission-closing__copyright-developer" />
    </div>
  );
}
