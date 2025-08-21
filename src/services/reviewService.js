const { statusCode, resMessage } = require('../config/constant');
const Review = require('../models/Review');

exports.create = async (req) => {
    try {
        const { rating, comment } = req.body;

        const review = new Review({
            userId: req.auth._id,
            rating,
            comment
        });

        await review.save();
        return {
            status: statusCode.CREATED,
            success: true,
            message: resMessage.Review_created_successfully,
            data: review
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.reviewList = async () => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'username image')
            .sort({ createdAt: -1 });

        if (!reviews || reviews.length === 0) {
            return {
                data: [],
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.Review_list_retrieved_successfully
            };
        }

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Review_list_retrieved_successfully,
            data: reviews
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}

exports.stats = async () => {
    try {
        const stats = await Review.aggregate([
            {
                $group: {
                    _id: { rating: "$rating", userId: "$userId" }
                }
            },
            {
                $group: {
                    _id: "$_id.rating",
                    totalUsers: { $sum: 1 }
                }
            }
        ])

        if (!stats || stats.length === 0) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.No_reviews_found,
                data: []
            };
        }

        const averageRating = await Review.aggregate([
            {
                $group: {
                    _id: "null",
                    rating: {
                        $avg: "$rating"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    rating: 1
                }
            }
        ]);

        const ratingsCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRatings = 0;

        stats.forEach(stat => {
            ratingsCount[stat._id] = stat.totalUsers;
            totalRatings += stat.totalUsers;
        });

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Review_stats_retrieved_successfully,
            data: { ratingsCount, averageRating, totalRatings }
        };
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message
        };
    }
}