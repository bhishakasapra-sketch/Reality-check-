import type { Metadata } from "next";
import { Explore } from "@/components/sims/Dashboard";

export const metadata: Metadata = { title: "Explore simulations" };
export default function Page() { return <Explore />; }
