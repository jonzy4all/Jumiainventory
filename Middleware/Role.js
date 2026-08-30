// const jwt = require("jsonwebtoken");

// // Middleware to verify JWT token
// exports.authorize = (...Roles) => {
//   return (req, res, next) => {
//     try {
//       // 1. Get Authorization header
//       const authHeader = req.headers.authorization;

//       if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).json({
//           success: false,
//           message: "No token provided.",
//         });
//       }

//       // 2. Extract JWT
//       const token = authHeader.split(" ")[1];

//       // 3. Verify JWT
//       const decoded = jwt.verify(
//         token,
//         process.env.JWT_SECRET
//       );

//       // 4. Store decoded JWT information
//       req.user = decoded;

//       // 5. Check role
//       if (
//         Roles.length > 0 &&
//         !Roles.includes(req.user.role)
//       ) {
//         return res.status(403).json({
//           success: false,
//           message: "Access denied. Insufficient permissions.",
//         });
//       }

//       // 6. Continue to controller
//       next();

//     } catch (error) {
//       console.error("JWT verification error:", error.message);

//       // Expired token
//       if (error.name === "TokenExpiredError") {
//         return res.status(401).json({
//           success: false,
//           message: "Token has expired. Please login again.",
//         });
//       }

//       // Invalid token
//       if (error.name === "JsonWebTokenError") {
//         return res.status(401).json({
//           success: false,
//           message: "Invalid token.",
//         });
//       }

//       return res.status(401).json({
//         success: false,
//         message: "Authentication failed.",
//       });
//     }
//   };
// };