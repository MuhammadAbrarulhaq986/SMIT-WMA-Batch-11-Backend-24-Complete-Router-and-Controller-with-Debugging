import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    //* GET USER DETAILS FROM FROUNTEND
    //* VALIDATION -- NOT EMPTY
    //* CHECK IF USER ALREADY EXISTS: USERNAME , EMAIL
    //* CHECK FOR IMAGES, CHECK FOR AVATER
    //* UPLOAD THEM TO CLOUDINARY, AVATER
    //* CREATE USSER OBJECT -- CREATE ENTRY IN DB
    //* REMOVE PASSWORD AND REFRESH TOKEN FIELD FROM RESPONSE
    //* CHECK FOR USER CREATION 
    //* RETURN res

    const { fullName, email, username, password } = req.body
    console.log(" fullName, email, username, password", email, password, username, fullName);
    //* THIS IS ALSO A GOOD WAY TO CHECK THE CONDITIONS
    //if (fullName === "") {
    //    throw new ApiError(400, "Fullname is required")
    //}

    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists with the same username or email");
    }

    const avatarLocalPath = req.files?.avatar[0].path;

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avater file is required");
    }

    const avater = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avater) {
        throw new ApiError(400, "Avater file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avater.url, //*  THIS IS NECESSARY
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