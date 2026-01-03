-- Point of Sale System Tables Migration
-- Creates all necessary tables for the retail POS MVP

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CASHIERS TABLE
-- Stores cashier/staff information with PIN authentication
-- ============================================
CREATE TABLE cashiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for active cashiers lookup
CREATE INDEX idx_cashiers_active ON cashiers(is_active) WHERE is_active = true;

-- ============================================
-- CATEGORIES TABLE
-- Product categories for organizing the catalog
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for sorting categories
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- ============================================
-- PRODUCTS TABLE
-- Product catalog with pricing and inventory
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- ============================================
-- SALES TABLE
-- Sales transactions header
-- ============================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id UUID NOT NULL REFERENCES cashiers(id),
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'voided')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Indexes for sales queries
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created ON sales(created_at DESC);

-- ============================================
-- SALE_ITEMS TABLE
-- Line items for each sale
-- ============================================
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for sale items lookup
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE cashiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Cashiers: Read all active cashiers (for PIN validation), authenticated users can insert/update
CREATE POLICY "Anyone can read active cashiers" ON cashiers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage cashiers" ON cashiers
    FOR ALL USING (auth.role() = 'authenticated');

-- Categories: Everyone can read, authenticated users can manage
CREATE POLICY "Anyone can read categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage categories" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Products: Everyone can read active products, authenticated users can manage
CREATE POLICY "Anyone can read active products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- Sales: Authenticated users can manage their own sales
CREATE POLICY "Users can read all sales" ON sales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sales" ON sales
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update sales" ON sales
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Sale Items: Follow sales permissions
CREATE POLICY "Users can read sale items" ON sale_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sale items" ON sale_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update sale items" ON sale_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete sale items" ON sale_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- POWERSYNC PUBLICATION
-- Include all POS tables for sync
-- ============================================

-- Drop existing publication if it exists and recreate with all tables
DROP PUBLICATION IF EXISTS powersync;

CREATE PUBLICATION powersync FOR TABLE 
    cashiers,
    categories,
    products,
    sales,
    sale_items;

-- ============================================
-- SEED DATA: Sample Categories and Products
-- ============================================

-- Insert sample categories
INSERT INTO categories (id, name, description, image_url, sort_order) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Beverages', 'Hot and cold drinks', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200', 1),
    ('22222222-2222-2222-2222-222222222222', 'Snacks', 'Chips, candy, and treats', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200', 2),
    ('33333333-3333-3333-3333-333333333333', 'Fresh Food', 'Sandwiches and salads', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200', 3),
    ('44444444-4444-4444-4444-444444444444', 'Dairy', 'Milk, cheese, and yogurt', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200', 4),
    ('55555555-5555-5555-5555-555555555555', 'Household', 'Cleaning and essentials', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200', 5);

-- Insert sample products
INSERT INTO products (id, category_id, name, sku, price, image_url, stock_quantity) VALUES
    -- Beverages
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Coffee (Large)', 'BEV-001', 4.99, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200', 100),
    ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Iced Tea', 'BEV-002', 2.99, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', 50),
    ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Orange Juice', 'BEV-003', 3.49, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200', 40),
    ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Sparkling Water', 'BEV-004', 1.99, 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200', 80),
    
    -- Snacks
    ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Potato Chips', 'SNK-001', 2.49, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200', 60),
    ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Chocolate Bar', 'SNK-002', 1.99, 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=200', 100),
    ('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Trail Mix', 'SNK-003', 4.99, 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=200', 35),
    ('b4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Granola Bar', 'SNK-004', 1.49, 'https://images.unsplash.com/photo-1558401546-6ab6a1fa706d?w=200', 75),
    
    -- Fresh Food
    ('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Turkey Sandwich', 'FRE-001', 7.99, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200', 20),
    ('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Caesar Salad', 'FRE-002', 8.49, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=200', 15),
    ('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Veggie Wrap', 'FRE-003', 6.99, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200', 18),
    
    -- Dairy
    ('d1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Whole Milk (1L)', 'DAI-001', 3.99, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200', 30),
    ('d2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Greek Yogurt', 'DAI-002', 2.49, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200', 45),
    ('d3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Cheddar Cheese', 'DAI-003', 5.99, 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=200', 25),
    
    -- Household
    ('e1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Paper Towels', 'HOU-001', 4.99, 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=200', 40),
    ('e2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Hand Soap', 'HOU-002', 3.49, 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=200', 55),
    ('e3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Dish Sponges (3pk)', 'HOU-003', 2.99, 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200', 65);

-- Insert a sample cashier with PIN "1234" (hash would be generated in production)
-- For demo purposes, using a simple hash representation
INSERT INTO cashiers (id, name, pin_hash, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Demo Cashier', '1234', true),
    ('00000000-0000-0000-0000-000000000002', 'John Smith', '5678', true),
    ('00000000-0000-0000-0000-000000000003', 'Jane Doe', '9012', true);

