export interface Business {
  id: number;
  name: string;
  category: string;
  province: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  secp: string;
  employeeCount: number;
  linkedinUrl: string;
  rating: number;
  reviewsCount: number;
  symbol?: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}
