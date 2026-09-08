import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Replaces Celery beat: weekly ingestion of new experts.
crons.weekly(
  "ingest-youtube-weekly",
  { dayOfWeek: "monday", hourUTC: 3 },
  api.ingest.ingestYoutube,
  {},
);

crons.weekly(
  "ingest-web-weekly",
  { dayOfWeek: "monday", hourUTC: 4 },
  api.ingest.ingestWeb,
  {},
);

export default crons;
