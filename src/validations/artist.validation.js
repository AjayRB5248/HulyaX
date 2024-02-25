const Joi = require("joi");

const addArtist = {
  body: Joi.object().keys({
    artists: Joi.array().items(
      Joi.object().keys({
        artistName: Joi.string().required(),
        category: Joi.string().required(),
      })
    ),
  }),
};

const updateArtist = {
  body: Joi.object().keys({
    artistName: Joi.string().optional(),
    category: Joi.string().optional(),
  }),
};

const deleteArtist = {
  params: Joi.object()
    .keys({
      artistId: Joi.string().required(),
    })
    .unknown(),
};

module.exports = {
  addArtist,
  updateArtist,
  deleteArtist,
};
