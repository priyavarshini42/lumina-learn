import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  gradeLabel,
  loadChildDashboard,
  generateParentRecommendations,
  type ChildDashboard,
  type ParentRecommendations,
} from "./parent.server";

export type ChildSummary = {
  studentId: string;
  fullName: string;
  username: string;
  gradeLabel: string;
  approved: boolean;
  relation: string;
};

export const listChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChildSummary[]> => {
    const { supabase, userId } = context;
    const { data: links, error } = await supabase
      .from("parent_student_links")
      .select("student_id, relation, approved")
      .eq("parent_id", userId);
    if (error) throw new Error(error.message);
    if (!links?.length) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, education_type, grade_number, inter_year, stream")
      .in(
        "id",
        links.map((l) => l.student_id),
      );

    return links.map((l) => {
      const p = profiles?.find((x) => x.id === l.student_id);
      return {
        studentId: l.student_id,
        fullName: p?.full_name ?? "Waiting for approval",
        username: p?.username ?? "—",
        gradeLabel: p ? gradeLabel(p) : "",
        approved: l.approved,
        relation: l.relation,
      };
    });
  });

export const requestChildLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { username: string; relation: string }) => ({
    username: input.username.trim().toLowerCase(),
    relation: input.relation || "guardian",
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: student } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .maybeSingle();
    if (!student) throw new Error("No student found with that username.");
    if (student.id === context.userId) throw new Error("You cannot link your own account.");

    const { error } = await context.supabase.from("parent_student_links").insert({
      parent_id: context.userId,
      student_id: student.id,
      relation: data.relation,
    });
    if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const listParentRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("parent_student_links")
      .select("parent_id, relation, approved, created_at")
      .eq("student_id", context.userId)
      .eq("approved", false);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const approveParentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { parentId: string; approve: boolean }) => input)
  .handler(async ({ data, context }) => {
    const query = context.supabase.from("parent_student_links");
    const { error } = data.approve
      ? await query
          .update({ approved: true })
          .eq("parent_id", data.parentId)
          .eq("student_id", context.userId)
      : await query.delete().eq("parent_id", data.parentId).eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getChildDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { studentId: string }) => input)
  .handler(
    async ({ data, context }): Promise<ChildDashboard> =>
      loadChildDashboard(context.supabase, data.studentId),
  );

export const getChildRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { studentId: string }) => input)
  .handler(async ({ data, context }): Promise<ParentRecommendations> => {
    const dashboard = await loadChildDashboard(context.supabase, data.studentId);
    return generateParentRecommendations(dashboard);
  });
