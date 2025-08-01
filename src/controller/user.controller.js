import { asyncHendler } from "../utils/asyncHendler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.modal.js";
import  jwt  from "jsonwebtoken";


const generateAccessAndRefereshTokens = async(userID) => {
    try {
        const user = await User.findById(userID);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false });

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Error generating access and refresh tokens");
    }
}

let options = {
    httpOnly : true,
    secure: true
}

const registerUser = asyncHendler (async (req, res) => {
    //Todo get User Details form frontend 
    //? Validation  - not empty
    //* check if user already Exists : userName, email
    //? Create user Object  - Create  entey in DB
    //* Remove the password and refresh token fileds for form responce      
    //! check for the user creation
    //Todo return responce

    

    const {fullName, email, password, username} = req.body;

    if(
        [fullName,email,password,username].some((fileds) => fileds?.trim() === '')
    ){
        throw new ApiError(400, "Please Fill The All The Details")
    }

    const exisrtedUSer = await User.findOne({
        $or : [{username}, {email}]
    })

    if(exisrtedUSer){
        throw new ApiError(404, "USer Alredy Existed Please Login!")
    }

    const user = await User.create({
        fullName,
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    console.log(createdUser);
    

    return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    createdUser,
                    "User Ragister Succesfully"
                )
            )
    


})

const loginUser =  asyncHendler( async ( req, res) => {
    //Get Details Form The user
    // Get Validate The User Data
    //Find The User 
    //Check The Password
    // acces and Reffre Token 
    //Send Cookies

    const {username , email, password} = req.body;

    if( !username && !email ){
        throw new ApiError(400, "Username and Email Are the required From The login")
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User  Not Exist")
    }

    const isPasswordVaild = await user.isPasswordCorrect(password)

    if(!isPasswordVaild){
        throw new ApiError(401, "Please Enter The Vaild Password")
    }

    const {refreshToken, accessToken} = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
    )

})

const logoutUser = asyncHendler( async ( req, res) => {
    await User.findByIdAndUpdate(
        req?.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )

    return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "User Logout Successfully"
                )
            )
})

const refreshAccessToken = asyncHendler( async( req, res ) => {
    const incomingRefeshToken =  req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefeshToken){
        throw new ApiError(401, "Unauthorized Access")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefeshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefeshToken !== user?.refreshToken){
            throw new ApiError(402, "Refresh Token Has Been Expire")
        }
    
        const {accessToken, newRefreshToken} =  await generateAccessAndRefereshTokens(user._id)
    
        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ApiResponse(
                        200,
                        {accessToken, refreshToken : newRefreshToken},
                        "accessToken Refresh Successfully"
                    )
                )
    } catch (error) {
        throw new ApiError(500, error?.massage || "Invalid Refresh Token")
    }
})

export { registerUser , loginUser, logoutUser, refreshAccessToken }