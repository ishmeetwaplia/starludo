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
      assetData = { banners: [], tournaments: [] };
    }

    const banners = (assetData.banners || []).map((b) => ({
      ...b,
      isActive: typeof b.isActive === "boolean" ? b.isActive : false,
    }));

    const tournaments = (assetData.tournaments || []).map((t) => ({
      ...t,
      isActive: typeof t.isActive === "boolean" ? t.isActive : false,
    }));

    return {
      success: true,
      status: 200,
      message: "Assets fetched successfully",
      data: { banners, tournaments },
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

    const scanners = (assetData.scanners || []).map((s) => ({
      ...s,
      isActive: typeof s.isActive === "boolean" ? s.isActive : false,
    }));

    return {
      success: true,
      status: 200,
      message: "Scanners fetched successfully",
      data: scanners,
    };
  } catch (error) {
    return {
      status: 500,
      success: false,
      message: error.message || "Server Error",
    };
  }
};
