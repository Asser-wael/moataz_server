import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";

export const authMiddleware = (req, res, next) => {
    try {

        const authHeaders = req.headers.authorization;


        if (!authHeaders) {
            return res.status(401).json({ message: "No token" });
        }

        const token = authHeaders.split(" ")[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired",
                code: "TOKEN_EXPIRED"
            });
        }

        return res.status(401).json({
            message: "Invalid token",
            code: "INVALID_TOKEN"
        });
    }
};
export const adminMiddleware = async (req, res, next) => {
    try {
        const user = await UserModel.findById(req.user.id)
        if (!user) {
            return res.json({ message: "User not found",type:"error" });
        }
        if (user.role !== "admin") {
            return res.json({ message: "No admin access" , type:"error"});
        }
        next()
    } catch (error) {
        console.error("Error:", error);
    }
}
export const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};