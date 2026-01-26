import { redirect } from "next/navigation";

export default function AdminOrdersRedirect() {
  redirect("/dashboard/orders");
}
