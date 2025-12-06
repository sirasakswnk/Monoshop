import database from "../service/database.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export async function getAllProducts(req,res){
    console.log(`GET /products is Requested!!.`);
    try{
        const strQry = `SELECT p.*,
        (
            SELECT row_to_json(temp_brands)
            FROM ( SELECT "brand_id", "brand_name"
                        FROM brands
                        WHERE "brand_id" = p."brand_id" )temp_brands
        ) AS brand,
        (   SELECT row_to_json(temp_series)
            FROM ( SELECT "series_id", "series_name"
                        FROM series
                        WHERE "series_id" = p."series_id" )temp_series            
        ) AS serie,
        (
            SELECT row_to_json(temp_product_type)
            FROM ( SELECT "product_typeid", "type_name"
                        FROM producttype
                        WHERE "product_typeid" = p."product_typeid" )temp_product_type
        ) AS product_type
        FROM products p ORDER BY "product_id" ASC`
        const result = await database.query(strQry)
        return res.status(200).json(result.rows)
    }
    catch(err){
        return res.status(500).json({
            error:err.message
        })
    }
}

export async function getProductsById(req,res){
    console.log(`GET /products/product_id is Requested!!.`);
    try{
        const result = await database.query({
            text:`SELECT p.*,
                (
                    SELECT row_to_json(temp_product_type)
                    FROM ( SELECT "product_typeid", "type_name"
                                FROM producttype
                                WHERE "product_typeid" = p."product_typeid" )temp_product_type
                ) AS product_type,
                (
                    SELECT row_to_json(temp_brands)
                    FROM ( SELECT "brand_id", "brand_name"
                                FROM brands
                                WHERE "brand_id" = p."brand_id" )temp_brands
                ) AS brand,
                (   SELECT row_to_json(temp_series)
                    FROM ( SELECT "series_id", "series_name"
                                FROM series
                                WHERE "series_id" = p."series_id" )temp_series            
                ) AS serie
                FROM products p
                WHERE p."product_id" = $1
                ORDER BY "product_id" ASC`,
            values:[req.params.product_id]
        })
        return res.status(200).json(result.rows)
    }
    catch(err){
        return res.status(500).json({
            error:err.message
        })
    }
}

export async function getThreeProducts(req,res){
    console.log(`GET /threeProducts is Requested!!.`);
    try{
        const strQry =
            `SELECT p.*,
                (
                    SELECT row_to_json(temp_product_type)
                    FROM ( SELECT "product_typeid", "type_name"
                                FROM producttype
                                WHERE "product_typeid" = p."product_typeid" )temp_product_type
                ) AS product_type,
                (
                    SELECT row_to_json(temp_brands)
                    FROM ( SELECT "brand_id", "brand_name"
                                FROM brands
                                WHERE "brand_id" = p."brand_id" )temp_brands
                ) AS brand,
                (   SELECT row_to_json(temp_series)
                    FROM ( SELECT "series_id", "series_name"
                                FROM series
                                WHERE "series_id" = p."series_id" )temp_series            
                ) AS serie
                FROM products p ORDER BY "product_id" OFFSET 0 LIMIT 3`
        const result = await database.query(strQry)
        return res.status(200).json(result.rows)
    }
    catch(err){
        return res.status(500).json({
            error:err.message
        })
    }
}

export async function getProductsByBrandId(req,res){
    console.log(`GET /products/brands/brand_id is Requested!!.`);
    try{
        const result = await database.query({
            text:`SELECT p.*,
                (
                    SELECT row_to_json(temp_product_type)
                    FROM ( SELECT "product_typeid", "type_name"
                                FROM producttype
                                WHERE "product_typeid" = p."product_typeid" )temp_product_type
                ) AS product_type,
                (   SELECT row_to_json(temp_series)
                    FROM ( SELECT "series_id", "series_name"
                                FROM series
                                WHERE "series_id" = p."series_id" )temp_series            
                ) AS serie
                FROM products p
                WHERE p."brand_id" ILIKE $1`,
            values:[req.params.brand_id]
        })
        return res.status(200).json(result.rows)
    }
    catch(err){
        return res.status(500).json({
            error:err.message
        })
    }
}

export async function postProducts(req,res){
    console.log(`POST /products is Requested!!.`);
        try{
            const bodyData = req.body
            const requiredFields = [
                "product_id", "productname", "price", "meterial", "size",
                "description", "product_typeid", "brand_id", "series_id"
        ];

            const missingFields = requiredFields.filter(field => !bodyData[field]);

            if (missingFields.length != 0) {
            return res.status(422).json({
                message: `Error: Missing fields -> ${missingFields.join(", ")}`
            });
        }

    
            const chkRow = await database.query({
                text:`SELECT * FROM products WHERE product_id = $1`,
                values:[bodyData.product_id]
            })
    
            if(chkRow.rowCount > 0){
                return res.status(409).json({
                    message:`Error: product_id : ${bodyData.product_id} already exists`
                })
            }
            const result = await database.query({
                text :` INSERT INTO products ( "product_id", "productname", "price", "meterial", "size", "description", "product_typeid", "brand_id", "series_id")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                values:[
                    bodyData.product_id,
                    bodyData.productname,
                    bodyData.price,
                    bodyData.meterial,
                    bodyData.size,
                    bodyData.description,
                    bodyData.product_typeid,
                    bodyData.brand_id,
                    bodyData.series_id
                ]
            })
            bodyData.message="Your Product has been created successfully"
            res.status(201).json(bodyData)
        }
        catch(err){
            return res.status(500).json({
                error:err.message
            })
        }
}

export async function putProducts(req,res){
    console.log(`PUT /products is Requested!!.`);
    
    // ตรวจสอบ token และ role
    const token = req.cookies.token
    if(!token){
        return res.status(401).json({
            message: `no token`, login: false
        })
    }
    
    try {
        const scKey = process.env.SECRET_KEY;
        const member = jwt.verify(token, scKey);
        
        // ตรวจสอบว่าเป็น admin หรือไม่
        if (member.role?.toLowerCase() !== 'admin') {
            return res.status(403).json({
                message: `Error: Only admin can update products`
            });
        }
        
        const bodyData = req.body
        
        // อัปเดตเฉพาะฟิลด์ที่อนุญาต (ไม่รวม product_typeid, brand_id)
        const result = await database.query({
            text :` UPDATE "products"
                SET "productname" = $1, 
                    "price" = $2, 
                    "meterial" = $3, 
                    "size" = $4, 
                    "description" = $5
                WHERE "product_id" = $6`,
            values:[
                bodyData.productname,
                bodyData.price,
                bodyData.meterial,
                bodyData.size,
                bodyData.description,
                req.params.product_id
            ]
        })
        
        if(result.rowCount == 0){
            return res.status(404).json({
                message:`Error: product_id : ${req.params.product_id} not found`
            })
        }
        
        bodyData.message="Your Product has been updated successfully"
        res.status(200).json(bodyData)
    }
    catch(err){
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: `Invalid or expired token`
            })
        }
        return res.status(500).json({
            error:err.message
        })
    }
}

export async function deleteProducts(req,res){
    console.log(`DELETE /products is Requested!!.`);
    try{
        const result = await database.query({
            text:`DELETE FROM products WHERE "product_id" = $1`,
            values:[req.params.product_id]
        })
        if(result.rowCount == 0){
            return res.status(404).json({
                message:`Error: product_id : ${req.params.product_id} not found`
            })
        }
        return res.status(200).json({
            message: `Your Product has been deleted successfully`
        });
    }
    catch(err){
        return res.status(500).json({
            error:err.message
        })
    }
}

export async function getSearchProducts(req,res){
    console.log(`GET /searchProduct id= ${req.params.product_id} is Requested!!.`);
    try{
        const result = await database.query({
            text:`SELECT p.*,
                (
                    SELECT row_to_json(temp_brands)
                    FROM ( SELECT "brand_id", "brand_name"
                                FROM brands
                                WHERE "brand_id" = p."brand_id" )temp_brands
                ) AS brand,
                (
                    SELECT row_to_json(temp_product_type)
                    FROM ( SELECT "product_typeid", "type_name"
                                FROM producttype
                                WHERE "product_typeid" = p."product_typeid" )temp_product_type
                ) AS product_type,
                (   SELECT row_to_json(temp_series)
                    FROM ( SELECT "series_id", "series_name"
                                FROM series
                                WHERE "series_id" = p."series_id" )temp_series            
                ) AS serie
                FROM products p
                WHERE p."product_id" ILIKE $1 
                    OR p."productname" ILIKE $1
                    OR p."description" ILIKE $1
                    ORDER BY "product_id" ASC`,
            values:[`%${req.params.product_id}%`]
        })
        return res.status(200).json(result.rows)
    }
    catch(err){
        return res.status(500).json({
            error:err.message
        })
    }
}