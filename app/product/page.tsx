import { Suspense } from "react";
import Checker from "@/components/Checker";

export const metadata = { title: "Check a checkout — Before You Pay" };

export default function Product() {
  return (
    <Suspense>
      <Checker />
    </Suspense>
  );
}
