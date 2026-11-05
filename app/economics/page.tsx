import type { Metadata } from "next";
import Economics from "@/components/sims/Economics";

export const metadata: Metadata = { title: "Economics simulator" };
export default function Page() { return <Economics />; }
