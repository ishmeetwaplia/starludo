const User = require("../models/User"); 

exports.generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.generateUsername = (length = 5) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateRandomReferCode(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

exports.generateUniqueReferCode = async (length = 8) => {
    let code;
    let exists = true;
    while (exists) {
        code = generateRandomReferCode(length);
        const user = await User.findOne({ referCode: code }).select("_id");
        if (!user) exists = false;
    }
    return code;
}
