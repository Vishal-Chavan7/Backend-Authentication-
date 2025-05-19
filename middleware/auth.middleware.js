import jwt from "jsonwebtoken";

export const authmiddleware = (req,res,next)=>{
    // step1: check if the token is present in the request headers
    const token = req.cookies.token;

    console.log("-----------------Token from request:------------------------", token);
    if(!token){
        return res.status(401).json({
            message: "Token not found",
            success: false,
        });
    
    }

    // step 2: verify the token using jwt.verify method

    const decode = jwt.verify(token,process.env.JWT_SECRET);

    console.log("Decoded token:", decode);

    if(!decode){
        res.status(401).json({
            message: "Invalid token",
            success: false,
        })
    }

    // step 3: if the token is valid, attach the user id to the request object and call next()
    req.user = decode.id;
    console.log("User ID from token:", req.user);
    next();
}