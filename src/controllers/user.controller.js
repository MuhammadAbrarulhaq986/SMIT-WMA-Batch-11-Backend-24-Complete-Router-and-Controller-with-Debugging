import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from "fs"
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
    //* GET USER DETAILS FROM FROUNTEND
    //* VALIDATION -- NOT EMPTY
    //* CHECK IF USER ALREADY EXISTS: USERNAME , EMAIL
    //* CHECK FOR IMAGES, CHECK FOR AVATAR
    //* UPLOAD THEM TO CLOUDINARY, AVATAR
    //* CREATE USSER OBJECT -- CREATE ENTRY IN DB
    //* REMOVE PASSWORD AND REFRESH TOKEN FIELD FROM RESPONSE
    //* CHECK FOR USER CREATION 
    //* RETURN res

    const { fullName, email, username, password } = req.body
    //console.log(" fullName, email, username, password", email, password, username, fullName);
    //* THIS IS ALSO A GOOD WAY TO CHECK THE CONDITIONS
    //if (fullName === "") {
    //    throw new ApiError(400, "Fullname is required")
    //}

    if (
        [fullName, email, username, password].some((field) => field?.trim()=== "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    //console.log(req.files); //* THIS IS USED TO CHECK HOW THE FILES ARE GOING 
    if (existedUser) {
        throw new ApiError(409, "User already exists with the same username or email");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url, //*  THIS IS NECESSARY
        coverImage: coverImage?.url || "", //*  THIS IS OPTIONAL
        email,
        password,
        username: username.toLowerCase(),
    })

    //* WHEN YOU GET THE USER YOU WONT BE GETTING HIS PASSWORD AND REFRESHTOKEN
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

});

export { registerUser };  