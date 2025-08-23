const fs = require("fs");
const path = require("path");

exports.getAssetsService = async () => {
  try {
    const assetFilePath = path.join(__dirname, "../../asset.json");

    if (!fs.existsSync(assetFilePath)) {
      return {
        status: 404,
        success: false,
        message: "No assets found",
        data: { banners: [], tournaments: [] },
      };
    }

    const fileContent = fs.readFileSync(assetFilePath, "utf-8");
    let assetData = { banners: [], tournaments: [] };

    try {
      assetData = JSON.parse(fileContent);
    } catch (e) {
      assetData = { banners: [], tournaments: [] }; // reset if corrupted
    }

    return {
      success: true,
      status: 200,
      message: "Assets fetched successfully",
      data: {
        banners: assetData.banners || [],
        tournaments: assetData.tournaments || [],
      },
    };
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error.message || "Server Error",
    };
  }
};

exports.getScannersService = async () => {
  try {
    const assetFilePath = path.join(__dirname, "../../asset.json");

    if (!fs.existsSync(assetFilePath)) {
      return {
        status: 404,
        success: false,
        message: "No scanners found",
        data: [],
      };
    }

    const fileContent = fs.readFileSync(assetFilePath, "utf-8");
    let assetData = { scanners: [] };

    try {
      assetData = JSON.parse(fileContent);
    } catch (e) {
      assetData = { scanners: [] }; 
    }

    return {
      success: true,
      status: 200,
      message: "Scanners fetched successfully",
      data: assetData.scanners || [],
    };
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error.message || "Server Error",
    };
  }
};

