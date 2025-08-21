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