import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import AcceptInvitationClient from "@/components/auth/AcceptInvitationClient";

export const metadata = {
  title: "Accept Invitation",
  description: "Accept your company invitation",
};

interface PageProps {
  searchParams: { token?: string };
}

export default async function AcceptInvitationPage({ searchParams }: PageProps) {
  const token = searchParams.token;

  if (!token) {
    redirect("/sign-in?error=missing_token");
  }

  const supabase = await createServerClient();

  // Verify invitation exists and is valid
  const { data: invitation, error } = await supabase
    .from("company_invitations")
    .select(`
      *,
      companies(
        name,
        email
      )
    `)
    .eq("invitation_token", token)
    .single();

  if (error || !invitation) {
    redirect("/sign-in?error=invalid_token");
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    redirect("/sign-in?error=expired_token");
  }

  // Check if already accepted
  if (invitation.accepted_at) {
    redirect("/sign-in?error=already_accepted");
  }

  return <AcceptInvitationClient invitation={invitation} token={token} />;
}
