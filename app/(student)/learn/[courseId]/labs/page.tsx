import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { LabPlayer } from "@/components/course/LabPlayer";

export default async function LabsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ labId?: string }>;
}) {
  const { courseId } = await params;
  const { labId } = await searchParams;
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check enrollment
  const { data: enrollment } = await supabase
    .from("course_purchases")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!enrollment) {
    redirect(`/courses/${courseId}`);
  }

  // If no labId in query params, show lab list
  if (!labId) {
    // Fetch all labs for this course
    const { data: labs } = await supabase
      .from("labs")
      .select(
        `
        *,
        lab_progress!left (
          completed,
          best_score_percent,
          attempts_count
        )
      `
      )
      .eq("course_id", courseId)
      .eq("lab_progress.user_id", user.id)
      .order("order_index", { ascending: true });

    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Labs & Practice</h1>
            <p className="text-muted-foreground">
              Complete hands-on exercises to reinforce your learning
            </p>
          </div>

          {!labs || labs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No labs available yet for this course
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map((lab) => {
                const progress = Array.isArray(lab.lab_progress)
                  ? lab.lab_progress[0]
                  : lab.lab_progress;

                return (
                  <a
                    key={lab.id}
                    href={`/learn/${courseId}/labs?labId=${lab.id}`}
                    className="block border rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">{lab.title}</h3>
                      {progress?.completed && (
                        <span className="text-green-600">✓</span>
                      )}
                    </div>

                    {lab.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {lab.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="capitalize">{lab.lab_type.replace("_", " ")}</span>
                      {lab.estimated_time_minutes && (
                        <span>~{lab.estimated_time_minutes} min</span>
                      )}
                      {lab.difficulty && (
                        <span className="capitalize">{lab.difficulty}</span>
                      )}
                    </div>

                    {progress && (
                      <div className="mt-4 text-sm">
                        <div className="flex justify-between mb-1">
                          <span>Best Score</span>
                          <span className="font-medium">
                            {progress.best_score_percent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${progress.best_score_percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show specific lab player
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LabPlayer labId={labId} />
      </div>
    </div>
  );
}
