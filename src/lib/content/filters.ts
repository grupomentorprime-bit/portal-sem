import type { ContentQueryFilters } from "@/types/content";

const DANGEROUS_KEY_PATTERN = /^\$|\.|\0/;

export function sanitizeFilterValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim().slice(0, 500);
    if (DANGEROUS_KEY_PATTERN.test(trimmed)) return undefined;
    return trimmed;
  }
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim().slice(0, 100))
      .slice(0, 20);
  }
  return undefined;
}

export function buildMongoFilter(
  tenant: string,
  filters?: ContentQueryFilters,
  options?: { includeDraft?: boolean; collection?: string }
): Record<string, unknown> {
  const mongo: Record<string, unknown> = { tenant };

  const statusless = options?.collection === "academy_categories" ||
    options?.collection === "content_news_categories";

  if (statusless) {
    if (!options?.includeDraft) {
      mongo.enabled = true;
    }
  } else if (!options?.includeDraft) {
    mongo.status = filters?.status ?? "published";
  } else if (filters?.status) {
    mongo.status = filters.status;
  }

  if (filters?.featured === true) mongo.featured = true;
  if (filters?.slug) mongo.slug = filters.slug;

  const category = filters?.category ?? filters?.categoryId;
  if (category) {
    mongo.$or = [{ categories: category }, { category }];
  }

  if (filters?.tags && filters.tags.length > 0) {
    mongo.tags = { $in: filters.tags };
  }

  if (filters?.search) {
    const regex = { $regex: filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    mongo.$or = [
      { title: regex },
      { summary: regex },
      { name: regex },
      { content: regex },
    ];
  }

  if (filters?.dateFrom || filters?.dateTo) {
    const dateFilter: Record<string, string> = {};
    if (filters.dateFrom) dateFilter.$gte = filters.dateFrom;
    if (filters.dateTo) dateFilter.$lte = filters.dateTo;
    mongo.publishedAt = dateFilter;
  }

  if (filters?.upcoming === true) {
    const today = new Date().toISOString().slice(0, 10);
    mongo.$and = [
      ...(Array.isArray(mongo.$and) ? (mongo.$and as Record<string, unknown>[]) : []),
      {
        $or: [
          { endDate: { $gte: today } },
          { endDate: "" },
          { endDate: { $exists: false } },
          {
            $and: [
              { $or: [{ endDate: "" }, { endDate: { $exists: false } }] },
              { startDate: { $gte: today } },
            ],
          },
        ],
      },
    ];
  }

  if (options?.collection === "content_academic_agenda" && !options?.includeDraft) {
    const now = new Date().toISOString();
    mongo.$and = [
      ...(Array.isArray(mongo.$and) ? (mongo.$and as Record<string, unknown>[]) : []),
      {
        $or: [{ visibleFrom: "" }, { visibleFrom: { $exists: false } }, { visibleFrom: { $lte: now } }],
      },
      {
        $or: [
          { visibleUntil: "" },
          { visibleUntil: { $exists: false } },
          { visibleUntil: { $gte: now } },
        ],
      },
    ];
  }

  if (filters?.personRole) mongo.personRole = filters.personRole;

  if (options?.collection === "content_people" && !options?.includeDraft) {
    mongo.$and = [
      ...(Array.isArray(mongo.$and) ? (mongo.$and as Record<string, unknown>[]) : []),
      {
        $or: [{ visible: { $ne: false } }, { visible: { $exists: false } }],
      },
      {
        $or: [
          { personStatus: { $exists: false } },
          { personStatus: { $nin: ["historical"] } },
        ],
      },
    ];
  }

  const now = new Date().toISOString();
  if (!statusless) {
    mongo.$and = [
      ...(Array.isArray(mongo.$and) ? (mongo.$and as Record<string, unknown>[]) : []),
      { $or: [{ expiresAt: "" }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }] },
    ];
  }

  return mongo;
}

export function parseFilters(raw?: Record<string, unknown>): ContentQueryFilters | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const filters: ContentQueryFilters = {};

  if (typeof raw.featured === "boolean") filters.featured = raw.featured;
  if (typeof raw.published === "boolean" && raw.published) filters.status = "published";
  if (typeof raw.category === "string") filters.category = sanitizeFilterValue(raw.category) as string;
  if (typeof raw.categoryId === "string") filters.categoryId = sanitizeFilterValue(raw.categoryId) as string;
  if (typeof raw.status === "string") filters.status = raw.status as ContentQueryFilters["status"];
  if (typeof raw.slug === "string") filters.slug = sanitizeFilterValue(raw.slug) as string;
  if (typeof raw.search === "string") filters.search = sanitizeFilterValue(raw.search) as string;
  if (typeof raw.dateFrom === "string") filters.dateFrom = raw.dateFrom;
  if (typeof raw.dateTo === "string") filters.dateTo = raw.dateTo;
  if (raw.upcoming === true) filters.upcoming = true;
  if (typeof raw.personRole === "string") {
    filters.personRole = sanitizeFilterValue(raw.personRole) as string;
  }
  if (Array.isArray(raw.tags)) filters.tags = sanitizeFilterValue(raw.tags) as string[];

  return Object.keys(filters).length > 0 ? filters : undefined;
}
