import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/Section";
import { approveParentLink, listParentRequests } from "@/lib/parent.functions";

/** Lets a student approve or reject pending parent link requests. */
export function ParentRequests() {
  const qc = useQueryClient();
  const fetchRequests = useServerFn(listParentRequests);
  const decide = useServerFn(approveParentLink);

  const { data } = useQuery({
    queryKey: ["parent-requests"],
    queryFn: () => fetchRequests({}),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (v: { parentId: string; approve: boolean }) => decide({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.approve ? "Parent access approved." : "Request removed.");
      void qc.invalidateQueries({ queryKey: ["parent-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data || data.length === 0) return null;

  return (
    <GlassCard hover={false}>
      <div className="flex items-center gap-2 font-semibold text-white">
        <ShieldCheck className="h-4 w-4 text-[#FF4FD9]" /> Parent access requests
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {data.map((r) => (
          <li key={r.parent_id} className="glass flex items-center justify-between gap-3 rounded-xl p-3">
            <span className="text-white/80 capitalize">{r.relation} wants to follow your progress</span>
            <span className="flex gap-2">
              <button
                onClick={() => mutation.mutate({ parentId: r.parent_id, approve: true })}
                disabled={mutation.isPending}
                className="btn-neon btn-neon-hover text-xs disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => mutation.mutate({ parentId: r.parent_id, approve: false })}
                disabled={mutation.isPending}
                className="glass rounded-xl px-3 py-2 text-xs text-white/70"
              >
                Reject
              </button>
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
