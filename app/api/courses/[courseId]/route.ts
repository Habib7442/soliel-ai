import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, subtitle, description, level, language, price_cents } = body;
    
    const { error } = await supabase
      .from('courses')
      .update({
        title,
        subtitle,
        description,
        level,
        language,
        price_cents
      })
      .eq('id', courseId)
      .eq('instructor_id', user.id);
    
    if (error) {
      console.error('Error updating course:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/courses/[courseId]:', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
