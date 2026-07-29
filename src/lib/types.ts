export type District = { id: number; name: string };
export type City = { id: number; district_id: number; name: string };
export type Category = { id: number; name: string; slug: string; icon_name: string };
export type Subcategory = { id: number; category_id: number; name: string; slug: string };

export type Profile = {
  id: string;
  full_name: string;
  phone_number: string;
  nic_number: string;
  avatar_url: string | null;
  district_id: number;
  city_id: number;
  address: string;
  created_at: string;
};

export type ListingAttributes = Record<string, string | number | boolean>;

export type Listing = {
  id: string;
  seller_id: string;
  category_id: number;
  subcategory_id: number;
  district_id: number;
  city_id: number;
  title: string;
  description: string;
  price_lkr: number | string;
  is_negotiable: boolean;
  status: string;
  images: string[];
  video_url: string | null;
  attributes: ListingAttributes;
  created_at: string;
};

export type ListingWithSeller = Listing & {
  profiles: Pick<Profile, "id" | "full_name" | "phone_number" | "avatar_url"> | null;
};

export type ListingFilters = {
  search?: string;
  categoryId?: number | null;
  subcategoryId?: number | null;
  districtId?: number | null;
  cityId?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  condition?: string | null;
};
