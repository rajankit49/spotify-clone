const userModel = require('../models/user.model');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');



async function registerUser(req, res){

    const { username, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    const hash = await bcrypt.hash(password,10)

    if (isUserAlreadyExists){
        return res.status(409).json({ message: "User already exists"})
    }

    const user = await userModel.create({
        username,
        email,
        password: hash,
        role: "user"
    })

    const token = jwt.sign({
        id: user._id,
        role: user.role,
    }, process.env.JWT_SECRET)


    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL,
        sameSite: (process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL) ? 'none' : 'lax'
    })

    res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        }
    })
}

async function loginUser(req, res){

    const { username, email, password} = req.body;


    const user = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if(!user){
        return res.status(401).json({ message: "Invalid credentials" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid){
        return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({
        id: user._id,
        role: user.role,
    }, process.env.JWT_SECRET)

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL,
        sameSite: (process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL) ? 'none' : 'lax'
    })

    res.status(200).json({
        message: "User logged in successfully",
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        }
    })
}

async function logoutUser(req, res){
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL,
        sameSite: (process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL) ? 'none' : 'lax'
    });

    return res.status(200).json({ message: "User logged out successfully"});
}
module.exports = { registerUser, loginUser, logoutUser }
