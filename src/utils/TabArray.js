export const TabArray = [
  {
    key: "user",
    label: "User Management",
    route: "/user",
  },
  {
    key: "customer",
    label: "Customer Management",
    route: "/customer",
  },
  {
    key: "salonManagement",
    label: "Salon Management",
    route: "/salons",
  },
  // {
  //   key: "salonRequest",
  //   label: "Salon Requests",
  //   route: "/salonrequest",
  // },
  {
    key: "bookings",
    label: "Bookings",
    route: "/bookings",
  },
  {
    // The leads a customer sent: requests, NOT bookings. Its own tab because the
    // two lists answer different questions (see docs/ADMIN-PANEL-BOOKING-REQUESTS.md).
    key: "bookingRequests",
    label: "Booking Requests",
    route: "/booking-requests",
  },
  {
    key: "advertisement",
    label: "Advertisement",
    route: "/advertisement",
  },
  {
    // The panel's notification inbox: the API's own event rows (new order, salon
    // registration, renewal, delivery-partner action, booking request) plus every
    // push an admin has sent. This key is also the role-access checkbox, so a
    // role can be granted the inbox without any other tab.
    key: "notifications",
    label: "Notifications",
    route: "/notifications",
  },
  {
    key: "shopProducts",
    label: "Shop Products",
    route: "/shop-products",
  },
  {
    key: "distributors",
    label: "Distributors",
    route: "/distributors",
  },
  {
    key: "shopOrders",
    label: "Shop Orders",
    route: "/shop-orders",
  },
  {
    key: "shopSettings",
    label: "Shop Settings",
    route: "/shop-settings",
  },
  {
    key: "plans",
    label: "Plans & Trials",
    route: "/plans",
  },
];
