import jwt from "jsonwebtoken";
import createError from "http-errors";

function signAccessToken(userId, role) {
  return new Promise((resolve, reject) => {
    const payload = { role };
    const secret = process.env.SECRETKEY;
    const options = {
      expiresIn: "12h",
      issuer: "localhost:9999",
      audience: userId,
    };

    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        reject(err);
        reject(createError.InternalServerError());
      }
      resolve(token);
    });
  });
}

function verifyAccessToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return next(createError.Unauthorized());

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.SECRETKEY, (err, payload) => {
    if (err) {
      return next(createError.Unauthorized());
    }
    req.user = { _id: payload._id, role: payload.role }; 
    next();
    console.log("role", req.user);
    
  });
}
function verifyRole(allowedRoles) {
  return (req, res, next) => {
    const { role } = req.payload;

    if (!allowedRoles.includes(role)) {
      return next(
        createError.Forbidden("Bạn không có quyền truy cập vào tài nguyên này")
      );
    }

    next();
  };
}

function authorize(allowedRoles) {
  if (!Array.isArray(allowedRoles)) {
    throw new Error("allowedRoles must be an array");
  }

  return (req, res, next) => {
    const { role } = req.user; 

    console.log(`Role from token (req.user.role): ${role}`);
    console.log(`Allowed roles: ${allowedRoles}`);

    if (!role) {
      return next(createError.Forbidden("Role not found in token"));
    }

    const roleAsString = String(role);  

    const allowedRolesAsString = allowedRoles.map(String);  

    if (!allowedRolesAsString.includes(roleAsString)) {
      return next(createError.Forbidden("Permission denied"));
    }

    next();  
  };
}
export { signAccessToken, verifyAccessToken, authorize, verifyRole };