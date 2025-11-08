export interface Iuser {
  id: number;
  username: string;
  email: string;
  image: string;
  phone: string;
  bio: string;
  interests: string | string[];
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}
