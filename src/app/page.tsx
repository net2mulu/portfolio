import type { Metadata } from "next";
import { Portfolio } from "@/components/Portfolio";
import { siteDescription, siteTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  alternates: { canonical: "/" },
};

export default function Home() {
  return <Portfolio />;
}
