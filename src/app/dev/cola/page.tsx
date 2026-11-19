import { notFound } from "next/navigation";
import { ColaLab } from "./lab";

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ColaLab />;
}
