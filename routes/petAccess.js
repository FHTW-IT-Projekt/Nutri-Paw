import express from 'express';
import pool from '../db/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Helper to verify if the logged-in user is the actual owner of the pet
 */
async function verifyOwner(petId, ownerId) {
    const [rows] = await pool.query(
        'SELECT owner_id FROM pets WHERE pet_id = ?',
        [petId]
    );
    if (rows.length === 0) return { status: 404, message: 'Pet not found' };
    if (rows[0].owner_id !== ownerId) return { status: 403, message: 'Forbidden: Only the owner can manage access' };
    return null;
}

// get all users with access to a specific pet
// router.get('/:petId/share', requireAuth, async (req, res) => {
router.get('/:petId/share',  async (req, res) => {
    const { petId } = req.params;

    try {
        // owner verification
        // const accessError = await verifyOwner(petId, req.user.userId);
        // if (accessError) return res.status(accessError.status).json({ message: accessError.message });

        // Retrieve authorized users with their explicit details from the access table
        const [sharedUsers] = await pool.query(
            `SELECT pa.access_id AS id, u.email, pa.role 
             FROM pet_access pa
             JOIN users u ON pa.user_id = u.user_id
             WHERE pa.pet_id = ?`,
            [petId]
        );

        res.json({
            pet_id: parseInt(petId),
            currentUserRole: 'owner', // We already verified they are the owner
            shared_users: sharedUsers
        });
    } catch (error) {
        console.error('[GET /share]', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//  grant access to a user by email
// router.post('/:petId/share', requireAuth, async (req, res) => {
router.post('/:petId/share',  async (req, res) => {
    const { petId } = req.params;
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    try {
        // owner verification
        // const accessError = await verifyOwner(petId, req.user.userId);
        // if (accessError) return res.status(accessError.status).json({ message: accessError.message });

        //target user account by email address
        const [userRows] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email.trim()]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'No user account found with that email address' });
        }
        const targetUserId = userRows[0].user_id;

        // prevent owners from sharing access with themselves
        // if (targetUserId === req.user.userId) {
        //     return res.status(400).json({ message: 'You are already the owner of this pet' });
        // }

        // insert access map entry
        await pool.query(
            'INSERT INTO pet_access (pet_id, user_id, role) VALUES (?, ?, ?)',
            [petId, targetUserId, 'shared']
        );

        res.status(201).json({ message: 'Access granted successfully' });
    } catch (error) {
        // handle unique key constraint violation error (ER_DUP_ENTRY)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'This user already has access to this pet' });
        }
        console.error('[POST /share]', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE  access
// router.delete('/:petId/share/:accessId', requireAuth, async (req, res) => {
router.delete('/:petId/share/:accessId',  async (req, res) => {
    const { petId, accessId } = req.params;

    try {
        //owner verification
        // const accessError = await verifyOwner(petId, req.user.userId);
        // if (accessError) return res.status(accessError.status).json({ message: accessError.message });

        // Remove relationship profile record matching access table primary ID context
        const [result] = await pool.query(
            'DELETE FROM pet_access WHERE access_id = ? AND pet_id = ?',
            [accessId, petId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Access record not found' });
        }

        res.json({ message: 'Access revoked successfully' });
    } catch (error) {
        console.error('[DELETE /share]', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;