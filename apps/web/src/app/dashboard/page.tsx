import type { Metadata } from "next";
import { RolePortal } from "@/components/role-portal";

export const metadata: Metadata = { title: "Dashboard — KARHUTLA.AI" };
export default function DashboardPage() { return <RolePortal />; }
