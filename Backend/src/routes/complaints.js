import { Router } from 'express';
import { db } from '../db/index.js';
import { complaints, users } from '../db/schema.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generateFollowUpQuestion } from '../services/ai.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Endpoint to generate AI question based on complaint
router.post('/ai/question', requireAuth, async (req, res) => {
  try {
    const { complaint_text } = req.body;
    if (!complaint_text) return res.status(400).json({ error: 'Complaint text is required.' });

    const question = await generateFollowUpQuestion(complaint_text);
    res.json({ ai_question: question });
  } catch (error) {
    console.error('AI Question Error:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

// Endpoint to submit the final complaint
router.post('/', requireAuth, async (req, res) => {
  try {
    const { complaint_text, ai_question, user_answer } = req.body;
    if (!complaint_text) return res.status(400).json({ error: 'Complaint text is required.' });

    const result = await db.insert(complaints).values({
      user_id: req.user.id,
      complaint_text,
      ai_question,
      user_answer
    }).returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Submit Complaint Error:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// Endpoint for user to view their own complaints
router.get('/my', requireAuth, async (req, res) => {
  try {
    const myComplaints = await db.select().from(complaints)
      .where(eq(complaints.user_id, req.user.id))
      .orderBy(desc(complaints.created_at));

    res.json(myComplaints);
  } catch (error) {
    console.error('Get My Complaints Error:', error);
    res.status(500).json({ error: 'Failed to retrieve complaints' });
  }
});

// Endpoint for admin to view all complaints
router.get('/admin/complaints', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allComplaints = await db.select({
      id: complaints.id,
      complaint_text: complaints.complaint_text,
      ai_question: complaints.ai_question,
      user_answer: complaints.user_answer,
      created_at: complaints.created_at,
      user_name: users.name,
      user_email: users.email
    })
      .from(complaints)
      .leftJoin(users, eq(complaints.user_id, users.id))
      .orderBy(desc(complaints.created_at));

    res.json(allComplaints);
  } catch (error) {
    console.error('Admin Get All Complaints Error:', error);
    res.status(500).json({ error: 'Failed to retrieve all complaints' });
  }
});

export default router;
