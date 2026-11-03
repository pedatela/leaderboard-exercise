/** Wrap domain data at the HTTP boundary; services return their data unchanged. */
export function successResponse(data, msg = "Request completed successfully.") {
  return {
    data,
    error: false,
    code: 0,
    msg,
  };
}

/** Only pass a public error code and message; never serialize the Error itself. */
export function errorResponse(code, msg) {
  return {
    data: {},
    error: true,
    code,
    msg,
  };
}
