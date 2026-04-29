import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import db from '../db/db.js';

router.post('/register', async (req, res) => 
{
    try{
        const {firstName, lastName, email, confirm_email, password, confirm_password } = req.body;
        
        if(!firstName.trim() || !lastName.trim() || !email.trim() || !confirm_email.trim() || !password.trim() || !confirm_password.trim())
        {
          return res.status(400).json({message: "Input missing!"});
        }
        if(email !== confirm_email)
        {
          return res.status(400).json({message: "Email adresses do not match!"});
        }
        if(password !== confirm_password)
        {
          return res.status(400).json({message: "Passwords don't match!"});
        }
        if(password.length < 8)
        {
          return res.status(400).json({message: "Password must be at least characters long!"});
        }
        
        
        
        const hashedPassword = await bcrypt.hash(password, 10); // 10: der Verschlüsselungsalgorithmus wird 2 hoch 10 mal durchlaufen

        const sql = "INSERT INTO users (first_name, last_name, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())";
        db.query(sql, [firstName, lastName, email, hashedPassword], (err, result) => {
          if (err)
            {
              if(err.code === 'ER_DUP_ENTRY')
              {
                  return res.status(400).json({message: "Email already exists!"});
              }
               return res.status(500).json({error: err.message});
            }

          res.status(201).json({message: "registration successful!"});
        });  
        } catch (e) {
            res.status(500).send();
    }
});

export default router;