import { redirect } from "next/navigation";

export default function UsersPage() {
  // Redirect to admin-users page
  redirect("/admin-users");
}