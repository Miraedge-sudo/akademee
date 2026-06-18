/**
 * Response Utility - Standardized Response Format
 */

class Response {
  static success(res, message = 'Success', data = null, statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(res, message = 'Error', error = null, statusCode = 400) {
    res.status(statusCode).json({
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  static paginated(res, message = 'Success', data = [], total = 0, limit = 10, offset = 0, statusCode = 200) {
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = Response;
