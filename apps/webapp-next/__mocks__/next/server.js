class NextResponse {
  static json(body, init) {
    return {
      json: async () => body,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    };
  }
}

module.exports = {
  NextResponse,
};
