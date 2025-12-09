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
    if (req.body.mem_email == null) {
        return res.json({ error: true, errormessage: "Please login first" });
    }
    
    try {
        const result = await database.query({
            text: `SELECT * FROM carts WHERE "cusId" = $1 AND "cartCf" !=true `,
            values: [req.body.mem_email]
        });
        
        if (result.rows[0] != null) {
            return res.json({ cartExists: true,cartId:result.rows[0].cartId });
        } else {
            return res.json({ cartExists: false, errormessage: "No active cart found" });
        }
    } catch (err) {
        return res.json({ error: true, errormessage: err.message });
    }
}

export async function postCarts(req, res) {
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
  try {
    if (req.body.cartId == null || req.body.pdId == null || req.body.pdPrice == null) {
      return res.json({
        cartDtlOK: false,
        messageAddCartDtl: "CartId && ProductID  && Price  is required",
      });
    }

    const qty = Number(req.body.qty) > 0 ? Number(req.body.qty) : 1;

    const pdResult = await database.query({
      text: `  SELECT * FROM "cartDtl" ctd WHERE ctd."cartId" = $1 AND ctd."pdId" = $2 `,
      values: [req.body.cartId, req.body.pdId],
    });    

    if (pdResult.rowCount == 0) {
      try {
        await database.query({
          text: ` INSERT INTO "cartDtl" ("cartId", "pdId", "qty","price")
                            VALUES ($1,$2,$3,$4) `,
          values: [req.body.cartId, req.body.pdId, qty, req.body.pdPrice],
        });
        return res.json({ cartDtlOK: true, messageAddCart: req.body.cartId });
      } catch (err) {
        return res.json({
          cartDtlOK: false,
          messageAddCartDtl: "INSERT DETAIL ERROR",
        });
      }
    } else {
      try {
        await database.query({
          text: ` UPDATE "cartDtl" SET "qty" = $1, "price" = $2
                            WHERE "cartId" = $3
                            AND "pdId" = $4 `,
          values: [pdResult.rows[0].qty + qty, req.body.pdPrice, req.body.cartId, req.body.pdId],
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

export async function updateCartItemQty(req, res) {
  try {
    const cartId = req.params.cartId;
    const pdId = req.params.pdId;
    const qty = Number(req.body.qty);

    if (!cartId || !pdId || !qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Cart ID, Product ID and qty>=1 are required"
      });
    }

    const result = await database.query({
      text: `UPDATE "cartDtl" SET qty = $1 WHERE "cartId" = $2 AND "pdId" = $3`,
      values: [qty, cartId, pdId]
    });

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }

    return res.json({
      success: true,
      message: "Cart item quantity updated"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}


export async function sumCarts(req, res) {
    try {
        const result = await database.query({
            text: `SELECT SUM(qty) AS qty, SUM(qty*price) AS money
                   FROM "cartDtl" ctd
                   WHERE ctd."cartId" = $1`,
            values: [req.params.id]
        });
        
        return res.json({
            id: req.params.id,
            qty: result.rows[0].qty,
            money: result.rows[0].money
        });
    } catch (err) {
        return res.json({ error: err.message });
    }
}

export async function getCarts(req, res) {
    try {
        const result = await database.query({
          text:`  SELECT ct.*, SUM(ctd.qty) AS sqty,SUM(ctd.price*ctd.qty) AS sprice
                  FROM carts ct LEFT JOIN "cartDtl" ctd ON ct."cartId" = ctd."cartId"
                  WHERE ct."cartId"=$1
                  GROUP BY ct."cartId" ` ,
          values:[req.params.id]
        });
        
        return res.json(result.rows);
        
    } catch (err) {
      return res.json({
          error: err.message
      })
  }

}

export async function getCartDtl(req, res) {
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
        
        return res.json(result.rows);
        
    } catch (err) {
      return res.json({
          error: err.message
      })
  }

}

export async function getCartByCus(req, res) {
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
        
        return res.json(result.rows);
        
    } catch (err) {
      return res.json({
          error: err.message
      })
  }

}

export async function deleteCartDtl(req, res) {
    try {
        const cartId = req.params.cartId;
        const pdId = req.params.pdId;

        if (!cartId || !pdId) {
            return res.status(400).json({
                success: false,
                message: "Cart ID and Product ID are required"
            });
        }

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

        return res.json({
            success: true,
            message: "Cart item deleted successfully"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

export async function deleteCart(req, res) {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: "Cart ID is required"
            });
        }

        await database.query({
            text: `DELETE FROM "cartDtl" WHERE "cartId" = $1`,
            values: [req.params.id]
        });

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

        return res.json({
            success: true,
            message: "Cart deleted successfully"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

export async function confirmOrder(req, res) {
    try {
        const cartId = req.params.id;
        
        if (!cartId) {
            return res.status(400).json({
                success: false,
                message: "Cart ID is required"
            });
        }

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

        const totalResult = await database.query({
            text: `SELECT SUM(qty) AS totalQty, SUM(qty*price) AS totalPrice
                   FROM "cartDtl"
                   WHERE "cartId" = $1`,
            values: [cartId]
        });

        const totalQty = totalResult.rows[0].totalQty || 0;
        const totalPrice = totalResult.rows[0].totalPrice || 0;

        await database.query('BEGIN');

        try {
            await database.query({
                text: `INSERT INTO orders ("orderId", "cusId", "orderDate", "totalQty", "totalPrice", "orderStatus")
                       VALUES ($1, $2, $3, $4, $5, $6)`,
                values: [orderId, cart.cusId, now, totalQty, totalPrice, 'pending']
            });

            for (const item of cartDtlResult.rows) {
                await database.query({
                    text: `INSERT INTO "orderDtl" ("orderId", "pdId", "qty", "price")
                           VALUES ($1, $2, $3, $4)`,
                    values: [orderId, item.pdId, item.qty, item.price]
                });
            }

            await database.query({
                text: `DELETE FROM "cartDtl" WHERE "cartId" = $1`,
                values: [cartId]
            });

            await database.query({
                text: `DELETE FROM carts WHERE "cartId" = $1`,
                values: [cartId]
            });

            await database.query('COMMIT');

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
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

export async function getOrders(req, res) {
    try {
        const cusId = req.params.cusId;
        
        if (!cusId) {
            return res.status(400).json({
                error: "Customer ID is required"
            });
        }

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
        return res.status(500).json({
            error: err.message
        });
    }
}

export async function getOrderDtl(req, res) {
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
        return res.status(500).json({
            error: err.message
        });
    }
}

export async function getAllOrders(req, res) {
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
        return res.status(500).json({
            error: err.message
        });
    }
}

export async function updateOrderStatus(req, res) {
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
        return res.status(500).json({
            error: err.message
        });
    }
}

export async function deleteOrder(req, res) {
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
        return res.status(500).json({
            error: err.message
        });
    }
}