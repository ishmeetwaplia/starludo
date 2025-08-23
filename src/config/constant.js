const statusCode = {
    BAD_REQUEST: 400,
    OK: 200,
    INTERNAL_SERVER_ERROR: 500,
    NOT_FOUND: 404,
    FORBIDDEN: 403,
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
    INVALID_CREDENTIALS: "Invalid email or password",
    LOGIN_SUCCESS: "Login successful",
    ADMIN_NOT_FOUND: "Admin not found",
    DASHBOARD_FETCHED: "Admin dashboard fetched",
    USER_MODEL_NOT_INITIALIZED: "User model not initialized yet",
    USER_EXISTS: "User already exists",
    USER_CREATED: "User created successfully",
    USER_NOT_FOUND: "User not found",
    USER_DELETED: "User deleted successfully",
    USER_UPDATED : "User updated successfully",
    USER_BANNED : "User has been banned",
    USER_UNBANNED : "User has been unbanned",
    KYC_UPDATED : "KYC status updated successfully",
    USER_FETCHED: "User fetched successfully",      
    USERS_FETCHED: "All users fetched successfully",
    No_pending_game_found_for_this_user: "No pending game found for this user",
    Room_id_created_successfully: "Room id created successfully",
};

module.exports = {
    statusCode,
    resMessage
};
