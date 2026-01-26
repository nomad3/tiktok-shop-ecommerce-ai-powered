import { redirect } from "next/navigation";

export default function AdminProductsRedirect() {
  redirect("/dashboard/products");
}
