import { sql } from '@vercel/postgres';

function calcFineMetal(lot) {
  if (lot.post_melt_weight && lot.actual_purity) {
    return (lot.post_melt_weight * lot.actual_purity) / 100;
  }
  return (lot.initial_weight * lot.expected_purity) / 100;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const status = req.query.status;
      
      let query;
      if (status) {
        query = sql`
          SELECT l.*, s.name as supplier_name 
          FROM lots l
          LEFT JOIN suppliers s ON l.supplier_id = s.id
          WHERE l.status = ${status}
          ORDER BY l.created_at DESC
        `;
      } else {
        query = sql`
          SELECT l.*, s.name as supplier_name 
          FROM lots l
          LEFT JOIN suppliers s ON l.supplier_id = s.id
          ORDER BY l.created_at DESC
        `;
      }
      
      const { rows } = await query;
      
      const lotsWithCalculations = rows.map(lot => {
        const fine_metal = calcFineMetal(lot);
        return {
          ...lot,
          fine_metal,
          fine_troy_oz: fine_metal / 31.1034768
        };
      });
      
      return res.status(200).json(lotsWithCalculations);
    }
    
    if (req.method === 'POST') {
      const body = req.body;
      
      // Auto-generate lot_id within transaction-like sequential read/write
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
      const lot_id = `LOT-${nextId}`;
      
      const { rows } = await sql`
        INSERT INTO lots (
          lot_id, supplier_id, initial_weight, expected_purity, 
          item_type, material_type, remarks, photos, status
        ) VALUES (
          ${lot_id}, ${body.supplier_id}, ${body.initial_weight}, ${body.expected_purity},
          ${body.item_type}, ${body.material_type}, ${body.remarks || ''}, ${JSON.stringify(body.photos || [])}::jsonb, 'Inbound Received'
        )
        RETURNING *
      `;
      
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('lots API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
