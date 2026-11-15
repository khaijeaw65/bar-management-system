// All figures in NUMERIC (DR-004). $1 / $2 = [start, end) of the business days.
// Business date of an instant = Bangkok local time minus the cut-off ($3), same rule as businessDate().

export const CUTOFF_SQL = `
  SELECT business_day_cutoff::text AS cutoff
  FROM venue
  ORDER BY created_at ASC
  LIMIT 1
`;

// revenue = completed payments by paid_at · bills = visits closed in the period ·
// average leaves out ฿0 bills (CD-05 R6).
export const PERIOD_TOTALS_SQL = `
  WITH paid AS (
    SELECT method, confirmed_via, amount
    FROM payment
    WHERE status = 'completed' AND paid_at >= $1 AND paid_at < $2
  ),
  closed AS (
    SELECT (
      SELECT COALESCE(SUM(p.amount), 0)
      FROM payment p
      WHERE p.visit_id = v.id AND p.status = 'completed'
    ) AS paid_total
    FROM visit v
    WHERE v.state = 'closed' AND v.closed_at >= $1 AND v.closed_at < $2
  ),
  totals AS (
    SELECT (SELECT COALESCE(SUM(amount), 0) FROM paid) AS revenue,
           (SELECT count(*) FROM closed) AS bills,
           (SELECT count(*) FROM closed WHERE paid_total > 0) AS paid_bills
  )
  SELECT t.revenue::text AS revenue,
         t.bills::int AS bills,
         COALESCE(ROUND(t.revenue / NULLIF(t.paid_bills, 0), 2), 0)::text AS average_bill,
         (SELECT COALESCE(SUM(amount), 0) FROM paid WHERE method = 'promptpay')::text AS promptpay_amount,
         (SELECT count(*) FROM paid WHERE method = 'promptpay')::int AS promptpay_count,
         (SELECT COALESCE(SUM(amount), 0) FROM paid WHERE method = 'cash')::text AS cash_amount,
         (SELECT count(*) FROM paid WHERE method = 'cash')::int AS cash_count,
         (SELECT count(*) FROM paid WHERE confirmed_via = 'manual')::int AS manual_confirmations
  FROM totals t
`;

export const DAILY_TOTALS_SQL = `
  WITH revenue AS (
    SELECT ((paid_at AT TIME ZONE 'Asia/Bangkok') - $3::interval)::date AS day, SUM(amount) AS revenue
    FROM payment
    WHERE status = 'completed' AND paid_at >= $1 AND paid_at < $2
    GROUP BY 1
  ),
  bills AS (
    SELECT ((closed_at AT TIME ZONE 'Asia/Bangkok') - $3::interval)::date AS day, count(*) AS bills
    FROM visit
    WHERE state = 'closed' AND closed_at >= $1 AND closed_at < $2
    GROUP BY 1
  )
  SELECT COALESCE(r.day, b.day)::text AS date,
         COALESCE(r.revenue, 0)::text AS revenue,
         COALESCE(b.bills, 0)::int AS bills
  FROM revenue r
  FULL JOIN bills b ON b.day = r.day
`;

// Active lines whose order belongs to business dates $1–$2. Charge items never count.
const ITEM_SALES = `
  SELECT v.menu_item_id,
         SUM(i.quantity) AS quantity,
         SUM(
           CASE WHEN i.cancel_kind = 'comp' THEN 0
                ELSE i.unit_price_snapshot * i.quantity
           END
         ) AS revenue
  FROM order_item i
  JOIN order_ticket t ON t.id = i.ticket_id
  JOIN order_record o ON o.id = t.order_id
  JOIN menu_item_variant v ON v.id = i.menu_item_variant_id
  WHERE (i.cancel_kind IS NULL OR i.cancel_kind = 'comp') AND o.business_date BETWEEN $1::date AND $2::date
  GROUP BY v.menu_item_id
`;

export const TOP_ITEMS_SQL = `
  WITH sales AS (${ITEM_SALES})
  SELECT mi.id AS menu_item_id, mi.name, s.quantity::int AS quantity, s.revenue::text AS revenue
  FROM sales s
  JOIN menu_item mi ON mi.id = s.menu_item_id
  WHERE mi.item_type <> 'charge'
  ORDER BY s.revenue DESC, s.quantity DESC, mi.name ASC
  LIMIT $3
`;

// Every item on sale for at least a week, sold or not (CD-05 R6); $4 = newest allowed created_at.
export const BOTTOM_ITEMS_SQL = `
  WITH sales AS (${ITEM_SALES})
  SELECT mi.id AS menu_item_id,
         mi.name,
         COALESCE(s.quantity, 0)::int AS quantity,
         COALESCE(s.revenue, 0)::text AS revenue
  FROM menu_item mi
  JOIN menu_category c ON c.id = mi.category_id
  LEFT JOIN sales s ON s.menu_item_id = mi.id
  WHERE mi.item_type <> 'charge' AND mi.is_available AND c.is_active AND mi.created_at <= $4
  ORDER BY COALESCE(s.quantity, 0) ASC, COALESCE(s.revenue, 0) ASC, mi.name ASC
  LIMIT $3
`;

export const HOURLY_REVENUE_SQL = `
  SELECT EXTRACT(HOUR FROM paid_at AT TIME ZONE 'Asia/Bangkok')::int AS hour,
         SUM(amount)::text AS revenue
  FROM payment
  WHERE status = 'completed' AND paid_at >= $1 AND paid_at < $2
  GROUP BY 1
`;

// Bill total as the POS shows it (order BILL_SQL): active lines incl. modifier deltas.
export const OPEN_SEATS_SQL = `
  WITH live AS (
    SELECT id, table_seat_id, opened_at
    FROM visit
    WHERE state IN ('open', 'active', 'idle')
  ),
  lines AS (
    SELECT o.visit_id,
           CASE WHEN i.cancel_kind = 'comp' THEN 0
                ELSE i.quantity * (i.unit_price_snapshot + COALESCE(mods.delta, 0))
           END AS amount
    FROM order_item i
    JOIN order_ticket t ON t.id = i.ticket_id
    JOIN order_record o ON o.id = t.order_id
    LEFT JOIN (
      SELECT order_item_id, SUM(price_delta_snapshot) AS delta
      FROM order_item_modifier
      GROUP BY order_item_id
    ) mods ON mods.order_item_id = i.id
    WHERE (i.cancel_kind IS NULL OR i.cancel_kind = 'comp') AND o.visit_id IN (SELECT id FROM live)
  )
  SELECT s.label AS seat_label, live.opened_at, COALESCE(SUM(l.amount), 0)::text AS total
  FROM live
  JOIN table_seat s ON s.id = live.table_seat_id
  LEFT JOIN lines l ON l.visit_id = live.id
  GROUP BY live.id, s.label, live.opened_at
  ORDER BY live.opened_at ASC, s.label ASC
`;

// pending = the station queue (pending · accepted · ready, charge tickets excluded) ·
// escalated = issues sent to POS (CD-15).
export const TICKET_COUNTS_SQL = `
  SELECT count(*) FILTER (
           WHERE station IS NOT NULL AND status IN ('pending', 'accepted', 'ready')
         )::int AS pending,
         count(*) FILTER (WHERE status = 'issue' AND issue_escalated_at IS NOT NULL)::int AS escalated_issues
  FROM order_ticket
`;
