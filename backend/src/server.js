import app from "./app.js";
import { PORT } from "./config/index.js";

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 JU ASA Exit Exam Training Platform Backend`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
