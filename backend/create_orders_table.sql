-- สร้างตาราง orders สำหรับเก็บรายการที่ยืนยันสั่งซื้อแล้ว
CREATE TABLE IF NOT EXISTS orders (
    "orderId" VARCHAR(20) PRIMARY KEY,
    "cusId" VARCHAR(100) NOT NULL,
    "orderDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "totalQty" INTEGER DEFAULT 0,
    "totalPrice" DECIMAL(10,2) DEFAULT 0,
    "orderStatus" VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง orderDtl สำหรับเก็บรายละเอียดสินค้าในแต่ละ order
CREATE TABLE IF NOT EXISTS "orderDtl" (
    "orderId" VARCHAR(20) NOT NULL,
    "pdId" VARCHAR(20) NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    PRIMARY KEY ("orderId", "pdId"),
    FOREIGN KEY ("orderId") REFERENCES orders("orderId") ON DELETE CASCADE
);

-- สร้าง index เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_orders_cusId ON orders("cusId");
CREATE INDEX IF NOT EXISTS idx_orders_orderDate ON orders("orderDate");
CREATE INDEX IF NOT EXISTS idx_orderDtl_orderId ON "orderDtl"("orderId");


