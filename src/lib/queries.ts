import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Category,
  City,
  District,
  Listing,
  ListingFilters,
  ListingWithSeller,
  Profile,
  Subcategory,
} from "./types";

export const referenceDataQuery = queryOptions({
  queryKey: ["reference-data"],
  staleTime: 1000 * 60 * 30,
  queryFn: async () => {
    const [districts, cities, categories, subcategories] = await Promise.all([
      supabase.from("districts").select("*").order("id"),
      supabase.from("cities").select("*").order("name"),
      supabase.from("categories").select("*").order("id"),
      supabase.from("subcategories").select("*").order("id"),
    ]);

    const firstError =
      districts.error || cities.error || categories.error || subcategories.error;
    if (firstError) throw firstError;

    return {
      districts: (districts.data ?? []) as District[],
      cities: (cities.data ?? []) as City[],
      categories: (categories.data ?? []) as Category[],
      subcategories: (subcategories.data ?? []) as Subcategory[],
    };
  },
});

export function listingsQuery(filters: ListingFilters) {
  return queryOptions({
    queryKey: ["listings", filters],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, profiles(id, full_name, phone_number, avatar_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);

      if (filters.search?.trim()) {
        const term = filters.search.trim().replace(/[%,()]/g, "");
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
      if (filters.subcategoryId) query = query.eq("subcategory_id", filters.subcategoryId);
      if (filters.districtId) query = query.eq("district_id", filters.districtId);
      if (filters.cityId) query = query.eq("city_id", filters.cityId);
      if (filters.minPrice != null) query = query.gte("price_lkr", filters.minPrice);
      if (filters.maxPrice != null) query = query.lte("price_lkr", filters.maxPrice);
      if (filters.condition) query = query.contains("attributes", { condition: filters.condition });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ListingWithSeller[];
    },
  });
}

export function listingQuery(id: string) {
  return queryOptions({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, profiles(id, full_name, phone_number, avatar_url)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ListingWithSeller | null;
    },
  });
}

export function myListingsQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["my-listings", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Listing[];
    },
  });
}

export function profileQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Profile | null;
    },
  });
}
