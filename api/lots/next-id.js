import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { rows } = await sql`
      SELECT lot_id FROM lots 
      WHERE lot_id LIKE 'LOT-%' 
      ORDER BY id DESC LIMIT 1
    `;
    
    let nextId = 1001;
    if (rows.length > 0) {
      const lastId = rows[0].lot_id;
      const numMatch = lastId.match(/\d+$/);
      if (numMatch) {
        nextId = parseInt(numMatch[0]) + 1;
      }
    }
    
    return res.status(200).json({ lot_id: `LOT-${nextId}` });
  } catch (error) {
    console.error('next-id error:', error);
    return res.status(500).json({ error: error.message });
  }
}
