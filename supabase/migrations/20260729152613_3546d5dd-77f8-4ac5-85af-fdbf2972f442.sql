CREATE TABLE public.districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);
GRANT SELECT ON public.districts TO anon, authenticated;
GRANT ALL ON public.districts TO service_role;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Districts are viewable by everyone" ON public.districts FOR SELECT USING (true);

CREATE TABLE public.cities (
  id SERIAL PRIMARY KEY,
  district_id INT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL
);
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT ALL ON public.cities TO service_role;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are viewable by everyone" ON public.cities FOR SELECT USING (true);

INSERT INTO public.districts (id, name) VALUES (1, 'Kandy'), (2, 'Matale'), (3, 'Nuwara Eliya');
SELECT setval('public.districts_id_seq', 3, true);

INSERT INTO public.cities (district_id, name) VALUES
(1, 'Kandy Town'), (1, 'Peradeniya'), (1, 'Katugastota'), (1, 'Gampola'), (1, 'Kundasale'), (1, 'Pilimathalawa'), (1, 'Digana'), (1, 'Nawalapitiya'), (1, 'Gelioya'), (1, 'Akurana'),
(2, 'Matale Town'), (2, 'Dambulla'), (2, 'Galewela'), (2, 'Rattota'), (2, 'Ukuwela'), (2, 'Sigiriya'), (2, 'Yatawatta'),
(3, 'Nuwara Eliya Town'), (3, 'Hatton'), (3, 'Walapane'), (3, 'Hanguranketha'), (3, 'Kotagala'), (3, 'Maskeliya'), (3, 'Ginigathena'), (3, 'Ragala');

CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon_name VARCHAR(50) NOT NULL
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

INSERT INTO public.categories (id, name, slug, icon_name) VALUES
(1, 'Vehicles', 'vehicles', 'car'),
(2, 'Property & Land', 'property', 'home'),
(3, 'Digital & Electronics', 'electronics', 'smartphone'),
(4, 'Spare Parts', 'spare-parts', 'wrench');
SELECT setval('public.categories_id_seq', 4, true);

CREATE TABLE public.subcategories (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);
GRANT SELECT ON public.subcategories TO anon, authenticated;
GRANT ALL ON public.subcategories TO service_role;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subcategories are viewable by everyone" ON public.subcategories FOR SELECT USING (true);

INSERT INTO public.subcategories (category_id, name, slug) VALUES
(1, 'Cars & Vans', 'cars-vans'), (1, 'Motorbikes & Scooters', 'motorbikes'), (1, 'Three Wheelers', 'three-wheelers'), (1, 'Heavy Duty & Trucks', 'trucks'),
(2, 'Land & Plots', 'land'), (2, 'Houses for Sale/Rent', 'houses'), (2, 'Commercial Property', 'commercial-property'),
(3, 'Mobile Phones & Tablets', 'mobile-phones'), (3, 'Laptops & Notebooks', 'laptops'), (3, 'Desktop PCs & Gaming', 'desktop-pcs'), (3, 'Computer Accessories', 'pc-accessories'),
(4, 'Vehicle Spare Parts', 'vehicle-parts'), (4, 'Electronic Components', 'electronic-parts');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  nic_number VARCHAR(20) NOT NULL,
  avatar_url TEXT,
  district_id INT NOT NULL REFERENCES public.districts(id),
  city_id INT NOT NULL REFERENCES public.cities(id),
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES public.categories(id),
  subcategory_id INT NOT NULL REFERENCES public.subcategories(id),
  district_id INT NOT NULL REFERENCES public.districts(id),
  city_id INT NOT NULL REFERENCES public.cities(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price_lkr DECIMAL(12,2) NOT NULL,
  is_negotiable BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  images TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active listings are viewable by everyone" ON public.listings FOR SELECT USING (status <> 'archived');
CREATE POLICY "Sellers can view their own listings" ON public.listings FOR SELECT TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can create their own listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = seller_id);

CREATE INDEX idx_listings_district_city ON public.listings(district_id, city_id);
CREATE INDEX idx_listings_category ON public.listings(category_id, subcategory_id);
CREATE INDEX idx_listings_price ON public.listings(price_lkr);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER listings_set_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();