import User from "../model/user.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



const userRegistration = async (req, res) => {
  // Step 1: Get the data from the request body
  const { name, email, password } = req.body;
  console.table({ name, email, password });

  // Step 2: Validate the data
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Please fill all the fields",
    });
  }

  // Step 3: Check if the user already exists in the database
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  // Step 4: Create a new user in the database
  try {
    const user = await User.create({
      name,
      email,
      password,
    });

    // Step 5: Save the token in the verificationToken field in the database
    const token = crypto.randomBytes(32).toString("hex");
    console.log("Generated Token:", token);

    user.verificationToken = token;
    await user.save();

    // Step 6: Send the token to the user's email

    const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
  },
});
    
    console.log("Transporter created:", transporter);
    
    const mailOptions = {
        from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
        to: user.email,
        subject: "Verify your email",
        text: `Please click on the link to verify your email:
               ${process.env.BASE_URL}/api/v1/users/verify/${token}`, // Plain text body
        html: `<b>Please click on the link to verify your email:</b>
               <a href="${process.env.BASE_URL}/api/v1/users/verify/${token}">Verify Email</a>`, // HTML body
    };
    
    console.log("Mail options:", mailOptions);
    
    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log("Error sending email:", err);
        } else {
            console.log("Email sent successfully:", info.response);
        }
    });

    // Step 7: Send the response to the user after all steps are completed
    res.status(200).json({
      message: "User registered successfully. Please check your email to verify your account.",
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "User not registered",
      success: false,
      err,
    });
  }
};


const verify = async (req, res) => {
    // Step 1: Get the token from the request params
    const { token } = req.params;
    console.log("Token from request:", token);

    if (!token) {
        return res.status(400).json({
            message: "Token not found",
            success: false,
        });
    }

    // Step 2: Check if the token is valid or not (search the token in the database)
    try {
        const user = await User.findOne({ verificationToken: token });
        console.log("User found in database:", user);

        if (!user) {
            return res.status(400).json({
                message: "Invalid token",
                success: false,
            });
        }

        // Step 3: If the token is valid, update the user to verified and remove the token
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        return res.status(200).json({
            message: "User verified successfully",
            success: true,
        });
    } catch (error) {
        console.log("Error during verification:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
}
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please fill all the fields",
        });
    }

    // Step 2: Check if the user already exists in the database
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        return res.status(400).json({
            message: "User does not exist",
        });
    }

    // Step 3: Check if the password is correct
    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
        return res.status(400).json({
            message: "Invalid credentials",
        });
    }

    // Step 4: Check if the user is verified
    if (!existingUser.isVerified) {
        return res.status(400).json({
            message: "User not verified",
        });
    }

    // Step 5: Generate a JWT token
    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("Generated JWT token:", token);

    // Step 6: Send the token in the cookie
    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: process.env.NODE_ENV === "production", // Use secure only in production
        sameSite: "strict", // Prevent CSRF attacks
        path: "/", // Makes the cookie available for the entire domain
    });

    // Step 7: Send the response to the user after all steps are completed
    res.status(200).json({
        message: "User logged in successfully",
        success: true,
        token,
        user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            isVerified: existingUser.isVerified,
        },
    });
};


const logout = async (req, res) => {
    try {
        // Step 1: Clear the cookie
        res.cookie("token", null, {
            httpOnly: true,
            maxAge: 0, // Immediately expires the cookie
            secure: process.env.NODE_ENV === "production", // Use secure only in production
            sameSite: "strict", // Prevent CSRF attacks
            path: "/", // Ensure the path matches the one used when setting the cookie
        });

        // Step 2: Send the response to the user
        res.status(200).json({
            message: "User logged out successfully",
            success: true,
        });
    } catch (err) {
        console.log("Error during logout:", err);
        res.status(500).json({
            message: "Logout failed",
            success: false,
            error: err.message,
        });
    }
};


const getMe = async (req,res)=>{
    try{
        //step 1: get the user id from the request object
        const userId = req.user;
        console.log("User ID from request:", userId);

        //step 2: find the user in the database
        const user = await User.findById(userId).select("-password ")
        console.log("User found in database:", user);

        //step 3: check if the user exists or not
        if(!user){
            return res.status(400).json({
                message: "User not found",
                success: false,
            });
        }

        //step 4: send the response to the user
        res.status(200).json({  
            message: "User fetched successfully",
            success: true,
            user,
        });

       

    }catch(err){
        console.log("Error getting user:", err);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: err.message,
        });
    }
}


const forgotPassword = async (req, res) => {
    // step 1: Get the email from the request body

    const {email} = req.body;
    console.log("Email from request:", email);
    if(!email){
        return res.status(400).json({
            message: "Please provide an email",
            success: false,
        });
    }
    // step 2: Check if the user exists in the database
    try {
        const user = await User.findOne({email});
        console.log("User found in database:", user);
        if(!user){
            return res.status(400).json({
                message: "User not found",
                success: false,
            });
        }

        // step 3: Generate a reset password token
        const resetToken = crypto.randomBytes(32).toString("hex");
        console.log("Generated reset password token:", resetToken);

        // step 4: Save the token in the databaseus
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // step 5: Send the token to the user's email
        const resetPasswordUrl = `${process.env.BASE_URL}/api/v1/users/reset-password/${resetToken}`;
        console.log("Reset password URL:", resetPasswordUrl);

        // step 6: Send the response to the user
        res.status(200).json({
            message: "Reset password link sent successfully",
            success: true,
            resetPasswordUrl,
        });


        // step 7: Send the email

        const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
           user: process.env.SMTP_USER,
           pass: process.env.SMTP_PASS,
  },
});
        console.log("Transporter created:", transporter);


        const mailOptions = {
            from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
            to: email,
            subject: "Password Reset",
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            ${resetPasswordUrl}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
            html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                   <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                   <a href="${resetPasswordUrl}">Reset Password</a>
                   <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`, // HTML body
        };

        console.log("Mail options:", mailOptions);

        // Send the email
        await transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log("Error sending email:", err);
            } else {
                console.log("Email sent successfully:", info.response);
            }
        });
  
    } catch (error) {
        console.log("Error finding user:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
}

const resetPassword = async (req, res) => {
    // Step 1: Get the token from the params and the password from the body
    const { token } = req.params;
    const { password } = req.body;
    console.log("Token from request:", token);
    console.log("Password from request:", password);

    if (!token || !password) {
        return res.status(400).json({
            message: "Please provide a token and a password",
            success: false,
        });
    }

    // Step 2: Check if the token is valid or not (search the token in the database)
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }, // Ensure the token is not expired
        });
        console.log("User found in database:", user);

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired token",
                success: false,
            });
        }

        // Step 3: If the token is valid, update the user's password and remove the token
        const passwordHash = await bcrypt.hash(password, 10);
        console.log("Hashed password:", passwordHash);

        user.password = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Step 4: Send the response to the user
        res.status(200).json({
            message: "Password reset successfully",
            success: true,
            user
        });
    } catch (error) {
        console.log("Error during password reset:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
};
    

export { userRegistration,verify,login ,logout,getMe, forgotPassword, resetPassword}; ;