const User = require("../models/user.model");

const listUsers = async (payload) => {
  try {
    const { email, limit, page, role } = payload || {}; // Extract filters from query params

    // Pagination
    const perPage = parseInt(limit) || 10;
    const pageNumber = parseInt(page) || 1;
    const skip = (pageNumber - 1) * perPage;
    const userCriteria = {
      role,
    };

    if (email) userCriteria.email = { $regex: email, $options: "i" };

    const companyPipeline = [
      {
        $match: userCriteria,
      },

      { $sort: { createdAt: -1 } }, // Sort by createdAt
      { $skip: skip }, // Pagination - skip
      { $limit: perPage }, // Pagination - limit
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          mobileNumber: 1,
          isNumberVerified: 1,
          isApproved: 1,
          permissions: 1,
          name: 1,
          role:1
        },
      },
    ];
    const companyPipelineWithoutEmptyObjects = companyPipeline.filter(
      (stage) => Object.keys(stage).length > 0
    );

    const companies = await User.aggregate(companyPipelineWithoutEmptyObjects);

    return companies;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  listUsers,
};
