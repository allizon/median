"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "./actions";

type Props = {
  user: {
    username: string;
    displayName: string | null;
    showInProgressOnProfile: boolean;
  };
};

export default function SettingsForm({ user }: Props) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.success && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          Profile updated.
        </p>
      )}
      {state?.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profile</h2>

        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={user.username}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50 aria-invalid:border-destructive"
            aria-invalid={!!state?.errors?.username}
          />
          {state?.errors?.username && (
            <p className="text-xs text-destructive">{state.errors.username[0]}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Your profile URL: /@{user.username}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-sm font-medium">
            Display name <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={user.displayName ?? ""}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
            placeholder="Your name"
          />
          {state?.errors?.displayName && (
            <p className="text-xs text-destructive">{state.errors.displayName[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Privacy</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="showInProgressOnProfile"
            defaultChecked={user.showInProgressOnProfile}
            className="rounded"
          />
          <span className="text-sm">
            Show in-progress items on my profile
            <span className="block text-xs text-muted-foreground mt-0.5">
              Visible to accepted friends only.
            </span>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Link
          href={`/@${user.username}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          View profile
        </Link>
      </div>
    </form>
  );
}
