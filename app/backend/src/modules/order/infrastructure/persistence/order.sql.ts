export const ORDER_ROWS_SQL = `
  SELECT
    o.id AS order_id,
    o.visit_id,
    o.order_number,
    o.business_date::text AS business_date,
    o.created_at AS order_created_at,
    o.created_by AS order_created_by,
    t.id AS ticket_id,
    t.station,
    t.status,
    t.sent_at,
    t.created_at AS ticket_created_at,
    t.updated_at AS ticket_updated_at,
    t.updated_by AS ticket_updated_by,
    s.id AS seat_id,
    s.label AS seat_label,
    s.kind AS seat_kind,
    i.id AS item_id,
    i.menu_item_variant_id AS variant_id,
    mi.name AS item_name,
    v.name AS variant_name,
    i.quantity,
    i.unit_price_snapshot AS unit_price,
    i.ordered_by_name,
    i.notes,
    i.cancelled_at,
    m.modifier_option_id AS option_id,
    mo.name AS option_name,
    m.price_delta_snapshot AS price_delta
  FROM order_record o
  JOIN visit vis ON vis.id = o.visit_id
  JOIN table_seat s ON s.id = vis.table_seat_id
  JOIN order_ticket t ON t.order_id = o.id
  JOIN order_item i ON i.ticket_id = t.id
  JOIN menu_item_variant v ON v.id = i.menu_item_variant_id
  JOIN menu_item mi ON mi.id = v.menu_item_id
  LEFT JOIN order_item_modifier m ON m.order_item_id = i.id
  LEFT JOIN modifier_option mo ON mo.id = m.modifier_option_id
`;

export const BILL_SQL = `
  SELECT o.visit_id,
         COALESCE(SUM(i.quantity * (i.unit_price_snapshot + COALESCE(mods.delta, 0))), 0)::text AS total,
         COALESCE(SUM(i.quantity), 0)::int AS item_count
  FROM order_item i
  JOIN order_ticket t ON t.id = i.ticket_id
  JOIN order_record o ON o.id = t.order_id
  LEFT JOIN (
    SELECT order_item_id, SUM(price_delta_snapshot) AS delta
    FROM order_item_modifier
    GROUP BY order_item_id
  ) mods ON mods.order_item_id = i.id
  WHERE i.cancelled_at IS NULL AND o.visit_id = ANY($1::uuid[])
  GROUP BY o.visit_id
`;

export const ORDER_TOTALS_SQL = `
  SELECT o.id AS order_id,
         COALESCE(SUM(i.quantity * (i.unit_price_snapshot + COALESCE(mods.delta, 0))), 0)::text AS total
  FROM order_record o
  JOIN order_ticket t ON t.order_id = o.id
  JOIN order_item i ON i.ticket_id = t.id
  LEFT JOIN (
    SELECT order_item_id, SUM(price_delta_snapshot) AS delta
    FROM order_item_modifier
    GROUP BY order_item_id
  ) mods ON mods.order_item_id = i.id
  WHERE i.cancelled_at IS NULL AND o.visit_id = $1
  GROUP BY o.id
`;

export const LOCK_TICKET_SQL = `
  SELECT t.id, t.order_id, t.status, t.sent_at, o.visit_id, s.kind AS seat_kind
  FROM order_ticket t
  JOIN order_record o ON o.id = t.order_id
  JOIN visit v ON v.id = o.visit_id
  JOIN table_seat s ON s.id = v.table_seat_id
  WHERE t.id = $1
  FOR UPDATE OF t
`;
