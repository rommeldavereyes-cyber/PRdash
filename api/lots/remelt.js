import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { target_purity, lot_ids } = req.body;
  if (!target_purity || !lot_ids || !Array.isArray(lot_ids) || lot_ids.length === 0) {
    return res.status(400).json({ error: 'target_purity and non-empty lot_ids array are required' });
  }

  try {
    // 1. Fetch the lots to sum their weights
    const { rows: selectedLots } = await sql`
      SELECT lot_id, initial_weight, post_melt_weight FROM lots 
      WHERE lot_id = ANY(${lot_ids}::varchar[])
    `;
    
    let totalWeight = 0;
    selectedLots.forEach(l => {
      totalWeight += (l.post_melt_weight || l.initial_weight || 0);
    });

    // 2. Generate next remelt ID
    const { rows: lastRows } = await sql`
      SELECT lot_id FROM lots 
      WHERE lot_id LIKE 'LOT-%' 
      ORDER BY id DESC LIMIT 1
    `;
    let nextId = 1001;
    if (lastRows.length > 0) {
      const lastId = lastRows[0].lot_id;
      const numMatch = lastId.match(/\d+$/);
      if (numMatch) {
        nextId = parseInt(numMatch[0]) + 1;
      }
    }
    const remeltLotId = `LOT-${nextId}`;

    // 3. Create remelt batch
    const { rows } = await sql`
      INSERT INTO lots (
        lot_id, record_type, target_purity, initial_weight, linked_lots, status
      ) VALUES (
        ${remeltLotId}, 'Remelt Batch', ${target_purity}, ${totalWeight}, ${JSON.stringify(lot_ids)}::jsonb, 'Inbound Received'
      )
      RETURNING *
    `;
    
    const newRemelt = rows[0];

    // 4. Update child lots
    await sql`
      UPDATE lots 
      SET status = 'Merged into Remelt', updated_at = CURRENT_TIMESTAMP
      WHERE lot_id = ANY(${lot_ids}::varchar[])
    `;

    return res.status(201).json(newRemelt);
  } catch (error) {
    console.error('Remelt error:', error);
    return res.status(500).json({ error: error.message });
  }
}
