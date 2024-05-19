const config = require("../config/config");
const stripe = require("stripe")(config.paymentProcessor.stripe_secret);

const generateSessionUrlStripe = async (products, user,tickets) => {
  try {
    const metaData = tickets?.map((p) => {
      return {
        userEmail: user.email,
        userPhone: user.mobileNumber,
        userId: user._id,
        ticketId:p?.ticketId,
        ticketQuantity:p?.quantity
      };
    });
    const metaDataObject = {};

    metaData.forEach((ticket, index) => {
      Object.entries(ticket).forEach(([key, value]) => {
        metaDataObject[`ticket_${index}_${key}`] = String(value);
      });
    });

    console.log(metaDataObject);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: products,
      mode: "payment",
      success_url: config.paymentProcessor.SUCCESS_URL,
      cancel_url: config.paymentProcessor.FAILED_URL,
      metadata: metaDataObject,
      payment_method_options: {},
    });

    return { status: "success", url: session.url };
  } catch (error) {
    console.error("Error handling payment:", error);
    throw new Error(error);
  }
};

const handleWebhookEvent = async (req, res) => {



    const { handleTicketPurchase } = require("./tickets.service");
    const endpointSecret = config.paymentProcessor.stripe_webhook_secret;
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook Error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }


    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const metaData = session?.metadata;
        const purchasedTickets = transformMetaData(metaData);
        await handleTicketPurchase(purchasedTickets);
        console.log(`Payment succeeded: ${session.id}`);
        break;
      // Handle other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).end();
  };


const transformMetaData = (metaDataObject) => {
  const transformedData = Object.keys(metaDataObject).reduce((acc, key) => {
    const [index, property] = key.split("_").slice(1); // Split key by '_' and extract index and property
    acc[index] = acc[index] || {}; // Initialize object at index if not exists
    acc[index][property] = metaDataObject[key]; // Assign property value
    return acc;
  }, []);

  const result = transformedData.map((ticket) => ({
    ticketId: ticket.ticketId,
    quantity: ticket.ticketQuantity,
    userId: ticket.userId,
  }));

  return result;
};

module.exports = {
  generateSessionUrlStripe,
  handleWebhookEvent
};
