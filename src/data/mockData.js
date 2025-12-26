export const users = [
  { id: "1", name: "John Doe", email: "john@example.com", phone: "+1 234-567-8901", status: "active", createdAt: "2024-01-15" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", phone: "+1 234-567-8902", status: "active", createdAt: "2024-01-20" },
  { id: "3", name: "Mike Johnson", email: "mike@example.com", phone: "+1 234-567-8903", status: "inactive", createdAt: "2024-02-01" },
  { id: "4", name: "Sarah Williams", email: "sarah@example.com", phone: "+1 234-567-8904", status: "active", createdAt: "2024-02-10" },
  { id: "5", name: "Robert Brown", email: "robert@example.com", phone: "+1 234-567-8905", status: "active", createdAt: "2024-02-15" },
  { id: "6", name: "Emily Davis", email: "emily@example.com", phone: "+1 234-567-8906", status: "inactive", createdAt: "2024-02-20" },
  { id: "7", name: "David Wilson", email: "david@example.com", phone: "+1 234-567-8907", status: "active", createdAt: "2024-03-01" },
  { id: "8", name: "Lisa Anderson", email: "lisa@example.com", phone: "+1 234-567-8908", status: "active", createdAt: "2024-03-05" },
  { id: "9", name: "James Taylor", email: "james@example.com", phone: "+1 234-567-8909", status: "active", createdAt: "2024-03-10" },
  { id: "10", name: "Jennifer Martinez", email: "jennifer@example.com", phone: "+1 234-567-8910", status: "inactive", createdAt: "2024-03-15" },
  { id: "11", name: "Chris Lee", email: "chris@example.com", phone: "+1 234-567-8911", status: "active", createdAt: "2024-03-20" },
  { id: "12", name: "Amanda Garcia", email: "amanda@example.com", phone: "+1 234-567-8912", status: "active", createdAt: "2024-03-25" },
];

export const salons = [
  {
    id: "1",
    name: "Glamour Studio",
    city: "New York",
    address: "123 Fifth Avenue, Manhattan, NY 10001",
    phone: "+91 2125550101",
    email: "info@glamourstudio.com",
    status: "active",
    rating: 4.8,
    images: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
      "https://images.unsplash.com/photo-1633681926035-ec1ac984418a?w=800",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
      "https://images.unsplash.com/photo-1633681926035-ec1ac984418a?w=800",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
      "https://images.unsplash.com/photo-1633681926035-ec1ac984418a?w=800",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",

    ],
    services: [
      { id: "s1", name: "Haircut", duration: 45, price: 50, description: "Basic haircut for men and women, includes shampoo and styling." },
      { id: "s2", name: "Hair Color", duration: 120, price: 150, description: "Professional hair coloring service for all hair types, includes consultation and touch-up." },
      { id: "s3", name: "Blowout", duration: 30, price: 35, description: "Smooth and shiny blow-dry for a salon-fresh look, perfect for special occasions." },
      { id: "s4", name: "Deep Conditioning", duration: 45, price: 45, description: "Smoothing treatment for frizzy or curly hair, lasts up to 3 months." },
      { id: "s5", name: "Deep Conditioning", duration: 45, price: 45, description: "Refreshing facial to cleanse and rejuvenate your skin, suitable for all skin types." },
      { id: "s6", name: "Deep Conditioning", duration: 45, price: 45, description: "Nail shaping, cuticle care, and polish for a neat and elegant look." },
      { id: "s7", name: "Deep Conditioning", duration: 45, price: 45, description: "Intensive hair treatment to restore moisture and shine, ideal for dry or damaged hair." }

    ],
    openingTime: "09:00",
    closingTime: "20:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  },
  {
    id: "2",
    name: "Serenity Spa & Salon",
    city: "Los Angeles",
    address: "456 Sunset Boulevard, LA 90028",
    phone: "+91 3235550202",
    email: "hello@serenityspa.com",
    status: "active",
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800",
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800"
    ],
    services: [
      { id: "s5", name: "Full Body Massage", duration: 60, price: 120 },
      { id: "s6", name: "Facial Treatment", duration: 45, price: 80 },
      { id: "s7", name: "Manicure & Pedicure", duration: 60, price: 65 },
      { id: "s5", name: "Full Body Massage", duration: 60, price: 120 },
      { id: "s6", name: "Facial Treatment", duration: 45, price: 80 },
      { id: "s7", name: "Manicure & Pedicure", duration: 60, price: 65 }
    ],
    openingTime: "10:00",
    closingTime: "21:00",
    workingDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  {
    id: "3",
    name: "Urban Cuts",
    city: "Chicago",
    address: "789 Michigan Avenue, Chicago, IL 60611",
    phone: "+1 312-555-0303",
    email: "book@urbancuts.com",
    status: "active",
    rating: 4.6,
    images: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800"
    ],
    services: [
      { id: "s8", name: "Men's Haircut", duration: 30, price: 35 },
      { id: "s9", name: "Beard Trim", duration: 20, price: 20 },
      { id: "s10", name: "Hot Towel Shave", duration: 30, price: 30 }
    ],
    openingTime: "08:00",
    closingTime: "19:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  },
  {
    id: "4",
    name: "Beauty Haven",
    city: "Miami",
    address: "321 Ocean Drive, Miami Beach, FL 33139",
    phone: "+1 305-555-0404",
    email: "contact@beautyhaven.com",
    status: "inactive",
    rating: 4.4,
    images: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800"
    ],
    services: [
      { id: "s11", name: "Makeup Session", duration: 60, price: 100 },
      { id: "s12", name: "Eyebrow Threading", duration: 15, price: 15 },
      { id: "s13", name: "Eyelash Extensions", duration: 90, price: 150 }
    ],
    openingTime: "09:00",
    closingTime: "18:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  {
    id: "5",
    name: "Classic Barbershop",
    city: "New York",
    address: "555 Broadway, New York, NY 10012",
    phone: "+1 212-555-0505",
    email: "info@classicbarber.com",
    status: "active",
    rating: 4.7,
    images: [
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800"
    ],
    services: [
      { id: "s14", name: "Classic Cut", duration: 40, price: 40 },
      { id: "s15", name: "Fade", duration: 35, price: 35 },
      { id: "s16", name: "Kids Haircut", duration: 25, price: 25 }
    ],
    openingTime: "07:00",
    closingTime: "20:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },
  {
    id: "6",
    name: "Zen Wellness Spa",
    city: "San Francisco",
    address: "888 Market Street, San Francisco, CA 94102",
    phone: "+1 415-555-0606",
    email: "relax@zenwellness.com",
    status: "active",
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbec68?w=800"
    ],
    services: [
      { id: "s17", name: "Thai Massage", duration: 90, price: 140 },
      { id: "s18", name: "Aromatherapy", duration: 60, price: 95 },
      { id: "s19", name: "Hot Stone Therapy", duration: 75, price: 130 }
    ],
    openingTime: "10:00",
    closingTime: "22:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },

  {
    id: "7",
    name: "Zen Wellness Spa",
    city: "San Francisco",
    address: "888 Market Street, San Francisco, CA 94102",
    phone: "+1 415-555-0606",
    email: "relax@zenwellness.com",
    status: "active",
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbec68?w=800"
    ],
    services: [
      { id: "s17", name: "Thai Massage", duration: 90, price: 140 },
      { id: "s18", name: "Aromatherapy", duration: 60, price: 95 },
      { id: "s19", name: "Hot Stone Therapy", duration: 75, price: 130 }
    ],
    openingTime: "10:00",
    closingTime: "22:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },

  {
    id: "8",
    name: "Zen Wellness Spa",
    city: "San Francisco",
    address: "888 Market Street, San Francisco, CA 94102",
    phone: "+1 415-555-0606",
    email: "relax@zenwellness.com",
    status: "active",
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbec68?w=800"
    ],
    services: [
      { id: "s17", name: "Thai Massage", duration: 90, price: 140 },
      { id: "s18", name: "Aromatherapy", duration: 60, price: 95 },
      { id: "s19", name: "Hot Stone Therapy", duration: 75, price: 130 }
    ],
    openingTime: "10:00",
    closingTime: "22:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },

  {
    id: "9",
    name: "Zen Wellness Spa",
    city: "San Francisco",
    address: "888 Market Street, San Francisco, CA 94102",
    phone: "+1 415-555-0606",
    email: "relax@zenwellness.com",
    status: "active",
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbec68?w=800"
    ],
    services: [
      { id: "s17", name: "Thai Massage", duration: 90, price: 140 },
      { id: "s18", name: "Aromatherapy", duration: 60, price: 95 },
      { id: "s19", name: "Hot Stone Therapy", duration: 75, price: 130 }
    ],
    openingTime: "10:00",
    closingTime: "22:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },

  {
    id: "10",
    name: "Zen Wellness Spa",
    city: "San Francisco",
    address: "888 Market Street, San Francisco, CA 94102",
    phone: "+1 415-555-0606",
    email: "relax@zenwellness.com",
    status: "active",
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbec68?w=800"
    ],
    services: [
      { id: "s17", name: "Thai Massage", duration: 90, price: 140 },
      { id: "s18", name: "Aromatherapy", duration: 60, price: 95 },
      { id: "s19", name: "Hot Stone Therapy", duration: 75, price: 130 }
    ],
    openingTime: "10:00",
    closingTime: "22:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  },

  {
    id: "11",
    name: "Zen Wellness Spa",
    city: "San Francisco",
    address: "888 Market Street, San Francisco, CA 94102",
    phone: "+1 415-555-0606",
    email: "relax@zenwellness.com",
    status: "active",
    rating: 4.9,
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbec68?w=800"
    ],
    services: [
      { id: "s17", name: "Thai Massage", duration: 90, price: 140 },
      { id: "s18", name: "Aromatherapy", duration: 60, price: 95 },
      { id: "s19", name: "Hot Stone Therapy", duration: 75, price: 130 }
    ],
    openingTime: "10:00",
    closingTime: "22:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  }
];

export const bookings = [
  { id: "b1", userId: "1", userName: "John Doe", salonId: "1", salonName: "Glamour Studio", serviceName: "Haircut", date: "2024-12-15", time: "10:00", status: "confirmed", totalAmount: 50 },
  { id: "b2", userId: "2", userName: "Jane Smith", salonId: "2", salonName: "Serenity Spa & Salon", serviceName: "Full Body Massage", date: "2024-12-15", time: "14:00", status: "pending", totalAmount: 120 },
  { id: "b3", userId: "3", userName: "Mike Johnson", salonId: "3", salonName: "Urban Cuts", serviceName: "Men's Haircut", date: "2024-12-14", time: "11:30", status: "completed", totalAmount: 35 },
  { id: "b4", userId: "4", userName: "Sarah Williams", salonId: "1", salonName: "Glamour Studio", serviceName: "Hair Color", date: "2024-12-16", time: "13:00", status: "confirmed", totalAmount: 150 },
  { id: "b5", userId: "5", userName: "Robert Brown", salonId: "5", salonName: "Classic Barbershop", serviceName: "Fade", date: "2024-12-14", time: "09:00", status: "completed", totalAmount: 35 },
  { id: "b6", userId: "6", userName: "Emily Davis", salonId: "6", salonName: "Zen Wellness Spa", serviceName: "Thai Massage", date: "2024-12-17", time: "16:00", status: "pending", totalAmount: 140 },
  { id: "b7", userId: "7", userName: "David Wilson", salonId: "2", salonName: "Serenity Spa & Salon", serviceName: "Facial Treatment", date: "2024-12-13", time: "15:00", status: "cancelled", totalAmount: 80 },
  { id: "b8", userId: "8", userName: "Lisa Anderson", salonId: "4", salonName: "Beauty Haven", serviceName: "Makeup Session", date: "2024-12-18", time: "10:30", status: "confirmed", totalAmount: 100 },
  { id: "b9", userId: "9", userName: "James Taylor", salonId: "3", salonName: "Urban Cuts", serviceName: "Beard Trim", date: "2024-12-15", time: "12:00", status: "confirmed", totalAmount: 20 },
  { id: "b10", userId: "10", userName: "Jennifer Martinez", salonId: "1", salonName: "Glamour Studio", serviceName: "Blowout", date: "2024-12-16", time: "11:00", status: "pending", totalAmount: 35 },
  { id: "b11", userId: "11", userName: "David Wilson", salonId: "2", salonName: "Serenity Spa & Salon", serviceName: "Facial Treatment", date: "2024-12-13", time: "15:00", status: "cancelled", totalAmount: 80 },
  { id: "b12", userId: "12", userName: "Lisa Anderson", salonId: "4", salonName: "Beauty Haven", serviceName: "Makeup Session", date: "2024-12-18", time: "10:30", status: "confirmed", totalAmount: 100 },
  { id: "b13", userId: "13", userName: "James Taylor", salonId: "3", salonName: "Urban Cuts", serviceName: "Beard Trim", date: "2024-12-15", time: "12:00", status: "confirmed", totalAmount: 20 },
  { id: "b14", userId: "14", userName: "Jennifer Martinez", salonId: "1", salonName: "Glamour Studio", serviceName: "Blowout", date: "2024-12-16", time: "11:00", status: "pending", totalAmount: 35 },
];

export const cities = [...new Set(salons.map((s) => s.city))];

