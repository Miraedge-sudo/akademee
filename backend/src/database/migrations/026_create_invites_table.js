/**
 * Migration: Create invites table
 * Description: Creates a table to store user invitation tokens and their status
 */
module.exports = {
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS invites (
        id SERIAL PRIMARY KEY,
        invite_token VARCHAR(64) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role_code VARCHAR(50) NOT NULL,
        school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
        accepted_at TIMESTAMP WITH TIME ZONE,
        declined_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(invite_token)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invites_school ON invites(school_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_invites_expires ON invites(expires_at)
    `;

    // Add comment to table
    await sql`
      COMMENT ON TABLE invites IS 'Stores user invitation tokens and their acceptance status'
    `;
  },

  down: async (sql) => {
    await sql`DROP TABLE IF EXISTS invites CASCADE`;
  },
};
