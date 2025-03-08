import { QueryTypes } from "sequelize";
import { sequelize } from "../utils/connectPostgres";

export async function getDarshanSlots(
  startDate: string,
  endDate: string,
  darshan_ids: number[],
  totalPersons: number
): Promise<any[]> {
  const query = `WITH combined_darshans AS (
    -- Select records from bmd_temple_darshan_dates if available
    SELECT 
      ds.date AS series_date,
      bmdtd.darshan_id,
      bmdtd.darshan_name,
      bmdtd.price,
      bmdt.temple_id,
      bmdt.temple_name,
      bmdt.location,
      bmdtdd.darshan_time,
      bmdtdd.no_of_tickets
    FROM 
      generate_series('${startDate}'::date, '${endDate}'::date, '1 day'::interval) AS ds(date)
    LEFT JOIN 
      bmd_temple_darshans bmdtd ON bmdtd.darshan_id = ANY(ARRAY[${darshan_ids.join(",")}])
    LEFT JOIN 
      bmd_temple_darshan_dates bmdtdd ON bmdtdd.darshan_id = bmdtd.darshan_id AND ds.date = bmdtdd.date
    LEFT JOIN 
      bmd_temples bmdt ON bmdtd.temple_id = bmdt.temple_id
    WHERE 
      bmdtdd.no_of_tickets >= ${totalPersons}
    
    UNION ALL
    
    -- Fallback to bmd_temple_darshan_slots if no record in dates
    SELECT 
      ds.date AS series_date,
      bmdtd.darshan_id,
      bmdtd.darshan_name,
      bmdtd.price,
      bmdt.temple_id,
      bmdt.temple_name,
      bmdt.location,
      bmds.darshan_time,
      bmds.no_of_tickets
    FROM 
      generate_series('${startDate}'::date, '${endDate}'::date, '1 day'::interval) AS ds(date)
    LEFT JOIN 
      bmd_temple_darshans bmdtd ON bmdtd.darshan_id = ANY(ARRAY[${darshan_ids.join(",")}])
    LEFT JOIN 
      bmd_temple_darshan_slots bmds ON bmdtd.darshan_id = bmds.darshan_id
    LEFT JOIN 
      bmd_temples bmdt ON bmdtd.temple_id = bmdt.temple_id
    WHERE 
      bmds.no_of_tickets >= ${totalPersons}
      AND NOT EXISTS (
        SELECT 1
        FROM bmd_temple_darshan_dates bmdtdd
        WHERE bmdtdd.darshan_id = bmdtd.darshan_id
        AND ds.date = bmdtdd.date
        AND bmdtdd.darshan_time = bmds.darshan_time
      )
)

-- Ensure all darshan_ids satisfy the condition
SELECT 
    TO_CHAR(series_date, 'YYYY-MM-DD') AS date,
    darshan_id,
    temple_id,
    temple_name,
    location,
    darshan_name,
    price,
    darshan_time,
    no_of_tickets
FROM 
    combined_darshans
WHERE 
    darshan_id = ANY(ARRAY[${darshan_ids.join(",")}])
GROUP BY 
    series_date, darshan_id, temple_id, temple_name, location, darshan_name, price, darshan_time, no_of_tickets
HAVING 
    COUNT(DISTINCT darshan_id) = ${darshan_ids.length} -- Ensure all darshan_ids are present
ORDER BY 
    series_date ASC,
    darshan_time ASC;
`;
  const darshanSlotResults = await sequelize.query(query, {
    type: QueryTypes.SELECT,
  });
  return darshanSlotResults;
}
