import database from "../service/database.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const getUserFromToken = (req) => {
    const token = req.cookies?.token;
    if (!token) {
        return null;
    }
    try {
        const scKey = process.env.SECRET_KEY;
        return jwt.verify(token, scKey);
    } catch (err) {
        console.error("Token verification failed:", err.message);
        return null;
    }
};

const ensureAdmin = (req, res) => {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return null;
    }
    return user;
};

export async function chkCart(req, res) {
    console.log(`POST CART customer ${req.body.mem_email} /chkCart is Requested!!.`)
    
    if (req.body.mem_email == null) {
        return res.json({ error: true, errormessage: "Please login first" });
    }
    
    try {
        console.log(`Checking cart for ${req.body.mem_email}`);
        const result = await database.query({
            text: `SELECT * FROM carts WHERE "cusId" = $1 AND "cartCf" !=true `,
            values: [req.body.mem_email]
        });
        
        if (result.rows[0] != null) {
            console.log(`Found existing cart: ${result.rows[0].cartId}`);
            return res.json({ cartExists: true,cartId:result.rows[0].cartId });
        } else {
            console.log(`No cart found for ${req.body.mem_email}`);
            return res.json({ cartExists: false, errormessage: "No active cart found" });
        }
    } catch (err) {
        console.error('Error in chkCart:', err);
        return res.json({ error: true, errormessage: err.message });
    }
}

export async function postCarts(req, res) {
  console.log(`POST /CART is requested `);

  // ✅ ประกาศตัวแปรไว้หัวฟังก์ชันให้หมด
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const currentDate = `${year}${month}${day}`;

  let i = 0;
  let theId = "";
  let existsResult = [];

  try {
    if (req.body.cusId == null) {
      return res.json({ cartOK: false, messageAddCart: "Customer Id is required"  });
    }

    do {
      i++;
      theId = `${currentDate}${String(i).padStart(4, "0")}`;
      existsResult = await database.query({
        text: 'SELECT EXISTS (SELECT * FROM carts WHERE "cartId" = $1) ',
        values: [theId],
      });
    } while (existsResult.rows[0].exists);

    await database.query({
      text: `INSERT INTO carts ("cartId", "cusId", "cartDate")
             VALUES ($1,$2,$3)`,
      values: [theId, req.body.cusId, now],
    });

    return res.json({ cartOK: true, messageAddCart: theId });
  } catch (err) {
    return res.json({ cartOK: false, messageAddCart: err.message });
  }
}



export async function postCartDtl(req, res) {
  console.log(`POST /CARTDETAIL is requested `);
  try {
    // ก่อนจะ Excuese Query ทำการ Validate Data ก่อน
    if (req.body.cartId == null || req.body.pdId == null || req.body.pdPrice == null) {
      return res.json({
        cartDtlOK: false,
        messageAddCartDtl: "CartId && ProductID  && Price  is required",
      });
    }
    // ดูว่ามี Product เดิมอยู่่หรือไม่
    const pdResult = await database.query({
      text: `  SELECT * FROM "cartDtl" ctd WHERE ctd."cartId" = $1 AND ctd."pdId" = $2 `,
      values: [req.body.cartId, req.body.pdId], //ค่า Parameter ที่ส่งมา
    });    
    if (pdResult.rowCount == 0) { // ถ้าไม่มีให้ INSERT
      try {
        const result = await database.query({
          text: ` INSERT INTO "cartDtl" ("cartId", "pdId", "qty","price")
                            VALUES ($1,$2,$3,$4) `,
          values: [req.body.cartId, req.body.pdId, 1, req.body.pdPrice],
        });
        return res.json({ cartDtlOK: true, messageAddCart: req.body.cartId });
      } catch (err) {
        return res.json({
          cartDtlOK: false,
          messageAddCartDtl: "INSERT DETAIL ERROR",
        });
      }
    } else { // ถ้ามีแล้วให้ UPDATE
      try {
        // อัปเดต qty และ price ใหม่ (ใช้ราคาล่าสุดจาก request)
        const result = await database.query({
          text: ` UPDATE "cartDtl" SET "qty" = $1, "price" = $2
                            WHERE "cartId" = $3
                            AND "pdId" = $4 `,
          values: [pdResult.rows[0].qty + 1, req.body.pdPrice, req.body.cartId, req.body.pdId],
        });
        return res.json({ cartDtlOK: true, messageAddCart: req.body.cartId });
      } catch (err) {
        return res.json({
          cartDtlOK: false,
          messageAddCartDtl: "INSERT DETAIL ERROR",
        });
      }
    }
  } catch (err) {
    return res.json({
      cartDtlOK: false,
      messageAddCartDtl: "INSERT DETAIL ERROR",
    });
  }
}


export async function sumCarts(req, res) {
    console.log(`POST /sumCart ${req.params.id} is Requested!!.`)
    
    try {
        const result = await database.query({
            text: `SELECT SUM(qty) AS qty, SUM(qty*price) AS money
                   FROM "cartDtl" ctd
                   WHERE ctd."cartId" = $1`,
            values: [req.params.id]
        });
        
        console.log(result.rows[0]);
        return res.json({
            id: req.params.id,
            qty: result.rows[0].qty,
            money: result.rows[0].money
        });
    } catch (err) {
        console.error('Error in sumCarts:', err);
        return res.json({ error: err.message });
    }
}

export async function getCarts(req, res) {
    console.log(`GET /getCart ${req.params.id} is Requested!!.`)
    
    try {
        const result = await database.query({
          text:`  SELECT ct.*, SUM(ctd.qty) AS sqty,SUM(ctd.price*ctd.qty) AS sprice
                  FROM carts ct LEFT JOIN "cartDtl" ctd ON ct."cartId" = ctd."cartId"
                  WHERE ct."cartId"=$1
                  GROUP BY ct."cartId" ` ,
          values:[req.params.id]
        });
        
        console.log(`id=${req.params.id}`);
        console.log(result.rows[0]);
        return res.json(result.rows);
        
    } catch (err) {
      return res.json({
          error: err.message
      })
  }

}

export async function getCartDtl(req, res) {
    console.log(`GET CartDetail ${req.params.id} is Requested!!.`)
    
    try {
        const result = await database.query({
            text: `SELECT ROW_NUMBER() OVER (ORDER BY ctd."pdId") AS row_number,
                          ctd."pdId", pd."productname", 
                          ctd.qty, ctd.price
                   FROM "cartDtl" ctd 
                   LEFT JOIN "products" pd ON ctd."pdId" = pd."product_id"  
                   WHERE ctd."cartId" = $1
                   ORDER BY ctd."pdId"`,
            values: [req.params.id]
        });
        
        console.log(`id=${req.params.id}`);
        console.log(result.rows[0]);
        return res.json(result.rows);
        
    } catch (err) {
      return res.json({
          error: err.message
      })
  }

}

export async function getCartByCus(req, res) {
    console.log(`POST CartByCus ${req.body.id} is Requested!!.`)
    
    try {
        const result = await database.query({
            text: `SELECT ROW_NUMBER() OVER (ORDER BY ct."cartId" DESC) AS row_number,
                          ct.*, SUM(ctd.qty) AS sqty, SUM(ctd.price*ctd.qty) AS sprice
                   FROM carts ct 
                   LEFT JOIN "cartDtl" ctd ON ct."cartId" = ctd."cartId"
                   WHERE ct."cusId" = $1
                   GROUP BY ct."cartId"
                   ORDER BY ct."cartId" DESC`,
            values: [req.body.id]
        });
        
        console.log(`id=${req.body.id}`);
        console.log(result.rows[0]);
        return res.json(result.rows);
        
    } catch (err) {
      return res.json({
          error: err.message
      })
  }

}

export async function deleteCartDtl(req, res) {
    console.log(`DELETE /carts/deleteitem/${req.params.cartId}/${req.params.pdId} is Requested!!.`)
    
    try {
        const cartId = req.params.cartId;
        const pdId = req.params.pdId;

        // ตรวจสอบว่ามี cartId และ pdId หรือไม่
        if (!cartId || !pdId) {
            return res.status(400).json({
                success: false,
                message: "Cart ID and Product ID are required"
            });
        }

        // ลบรายการสินค้าจาก cartDtl
        const result = await database.query({
            text: `DELETE FROM "cartDtl" WHERE "cartId" = $1 AND "pdId" = $2`,
            values: [cartId, pdId]
        });

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        console.log(`Cart item ${pdId} from cart ${cartId} deleted successfully`);
        return res.json({
            success: true,
            message: "Cart item deleted successfully"
        });

    } catch (err) {
        console.error('Error deleting cart item:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

export async function deleteCart(req, res) {
    console.log(`DELETE /carts/delete/${req.params.id} is Requested!!.`)
    
    try {
        // ตรวจสอบว่ามี cartId หรือไม่
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: "Cart ID is required"
            });
        }

        // เริ่ม transaction โดยลบ cartDtl ก่อน แล้วค่อยลบ carts
        // ลบรายละเอียดตะกร้าก่อน
        await database.query({
            text: `DELETE FROM "cartDtl" WHERE "cartId" = $1`,
            values: [req.params.id]
        });

        // ลบตะกร้าหลัก
        const result = await database.query({
            text: `DELETE FROM carts WHERE "cartId" = $1`,
            values: [req.params.id]
        });

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        console.log(`Cart ${req.params.id} deleted successfully`);
        return res.json({
            success: true,
            message: "Cart deleted successfully"
        });

    } catch (err) {
        console.error('Error deleting cart:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

// ยืนยันสั่งซื้อ - คัดลอกข้อมูลจาก cart ไป order และลบ cart
export async function confirmOrder(req, res) {
    console.log(`POST /carts/confirm/${req.params.id} is Requested!!.`)
    
    try {
        const cartId = req.params.id;
        
        if (!cartId) {
            return res.status(400).json({
                success: false,
                message: "Cart ID is required"
            });
        }

        // ตรวจสอบว่ามี cart หรือไม่
        const cartResult = await database.query({
            text: `SELECT * FROM carts WHERE "cartId" = $1`,
            values: [cartId]
        });

        if (cartResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const cart = cartResult.rows[0];

        // ตรวจสอบว่ามีสินค้าในตะกร้าหรือไม่
        const cartDtlResult = await database.query({
            text: `SELECT * FROM "cartDtl" WHERE "cartId" = $1`,
            values: [cartId]
        });

        if (cartDtlResult.rowCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // สร้าง orderId ใหม่
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const currentDate = `${year}${month}${day}`;

        let i = 0;
        let orderId = "";
        let existsResult = [];

        do {
            i++;
            orderId = `ORD${currentDate}${String(i).padStart(4, "0")}`;
            existsResult = await database.query({
                text: 'SELECT EXISTS (SELECT * FROM orders WHERE "orderId" = $1)',
                values: [orderId],
            });
        } while (existsResult.rows[0].exists);

        // คำนวณ total
        const totalResult = await database.query({
            text: `SELECT SUM(qty) AS totalQty, SUM(qty*price) AS totalPrice
                   FROM "cartDtl"
                   WHERE "cartId" = $1`,
            values: [cartId]
        });

        const totalQty = totalResult.rows[0].totalQty || 0;
        const totalPrice = totalResult.rows[0].totalPrice || 0;

        // เริ่ม transaction - สร้าง order และ orderDtl
        await database.query('BEGIN');

        try {
            // สร้าง order
            await database.query({
                text: `INSERT INTO orders ("orderId", "cusId", "orderDate", "totalQty", "totalPrice", "orderStatus")
                       VALUES ($1, $2, $3, $4, $5, $6)`,
                values: [orderId, cart.cusId, now, totalQty, totalPrice, 'pending']
            });

            // คัดลอก cartDtl ไป orderDtl
            for (const item of cartDtlResult.rows) {
                await database.query({
                    text: `INSERT INTO "orderDtl" ("orderId", "pdId", "qty", "price")
                           VALUES ($1, $2, $3, $4)`,
                    values: [orderId, item.pdId, item.qty, item.price]
                });
            }

            // ลบ cartDtl และ cart
            await database.query({
                text: `DELETE FROM "cartDtl" WHERE "cartId" = $1`,
                values: [cartId]
            });

            await database.query({
                text: `DELETE FROM carts WHERE "cartId" = $1`,
                values: [cartId]
            });

            await database.query('COMMIT');

            console.log(`Order ${orderId} created successfully from cart ${cartId}`);
            return res.json({
                success: true,
                message: "Order confirmed successfully",
                orderId: orderId
            });

        } catch (err) {
            await database.query('ROLLBACK');
            throw err;
        }

    } catch (err) {
        console.error('Error confirming order:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

// ดึงรายการ orders ของลูกค้า
export async function getOrders(req, res) {
    console.log(`GET /orders/${req.params.cusId} is Requested!!.`)
    
    try {
        const cusId = req.params.cusId;
        
        if (!cusId) {
            return res.status(400).json({
                error: "Customer ID is required"
            });
        }

        // คำนวณ totalQty และ totalPrice จาก orderDtl เพื่อให้แน่ใจว่าจะได้ค่าที่ถูกต้อง
        const result = await database.query({
            text: `SELECT o.*, 
                          COALESCE(SUM(od.qty), 0) AS "totalQty",
                          COALESCE(SUM(od.qty * od.price), 0) AS "totalPrice",
                          ROW_NUMBER() OVER (ORDER BY o."orderDate" DESC) AS row_number
                   FROM orders o
                   LEFT JOIN "orderDtl" od ON o."orderId" = od."orderId"
                   WHERE o."cusId" = $1
                   GROUP BY o."orderId"
                   ORDER BY o."orderDate" DESC`,
            values: [cusId]
        });

        return res.json(result.rows);

    } catch (err) {
        console.error('Error getting orders:', err);
        return res.status(500).json({
            error: err.message
        });
    }
}

// ดึงรายละเอียด order
export async function getOrderDtl(req, res) {
    console.log(`GET /orders/detail/${req.params.id} is Requested!!.`)
    
    try {
        const orderId = req.params.id;
        
        if (!orderId) {
            return res.status(400).json({
                error: "Order ID is required"
            });
        }

        const result = await database.query({
            text: `SELECT ROW_NUMBER() OVER (ORDER BY od."pdId") AS row_number,
                          od."pdId", pd."productname", 
                          od.qty, od.price
                   FROM "orderDtl" od 
                   LEFT JOIN "products" pd ON od."pdId" = pd."product_id"  
                   WHERE od."orderId" = $1
                   ORDER BY od."pdId"`,
            values: [orderId]
        });

        return res.json(result.rows);

    } catch (err) {
        console.error('Error getting order detail:', err);
        return res.status(500).json({
            error: err.message
        });
    }
}

// ====== Admin only functions ======
export async function getAllOrders(req, res) {
    console.log("GET /orders/admin is Requested!!.")

    const admin = ensureAdmin(req, res);
    if (!admin) {
        return;
    }

    try {
        const result = await database.query({
            text: `SELECT o.*,
                          COALESCE(SUM(od.qty), 0) AS "totalQty",
                          COALESCE(SUM(od.qty * od.price), 0) AS "totalPrice",
                          ROW_NUMBER() OVER (ORDER BY o."orderDate" DESC) AS row_number
                   FROM orders o
                   LEFT JOIN "orderDtl" od ON o."orderId" = od."orderId"
                   GROUP BY o."orderId"
                   ORDER BY o."orderDate" DESC`
        });

        return res.json(result.rows);
    } catch (err) {
        console.error("Error getting all orders:", err);
        return res.status(500).json({
            error: err.message
        });
    }
}

export async function updateOrderStatus(req, res) {
    console.log(`PUT /orders/${req.params.id}/status is Requested!!. Status = ${req.body.status}`)

    const admin = ensureAdmin(req, res);
    if (!admin) {
        return;
    }

    const orderId = req.params.id;
    const { status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({
            error: "Order ID and new status are required"
        });
    }

    try {
        const result = await database.query({
            text: `UPDATE orders SET "orderStatus" = $1 WHERE "orderId" = $2`,
            values: [status, orderId]
        });

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Order not found"
            });
        }

        return res.json({
            success: true,
            message: "Order status updated successfully"
        });
    } catch (err) {
        console.error("Error updating order status:", err);
        return res.status(500).json({
            error: err.message
        });
    }
}

export async function deleteOrder(req, res) {
    console.log(`DELETE /orders/${req.params.id} is Requested!!.`)

    const admin = ensureAdmin(req, res);
    if (!admin) {
        return;
    }

    const orderId = req.params.id;

    if (!orderId) {
        return res.status(400).json({
            error: "Order ID is required"
        });
    }

    await database.query("BEGIN");
    try {
        await database.query({
            text: `DELETE FROM "orderDtl" WHERE "orderId" = $1`,
            values: [orderId]
        });

        const result = await database.query({
            text: `DELETE FROM orders WHERE "orderId" = $1`,
            values: [orderId]
        });

        if (result.rowCount === 0) {
            await database.query("ROLLBACK");
            return res.status(404).json({
                error: "Order not found"
            });
        }

        await database.query("COMMIT");
        return res.json({
            success: true,
            message: "Order deleted successfully"
        });
    } catch (err) {
        await database.query("ROLLBACK");
        console.error("Error deleting order:", err);
        return res.status(500).json({
            error: err.message
        });
    }
}