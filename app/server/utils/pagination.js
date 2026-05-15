/**
 * 📄 Pagination helper utilities
 * Standardizes pagination across all API endpoints
 */

export class PaginationHelper {
  /**
   * Parse pagination params from query string
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page (default 20)
   * @returns {object} {page, limit, offset}
   */
  static parsePaginationParams(page = 1, limit = 20) {
    // Validate and sanitize
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100); // Max 100 items per page
    const offset = (pageNum - 1) * pageLimit;

    return {
      page: pageNum,
      limit: pageLimit,
      offset,
    };
  }

  /**
   * Format paginated response
   * @param {array} items - Items returned
   * @param {number} total - Total count of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {object} Formatted pagination response
   */
  static formatResponse(items, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };
  }

  /**
   * Validate pagination params middleware
   */
  static middleware() {
    return (req, res, next) => {
      const { page = 1, limit = 20 } = req.query;
      req.pagination = PaginationHelper.parsePaginationParams(page, limit);
      next();
    };
  }
}

export default PaginationHelper;
