import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM suppliers ORDER BY name ASC`;
      return res.status(200).json({ value: rows, count: rows.length });
    } 
    
    if (req.method === 'POST') {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      
      const { rows } = await sql`
        INSERT INTO suppliers (name) 
        VALUES (${name}) 
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Suppliers API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
