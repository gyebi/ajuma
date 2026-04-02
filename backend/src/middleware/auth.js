import admin from "../config/firebaseAdmin.js";

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized: No token provided"
      });
    }

    const idToken = authHeader.slice("Bearer ".length).trim();

    if (!idToken) {
      return res.status(401).json({
        error: "Unauthorized: Empty token"
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    req.user = decodedToken;

    return next();
  } catch (error) {
    console.error("Token verification failed:", error);

    return res.status(401).json({
      error: "Unauthorized: Invalid token"
    });
  }
}
