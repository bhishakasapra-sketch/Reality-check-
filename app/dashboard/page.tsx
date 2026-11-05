import type { Metadata } from "next";
import Dashboard from "@/components/sims/Dashboard";

export const metadata: Metadata = { title: "My dashboard" };
export default function Page() { return <Dashboard />; }
