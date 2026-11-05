import type { Metadata } from "next";
import Business from "@/components/sims/Business";

export const metadata: Metadata = { title: "Business simulator" };
export default function Page() { return <Business />; }
