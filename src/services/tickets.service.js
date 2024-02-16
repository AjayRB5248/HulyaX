const TicketConfigModel = require("../models/ticket-configs.model");
const TicketModel = require("../models/tickets.model");
const moment = require("moment");
const EventModel = require("../models/events.model");
const TicketConfigs = require("../models/ticket-configs.model");
const { generateSessionUrlStripe } = require("./stripe");
const uuid = require("uuid");
const qr = require("qrcode"); // Library for generating QR codes
const mongoose = require("mongoose");
const { uploadToS3Bucket } = require("./s3/s3Service");

const purchaseTicket = async (payload, user) => {
  const { eventId, tickets } = payload; // receive other payment related keys from payload
  const ticketConfigId = tickets?.map((p) => p?.ticketId);
  const ticketConfigs = await TicketConfigModel.find({
    _id: { $in: ticketConfigId },
  }).lean();
  const allTicketsHaveEnoughSeats = tickets.every((ticket) => {
    const ticketConfig = ticketConfigs.find(
      (config) => config._id.toString() === ticket.ticketId
    );

    if (!ticketConfig) {
      throw new Error(`Ticket with ID ${ticket.ticketId} not found.`);
    }

    return ticketConfig.availableSeats >= ticket.quantity;
  });

  if (!allTicketsHaveEnoughSeats) {
    throw new Error(`Not enough available seats for one or more tickets.`);
  }

  let products = [];
  for (let i = 0; i < ticketConfigs?.length; i++) {
    const currentTicket = tickets?.find(
      (ticket) => ticket.ticketId + "" === ticketConfigs[i]?._id + ""
    );
    let currentProduct = {
      price_data: {
        currency: "aud",
        product_data: {
          name: ticketConfigs[i].type,
        },

        unit_amount: `${ticketConfigs[i]?.price}00`,
      },
      quantity: currentTicket?.quantity,
    };
    products.push(currentProduct);
  }

  const { url } = await generateSessionUrlStripe(products, user, tickets);
  return url;
};

const viewTickets = async (payload, user) => {
  const { eventId, venueName } = payload;
  const currentEvents = await EventModel.findById(eventId).lean();
  if (!currentEvents) throw new Error("Event not found");
  const venueId = currentEvents?.venues?.find(
    (venue) => venue?.venueName + "" === venueName + ""
  )?._id;
  if (!venueId) throw new Error("Venue not found");
  const ticketCollections = await TicketConfigs.find({
    venueId,
    eventId,
  }).lean();
  return ticketCollections;
};

const handleTicketPurchase = async (ticketPayload) => {
  try {
    let purchaseTicketPromises = [];
    for (let i = 0; i < ticketPayload.length; i++) {
      purchaseTicketPromises.push(
        TicketConfigModel.findByIdAndUpdate(
          ticketPayload[i].ticketId,
          {
            $inc: {
              soldSeats: ticketPayload[i].quantity,
              availableSeats: -ticketPayload[i].quantity,
            },
          },
          { new: true }
        ).lean()
      );
    }
    const purchaseTicket = await Promise.all(purchaseTicketPromises);

    for (let i = 0; i < purchaseTicket.length; i++) {
      let s3Promises = [];
      const currentTicket = purchaseTicket[i];
      const currentPayload = ticketPayload?.find(
        (p) => p.ticketId + "" === currentTicket?._id + ""
      );
      for (let p = 0; p < currentPayload?.quantity; p++) {
        const barcodeText = `${currentTicket?.type}_${generateTicketId()}`;
        const barcode = await generateQRCode(barcodeText);
        const buffer = Buffer.from(
          barcode.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
        s3Promises.push(
          uploadToS3Bucket(buffer, "image/jpeg", `ticket/${barcodeText}`)
        );
      }

      const s3Tickets = await Promise.all(s3Promises);
      //return me in array with location and barcode text
      const purchasedTicket = s3Tickets.map((s3Ticket) => {
        return {
          barcode: s3Ticket.Location,
          uniqueId: s3Ticket.Key?.split("/")?.[1],
        };
      });

      let ticketObject = {
        status: "CONFIRMED",
        ticketTypeId: currentTicket?._id,
        bookedDate: moment().toISOString(),
        eventId: currentTicket?.eventId,
        customer: ticketPayload?.[0]?.userId,
        purchasedTicket,
      };

      const bookedTicket = new TicketModel(ticketObject);
      await bookedTicket.save();
    }
  } catch (error) {
    console.error(error);
  }
};

const generateTicketId = () => {
  return uuid.v4();
};

const generateQRCode = async (text) => {
  try {
    return await qr.toDataURL(text);
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
};

const verifyQRCode = async (payloadData) => {
  try {
    const { eventId, ticketId } = payloadData ?? {};
    const currentTicket = await TicketModel.findOne({
      eventId,
      purchasedTicket: { $elemMatch: { uniqueId: ticketId } },
    })
      .select("_id purchasedTicket")
      .lean();
    if (!currentTicket) throw new Error("Ticket not found");
    const matchedTicket = currentTicket?.purchasedTicket?.find(
      (p) => p?.uniqueId + "" === ticketId + ""
    );
    const matchedIndex = currentTicket?.purchasedTicket?.findIndex(
      (p) => p?.uniqueId + "" === ticketId + ""
    );
    if (!matchedTicket) throw new Error("Ticket not found");
    if (matchedTicket?.isVerified) throw new Error("Ticket Already verified");

    const updateQuery = {};
    updateQuery[`purchasedTicket.${matchedIndex}.isVerified`] = true;

    const ticket = await TicketModel.findOneAndUpdate(
      { eventId, "purchasedTicket.": { $elemMatch: { uniqueId: ticketId } } },
      { $set: updateQuery },
      { new: true }
    );

    return ticket;
  } catch (error) {
    console.error("Error verifying QR code:", error);
    throw error;
  }
};

const getTicketsByCustomer = async (payload, user) => {
  try {
    const twoMonthsAgo = moment().subtract(2, "months").toDate();
    const { eventName, eventStatus, createdAt, limit, page } = payload || {}; // Extract filters from query params

    // Define query conditions for tickets
    const ticketQuery = {
      customer: mongoose.Types.ObjectId(user._id),
      createdAt: { $gte: twoMonthsAgo },
    };

    console.log(await TicketModel.find(ticketQuery));

    // Pagination
    const perPage = parseInt(limit) || 10;
    const pageNumber = parseInt(page) || 1;
    const skip = (pageNumber - 1) * perPage;

    const ticketPipeline = [
      { $match: ticketQuery }, // Match tickets based on customerId and createdAt
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventData",
        },
      }, // Lookup events
      { $unwind: "$eventData" }, // Unwind eventId array
      { $match: { "eventData.isDeleted": false } }, // Filter out deleted events
      eventStatus ? { $match: { "eventData.status": eventStatus } } : {},
      eventName
        ? {
            $match: {
              "eventData.eventName": { $regex: eventName, $options: "i" },
            },
          }
        : {},
      { $sort: { createdAt: -1 } }, // Sort by createdAt
      { $skip: skip }, // Pagination - skip
      { $limit: perPage }, // Pagination - limit
      {
        $project: {
          _id: 1,
          status: 1,
          ticketTypeId: 1,
          bookedDate: 1,
          "eventData._id": 1,
          "eventData.eventName": 1,
          "eventData.status": 1,
          "eventData.eventOwner": 1,
          "eventData.artists": 1,
          "eventData.venues": 1,
          "eventData.slug": 1,
          "eventData.tags": 1,
        },
      },
    ];
    const ticketPipelineWithoutEmptyObjects = ticketPipeline.filter(
      (stage) => Object.keys(stage).length > 0
    );

    const tickets = await TicketModel.aggregate(
      ticketPipelineWithoutEmptyObjects
    );

    return tickets;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  purchaseTicket,
  viewTickets,
  handleTicketPurchase,
  verifyQRCode,
  getTicketsByCustomer,
};
