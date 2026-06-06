"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getPlatform } from "@/lib/auth";

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else if (!getPlatform()) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);
  return null;
}
