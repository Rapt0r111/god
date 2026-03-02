// app/(dashboard)/roles/page.tsx
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { users } from "@/lib/db/schema";
import { RolesClient } from "@/components/roles/RolesClient";

export default async function RolesPage() {
  const [allTasks, allUsers] = await Promise.all([
    db.select().from(tasks),
    db.select().from(users),
  ]);

  return <RolesClient tasks={allTasks} users={allUsers} />;
}