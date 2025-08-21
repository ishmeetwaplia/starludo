const statusCode = {
    BAD_REQUEST: 400,
    OK: 200,
    INTERNAL_SERVER_ERROR: 500,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    CREATED: 201,
};

const resMessage = {
    OTP_SENT: "OTP sent successfully",
    User_not_found: "User not found",
    Invalid_or_expired_OTP: "Invalid or expired OTP",
    OTP_verified_successfully: "OTP verified successfully",
    Passwords_do_not_match: "Password and Confirm Password do not match",
    Password_created: "Password created successfully",
    Profile_fetched_successfully: "Profile fetched successfully",
    Token_missing: "Token is required",
    Token_invalid: "Invalid or expired token",
    Logout_successful: "Logout successful",
    Review_created_successfully: "Review created successfully",
    Review_list_retrieved_successfully: "Review list retrieved successfully",
    No_reviews_found: "No reviews found",
    Review_stats_retrieved_successfully: "Review stats retrieved successfully",
};

module.exports = {
    statusCode,
    resMessage
};
