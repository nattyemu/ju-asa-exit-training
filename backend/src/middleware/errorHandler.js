const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      success: false,
      message: "A user with this email already exists",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
  });
};

export default errorHandler;
