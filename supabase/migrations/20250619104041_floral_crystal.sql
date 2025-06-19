/*
  # Enhanced Tender Database Performance

  1. Indexes
    - Full-text search indexes for title, description, and buyer
    - Performance indexes for common queries
    - Avoid using non-immutable functions in index predicates

  2. Functions
    - Statistics function for dashboard metrics
    - Maintenance function for data cleanup

  3. Performance
    - Optimized for fast searches and filtering
    - Support for real-time tender statistics
*/

-- Add indexes for better query performance
-- Note: Removed the problematic index with now() function in WHERE clause
CREATE INDEX IF NOT EXISTS idx_tenders_close_date_desc ON tenders(close_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tenders_title_search ON tenders USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_tenders_description_search ON tenders USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_tenders_buyer_search ON tenders USING gin(to_tsvector('english', buyer));

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tenders_close_date_category ON tenders(close_date, category) WHERE close_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenders_department_close_date ON tenders(department, close_date) WHERE department IS NOT NULL;

-- Add function to get tender statistics
CREATE OR REPLACE FUNCTION get_tender_stats()
RETURNS TABLE(
  total_tenders bigint,
  open_tenders bigint,
  closing_soon bigint,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tenders,
    COUNT(*) FILTER (WHERE close_date > CURRENT_TIMESTAMP) as open_tenders,
    COUNT(*) FILTER (WHERE close_date > CURRENT_TIMESTAMP AND close_date < (CURRENT_TIMESTAMP + interval '7 days')) as closing_soon,
    MAX(updated_at) as last_updated
  FROM tenders;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function to get open tenders efficiently
CREATE OR REPLACE FUNCTION get_open_tenders(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  ocid text,
  title text,
  description text,
  category text,
  close_date timestamptz,
  buyer text,
  department text,
  bid_number text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.ocid,
    t.title,
    t.description,
    t.category,
    t.close_date,
    t.buyer,
    t.department,
    t.bid_number,
    t.created_at
  FROM tenders t
  WHERE t.close_date > CURRENT_TIMESTAMP
  ORDER BY t.close_date ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function to search tenders
CREATE OR REPLACE FUNCTION search_tenders(
  search_term text,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  ocid text,
  title text,
  description text,
  category text,
  close_date timestamptz,
  buyer text,
  department text,
  bid_number text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.ocid,
    t.title,
    t.description,
    t.category,
    t.close_date,
    t.buyer,
    t.department,
    t.bid_number,
    ts_rank(
      to_tsvector('english', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(t.buyer, '')),
      plainto_tsquery('english', search_term)
    ) as rank
  FROM tenders t
  WHERE 
    to_tsvector('english', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '') || ' ' || COALESCE(t.buyer, ''))
    @@ plainto_tsquery('english', search_term)
    AND t.close_date > CURRENT_TIMESTAMP
  ORDER BY rank DESC, t.close_date ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function to clean up old data (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_tenders()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update timestamps for expired tenders for housekeeping
  UPDATE tenders 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE close_date < (CURRENT_TIMESTAMP - interval '30 days')
    AND close_date IS NOT NULL
    AND updated_at < (CURRENT_TIMESTAMP - interval '1 day');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add function to upsert tender data efficiently
CREATE OR REPLACE FUNCTION upsert_tender(
  p_ocid text,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_close_date timestamptz DEFAULT NULL,
  p_buyer text DEFAULT NULL,
  p_full_data jsonb DEFAULT NULL,
  p_bid_number text DEFAULT NULL,
  p_department text DEFAULT NULL,
  p_bid_description text DEFAULT NULL,
  p_service_location text DEFAULT NULL,
  p_opening_date timestamptz DEFAULT NULL,
  p_modified_date timestamptz DEFAULT NULL,
  p_contact_person text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_contact_tel text DEFAULT NULL,
  p_contact_fax text DEFAULT NULL,
  p_briefing_session boolean DEFAULT NULL,
  p_compulsory_briefing boolean DEFAULT NULL,
  p_briefing_date timestamptz DEFAULT NULL,
  p_special_conditions text DEFAULT NULL,
  p_submission_method text DEFAULT NULL,
  p_submission_email text DEFAULT NULL,
  p_file_size_limit text DEFAULT NULL,
  p_required_format text DEFAULT NULL,
  p_reference_number text DEFAULT NULL,
  p_documents jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  tender_id uuid;
BEGIN
  INSERT INTO tenders (
    ocid, title, description, category, close_date, buyer, full_data,
    bid_number, department, bid_description, service_location, opening_date,
    modified_date, contact_person, contact_email, contact_tel, contact_fax,
    briefing_session, compulsory_briefing, briefing_date, special_conditions,
    submission_method, submission_email, file_size_limit, required_format,
    reference_number, documents, created_at, updated_at
  ) VALUES (
    p_ocid, p_title, p_description, p_category, p_close_date, p_buyer, p_full_data,
    p_bid_number, p_department, p_bid_description, p_service_location, p_opening_date,
    p_modified_date, p_contact_person, p_contact_email, p_contact_tel, p_contact_fax,
    p_briefing_session, p_compulsory_briefing, p_briefing_date, p_special_conditions,
    p_submission_method, p_submission_email, p_file_size_limit, p_required_format,
    p_reference_number, p_documents, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  ON CONFLICT (ocid) DO UPDATE SET
    title = COALESCE(EXCLUDED.title, tenders.title),
    description = COALESCE(EXCLUDED.description, tenders.description),
    category = COALESCE(EXCLUDED.category, tenders.category),
    close_date = COALESCE(EXCLUDED.close_date, tenders.close_date),
    buyer = COALESCE(EXCLUDED.buyer, tenders.buyer),
    full_data = COALESCE(EXCLUDED.full_data, tenders.full_data),
    bid_number = COALESCE(EXCLUDED.bid_number, tenders.bid_number),
    department = COALESCE(EXCLUDED.department, tenders.department),
    bid_description = COALESCE(EXCLUDED.bid_description, tenders.bid_description),
    service_location = COALESCE(EXCLUDED.service_location, tenders.service_location),
    opening_date = COALESCE(EXCLUDED.opening_date, tenders.opening_date),
    modified_date = COALESCE(EXCLUDED.modified_date, tenders.modified_date),
    contact_person = COALESCE(EXCLUDED.contact_person, tenders.contact_person),
    contact_email = COALESCE(EXCLUDED.contact_email, tenders.contact_email),
    contact_tel = COALESCE(EXCLUDED.contact_tel, tenders.contact_tel),
    contact_fax = COALESCE(EXCLUDED.contact_fax, tenders.contact_fax),
    briefing_session = COALESCE(EXCLUDED.briefing_session, tenders.briefing_session),
    compulsory_briefing = COALESCE(EXCLUDED.compulsory_briefing, tenders.compulsory_briefing),
    briefing_date = COALESCE(EXCLUDED.briefing_date, tenders.briefing_date),
    special_conditions = COALESCE(EXCLUDED.special_conditions, tenders.special_conditions),
    submission_method = COALESCE(EXCLUDED.submission_method, tenders.submission_method),
    submission_email = COALESCE(EXCLUDED.submission_email, tenders.submission_email),
    file_size_limit = COALESCE(EXCLUDED.file_size_limit, tenders.file_size_limit),
    required_format = COALESCE(EXCLUDED.required_format, tenders.required_format),
    reference_number = COALESCE(EXCLUDED.reference_number, tenders.reference_number),
    documents = COALESCE(EXCLUDED.documents, tenders.documents),
    updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO tender_id;
  
  RETURN tender_id;
END;
$$ LANGUAGE plpgsql;