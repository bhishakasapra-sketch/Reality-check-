import type { Metadata } from "next";
import Challenges from "@/components/sims/Challenges";

export const metadata: Metadata = { title: "Global decision challenges" };
export default function Page() { return <Challenges />; }
