const express = require("express");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const eventRoute = require("./event.route");
const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/events",
    route: eventRoute,
  },
  {
    path: "tickets",
    route: require("./tickets.route"),
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

module.exports = router;
