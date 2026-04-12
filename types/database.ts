export type UserRole = "NEIGHBOR" | "PRO";
export type RequestStatus = "OPEN" | "PENDING" | "MATCHED" | "COMPLETED";
export type Urgency = "LOW" | "NORMAL" | "URGENT";

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    trust_score: number;
    location: unknown | null;
    lat: number | null;
    lng: number | null;
    bio: string | null;
    skills: string[];
    certificate_urls: string[];
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface ServiceRequest {
    id: string;
    client_id: string;
    title: string;
    description: string | null;
    category: string;
    photo_urls: string[];
    status: RequestStatus;
    location: unknown | null;
    lat: number | null;
    lng: number | null;
    matched_pro_id: string | null;
    budget: string | null;
    urgency: Urgency;
    proposed_price: string | null;
    created_at: string;
    updated_at: string;
}

export interface Chat {
    id: string;
    request_id: string;
    sender_id: string;
    message: string;
    created_at: string;
}

export interface ChatRoom {
    id: string;
    request_id: string;
    neighbor_id: string;
    pro_id: string;
    created_at: string;
}

export interface Review {
    id: string;
    request_id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: {
                    id: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    role?: UserRole;
                    trust_score?: number;
                    location?: unknown | null;
                    lat?: number | null;
                    lng?: number | null;
                    bio?: string | null;
                    skills?: string[];
                    certificate_urls?: string[];
                    is_verified?: boolean;
                };
                Update: {
                    full_name?: string | null;
                    avatar_url?: string | null;
                    role?: UserRole;
                    trust_score?: number;
                    location?: unknown | null;
                    lat?: number | null;
                    lng?: number | null;
                    bio?: string | null;
                    skills?: string[];
                    certificate_urls?: string[];
                    is_verified?: boolean;
                };
                Relationships: [];
            };
            requests: {
                Row: ServiceRequest;
                Insert: {
                    client_id: string;
                    title: string;
                    description?: string | null;
                    category?: string;
                    photo_urls?: string[];
                    status?: RequestStatus;
                    location?: unknown | null;
                    lat?: number | null;
                    lng?: number | null;
                    matched_pro_id?: string | null;
                    budget?: string | null;
                    urgency?: Urgency;
                    proposed_price?: string | null;
                };
                Update: {
                    title?: string;
                    description?: string | null;
                    category?: string;
                    photo_urls?: string[];
                    status?: RequestStatus;
                    location?: unknown | null;
                    lat?: number | null;
                    lng?: number | null;
                    matched_pro_id?: string | null;
                    budget?: string | null;
                    urgency?: Urgency;
                    proposed_price?: string | null;
                };
                Relationships: [];
            };
            chat_rooms: {
                Row: ChatRoom;
                Insert: {
                    request_id: string;
                    neighbor_id: string;
                    pro_id: string;
                };
                Update: {
                    request_id?: string;
                    neighbor_id?: string;
                    pro_id?: string;
                };
                Relationships: [];
            };
            chats: {
                Row: Chat;
                Insert: {
                    request_id: string;
                    sender_id: string;
                    message: string;
                };
                Update: {
                    request_id?: string;
                    sender_id?: string;
                    message?: string;
                };
                Relationships: [];
            };
            reviews: {
                Row: Review;
                Insert: {
                    request_id: string;
                    reviewer_id: string;
                    reviewee_id: string;
                    rating: number;
                    comment?: string | null;
                };
                Update: {
                    rating?: number;
                    comment?: string | null;
                };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
    };
};
