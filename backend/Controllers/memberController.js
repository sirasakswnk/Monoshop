import database from "../service/database.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'img_mem')
    },
    filename: function (req, file, cb) {
        const filename = `${req.body.mem_email}.jpg`
        cb(null, filename)
    }
})
const upload = multer({
    storage: storage,
}).single('file');


export async function uploadMember(req, res) {
   console.log("Upload Member Image")
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        res.status(200).json({ message: 'File uploaded successfully!' });
    });
}


export async function postMembers(req,res){
    console.log(`POST /members is Requested!!.`)
    const bodyData = req.body
    try{
        const requiredFields = ["mem_email", "mem_password_hash", "mem_name","mem_phonenumber"];
        const missingFields = requiredFields.filter(field => !bodyData[field]);
        if (missingFields.length != 0) {
            return res.status(422).json({
                message: `Error: Missing fields -> ${missingFields.join(", ")}`,register:false
            });
        }

        const chkRow = await database.query({
            text:`SELECT * FROM members WHERE mem_email = $1`,
            values:[bodyData.mem_email]
        })

        if(chkRow.rowCount != 0){
            return res.status(409).json({
                message:`Error: mem_email : ${bodyData.mem_email} already exists`,register:false
            })
        }

        const pass = req.body.mem_password_hash
        const salt = bcrypt.genSaltSync(10)
        const pass_hash = bcrypt.hashSync(pass, salt)
        const result = await database.query({
            text :` INSERT INTO members ( "mem_email", "mem_name", "mem_password_hash", "mem_phonenumber", "role") VALUES ($1, $2, $3, $4, $5) `,
            values:[bodyData.mem_email, bodyData.mem_name, pass_hash, bodyData.mem_phonenumber, "customer"]
        })
        bodyData.message = `Your account has been created successfully`
        bodyData.register = true
        res.json(bodyData)
    }
    catch(err){
        return res.json({
            error:err.message,register:false
        })
    }
}

export async function getMembers(req, res) {
    console.log(`GET /getMember is Requested!!.`);
    const token = req.cookies.token
    if(!token){
        return res.json({
            message: `no token`,login: false
        })
    }
    try {
        const scKey = process.env.SECRET_KEY; //อ่านค่าจาก ENV
        const member = jwt.verify(token, scKey);
        console.log(member);
        return res.json({
            mem_email: member.mem_email,
            mem_name: member.mem_name,
            role: member.role,
            login: true
        })

    } catch (error) {
        console.log(error.message);
        return res.json({
            message: `ข้อมูลไม่ถูกต้อง หรือถูกปลอมแปลง`,login: false
        })
    }
}

export async function loginMembers(req,res){
    console.log(`POST /loginMembers is Requested!!.`)
    const bodyData = req.body
    try{
        const requiredFields = ["mem_email", "mem_password_hash"]
        const missingFields = requiredFields.filter(field => !bodyData[field])
        if (missingFields.length != 0) {
            return res.status(422).json({
                message: `Error: Missing fields -> ${missingFields.join(", ")}`
            });
        }

        const result = await database.query({
            text:`SELECT * FROM members WHERE mem_email = $1`,
            values:[bodyData.mem_email]
        })

        if(result.rowCount == 0){
            return res.json({ message: `Error: mem_email : ${bodyData.mem_email} not found`, login:false })
            
        }

        const login = await bcrypt.compare(req.body.mem_password_hash, result.rows[0].mem_password_hash)
        if(login){
            const user={
                mem_email:result.rows[0].mem_email,
                mem_name:result.rows[0].mem_name,
                role:result.rows[0].role
            }
            const scKey = process.env.SECRET_KEY
            const token = jwt.sign(user,scKey,{expiresIn:'1h'})
            res.cookie('token',token,{
                maxAge: 3600000,
                httpOnly: true,
                secure : true,
                sameSite : 'none'
            })
        return res.json({ message: `Your account has been logged in successfully`, login:true })
        }else {
            res.clearCookie('token',{
                httpOnly: true,
                secure : true,
                sameSite : 'none'
            })
        return res.status(401).json({ message: "Invalid password", login: false });
}
    }
    catch(err){
        return res.json({
            message:`something went wrong`,login:false
        })
    }
}

export async function logoutMembers(req,res){
    console.log(`GET /logoutMembers is Requested!!.`)
    try{
    res.clearCookie('token',{
        httpOnly: true,
        secure : true,
        sameSite : 'none'
    })
    return res.json({ message: `Your account has been logged out successfully`, login:false })
}
catch(err){
    return res.json({
        message:`something went wrong`,login:false
    })

}
}

export async function updateMembers(req, res) {
    console.log(`PUT /members/update is Requested!!.`)
    const token = req.cookies.token
    if(!token){
        return res.status(401).json({
            message: `no token`, login: false
        })
    }
    try {
        const scKey = process.env.SECRET_KEY;
        const member = jwt.verify(token, scKey);
        const bodyData = req.body;

       
        if (!bodyData.mem_email || !bodyData.mem_name) {
            return res.status(422).json({
                message: `Error: Missing required fields (mem_email, mem_name)`
            });
        }

        // ตรวจสอบว่า mem_email ตรงกับ token หรือไม่ (ป้องกันการแก้ไขข้อมูลของคนอื่น)
        if (bodyData.mem_email !== member.mem_email) {
            return res.status(403).json({
                message: `Error: You can only update your own profile`
            });
        }

        // สร้าง query สำหรับอัปเดต
        let updateQuery = `UPDATE members SET "mem_name" = $1`;
        let values = [bodyData.mem_name];
        let paramIndex = 2;

        // ถ้ามี role และ user เป็น admin ให้อัปเดต role ด้วย
        if (bodyData.role && member.role?.toLowerCase() === 'admin') {
            updateQuery += `, "role" = $${paramIndex}`;
            values.push(bodyData.role);
            paramIndex++;
        }

        updateQuery += ` WHERE "mem_email" = $${paramIndex}`;
        values.push(bodyData.mem_email);

        const result = await database.query({
            text: updateQuery,
            values: values
        });

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: `Error: Member not found`
            });
        }

     
        const updatedUser = {
            mem_email: bodyData.mem_email,
            mem_name: bodyData.mem_name,
            role: bodyData.role && member.role?.toLowerCase() === 'admin' ? bodyData.role : member.role
        };

        const newToken = jwt.sign(updatedUser, scKey, {expiresIn:'1h'});
        res.cookie('token', newToken, {
            maxAge: 3600000,
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        return res.json({
            message: `Profile updated successfully`,
            mem_email: updatedUser.mem_email,
            mem_name: updatedUser.mem_name,
            role: updatedUser.role
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: `Failed to update profile: ${error.message}`
        });
    }
}
