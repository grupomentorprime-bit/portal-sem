import { notFound } from "next/navigation";
import { HeroSliderPrototype } from "@/components/portal/home/institutional/HeroSliderPrototype";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ slide?: string; still?: string }>;
}

/** Prototipo visual del slider. Solo desarrollo. No reemplaza la Home. */
export default async function HeroSliderPrototypePage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV !== "development") notFound();

  const params = await searchParams;
  const parsed = Number(params.slide);
  const initialIndex = Number.isFinite(parsed) ? parsed : 0;

  return (
    <>
      <HeroSliderPrototype initialIndex={initialIndex} still={params.still === "1"} />
      <p className="sem-slider-proto__caption">Prototipo del slider. La Home publicada no cambia.</p>
    </>
  );
}
