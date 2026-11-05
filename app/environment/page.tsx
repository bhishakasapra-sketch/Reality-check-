import type { Metadata } from "next";
import Environment from "@/components/sims/Environment";

export const metadata: Metadata = { title: "Environment simulator" };
export default function Page() { return <Environment />; }
