const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: "/events",
    route: eventRoute,
  },
];



defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});



module.exports = router;
