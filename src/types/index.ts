export interface Cinema {
  id: number;
  name: string;
  city: string;
  address: string;
  mapUrl: string | null;
  amenities: string[];
  lateNight: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCinemaDTO = Omit<Cinema, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCinemaDTO = Partial<CreateCinemaDTO>;

export interface Movie {
  id: number;
  name: string;
  title: string;
  releaseYear: number;
  genre: string;
  durationMinutes: number;
  rating: number;
  ratingValue: number;
  languages: string[];
  certificate: string;
  posterUrl: string | null;
  posterTitle: string;
  art: string;
  description: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateMovieDTO = {
  name: string;
  releaseYear: number;
  genre: string;
  durationMinutes: number;
  rating: number;
  languages: string[];
  certificate: string;
  posterUrl?: string | null;
  art?: string;
  description: string;
  active?: boolean;
};

export type UpdateMovieDTO = Partial<CreateMovieDTO>;

export interface Showtime {
  id: number;
  cinemaId: number;
  movieId: number;
  date: string;
  time: string;
  category: string;
  screen: string;
  startingPrice: number;
  status: 'scheduled' | 'cancelled';
  cancelReason: string | null;
  bookingCount?: number;
  cinema?: string;
  city?: string;
  movie?: string;
  cinemaActive?: boolean;
  movieActive?: boolean;
  blockedSeats?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type CreateShowtimeDTO = {
  cinemaId: number;
  movieId: number;
  date: string;
  time: string;
  category: string;
  screen: string;
  startingPrice: number;
};

export type UpdateShowtimeDTO = Partial<CreateShowtimeDTO>;

export interface SnackItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Snack {
  id: string;
  name: string;
  icon: string;
  price: number;
  inStock: boolean;
  category: string;
  description: string;
  createdAt?: string;
}

export type CreateSnackDTO = {
  name: string;
  icon?: string;
  price: number;
  inStock?: boolean;
  category?: string;
  description?: string;
};

export type UpdateSnackDTO = Partial<CreateSnackDTO>;

export interface Promo {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt?: string;
}

export type CreatePromoDTO = {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxUses?: number;
  active?: boolean;
};

export type UpdatePromoDTO = Partial<CreatePromoDTO>;

export interface ValidatePromoResponse {
  valid: boolean;
  code?: string;
  discountType?: 'percentage' | 'flat';
  discountValue?: number;
  discountAmount?: number;
  message?: string;
}

export interface ScanLog {
  id: number;
  ticketCode: string;
  customerName: string | null;
  movie: string | null;
  seats: string | null;
  status: 'valid' | 'duplicate' | 'invalid';
  timestamp: string;
}

export interface Booking {
  id: string;
  ticketCode: string | null;
  showtimeId: number;
  customerName: string;
  email: string;
  seats: string[];
  snacks?: SnackItem[];
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  resolutionStatus: string;
  refundAmount: number;
  refundReference: string | null;
  replacementTicketCode: string | null;
  movie?: string;
  date?: string;
  time?: string;
  cinema?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSummary {
  cinemas: number;
  movies: number;
  upcomingShowtimes: number;
  confirmedTickets: number;
}

export interface GenreAnalytics {
  genre: string;
  ticketsSold: number;
  revenue: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  period: string;
  label: string;
  ticketsSold: number;
  revenue: number;
}

export interface AnalyticsSummary {
  grossRevenue: number;
  ticketRevenue: number;
  snackRevenue: number;
  occupancyRate: number;
  totalBookings: number;
  totalSeatsSold: number;
  topMovie: string;
  topCinema: string;
  topGenre: string;
  topGenreTickets: number;
  genreBreakdown: GenreAnalytics[];
  monthlySales: TimeSeriesPoint[];
  yearlySales: TimeSeriesPoint[];
}
