import { redirect } from "next/navigation";

export default function AdminQueueRedirect() {
  redirect("/dashboard/queue");
}
