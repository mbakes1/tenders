/*
  # Enhanced Tender Schema

  1. New Columns Added
    - `bid_number` (text) - The official bid/tender reference number
    - `department` (text) - The department or organization issuing the tender
    - `bid_description` (text) - Detailed description of the bid requirements
    - `service_location` (text) - Where goods, works or services are required
    - `opening_date` (timestamptz) - When the tender opens
    - `modified_date` (timestamptz) - Last modification date
    - `contact_person` (text) - Name of the enquiries/contact person
    - `contact_email` (text) - Contact email address
    - `contact_tel` (text) - Contact telephone number
    - `contact_fax` (text) - Contact fax number
    - `briefing_session` (boolean) - Whether there's a briefing session
    - `compulsory_briefing` (boolean) - Whether briefing is compulsory
    - `briefing_date` (timestamptz) - Date of briefing session
    - `special_conditions` (text) - Special conditions and delivery instructions
    - `submission_method` (text) - How to submit (electronic, physical, etc.)
    - `submission_email` (text) - Email for electronic submissions
    - `file_size_limit` (text) - File size limitations
    - `required_format` (text) - Required file format
    - `reference_number` (text) - Reference number for submissions

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to tenders table
DO $$
BEGIN
  -- Bid information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'bid_number') THEN
    ALTER TABLE tenders ADD COLUMN bid_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'department') THEN
    ALTER TABLE tenders ADD COLUMN department text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'bid_description') THEN
    ALTER TABLE tenders ADD COLUMN bid_description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'service_location') THEN
    ALTER TABLE tenders ADD COLUMN service_location text;
  END IF;
  
  -- Dates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'opening_date') THEN
    ALTER TABLE tenders ADD COLUMN opening_date timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'modified_date') THEN
    ALTER TABLE tenders ADD COLUMN modified_date timestamptz;
  END IF;
  
  -- Contact information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'contact_person') THEN
    ALTER TABLE tenders ADD COLUMN contact_person text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'contact_email') THEN
    ALTER TABLE tenders ADD COLUMN contact_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'contact_tel') THEN
    ALTER TABLE tenders ADD COLUMN contact_tel text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'contact_fax') THEN
    ALTER TABLE tenders ADD COLUMN contact_fax text;
  END IF;
  
  -- Briefing information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'briefing_session') THEN
    ALTER TABLE tenders ADD COLUMN briefing_session boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'compulsory_briefing') THEN
    ALTER TABLE tenders ADD COLUMN compulsory_briefing boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'briefing_date') THEN
    ALTER TABLE tenders ADD COLUMN briefing_date timestamptz;
  END IF;
  
  -- Submission details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'special_conditions') THEN
    ALTER TABLE tenders ADD COLUMN special_conditions text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'submission_method') THEN
    ALTER TABLE tenders ADD COLUMN submission_method text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'submission_email') THEN
    ALTER TABLE tenders ADD COLUMN submission_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'file_size_limit') THEN
    ALTER TABLE tenders ADD COLUMN file_size_limit text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'required_format') THEN
    ALTER TABLE tenders ADD COLUMN required_format text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'reference_number') THEN
    ALTER TABLE tenders ADD COLUMN reference_number text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenders_bid_number ON tenders(bid_number);
CREATE INDEX IF NOT EXISTS idx_tenders_department ON tenders(department);
CREATE INDEX IF NOT EXISTS idx_tenders_opening_date ON tenders(opening_date);