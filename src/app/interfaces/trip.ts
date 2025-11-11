export interface Trip {
  id: number;
  origin: string;
  destination: string;
  title: string;
  description: string;
  creator_id: number;
  start_date: string;
  end_date: string;
  estimated_cost: string;
  min_participants: number;
  transport: string;
  accommodation: string;
  itinerary: string;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  solicitado: boolean;
}
