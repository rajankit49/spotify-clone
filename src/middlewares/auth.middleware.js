const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');


async function authArtist(req, res, next) {
    
    const authHeader = req.headers.authorization;
    const token = req.cookies.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if(!token){
        return res.status(401).json({ message: "Unauthorized"})
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role !== "artist"){
            return res.status(403).json({ message: "You don't have access"})
        }

        req.user = decoded;
        next();
    }
    catch (err) {
        console.log(err);
        return res.status(401).json({ message: "Unauthorized"})
    }
    
}

async function authUser(req,res,next) {
    const authHeader = req.headers.authorization;
    const token = req.cookies.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    
    if (!token) {
        return res.status(401).json({ message: "Unauthorized"})
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(decoded.role !== "user" && decoded.role !== "artist" && decoded.role !== "admin") {
            return res.status(403).json({ message: "You don't have access"})
        }

        req.user = decoded;
        next();

    } catch (error) {

        console.log(error);
        return res.status(401).json({message: "Unauthorized"})
    }
}

async function authAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = req.cookies.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if(!token){
        return res.status(401).json({ message: "Unauthorized"})
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role !== "admin"){
            return res.status(403).json({ message: "You don't have admin access"})
        }

        req.user = decoded;
        next();
    }
    catch (err) {
        console.log(err);
        return res.status(401).json({ message: "Unauthorized"})
    }
}

module.exports = {authArtist, authUser, authAdmin};