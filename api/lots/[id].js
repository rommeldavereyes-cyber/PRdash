import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  const updates = req.body;

  try {
    // Only allow updating certain fields
    const allowedFields = ['status', 'post_melt_weight', 'actual_purity', 'photos'];
    const updateClauses = [];
    const values = [];
    let valueIdx = 1;

    // First fetch existing photos if we are pushing new ones
    if (updates.photos) {
      const { rows: existing } = await sql`SELECT photos FROM lots WHERE id = ${id}`;
      if (existing.length > 0) {
        let existingPhotos = existing[0].photos || [];
        if (typeof existingPhotos === 'string') {
            existingPhotos = JSON.parse(existingPhotos);
        }
        updates.photos = [...existingPhotos, ...updates.photos];
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateClauses.push(`${key} = $${valueIdx}`);
        values.push(key === 'photos' ? JSON.stringify(value) : value);
        valueIdx++;
      }
    }

    if (updateClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    // Using parameterized query for dynamic fields
    const query = `
      UPDATE lots 
      SET ${updateClauses.join(', ')}
      WHERE id = $${valueIdx}
      RETURNING *
    `;

    const { rows } = await sql.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Update lot error:', error);
    return res.status(500).json({ error: error.message });
  }
}
