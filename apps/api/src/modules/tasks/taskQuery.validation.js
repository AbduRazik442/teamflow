
const ALLOWED_STATUSES = ["todo", "in-progress", "completed"];
const ALLOWED_PRIORITIES = ["low", "medium", "high"];

const ALLOWED_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "dueDate",
  "priority",
  "title",
];

export function validateTaskQuery(req, res, next) {
  const {
    status,
    priority,
    sortBy,
    sortOrder,
    page,
    limit,
    search,
  } = req.query;

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task status filter.",
    });
  }

  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task priority filter.",
    });
  }

  if (sortBy && !ALLOWED_SORT_FIELDS.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: "Invalid task sort field.",
    });
  }

  if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
    return res.status(400).json({
      success: false,
      message: "Sort order must be asc or desc.",
    });
  }

  const parsedPage = Number(page ?? 1);
  const parsedLimit = Number(limit ?? 10);

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1 ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Page must be positive and limit must be between 1 and 100.",
    });
  }

  if (search && (typeof search !== "string" || search.length > 100)) {
    return res.status(400).json({
      success: false,
      message: "Search must not exceed 100 characters.",
    });
  }

  next();
}