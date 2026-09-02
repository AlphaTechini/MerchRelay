import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Card, WorkspacePage } from "../components/workspace-page";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  return prisma.activityEntry.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default function ActivityPage() {
  const activity = useLoaderData();

  return (
    <WorkspacePage
      eyebrow="Audit trail"
      title="Activity"
      description="A durable record of analysis, research, proposal decisions, executions, and verification results."
    >
      <Card
        title="Session activity"
        detail={`${activity.length} recent events`}
      >
        {activity.length === 0 ? (
          <div className="workspace-empty">No activity recorded yet.</div>
        ) : (
          <ul className="workspace-list">
            {activity.map((entry) => (
              <li className="workspace-list-item" key={entry.id}>
                <div>
                  <strong>{entry.type}</strong>
                  <span>{entry.summary}</span>
                  <span>
                    {entry.actor}
                    {entry.tool ? ` via ${entry.tool}` : ""}
                  </span>
                  {entry.metadata && (
                    <details>
                      <summary>View event details</summary>
                      <pre className="workspace-code">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </WorkspacePage>
  );
}
