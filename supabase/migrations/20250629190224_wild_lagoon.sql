/*
  # Backfill Province and Industry Data for Existing Tenders

  This migration populates the `province` and `industry_category` columns for all existing tenders
  to enable filtering functionality. It uses temporary functions to apply the same enrichment logic
  that is present in the `sync-tenders` Edge Function.
*/

-- Create a temporary function to determine the province from tender data
CREATE OR REPLACE FUNCTION temp_get_province(tender_data jsonb)
RETURNS text AS $$
DECLARE
    search_text text;
BEGIN
    search_text := lower(
        coalesce(tender_data->'buyer'->>'name', '') || ' ' ||
        coalesce(tender_data->'buyer'->'address'->>'locality', '') || ' ' ||
        coalesce(tender_data->'buyer'->'address'->>'region', '') || ' ' ||
        coalesce(tender_data->'tender'->>'title', '') || ' ' ||
        coalesce(tender_data->'tender'->>'description', '')
    );

    IF search_text LIKE ANY (ARRAY['%eastern cape%', '%ec%', '%port elizabeth%', '%east london%', '%grahamstown%', '%mthatha%']) THEN RETURN 'Eastern Cape';
    ELSIF search_text LIKE ANY (ARRAY['%free state%', '%fs%', '%bloemfontein%', '%welkom%', '%kroonstad%']) THEN RETURN 'Free State';
    ELSIF search_text LIKE ANY (ARRAY['%gauteng%', '%gp%', '%johannesburg%', '%pretoria%', '%soweto%', '%sandton%', '%midrand%', '%centurion%']) THEN RETURN 'Gauteng';
    ELSIF search_text LIKE ANY (ARRAY['%kwazulu-natal%', '%kzn%', '%durban%', '%pietermaritzburg%', '%newcastle%', '%richards bay%']) THEN RETURN 'KwaZulu-Natal';
    ELSIF search_text LIKE ANY (ARRAY['%limpopo%', '%lp%', '%polokwane%', '%tzaneen%', '%thohoyandou%']) THEN RETURN 'Limpopo';
    ELSIF search_text LIKE ANY (ARRAY['%mpumalanga%', '%mp%', '%nelspruit%', '%witbank%', '%secunda%', '%emalahleni%']) THEN RETURN 'Mpumalanga';
    ELSIF search_text LIKE ANY (ARRAY['%northern cape%', '%nc%', '%kimberley%', '%upington%', '%springbok%']) THEN RETURN 'Northern Cape';
    ELSIF search_text LIKE ANY (ARRAY['%north west%', '%nw%', '%mafikeng%', '%potchefstroom%', '%klerksdorp%', '%rustenburg%']) THEN RETURN 'North West';
    ELSIF search_text LIKE ANY (ARRAY['%western cape%', '%wc%', '%cape town%', '%stellenbosch%', '%paarl%', '%george%', '%worcester%']) THEN RETURN 'Western Cape';
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a temporary function to determine the industry from tender data
CREATE OR REPLACE FUNCTION temp_get_industry(tender_data jsonb)
RETURNS text AS $$
DECLARE
    search_text text;
BEGIN
    search_text := lower(
        coalesce(tender_data->'tender'->>'title', '') || ' ' ||
        coalesce(tender_data->'tender'->>'description', '') || ' ' ||
        coalesce(tender_data->'tender'->>'mainProcurementCategory', '')
    );

    IF search_text LIKE ANY (ARRAY['%it%', '%software%', '%hardware%', '%ict%', '%information technology%', '%website%', '%development%', '%computer%', '%system%', '%network%', '%database%', '%programming%', '%digital%', '%cyber%', '%cloud%']) THEN RETURN 'Information Technology';
    ELSIF search_text LIKE ANY (ARRAY['%construction%', '%building%', '%civil%', '%roads%', '%infrastructure%', '%maintenance%', '%renovation%', '%repair%', '%plumbing%', '%electrical%', '%roofing%', '%painting%', '%concrete%', '%steel%', '%bridge%', '%highway%']) THEN RETURN 'Construction & Infrastructure';
    ELSIF search_text LIKE ANY (ARRAY['%consulting%', '%advisory%', '%professional services%', '%facilitation%', '%strategy%', '%management consulting%', '%business consulting%', '%technical consulting%', '%project management%', '%change management%']) THEN RETURN 'Consulting Services';
    ELSIF search_text LIKE ANY (ARRAY['%marketing%', '%advertising%', '%communication%', '%media%', '%brand%', '%public relations%', '%social media%', '%graphic design%', '%printing%', '%promotional%', '%campaign%', '%corporate communications%', '%event management%']) THEN RETURN 'Marketing & Communications';
    ELSIF search_text LIKE ANY (ARRAY['%health%', '%medical%', '%hospital%', '%pharmaceutical%', '%ppe%', '%healthcare%', '%clinic%', '%nursing%', '%medical equipment%', '%laboratory%', '%dental%', '%mental health%', '%public health%', '%medical supplies%']) THEN RETURN 'Health & Medical';
    ELSIF search_text LIKE ANY (ARRAY['%security%', '%guarding%', '%cctv%', '%alarm%', '%surveillance%', '%access control%', '%security systems%', '%patrol%', '%monitoring%', '%safety%', '%protection%']) THEN RETURN 'Security Services';
    ELSIF search_text LIKE ANY (ARRAY['%education%', '%training%', '%learning%', '%school%', '%university%', '%college%', '%workshop%', '%course%', '%curriculum%', '%teaching%', '%academic%', '%skills development%', '%capacity building%', '%educational services%']) THEN RETURN 'Education & Training';
    ELSIF search_text LIKE ANY (ARRAY['%financial%', '%banking%', '%insurance%', '%accounting%', '%audit%', '%tax%', '%bookkeeping%', '%payroll%', '%financial management%', '%investment%', '%treasury%', '%risk management%']) THEN RETURN 'Financial Services';
    ELSIF search_text LIKE ANY (ARRAY['%transport%', '%logistics%', '%delivery%', '%freight%', '%shipping%', '%courier%', '%vehicle%', '%fleet%', '%distribution%', '%supply chain%', '%warehousing%']) THEN RETURN 'Transportation & Logistics';
    ELSIF search_text LIKE ANY (ARRAY['%energy%', '%electricity%', '%power%', '%solar%', '%renewable%', '%utilities%', '%water%', '%gas%', '%fuel%', '%generator%', '%electrical services%']) THEN RETURN 'Energy & Utilities';
    ELSIF search_text LIKE ANY (ARRAY['%agriculture%', '%farming%', '%food%', '%catering%', '%agricultural%', '%livestock%', '%crops%', '%irrigation%', '%food services%', '%nutrition%', '%agricultural equipment%']) THEN RETURN 'Agriculture & Food';
    ELSIF search_text LIKE ANY (ARRAY['%manufacturing%', '%production%', '%factory%', '%industrial%', '%machinery%', '%equipment%', '%tools%', '%fabrication%', '%assembly%']) THEN RETURN 'Manufacturing';
    ELSIF search_text LIKE ANY (ARRAY['%legal%', '%law%', '%attorney%', '%lawyer%', '%litigation%', '%compliance%', '%regulatory%', '%legal advice%', '%contract%', '%legal services%']) THEN RETURN 'Legal Services';
    END IF;

    RETURN 'Other';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing tenders where province or industry is NULL
UPDATE tenders
SET
    province = COALESCE(province, temp_get_province(full_data)),
    industry_category = COALESCE(industry_category, temp_get_industry(full_data))
WHERE
    province IS NULL OR industry_category IS NULL;

-- Clean up the temporary functions
DROP FUNCTION temp_get_province(jsonb);
DROP FUNCTION temp_get_industry(jsonb);

-- Log the backfill operation
INSERT INTO fetch_logs (
    sync_type,
    sync_status,
    total_fetched,
    open_tenders,
    pages_processed,
    execution_time_ms,
    stopped_reason,
    created_at
) VALUES (
    'backfill',
    'completed',
    (SELECT COUNT(*) FROM tenders WHERE province IS NOT NULL OR industry_category IS NOT NULL),
    (SELECT COUNT(*) FROM tenders WHERE close_date > NOW()),
    0,
    0,
    'Backfilled province and industry_category columns for existing tenders',
    NOW()
);