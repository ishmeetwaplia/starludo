const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Game = require("../models/Game");
const { statusCode, resMessage } = require("../config/constant");
const fs = require("fs");
const path = require("path");

exports.login = async ({ email, password }) => {
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return {
        status: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.INVALID_CREDENTIALS
      };
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return {
        status: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.INVALID_CREDENTIALS
      };
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.LOGIN_SUCCESS,
      data: { id: admin._id, email: admin.email, token }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getDashboard = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId).select("-password");
    if (!admin) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.ADMIN_NOT_FOUND
      };
    }

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.DASHBOARD_FETCHED,
      data: admin
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.createUser = async ({ phone }) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const existing = await User.findOne({ phone });
    if (existing) {
      return {
        status: statusCode.CONFLICT,
        success: false,
        message: resMessage.USER_EXISTS
      };
    }

    const newUser = await User.create({ phone, isRegistered: false });

    return {
      success: true,
      status: statusCode.CREATED,
      message: resMessage.USER_CREATED,
      data: newUser
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.deleteUser = async (userId) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.USER_DELETED
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getUserById = async (userId) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.USER_FETCHED,
      data: user
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getAllUsers = async (query) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const {
      isActive,
      isBanned,
      search,
      page = 1,
      limit = 10
    } = query;

    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === "true"; 
    if (isBanned !== undefined) filter.isBanned = isBanned === "true"; 

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.USERS_FETCHED,
      data: {
        users,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.banUnbanUser = async (userId, isBanned) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    user.isBanned = isBanned;
    await user.save();

    return {
      success: true,
      status: statusCode.OK,
      message: isBanned ? resMessage.USER_BANNED : resMessage.USER_UNBANNED,
      data: user
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.updateUser = async (userId, userData) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    for (const key of Object.keys(userData)) {
      user[key] = userData[key];
    }

    await user.save();

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.USER_UPDATED,
      data: user
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.uploadScannerImage = async (adminId, file, upiId) => {
  try {
    if (!Admin) throw new Error(resMessage.ADMIN_MODEL_NOT_INITIALIZED);

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.ADMIN_NOT_FOUND
      };
    }

    if (!file) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "No image uploaded"
      };
    }

    if (!upiId) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "UPI ID is required"
      };
    }

    // Save in DB
    admin.scanner = {
      image: file.path,
      upiId
    };
    await admin.save();

    // === Minimal modification starts here ===
    const assetFilePath = path.join(__dirname, "../../asset.json"); // root folder

    let assetData = { scanners: [] };
    if (fs.existsSync(assetFilePath)) {
      const fileContent = fs.readFileSync(assetFilePath, "utf-8");
      try {
        assetData = JSON.parse(fileContent);
      } catch (e) {
        assetData = { scanners: [] }; // reset if corrupted
      }
    }

    // Ensure scanners key exists
    if (!Array.isArray(assetData.scanners)) {
      assetData.scanners = [];
    }

    // Add new scanner record
    assetData.scanners.push({
      image: file.path,
      upiId
    });

    // Write back to asset.json
    fs.writeFileSync(assetFilePath, JSON.stringify(assetData, null, 2));
    // === Minimal modification ends here ===

    return {
      success: true,
      status: statusCode.OK,
      message: "Scanner uploaded successfully",
      data: admin.scanner
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getAllGames = async (query) => {
  try {
    const {
      status,
      betAmountMin,
      betAmountMax,
      winningAmountMin,
      winningAmountMax,
      page = 1,
      limit = 10,
    } = query;

    const filter = {};

    if (status) filter.status = status;

    if (betAmountMin || betAmountMax) {
      filter.betAmount = {};
      if (betAmountMin) filter.betAmount.$gte = Number(betAmountMin);
      if (betAmountMax) filter.betAmount.$lte = Number(betAmountMax);
    }

    if (winningAmountMin || winningAmountMax) {
      filter.winningAmount = {};
      if (winningAmountMin) filter.winningAmount.$gte = Number(winningAmountMin);
      if (winningAmountMax) filter.winningAmount.$lte = Number(winningAmountMax);
    }

    const skip = (page - 1) * limit;

    const games = await Game.find(filter)
      .populate("createdBy", "_id username")
      .populate("acceptedBy", "_id username")
      .skip(skip)
      .limit(Number(limit));

    const total = await Game.countDocuments(filter);

    return {
      success: true,
      status: statusCode.OK,
      message: "Games fetched successfully",
      data: {
        games,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error,
    };
  }
};

exports.addCredit = async (userId, creditToAdd) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    // Add credit to the user’s account
    user.credit = (user.credit || 0) + creditToAdd;

    await user.save();

    return {
      success: true,
      status: statusCode.OK,
      message: "Credit added successfully",
      data: { userId: user._id, credit: user.credit }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getUserGameStats = async (userId, query) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    let { page = 1, limit = 10, type } = query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    // Build filter based on type
    let filter = {};
    if (type === "created") {
      filter.createdBy = userId;
    } else if (type === "accepted") {
      filter.acceptedBy = userId;
    } else if (type === "won") {
      filter.winner = userId;
    } else if (type === "lost") {
      filter.loser = userId;
    } else if (type === "quit") {
      filter.quitBy = userId;
    } else if (type === "played") {
      filter.$or = [{ createdBy: userId }, { acceptedBy: userId }];
    }

    // Fetch games with pagination
    const games = await Game.find(filter)
      .populate("createdBy", "_id username")
      .populate("acceptedBy", "_id username")
      .populate("winner", "_id username")
      .populate("loser", "_id username")
      .populate("quitBy", "_id username")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Game.countDocuments(filter);

    // Pre-calculate all counts
    const createdCount = await Game.countDocuments({ createdBy: userId });
    const acceptedCount = await Game.countDocuments({ acceptedBy: userId });
    const playedCount = await Game.countDocuments({ 
      $or: [{ createdBy: userId }, { acceptedBy: userId }]
    });
    const wonCount = await Game.countDocuments({ winner: userId });
    const lostCount = await Game.countDocuments({ loser: userId });
    const quitCount = await Game.countDocuments({ quitBy: userId });

    return {
      success: true,
      status: statusCode.OK,
      message: "User game stats fetched successfully",
      data: {
        userId,
        createdCount,
        acceptedCount,
        playedCount,
        wonCount,
        lostCount,
        quitCount,
        games,
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.uploadAssetsService = async (banners, tournaments) => {
  try {
    const bannerPaths = banners.map((file) => file.path);
    const tournamentPaths = tournaments.map((file) => file.path);

    if (bannerPaths.length === 0 && tournamentPaths.length === 0) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "No images uploaded",
      };
    }

    // === Handle asset.json ===
    const assetFilePath = path.join(__dirname, "../../asset.json");

    let assetData = { banners: [], tournaments: [] };
    if (fs.existsSync(assetFilePath)) {
      const fileContent = fs.readFileSync(assetFilePath, "utf-8");
      try {
        assetData = JSON.parse(fileContent);
      } catch (e) {
        assetData = { banners: [], tournaments: [] }; // reset if corrupted
      }
    }

    if (!Array.isArray(assetData.banners)) assetData.banners = [];
    if (!Array.isArray(assetData.tournaments)) assetData.tournaments = [];

    // Append new paths
    assetData.banners.push(...bannerPaths);
    assetData.tournaments.push(...tournamentPaths);

    // Save updated asset.json
    fs.writeFileSync(assetFilePath, JSON.stringify(assetData, null, 2));

    return {
      success: true,
      status: statusCode.OK,
      message: "Assets uploaded successfully",
      data: {
        banners: bannerPaths,
        tournaments: tournamentPaths,
      },
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error,
    };
  }
};
