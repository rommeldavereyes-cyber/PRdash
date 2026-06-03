import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Create suppliers table
    await sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `;

    // Create lots table
    await sql`
      CREATE TABLE IF NOT EXISTS lots (
        id SERIAL PRIMARY KEY,
        lot_id VARCHAR(50) UNIQUE NOT NULL,
        record_type VARCHAR(50) DEFAULT 'Standard Lot',
        status VARCHAR(50) DEFAULT 'Inbound Received',
        supplier_id INTEGER REFERENCES suppliers(id),
        initial_weight FLOAT,
        expected_purity FLOAT,
        post_melt_weight FLOAT,
        actual_purity FLOAT,
        item_type VARCHAR(100),
        material_type VARCHAR(100),
        photos JSONB DEFAULT '[]'::jsonb,
        remarks TEXT DEFAULT '',
        linked_lots JSONB DEFAULT '[]'::jsonb,
        target_purity FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed suppliers if empty
    const { rows: existingSuppliers } = await sql`SELECT count(*) FROM suppliers`;
    if (parseInt(existingSuppliers[0].count) === 0) {
      await sql`
        INSERT INTO suppliers (name) VALUES 
        ('ABC Metals'),
        ('Golden State Refining'),
        ('Pacific Precious'),
        ('Silver Creek Trading'),
        ('Mountain Gold Corp')
      `;
    }

    return res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Initialization error:', error);
    return res.status(500).json({ error: error.message });
  }
}
