/* @ds-bundle: {"format":4,"namespace":"TheLoftBarDesignSystem_99bbff","components":[{"name":"CartLine","sourcePath":"components/bar/CartLine.jsx"},{"name":"MenuItemCard","sourcePath":"components/bar/MenuItemCard.jsx"},{"name":"OrderTicket","sourcePath":"components/bar/OrderTicket.jsx"},{"name":"PromptPayPanel","sourcePath":"components/bar/PromptPayPanel.jsx"},{"name":"StatTile","sourcePath":"components/bar/StatTile.jsx"},{"name":"TableCard","sourcePath":"components/bar/TableCard.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"LUCIDE_VERSION","sourcePath":"components/core/Icon.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Spinner","sourcePath":"components/core/Spinner.jsx"},{"name":"STATUS_CHIP_SETS","sourcePath":"components/core/StatusChip.jsx"},{"name":"StatusChip","sourcePath":"components/core/StatusChip.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"ToastRegion","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"QuantityStepper","sourcePath":"components/forms/QuantityStepper.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"NotificationBell","sourcePath":"components/pos/NotificationBell.jsx"},{"name":"NOTIFICATION_TYPES","sourcePath":"components/pos/NotificationFeed.jsx"},{"name":"NotificationFeed","sourcePath":"components/pos/NotificationFeed.jsx"},{"name":"PosRail","sourcePath":"components/pos/PosRail.jsx"}],"sourceHashes":{"components/bar/CartLine.jsx":"9dd41632e88a","components/bar/MenuItemCard.jsx":"0f095f9ace2d","components/bar/OrderTicket.jsx":"f2eb471df7ba","components/bar/PromptPayPanel.jsx":"8bd60b1755bc","components/bar/StatTile.jsx":"6224a26b735e","components/bar/TableCard.jsx":"ca06cfbaa47b","components/core/Avatar.jsx":"d81b879524c4","components/core/Badge.jsx":"ac2043e4e05e","components/core/Button.jsx":"f753e1a0c52d","components/core/Card.jsx":"76a60de395ca","components/core/Icon.jsx":"9e50ce93ebe0","components/core/IconButton.jsx":"80e3ca658bde","components/core/Spinner.jsx":"3cd0603a5b7a","components/core/StatusChip.jsx":"4f2565b2225a","components/core/Tag.jsx":"7583a6f07f7b","components/data/DataTable.jsx":"ef3faf5cabff","components/feedback/Alert.jsx":"64504a2090ec","components/feedback/Dialog.jsx":"523f7fcd521a","components/feedback/EmptyState.jsx":"8a5ac8264aaf","components/feedback/Skeleton.jsx":"a5f5e390e5a8","components/feedback/Toast.jsx":"67a65bc4e0a5","components/feedback/Tooltip.jsx":"3cd2082a0312","components/forms/Checkbox.jsx":"3d716b0dccfb","components/forms/Input.jsx":"2213e355bf21","components/forms/QuantityStepper.jsx":"7f1fb54f4caf","components/forms/Radio.jsx":"61465b0eb264","components/forms/SearchField.jsx":"cddb82874276","components/forms/SegmentedControl.jsx":"a6e34c8f0c55","components/forms/Select.jsx":"fcf924df2de0","components/forms/Switch.jsx":"f4a99bb22dbe","components/navigation/TabBar.jsx":"790b07a0bb3f","components/navigation/Tabs.jsx":"a209d7b82bb4","components/navigation/TopBar.jsx":"012ce44e63fa","components/pos/NotificationBell.jsx":"5d642b6cfc42","components/pos/NotificationFeed.jsx":"a1acf3ea17f0","components/pos/PosRail.jsx":"99a0a97d03ad","guidelines/cd-00/artboard.js":"c5ca83ac9f1c","ui_kits/customer-menu/CartScreen.jsx":"fe44078dfca0","ui_kits/customer-menu/ItemSheet.jsx":"df93c3136f12","ui_kits/customer-menu/MenuScreen.jsx":"1f2143e4d778","ui_kits/customer-menu/StatusScreen.jsx":"036e69e2c144","ui_kits/customer-menu/data.js":"6ee124c17ac0","ui_kits/pos-desktop/FloorView.jsx":"84cc867c44a1","ui_kits/pos-desktop/OrderView.jsx":"4c53ed9f28a4","ui_kits/pos-desktop/PayView.jsx":"cbd3e7fd83e1","ui_kits/pos-desktop/Sidebar.jsx":"ae3e66c92b2e","ui_kits/pos-desktop/data.js":"1dd5cca565fb","ui_kits/pos-v2/Shell.jsx":"b9359c16d6d4","ui_kits/pos-v2/cd-02/cd02-kit.jsx":"2a30f470d3b3","ui_kits/pos-v2/cd-02/cd02-panel.jsx":"bad4c6b8b85c","ui_kits/pos-v2/cd-03/cd03-kit.jsx":"7d0fd647dfab","ui_kits/pos-v2/cd-04/cd04-kit.jsx":"b5efb57f3026","ui_kits/pos-v2/cd-04/cd04-sheets.jsx":"66d93b827e94","ui_kits/staff-mobile/OrdersScreen.jsx":"1206825a9a44","ui_kits/staff-mobile/StockScreen.jsx":"d0bd80eae964","ui_kits/staff-mobile/TablesScreen.jsx":"ffe14fbcfa49"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TheLoftBarDesignSystem_99bbff = window.TheLoftBarDesignSystem_99bbff || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/bar/CartLine.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 16) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function CartLine({
  name,
  note,
  price,
  qty = 1,
  onQtyChange,
  onRemove,
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-component": "CartLine",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 0",
      borderBottom: "1px solid var(--line-hairline)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)",
      color: "var(--text-body)"
    }
  }, name), note && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, note)), onQtyChange && NS.QuantityStepper ? React.createElement(NS.QuantityStepper, {
    value: qty,
    onChange: onQtyChange,
    min: 0
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-body-md)",
      color: "var(--text-faint)",
      fontVariantNumeric: "tabular-nums"
    }
  }, "\xD7", qty), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 68,
      textAlign: "right",
      font: "var(--text-body-strong)",
      color: "var(--text-body)",
      fontVariantNumeric: "tabular-nums"
    }
  }, price), onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRemove,
    "aria-label": "\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    style: {
      width: 36,
      height: 36,
      display: "grid",
      placeItems: "center",
      background: "transparent",
      border: "none",
      borderRadius: "var(--r-xs)",
      color: "var(--text-faint)",
      cursor: "pointer"
    }
  }, lbIco("x")));
}
Object.assign(__ds_scope, { CartLine });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bar/CartLine.jsx", error: String((e && e.message) || e) }); }

// components/bar/MenuItemCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 20) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function MenuItemCard({
  name,
  nameEn,
  price,
  note,
  image,
  soldOut = false,
  onAdd,
  layout = "row",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const row = layout === "row";
  const thumb = /*#__PURE__*/React.createElement("div", {
    style: {
      width: row ? 72 : "100%",
      height: row ? 72 : 108,
      borderRadius: row ? "var(--r-sm)" : "var(--r-card) var(--r-card) 0 0",
      background: image ? `center/cover url(${image})` : "var(--surface-raised)",
      display: "grid",
      placeItems: "center",
      color: "var(--text-faint)",
      flex: "0 0 auto",
      font: "var(--fw-bold) 20px/1 var(--font-ui)"
    }
  }, !image && Array.from(name || "")[0]);
  const chip = soldOut && NS.StatusChip ? React.createElement(NS.StatusChip, {
    kind: "menu",
    status: "soldout"
  }) : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-component": "MenuItemCard",
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      flexDirection: row ? "row" : "column",
      gap: 12,
      alignItems: row ? "center" : "stretch",
      padding: row ? "var(--card-pad)" : 0,
      paddingBottom: row ? "var(--card-pad)" : 12,
      background: hover && !soldOut ? "var(--surface-hover)" : "var(--surface-card)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-card)",
      boxShadow: "var(--shadow-card), var(--highlight-top)",
      opacity: soldOut ? .5 : 1,
      transition: "background var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), thumb, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      padding: row ? 0 : "0 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)",
      color: "var(--text-body)"
    }
  }, name), nameEn && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, nameEn), note && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, note), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-price)",
      color: "var(--text-accent)",
      fontVariantNumeric: "tabular-nums"
    }
  }, price), !row && (soldOut ? chip : onAdd && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "เพิ่ม " + name,
    onClick: onAdd,
    style: {
      cursor: "pointer",
      width: 36,
      height: 36,
      display: "grid",
      placeItems: "center",
      border: "none",
      borderRadius: "var(--r-sm)",
      background: "var(--accent)",
      color: "var(--text-on-accent)"
    }
  }, lbIco("plus"))))), row && (soldOut ? chip : onAdd && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "เพิ่ม " + name,
    onClick: onAdd,
    style: {
      width: 44,
      height: 44,
      display: "grid",
      placeItems: "center",
      borderRadius: "var(--r-sm)",
      background: "var(--accent-soft-strong)",
      color: "var(--text-accent)",
      border: "none",
      cursor: "pointer"
    }
  }, lbIco("plus"))));
}
Object.assign(__ds_scope, { MenuItemCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bar/MenuItemCard.jsx", error: String((e && e.message) || e) }); }

// components/bar/OrderTicket.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const OT_LEGACY = {
  new: "pending",
  making: "accepted",
  served: "ready",
  void: "issue"
};
function OrderTicket({
  table,
  time,
  status = "pending",
  statusLabel,
  lines = [],
  total,
  actions,
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const st = OT_LEGACY[status] || status;
  const num = {
    fontVariantNumeric: "tabular-nums"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-component": "OrderTicket",
    "data-status": st,
    style: {
      background: "var(--surface-card)",
      border: "1px solid " + (st === "issue" ? "var(--status-void-border)" : "var(--line)"),
      borderRadius: "var(--r-card)",
      boxShadow: "var(--shadow-card), var(--highlight-top)",
      padding: "var(--card-pad)",
      display: "grid",
      gap: 12,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-subhead)",
      color: "var(--text-body)"
    }
  }, table), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: "var(--text-small)",
      color: "var(--text-faint)",
      ...num
    }
  }, time), NS.StatusChip && React.createElement(NS.StatusChip, {
    kind: "order",
    status: st,
    label: statusLabel
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, lines.map((l, i) => {
    const cx = l.status === "cancelled";
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 10,
        alignItems: "baseline",
        font: "var(--text-body-md)",
        color: cx ? "var(--text-faint)" : "var(--text-body)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: cx ? "var(--text-faint)" : "var(--text-accent)",
        font: "var(--text-body-strong)",
        minWidth: 26,
        ...num
      }
    }, l.qty, "\xD7"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        textDecoration: cx ? "line-through" : "none"
      }
    }, l.name, l.note && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, l.note)), l.status && NS.StatusChip && React.createElement(NS.StatusChip, {
      kind: "item",
      status: l.status,
      size: "sm"
    }), l.price && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-muted)",
        ...num
      }
    }, l.price));
  })), (total || actions) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      paddingTop: 10,
      borderTop: "1px solid var(--line-hairline)"
    }
  }, total && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: "var(--text-price)",
      color: "var(--text-body)",
      ...num
    }
  }, total), actions));
}
Object.assign(__ds_scope, { OrderTicket });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bar/OrderTicket.jsx", error: String((e && e.message) || e) }); }

// components/bar/PromptPayPanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function PromptPayPanel({
  amount,
  merchant = "เดอะ ลอฟท์ บาร์",
  reference,
  qrSrc,
  qr,
  qrSize = 200,
  expiresIn,
  status = "pending",
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const done = status === "paid" || status === "completed",
    dim = status === "failed" || status === "expired" || status === "cancelled";
  const chip = done ? "completed" : status === "expired" ? "cancelled" : status;
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-component": "PromptPayPanel",
    "data-status": status,
    style: {
      width: Math.max(320, qrSize + 88),
      boxSizing: "border-box",
      display: "grid",
      gap: 14,
      justifyItems: "center",
      padding: 20,
      background: "var(--surface-card)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-card-lg)",
      boxShadow: "var(--shadow-card), var(--highlight-top)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-body-strong)",
      color: "var(--text-body)"
    }
  }, "\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E40\u0E1E\u0E22\u0E4C"), NS.StatusChip && React.createElement(NS.StatusChip, {
    kind: "payment",
    status: chip
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: qrSize + 32,
      boxSizing: "border-box",
      padding: 16,
      borderRadius: "var(--r-card)",
      background: "var(--qr-bg)",
      border: "1px solid var(--line)",
      display: "grid",
      gap: 10,
      justifyItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: qrSize,
      height: qrSize,
      position: "relative",
      display: "grid",
      placeItems: "center",
      opacity: dim ? .25 : 1,
      background: qr ? "none" : qrSrc ? `center/contain no-repeat url(${qrSrc})` : "repeating-linear-gradient(45deg, transparent 0 6px, rgba(18,16,12,.06) 6px 7px)",
      outline: qr || qrSrc ? "none" : "1px dashed var(--qr-ink)",
      outlineOffset: -1
    }
  }, qr, !qr && !qrSrc && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "500 11px/1.4 ui-monospace,Menlo,monospace",
      color: "var(--qr-ink)",
      textAlign: "center"
    }
  }, "PromptPay QR", /*#__PURE__*/React.createElement("br", null), "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E08\u0E32\u0E01\u0E22\u0E2D\u0E14\u0E0A\u0E33\u0E23\u0E30")), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) var(--fs-small)/1.3 var(--font-ui)",
      color: "var(--qr-ink)"
    }
  }, merchant)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--fw-bold) var(--fs-pos-total)/1.1 var(--font-numeric)",
      fontVariantNumeric: "tabular-nums",
      color: done ? "var(--success-fg)" : "var(--text-body)"
    }
  }, amount), reference && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)",
      fontVariantNumeric: "tabular-nums",
      marginTop: 4
    }
  }, reference)), expiresIn && status === "pending" && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)",
      fontVariantNumeric: "tabular-nums"
    }
  }, "\u0E2B\u0E21\u0E14\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19 ", expiresIn));
}
Object.assign(__ds_scope, { PromptPayPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bar/PromptPayPanel.jsx", error: String((e && e.message) || e) }); }

// components/bar/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StatTile({
  label,
  value,
  delta,
  tone = "neutral",
  icon,
  style,
  ...rest
}) {
  const deltaColor = tone === "up" ? "var(--success-fg)" : tone === "down" ? "var(--text-danger)" : "var(--text-faint)";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-card)",
      padding: "var(--card-pad)",
      display: "grid",
      gap: 6,
      boxShadow: "var(--shadow-card), var(--highlight-top)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-ui)",
      color: "var(--text-faint)"
    }
  }, icon, label), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--fw-bold) var(--fs-title)/1.2 var(--font-numeric)",
      fontVariantNumeric: "tabular-nums",
      color: "var(--text-body)"
    }
  }, value), delta && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      fontVariantNumeric: "tabular-nums",
      color: deltaColor
    }
  }, delta));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bar/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/bar/TableCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TC_NUM = {
  fontVariantNumeric: "tabular-nums"
};
function tcBaht(v) {
  if (v == null || v === "") return null;
  if (typeof v === "string") return v;
  return "฿" + Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function tcSkin(state, calling, selected) {
  let bg = "var(--surface-card)",
    bd = "var(--border-w) solid var(--line)",
    flat = false;
  if (state === "free") {
    bg = "transparent";
    flat = true;
  }
  if (state === "open") bd = "var(--border-w-strong) dashed var(--line-accent)";
  if (state === "idle") {
    bg = "var(--warning-bg)";
    bd = "var(--border-w-strong) solid var(--status-new-border)";
  }
  if (state === "closed") {
    bg = "var(--bg-sunken)";
    bd = "var(--border-w) solid var(--line-hairline)";
    flat = true;
  }
  if (state === "abandoned") {
    bg = "var(--status-void-bg)";
    bd = "var(--border-w-strong) solid var(--status-void-border)";
  }
  if (calling) {
    bg = "var(--accent-soft)";
    bd = "var(--border-w-strong) solid var(--accent)";
  }
  const ring = selected ? "0 0 0 2px var(--bg-app), 0 0 0 4px var(--accent)" : flat ? "none" : "var(--shadow-card), var(--highlight-top)";
  return {
    background: bg,
    border: bd,
    boxShadow: ring
  };
}
function TableCard({
  label,
  state = "free",
  calling = false,
  guests,
  items,
  total,
  time,
  idleMin,
  newOrders,
  size = "large",
  selected = false,
  compactStatus = "chip",
  onClick,
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const {
    Card,
    StatusChip,
    Badge,
    Icon
  } = NS;
  if (!Card || !StatusChip || !Badge) return null;
  const compact = size === "compact",
    muted = state === "free" || state === "closed";
  const money = tcBaht(total);
  const base = {
    position: "relative",
    width: compact ? 120 : "100%",
    height: compact ? 96 : 140,
    padding: compact ? 10 : 14,
    display: "flex",
    flexDirection: "column",
    borderRadius: "var(--r-card)",
    cursor: onClick ? "pointer" : "default",
    ...tcSkin(state, calling, selected),
    ...style
  };
  const lab = /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-bold) ${compact ? "var(--fs-subhead)" : "var(--fs-heading)"}/1.2 var(--font-ui)`,
      color: muted ? "var(--text-faint)" : "var(--text-body)",
      whiteSpace: "nowrap"
    }
  }, label);
  const badge = newOrders > 0 && /*#__PURE__*/React.createElement("span", {
    "data-heroui": "Badge",
    style: {
      position: "absolute",
      top: -10,
      right: 10,
      height: 20,
      padding: "0 8px",
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "var(--r-pill)",
      background: "var(--accent)",
      color: "var(--text-on-accent)",
      border: "2px solid var(--bg-app)",
      font: "var(--fw-bold) var(--fs-micro)/1 var(--font-ui)",
      ...TC_NUM,
      whiteSpace: "nowrap",
      zIndex: "var(--z-raised)"
    }
  }, "ออเดอร์ใหม่ " + newOrders);
  const chip = state === "free" ? null : /*#__PURE__*/React.createElement(StatusChip, {
    kind: "table",
    status: calling ? "calling" : state,
    size: "sm"
  });
  const faint = {
    font: "var(--text-small)",
    color: "var(--text-faint)",
    ...TC_NUM,
    whiteSpace: "nowrap"
  };
  const card = kids => /*#__PURE__*/React.createElement(Card, _extends({
    padding: 0,
    onClick: onClick,
    "data-component": "TableCard",
    "data-state": state,
    "data-calling": calling || undefined,
    style: base
  }, rest), kids, badge);
  if (compact) {
    const totalEl = money && /*#__PURE__*/React.createElement("span", {
      style: {
        marginTop: "auto",
        font: "var(--fw-bold) var(--fs-body)/1.3 var(--font-numeric)",
        color: "var(--text-body)",
        ...TC_NUM,
        whiteSpace: "nowrap"
      }
    }, money);
    if (calling || state === "idle") {
      if (compactStatus === "skin") return card(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6
        }
      }, lab, /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), calling && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 8,
          height: 8,
          borderRadius: "var(--r-pill)",
          background: "var(--accent)",
          color: "var(--accent)",
          animation: "lb-pulse 1.6s var(--ease-out) infinite"
        }
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 6,
          marginTop: 4,
          font: "var(--text-small)",
          color: "var(--text-muted)"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, guests), /*#__PURE__*/React.createElement("span", {
        style: faint
      }, time)), totalEl));
      return card(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6
        }
      }, lab, /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: faint
      }, time)), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 4
        }
      }, calling ? /*#__PURE__*/React.createElement(Badge, {
        tone: "accent",
        variant: "solid",
        pulse: true,
        size: "sm"
      }, "\u0E40\u0E23\u0E35\u0E22\u0E01") : /*#__PURE__*/React.createElement(Badge, {
        tone: "new",
        dot: true,
        size: "sm"
      }, "\u0E44\u0E21\u0E48\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27")), totalEl));
    }
    if (state === "open") return card(/*#__PURE__*/React.createElement(React.Fragment, null, lab, /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, chip), /*#__PURE__*/React.createElement("span", {
      style: {
        marginTop: "auto",
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, "\u0E23\u0E2D\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C")));
    if (state === "free") return card(lab);
    return card(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, lab, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), state === "seated" && chip), state !== "seated" && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4
      }
    }, chip), state === "seated" && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 4,
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, guests), /*#__PURE__*/React.createElement("span", {
      style: faint
    }, time)), totalEl));
  }
  const meta = [items != null && items + " รายการ", time].filter(Boolean).join(" · ");
  return card(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, lab, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), chip), state === "open" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 6,
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, "\u0E23\u0E2D\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C"), time && /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: "auto",
      ...faint
    }
  }, "เปิด " + time)), state !== "open" && state !== "free" && /*#__PURE__*/React.createElement(React.Fragment, null, guests && /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 4,
      display: "flex",
      alignItems: "center",
      gap: 6,
      font: "var(--text-small)",
      color: "var(--text-muted)",
      minWidth: 0
    }
  }, Icon && /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, guests)), state === "idle" && idleMin != null && /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 2,
      display: "flex",
      alignItems: "center",
      gap: 6,
      font: "var(--fw-semibold) var(--fs-small)/1.5 var(--font-ui)",
      color: "var(--warning-fg)",
      ...TC_NUM
    }
  }, Icon && /*#__PURE__*/React.createElement(Icon, {
    name: "clock-alert",
    size: 16
  }), "ไม่มีความเคลื่อนไหว " + idleMin + " นาที"), (meta || money) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: faint
  }, meta), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), money && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-price)",
      color: "var(--text-body)",
      ...TC_NUM,
      whiteSpace: "nowrap"
    }
  }, money)))));
}
Object.assign(__ds_scope, { TableCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bar/TableCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const AVS = {
  sm: 24,
  md: 32,
  lg: 40
};
function Avatar({
  src,
  name,
  size = "md",
  status,
  style,
  ...rest
}) {
  const px = typeof size === "number" ? size : AVS[size] || 32;
  const [broken, setBroken] = React.useState(false);
  const initials = name ? name.trim().split(/\s+/).map(w => Array.from(w)[0]).join("").slice(0, 2).toUpperCase() : "?";
  const fs = Math.round(px * .4);
  const statusCol = status === "online" ? "var(--success)" : status === "away" ? "var(--warning)" : "var(--text-faint)";
  const showImg = src && !broken;
  return /*#__PURE__*/React.createElement("span", _extends({
    "data-heroui": "Avatar",
    role: "img",
    "aria-label": name || "",
    style: {
      display: "inline-flex",
      width: px,
      height: px,
      flex: "0 0 auto",
      position: "relative",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: px,
      height: px,
      borderRadius: "50%",
      overflow: "hidden",
      display: "grid",
      placeItems: "center",
      background: showImg ? "var(--surface-raised)" : "var(--accent-soft-strong)",
      color: "var(--text-accent)",
      boxShadow: "inset 0 0 0 1px var(--line)",
      font: "var(--fw-semibold) " + fs + "px/1 var(--font-ui)"
    }
  }, showImg ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    onError: () => setBroken(true),
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials), status && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      bottom: -1,
      right: -1,
      width: Math.max(8, Math.round(px * .3)),
      height: Math.max(8, Math.round(px * .3)),
      borderRadius: "50%",
      border: "2px solid var(--bg-app)",
      background: statusCol
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BADGE_TONES = {
  neutral: {
    bg: "var(--status-neutral-bg)",
    fg: "var(--status-neutral-fg)",
    dot: "var(--text-faint)",
    bd: "var(--status-neutral-border)"
  },
  accent: {
    bg: "var(--accent-soft-strong)",
    fg: "var(--text-accent)",
    dot: "var(--accent)",
    bd: "var(--line-accent-soft)",
    solid: "var(--accent)",
    solidFg: "var(--text-on-accent)"
  },
  new: {
    bg: "var(--status-new-bg)",
    fg: "var(--status-new-fg)",
    dot: "var(--status-new)",
    bd: "var(--status-new-border)"
  },
  making: {
    bg: "var(--status-making-bg)",
    fg: "var(--status-making-fg)",
    dot: "var(--status-making)",
    bd: "var(--status-making-border)"
  },
  served: {
    bg: "var(--status-served-bg)",
    fg: "var(--status-served-fg)",
    dot: "var(--status-served)",
    bd: "var(--status-served-border)"
  },
  void: {
    bg: "var(--status-void-bg)",
    fg: "var(--status-void-fg)",
    dot: "var(--status-void)",
    bd: "var(--status-void-border)"
  },
  bottle: {
    bg: "var(--bottle-keep-bg)",
    fg: "var(--bottle-keep)",
    dot: "var(--bottle-keep)",
    bd: "var(--bottle-keep-border)"
  }
};
BADGE_TONES.success = BADGE_TONES.served;
BADGE_TONES.warning = BADGE_TONES.new;
BADGE_TONES.info = BADGE_TONES.making;
BADGE_TONES.danger = BADGE_TONES.void;
function Badge({
  children,
  tone = "neutral",
  variant = "soft",
  dot = false,
  pulse = false,
  strike = false,
  size = "md",
  style,
  ...rest
}) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  const solid = variant === "solid" && t.solid;
  const bg = solid ? t.solid : variant === "outline" ? "transparent" : t.bg;
  const fg = solid ? t.solidFg : t.fg;
  const dotCol = solid ? t.solidFg : t.dot;
  return /*#__PURE__*/React.createElement("span", _extends({
    "data-heroui": "Chip",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      flex: "0 0 auto",
      padding: size === "sm" ? "2px 8px" : "4px 10px",
      background: bg,
      color: fg,
      borderRadius: "var(--r-pill)",
      border: "1px solid " + (variant === "outline" ? t.bd : "transparent"),
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
      font: "var(--fw-semibold) var(--fs-micro)/1.4 var(--font-ui)",
      textDecoration: strike ? "line-through" : "none",
      ...style
    }
  }, rest), (dot || pulse) && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: dotCol,
      color: dotCol,
      flex: "0 0 auto",
      animation: pulse ? "lb-pulse 1.6s var(--ease-out) infinite" : "none"
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BTN_TONES = {
  primary: {
    bg: "var(--accent)",
    fg: "var(--text-on-accent)",
    bd: "transparent",
    hover: "var(--accent-hover)",
    press: "var(--accent-press)"
  },
  secondary: {
    bg: "var(--surface-raised)",
    fg: "var(--text-body)",
    bd: "var(--line)",
    hover: "var(--surface-hover)",
    press: "var(--surface-press)"
  },
  ghost: {
    bg: "transparent",
    fg: "var(--text-muted)",
    bd: "transparent",
    hover: "var(--surface-raised)",
    press: "var(--surface-press)"
  },
  danger: {
    bg: "var(--danger-bg)",
    fg: "var(--danger-fg)",
    bd: "var(--danger-border)",
    hover: "var(--danger-bg-hover)",
    press: "var(--danger-bg)"
  }
};
const BTN_SIZES = {
  sm: {
    h: 36,
    px: 12,
    font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)",
    gap: 6,
    icon: 16
  },
  md: {
    h: 44,
    px: 16,
    font: "var(--fw-semibold) var(--fs-body)/1 var(--font-ui)",
    gap: 8,
    icon: 20
  },
  lg: {
    h: 52,
    px: 20,
    font: "var(--fw-bold) var(--fs-subhead)/1 var(--font-ui)",
    gap: 10,
    icon: 20
  }
};
function useLBInteract(force) {
  const [s, set] = React.useState({
    h: false,
    p: false,
    f: false
  });
  const on = {
    onMouseEnter: () => set(x => ({
      ...x,
      h: true
    })),
    onMouseLeave: () => set(x => ({
      ...x,
      h: false,
      p: false
    })),
    onMouseDown: () => set(x => ({
      ...x,
      p: true
    })),
    onMouseUp: () => set(x => ({
      ...x,
      p: false
    })),
    onFocus: e => set(x => ({
      ...x,
      f: e.target.matches(":focus-visible")
    })),
    onBlur: () => set(x => ({
      ...x,
      f: false
    }))
  };
  return [{
    hover: force === "hover" || s.h,
    press: force === "pressed" || s.p,
    focus: force === "focus" || s.f
  }, on];
}
const lbNode = (n, size) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return typeof n === "string" && NS.Icon ? React.createElement(NS.Icon, {
    name: n,
    size
  }) : n;
};
function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  isDisabled,
  loading = false,
  isPending,
  iconLeft,
  iconRight,
  onClick,
  onPress,
  forceState,
  style,
  ...rest
}) {
  const off = disabled || isDisabled;
  const pending = loading || isPending;
  const [st, on] = useLBInteract(forceState);
  const t = BTN_TONES[variant] || BTN_TONES.primary;
  const s = BTN_SIZES[size] || BTN_SIZES.md;
  const live = !off && !pending;
  const bg = off ? "var(--surface-raised)" : st.press && live ? t.press : st.hover && live ? t.hover : t.bg;
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const shadows = [variant === "primary" && !off ? "var(--highlight-top)" : null, st.focus ? "var(--glow-focus)" : null].filter(Boolean).join(",") || "none";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "data-heroui": "Button",
    disabled: off,
    "aria-busy": pending || undefined,
    "aria-disabled": off || pending || undefined,
    "data-hovered": st.hover || undefined,
    "data-pressed": st.press || undefined,
    "data-focus-visible": st.focus || undefined,
    "data-pending": pending || undefined,
    onClick: live ? onPress || onClick : undefined
  }, on, {
    style: {
      display: block ? "flex" : "inline-flex",
      width: block ? "100%" : "auto",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.h,
      padding: `0 ${s.px}px`,
      font: s.font,
      whiteSpace: "nowrap",
      background: bg,
      color: off ? "var(--text-faint)" : t.fg,
      border: `1px solid ${off ? "var(--line-hairline)" : t.bd}`,
      borderRadius: "var(--r-btn)",
      cursor: off ? "not-allowed" : pending ? "progress" : "pointer",
      outline: "none",
      transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
      transform: st.press && live ? "scale(var(--press-scale))" : "none",
      boxShadow: shadows,
      ...style
    }
  }, rest), pending && NS.Spinner ? React.createElement(NS.Spinner, {
    size: "sm"
  }) : lbNode(iconLeft, s.icon), children, !pending && lbNode(iconRight, s.icon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CARD_TONES = {
  default: {
    bg: "var(--surface-card)",
    bd: "var(--line)"
  },
  raised: {
    bg: "var(--surface-raised)",
    bd: "var(--line)"
  },
  accent: {
    bg: "var(--accent-soft)",
    bd: "var(--line-accent-soft)"
  },
  flat: {
    bg: "transparent",
    bd: "var(--line-hairline)"
  }
};
function Card({
  children,
  padding = "var(--card-pad)",
  tone = "default",
  interactive = false,
  selected = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const t = CARD_TONES[tone] || CARD_TONES.default;
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-heroui": "Card",
    onClick: onClick,
    tabIndex: interactive ? 0 : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      background: interactive && press ? "var(--surface-press)" : interactive && hover ? "var(--surface-hover)" : t.bg,
      border: `${selected ? "var(--border-w-strong)" : "var(--border-w)"} solid ${selected ? "var(--line-accent)" : t.bd}`,
      borderRadius: "var(--r-card)",
      padding,
      boxShadow: "var(--shadow-card), var(--highlight-top)",
      cursor: interactive ? "pointer" : "default",
      transition: "background var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24
};
const LUCIDE_VERSION = "0.468.0";
function Icon({
  name,
  size = "md",
  color = "currentColor",
  label,
  style,
  ...rest
}) {
  const px = typeof size === "number" ? size <= 17 ? 16 : size <= 21 ? 20 : 24 : ICON_SIZES[size] || 20;
  const ref = React.useRef(null);
  React.useEffect(() => {
    let t;
    const draw = () => {
      const el = ref.current;
      if (!el) return;
      if (!window.lucide) {
        t = setTimeout(draw, 120);
        return;
      }
      el.innerHTML = '<i data-lucide="' + name + '"></i>';
      window.lucide.createIcons({
        icons: window.lucide.icons,
        nameAttr: "data-lucide",
        root: el
      });
      const svg = el.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", px);
        svg.setAttribute("height", px);
        svg.setAttribute("stroke-width", "1.75");
        svg.style.display = "block";
      }
    };
    draw();
    return () => clearTimeout(t);
  }, [name, px]);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    "data-icon": name,
    role: label ? "img" : undefined,
    "aria-label": label,
    "aria-hidden": label ? undefined : true,
    style: {
      display: "inline-flex",
      width: px,
      height: px,
      color,
      flex: "0 0 auto",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { LUCIDE_VERSION, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const IB_SIZES = {
  sm: 36,
  md: 44,
  lg: 52
};
function useLBInteract(force) {
  const [s, set] = React.useState({
    h: false,
    p: false,
    f: false
  });
  const on = {
    onMouseEnter: () => set(x => ({
      ...x,
      h: true
    })),
    onMouseLeave: () => set(x => ({
      ...x,
      h: false,
      p: false
    })),
    onMouseDown: () => set(x => ({
      ...x,
      p: true
    })),
    onMouseUp: () => set(x => ({
      ...x,
      p: false
    })),
    onFocus: e => set(x => ({
      ...x,
      f: e.target.matches(":focus-visible")
    })),
    onBlur: () => set(x => ({
      ...x,
      f: false
    }))
  };
  return [{
    hover: force === "hover" || s.h,
    press: force === "pressed" || s.p,
    focus: force === "focus" || s.f
  }, on];
}
function IconButton({
  icon,
  label,
  size = "md",
  variant = "ghost",
  onClick,
  onPress,
  active = false,
  disabled = false,
  isDisabled,
  loading = false,
  isPending,
  forceState,
  style,
  ...rest
}) {
  const off = disabled || isDisabled,
    pending = loading || isPending,
    live = !off && !pending;
  const [st, on] = useLBInteract(forceState);
  const px = typeof size === "number" ? size : IB_SIZES[size] || 44;
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const base = variant === "solid" ? "var(--surface-raised)" : "transparent";
  const bg = off ? variant === "solid" ? "var(--surface-raised)" : "transparent" : active ? "var(--accent-soft)" : st.press && live ? "var(--surface-press)" : st.hover && live ? "var(--surface-hover)" : base;
  const ico = typeof icon === "string" && NS.Icon ? React.createElement(NS.Icon, {
    name: icon,
    size: px >= 52 ? 24 : 20
  }) : icon;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "data-heroui": "Button",
    "aria-label": label,
    disabled: off,
    "aria-busy": pending || undefined,
    "aria-pressed": active || undefined,
    "data-hovered": st.hover || undefined,
    "data-pressed": st.press || undefined,
    "data-focus-visible": st.focus || undefined,
    onClick: live ? onPress || onClick : undefined
  }, on, {
    style: {
      width: px,
      height: px,
      display: "inline-grid",
      placeItems: "center",
      flex: "0 0 auto",
      background: bg,
      outline: "none",
      color: off ? "var(--text-faint)" : active ? "var(--text-accent)" : st.hover ? "var(--text-body)" : "var(--text-muted)",
      border: variant === "solid" ? "1px solid var(--line)" : "1px solid transparent",
      borderRadius: "var(--r-btn)",
      cursor: off ? "not-allowed" : pending ? "progress" : "pointer",
      transform: st.press && live ? "scale(var(--press-scale))" : "none",
      boxShadow: st.focus ? "var(--glow-focus)" : "none",
      transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-out)",
      ...style
    }
  }, rest), pending && NS.Spinner ? React.createElement(NS.Spinner, {
    size: "sm"
  }) : ico);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SPIN_SIZES = {
  sm: 16,
  md: 20,
  lg: 24
};
function Spinner({
  size = "md",
  color = "currentColor",
  label = "กำลังโหลด",
  style,
  ...rest
}) {
  const px = typeof size === "number" ? size : SPIN_SIZES[size] || 20;
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "status",
    "aria-label": label,
    "data-heroui": "Spinner",
    style: {
      display: "inline-block",
      width: px,
      height: px,
      flex: "0 0 auto",
      borderRadius: "50%",
      color,
      border: (px >= 24 ? 2.5 : 2) + "px solid color-mix(in oklab, currentColor 25%, transparent)",
      borderTopColor: "currentColor",
      animation: "lb-spin 700ms linear infinite",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusChip.jsx
try { (() => {
const STATUS_SETS = {
  order: {
    pending: ["ใหม่", "new"],
    accepted: ["กำลังทำ", "making"],
    ready: ["พร้อมเสิร์ฟ", "served"],
    sent: ["เสิร์ฟแล้ว", "neutral"],
    issue: ["มีปัญหา", "void"]
  },
  item: {
    waiting: ["รอ", "neutral"],
    making: ["กำลังทำ", "making"],
    ready: ["พร้อม", "served"],
    cancelled: ["ยกเลิก", "neutral", {
      strike: true,
      dot: false
    }]
  },
  table: {
    free: ["ว่าง", "neutral"],
    open: ["เปิดแล้ว", "accent"],
    seated: ["มีแขก", "served"],
    idle: ["ไม่มีความเคลื่อนไหว", "new"],
    closed: ["ปิดโต๊ะ", "neutral"],
    abandoned: ["ทิ้งโต๊ะ", "void"],
    calling: ["เรียกพนักงาน", "accent", {
      variant: "solid",
      pulse: true
    }]
  },
  payment: {
    pending: ["รอชำระ", "new"],
    completed: ["ชำระแล้ว", "served"],
    failed: ["ไม่สำเร็จ", "void"],
    cancelled: ["ยกเลิกแล้ว", "neutral"],
    paid: ["ชำระแล้ว", "served"],
    refunded: ["คืนเงินแล้ว", "making"]
  },
  bottle: {
    active: ["ฝากอยู่", "bottle"],
    empty: ["หมดขวด", "neutral"],
    expired: ["หมดอายุ", "void"]
  },
  menu: {
    soldout: ["หมด", "void"]
  }
};
const STATUS_CHIP_SETS = STATUS_SETS;
function StatusChip({
  kind = "order",
  status,
  label,
  size = "md",
  dot = true,
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const row = (STATUS_SETS[kind] || {})[status] || ["—", "neutral"];
  const extra = row[2] || {};
  if (!NS.Badge) return null;
  return React.createElement(NS.Badge, {
    tone: row[1],
    dot: extra.dot === false ? false : dot,
    size,
    "data-status-kind": kind,
    "data-status": status,
    ...extra,
    style,
    ...rest
  }, label || row[0]);
}
Object.assign(__ds_scope, { STATUS_CHIP_SETS, StatusChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusChip.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useLBInteract(force) {
  const [s, set] = React.useState({
    h: false,
    p: false,
    f: false
  });
  const on = {
    onMouseEnter: () => set(x => ({
      ...x,
      h: true
    })),
    onMouseLeave: () => set(x => ({
      ...x,
      h: false,
      p: false
    })),
    onMouseDown: () => set(x => ({
      ...x,
      p: true
    })),
    onMouseUp: () => set(x => ({
      ...x,
      p: false
    })),
    onFocus: e => set(x => ({
      ...x,
      f: e.target.matches(":focus-visible")
    })),
    onBlur: () => set(x => ({
      ...x,
      f: false
    }))
  };
  return [{
    hover: force === "hover" || s.h,
    press: force === "pressed" || s.p,
    focus: force === "focus" || s.f
  }, on];
}
function Tag({
  children,
  selected = false,
  isSelected,
  count,
  disabled = false,
  isDisabled,
  onClick,
  onPress,
  forceState,
  style,
  ...rest
}) {
  const sel = selected || isSelected,
    off = disabled || isDisabled;
  const [st, on] = useLBInteract(forceState);
  const bg = off ? "var(--surface-raised)" : sel ? st.press ? "var(--accent-press)" : st.hover ? "var(--accent-hover)" : "var(--accent)" : st.press ? "var(--surface-press)" : st.hover ? "var(--surface-hover)" : "var(--surface-raised)";
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "data-heroui": "Tag",
    disabled: off,
    "aria-pressed": sel,
    "data-selected": sel || undefined,
    "data-hovered": st.hover || undefined,
    "data-pressed": st.press || undefined,
    "data-focus-visible": st.focus || undefined,
    onClick: off ? undefined : onPress || onClick
  }, on, {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 36,
      padding: "0 14px",
      borderRadius: "var(--r-pill)",
      background: bg,
      outline: "none",
      color: off ? "var(--text-faint)" : sel ? "var(--text-on-accent)" : st.hover ? "var(--text-body)" : "var(--text-muted)",
      border: `1px solid ${sel && !off ? "transparent" : off ? "var(--line-hairline)" : "var(--line)"}`,
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)",
      cursor: off ? "not-allowed" : "pointer",
      whiteSpace: "nowrap",
      transform: st.press && !off ? "scale(var(--press-scale))" : "none",
      boxShadow: st.focus ? "var(--glow-focus)" : "none",
      transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-out)",
      ...style
    }
  }, rest), children, count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: "tabular-nums",
      opacity: sel ? 1 : .85
    }
  }, count));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 16) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function LBTh({
  c,
  sort,
  onSort,
  first
}) {
  const [h, setH] = React.useState(false);
  const active = sort && sort.column === c.key;
  const icon = active ? sort.direction === "descending" ? "arrow-down" : "arrow-up" : "arrow-up-down";
  const next = () => onSort && onSort({
    column: c.key,
    direction: active && sort.direction === "ascending" ? "descending" : "ascending"
  });
  return /*#__PURE__*/React.createElement("th", {
    "aria-sort": active ? sort.direction : c.sortable ? "none" : undefined,
    style: {
      padding: first ? "0 16px 0 16px" : "0 16px",
      height: 40,
      textAlign: c.align || "left",
      width: c.width,
      font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-ui)",
      color: active ? "var(--text-body)" : "var(--text-faint)",
      borderBottom: "1px solid var(--line)",
      whiteSpace: "nowrap",
      position: "sticky",
      top: 0,
      zIndex: "var(--z-raised)",
      background: h && c.sortable ? "var(--surface-raised)" : "var(--bg-sunken)"
    }
  }, c.sortable ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: next,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
      font: "inherit",
      color: "inherit",
      flexDirection: c.align === "right" ? "row-reverse" : "row"
    }
  }, c.label, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: active ? "var(--text-accent)" : "var(--text-faint)",
      opacity: active || h ? 1 : .6
    }
  }, lbIco(icon))) : c.label);
}
function LBPageBtn({
  children,
  on,
  disabled,
  onClick,
  label
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    "aria-current": on ? "page" : undefined,
    disabled: disabled,
    onClick: onClick,
    style: {
      minWidth: 32,
      height: 32,
      padding: "0 6px",
      display: "grid",
      placeItems: "center",
      borderRadius: "var(--r-sm)",
      cursor: disabled ? "not-allowed" : "pointer",
      background: on ? "var(--accent-soft-strong)" : "transparent",
      border: "1px solid " + (on ? "var(--line-accent-soft)" : "transparent"),
      color: disabled ? "var(--text-faint)" : on ? "var(--text-accent)" : "var(--text-muted)",
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)",
      fontVariantNumeric: "tabular-nums"
    }
  }, children);
}
function DataTable({
  columns = [],
  rows = [],
  rowKey = "id",
  loading = false,
  emptyContent = null,
  onRowClick,
  sortDescriptor,
  onSortChange,
  selectionMode = "none",
  selectedKeys,
  onSelectionChange,
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  forceHoverKey,
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const [hovered, setHovered] = React.useState(-1);
  const sel = new Set(selectedKeys ? Array.from(selectedKeys) : []);
  const multi = selectionMode === "multiple",
    selectable = selectionMode !== "none";
  const keyOf = (r, i) => r[rowKey] ?? i;
  const toggle = k => {
    if (!onSelectionChange) return;
    const n = new Set(selectionMode === "single" ? [] : sel);
    if (sel.has(k)) n.delete(k);else n.add(k);
    onSelectionChange(n);
  };
  const allOn = rows.length > 0 && rows.every((r, i) => sel.has(keyOf(r, i))),
    someOn = !allOn && rows.some((r, i) => sel.has(keyOf(r, i)));
  const Check = NS.Checkbox ? p => React.createElement(NS.Checkbox, p) : () => null;
  const cols = columns.length + (multi ? 1 : 0);
  const thead = /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, multi && /*#__PURE__*/React.createElement("th", {
    style: {
      width: 48,
      padding: "0 0 0 16px",
      borderBottom: "1px solid var(--line)",
      background: "var(--bg-sunken)",
      position: "sticky",
      top: 0,
      zIndex: "var(--z-raised)"
    }
  }, /*#__PURE__*/React.createElement(Check, {
    isSelected: allOn,
    isIndeterminate: someOn,
    onChange: v => onSelectionChange && onSelectionChange(new Set(v ? rows.map(keyOf) : []))
  })), columns.map((c, i) => /*#__PURE__*/React.createElement(LBTh, {
    key: c.key || i,
    c: c,
    first: i === 0,
    sort: sortDescriptor,
    onSort: onSortChange
  }))));
  let body;
  if (loading) body = [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("tr", {
    key: n,
    style: {
      borderBottom: "1px solid var(--line-hairline)"
    }
  }, multi && /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "0 0 0 16px"
    }
  }), columns.map((c, i) => /*#__PURE__*/React.createElement("td", {
    key: i,
    style: {
      padding: "15px 16px",
      textAlign: c.align || "left"
    }
  }, NS.Skeleton && React.createElement(NS.Skeleton, {
    height: 13,
    width: i === 0 ? "55%" : i === 1 ? "35%" : "40%",
    style: {
      display: "inline-block",
      verticalAlign: "middle"
    }
  })))));else if (!rows.length) body = /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: cols,
    style: {
      padding: "32px 20px",
      textAlign: "center"
    }
  }, emptyContent || NS.EmptyState && React.createElement(NS.EmptyState, {
    variant: "empty"
  })));else body = rows.map((row, ri) => {
    const k = keyOf(row, ri),
      on = sel.has(k),
      hov = ri === hovered && (onRowClick || selectable) || k === forceHoverKey;
    return /*#__PURE__*/React.createElement("tr", {
      key: k,
      "aria-selected": selectable ? on : undefined,
      onMouseEnter: () => setHovered(ri),
      onMouseLeave: () => setHovered(-1),
      onClick: () => {
        if (selectable) toggle(k);
        onRowClick && onRowClick(row);
      },
      style: {
        borderBottom: "1px solid var(--line-hairline)",
        cursor: onRowClick || selectable ? "pointer" : "default",
        background: on ? "var(--accent-soft)" : hov ? "var(--surface-hover)" : "transparent",
        boxShadow: on ? "inset 2px 0 0 var(--accent)" : "none",
        transition: "background var(--dur-fast) var(--ease-out)"
      }
    }, multi && /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "0 0 0 16px"
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement(Check, {
      isSelected: on,
      onChange: () => toggle(k)
    })), columns.map((c, ci) => /*#__PURE__*/React.createElement("td", {
      key: ci,
      style: {
        padding: "13px 16px",
        font: "var(--text-body-md)",
        color: "var(--text-body)",
        textAlign: c.align || "left",
        fontVariantNumeric: c.numeric ? "tabular-nums" : "normal",
        whiteSpace: c.numeric ? "nowrap" : "normal"
      }
    }, c.render ? c.render(row[c.key], row) : row[c.key])));
  });
  const pages = pageCount ? Array.from({
    length: pageCount
  }, (_, i) => i + 1).filter(p => p === 1 || p === pageCount || Math.abs(p - page) <= 1) : [];
  const from = page && pageSize ? (page - 1) * pageSize + 1 : null,
    to = from ? Math.min(page * pageSize, total || page * pageSize) : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-heroui": "Table",
    style: {
      borderRadius: "var(--r-card)",
      border: "1px solid var(--line)",
      overflow: "hidden",
      background: "var(--surface-card)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, thead, /*#__PURE__*/React.createElement("tbody", null, body))), pageCount > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px 8px 16px",
      borderTop: "1px solid var(--line)",
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: "var(--text-small)",
      color: "var(--text-faint)",
      fontVariantNumeric: "tabular-nums"
    }
  }, from && total ? `แสดง ${from}–${to} จาก ${total}` : ""), /*#__PURE__*/React.createElement(LBPageBtn, {
    label: "\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
    disabled: page <= 1,
    onClick: () => onPageChange && onPageChange(page - 1)
  }, lbIco("chevron-left")), pages.map((p, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: p
  }, i > 0 && p - pages[i - 1] > 1 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      font: "var(--text-small)"
    }
  }, "\u2026"), /*#__PURE__*/React.createElement(LBPageBtn, {
    on: p === page,
    onClick: () => onPageChange && onPageChange(p)
  }, p))), /*#__PURE__*/React.createElement(LBPageBtn, {
    label: "\u0E16\u0E31\u0E14\u0E44\u0E1B",
    disabled: page >= pageCount,
    onClick: () => onPageChange && onPageChange(page + 1)
  }, lbIco("chevron-right"))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 20) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
const ATONES = {
  info: {
    bg: "var(--info-bg)",
    bd: "var(--status-making-border)",
    fg: "var(--info-fg)",
    icon: "info"
  },
  success: {
    bg: "var(--success-bg)",
    bd: "var(--status-served-border)",
    fg: "var(--success-fg)",
    icon: "circle-check"
  },
  warning: {
    bg: "var(--warning-bg)",
    bd: "var(--status-new-border)",
    fg: "var(--warning-fg)",
    icon: "triangle-alert"
  },
  danger: {
    bg: "var(--danger-bg)",
    bd: "var(--danger-border)",
    fg: "var(--text-danger)",
    icon: "circle-alert"
  }
};
function Alert({
  title,
  children,
  tone = "info",
  icon,
  action,
  onClose,
  style,
  ...rest
}) {
  const t = ATONES[tone] || ATONES.info;
  const ico = icon === false ? null : icon && typeof icon !== "string" ? icon : lbIco(icon || t.icon);
  return /*#__PURE__*/React.createElement("div", _extends({
    role: tone === "danger" || tone === "warning" ? "alert" : "status",
    "data-heroui": "Alert",
    "data-tone": tone,
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "12px 12px 12px 14px",
      background: t.bg,
      border: "1px solid " + t.bd,
      borderRadius: "var(--r-card)",
      ...style
    }
  }, rest), ico && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.fg,
      flex: "0 0 auto",
      marginTop: 2,
      display: "inline-flex"
    }
  }, ico), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)",
      color: t.fg
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-body)",
      marginTop: title ? 2 : 3
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      gap: 8
    }
  }, action)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u0E1B\u0E34\u0E14",
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      margin: "-4px -4px 0 0",
      display: "grid",
      placeItems: "center",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "var(--text-muted)",
      borderRadius: "var(--r-xs)",
      flex: "0 0 auto"
    }
  }, lbIco("x", 16)));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 24) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function Dialog({
  open = true,
  isOpen,
  title,
  children,
  actions,
  onClose,
  variant = "center",
  tone = "default",
  icon,
  isDismissable = true,
  style,
  ...rest
}) {
  const shown = isOpen != null ? isOpen : open;
  React.useEffect(() => {
    if (!shown || !onClose || !isDismissable) return;
    const h = e => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [shown, onClose, isDismissable]);
  if (!shown) return null;
  const sheet = variant === "sheet",
    danger = tone === "danger";
  const ico = icon === false ? null : icon ? typeof icon === "string" ? lbIco(icon) : icon : danger ? lbIco("triangle-alert") : null;
  return /*#__PURE__*/React.createElement("div", {
    "data-heroui": sheet ? "Drawer" : danger ? "AlertDialog" : "Modal",
    style: {
      position: "absolute",
      inset: 0,
      zIndex: "var(--z-scrim)",
      display: "flex",
      alignItems: sheet ? "flex-end" : "center",
      justifyContent: "center",
      background: "var(--scrim)",
      backdropFilter: "var(--blur-overlay)"
    },
    onClick: isDismissable ? onClose : undefined
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: danger ? "alertdialog" : "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      position: "relative",
      zIndex: "var(--z-dialog)",
      width: sheet ? "100%" : "min(420px, calc(100% - 32px))",
      background: "var(--surface-overlay)",
      border: "1px solid var(--line)",
      borderRadius: sheet ? "var(--r-sheet) var(--r-sheet) 0 0" : "var(--r-card-lg)",
      boxShadow: sheet ? "var(--shadow-sheet)" : "var(--shadow-dialog)",
      padding: "var(--card-pad-lg)",
      paddingBottom: sheet ? "calc(var(--card-pad-lg) + 8px)" : "var(--card-pad-lg)",
      ...style
    }
  }, rest), sheet && /*#__PURE__*/React.createElement("div", {
    style: {
      width: "var(--sheet-grab)",
      height: 4,
      borderRadius: 999,
      background: "var(--line-strong)",
      margin: "-6px auto 14px"
    }
  }), ico && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      marginBottom: 14,
      background: danger ? "var(--danger-bg)" : "var(--accent-soft)",
      color: danger ? "var(--text-danger)" : "var(--text-accent)"
    }
  }, ico), title && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-heading)",
      color: "var(--text-body)",
      marginBottom: 8
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-md)",
      color: "var(--text-muted)"
    }
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 20,
      justifyContent: "flex-end"
    }
  }, actions)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 24) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
const ES_DEFAULTS = {
  empty: {
    icon: "inbox",
    title: "ยังไม่มีข้อมูล"
  },
  noresult: {
    icon: "search-x",
    title: "ไม่พบผลการค้นหา"
  },
  loading: {
    title: "กำลังโหลด"
  },
  error: {
    icon: "circle-alert",
    title: "เกิดข้อผิดพลาด",
    description: "โหลดข้อมูลไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
  }
};
function EmptyState({
  variant = "empty",
  icon,
  title,
  description,
  action,
  onRetry,
  retryLabel = "ลองอีกครั้ง",
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const d = ES_DEFAULTS[variant] || ES_DEFAULTS.empty;
  const err = variant === "error";
  const ico = variant === "loading" ? NS.Spinner ? React.createElement(NS.Spinner, {
    size: "lg",
    color: "var(--text-accent)"
  }) : null : icon === false ? null : icon && typeof icon !== "string" ? icon : lbIco(icon || d.icon);
  const act = action || (err && onRetry && NS.Button ? React.createElement(NS.Button, {
    variant: "secondary",
    size: "sm",
    iconLeft: "rotate-cw",
    onPress: onRetry
  }, retryLabel) : null);
  return /*#__PURE__*/React.createElement("div", _extends({
    role: err ? "alert" : variant === "loading" ? "status" : undefined,
    "data-variant": variant,
    style: {
      display: "grid",
      justifyItems: "center",
      gap: 8,
      padding: "40px 24px",
      textAlign: "center",
      ...style
    }
  }, rest), ico && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      marginBottom: 4,
      background: err ? "var(--danger-bg)" : "var(--surface-raised)",
      color: err ? "var(--text-danger)" : "var(--text-faint)"
    }
  }, ico), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-subhead)",
      color: "var(--text-body)"
    }
  }, title || d.title), (description || d.description) && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)",
      maxWidth: 280
    }
  }, description || d.description), act && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, act));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function LBSk({
  width,
  height = 16,
  radius,
  circle,
  rounded,
  style
}) {
  const r = circle ? "50%" : rounded ? "var(--r-pill)" : radius ?? "var(--r-xs)";
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "block",
      width: circle ? height : width || "100%",
      height,
      borderRadius: r,
      flex: "0 0 auto",
      background: "var(--surface-raised)",
      backgroundImage: "linear-gradient(90deg,var(--surface-raised) 0%,var(--surface-hover) 40%,var(--surface-raised) 100%)",
      backgroundSize: "200% 100%",
      animation: "sk-shimmer 1.5s ease-in-out infinite",
      ...style
    }
  });
}
function Skeleton({
  variant,
  width,
  height = 16,
  radius,
  circle = false,
  rounded = false,
  style,
  ...rest
}) {
  const shell = {
    background: "var(--surface-card)",
    border: "1px solid var(--line)",
    borderRadius: "var(--r-card)"
  };
  let body;
  if (variant === "row") body = /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderBottom: "1px solid var(--line-hairline)",
      ...style
    }
  }, /*#__PURE__*/React.createElement(LBSk, {
    circle: true,
    height: 32
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "grid",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(LBSk, {
    width: "45%",
    height: 13
  }), /*#__PURE__*/React.createElement(LBSk, {
    width: "28%",
    height: 11
  })), /*#__PURE__*/React.createElement(LBSk, {
    width: 56,
    height: 13
  }));else if (variant === "card") body = /*#__PURE__*/React.createElement("div", {
    style: {
      ...shell,
      padding: 16,
      display: "flex",
      gap: 12,
      alignItems: "center",
      ...style
    }
  }, /*#__PURE__*/React.createElement(LBSk, {
    width: 72,
    height: 72,
    radius: "var(--r-sm)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "grid",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(LBSk, {
    width: "60%",
    height: 15
  }), /*#__PURE__*/React.createElement(LBSk, {
    width: "35%",
    height: 12
  }), /*#__PURE__*/React.createElement(LBSk, {
    width: 64,
    height: 17
  })));else if (variant === "tile") body = /*#__PURE__*/React.createElement("div", {
    style: {
      ...shell,
      padding: 14,
      minHeight: 96,
      display: "grid",
      gap: 8,
      alignContent: "start",
      ...style
    }
  }, /*#__PURE__*/React.createElement(LBSk, {
    width: 48,
    height: 20
  }), /*#__PURE__*/React.createElement(LBSk, {
    width: 72,
    height: 20,
    rounded: true
  }), /*#__PURE__*/React.createElement(LBSk, {
    width: 56,
    height: 13,
    style: {
      marginTop: 8
    }
  }));else body = /*#__PURE__*/React.createElement(LBSk, {
    width: width,
    height: height,
    radius: radius,
    circle: circle,
    rounded: rounded,
    style: style
  });
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-heroui": "Skeleton",
    role: "presentation",
    "aria-busy": "true",
    style: {
      display: variant ? "block" : "contents"
    }
  }, rest), body);
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 20) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
const TTONES = {
  success: {
    rule: "var(--success)",
    fg: "var(--success-fg)",
    icon: "circle-check"
  },
  error: {
    rule: "var(--danger)",
    fg: "var(--text-danger)",
    icon: "circle-x"
  },
  warning: {
    rule: "var(--warning)",
    fg: "var(--warning-fg)",
    icon: "triangle-alert"
  },
  info: {
    rule: "var(--info)",
    fg: "var(--info-fg)",
    icon: "info"
  }
};
TTONES.danger = TTONES.error;
function Toast({
  title,
  children,
  tone = "success",
  icon,
  action,
  onClose,
  duration = 4000,
  style,
  ...rest
}) {
  const t = TTONES[tone] || TTONES.info;
  React.useEffect(() => {
    if (!duration || !onClose) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);
  const act = action && action.label ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: action.onPress,
    style: {
      height: 32,
      padding: "0 10px",
      background: "transparent",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-sm)",
      cursor: "pointer",
      color: "var(--text-accent)",
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)",
      whiteSpace: "nowrap"
    }
  }, action.label) : action;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: tone === "error" || tone === "danger" ? "alert" : "status",
    "data-heroui": "Toast",
    "data-tone": tone,
    style: {
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 10px 12px 14px",
      width: "100%",
      maxWidth: 380,
      background: "var(--surface-overlay)",
      border: "1px solid var(--line)",
      borderLeft: `3px solid ${t.rule}`,
      borderRadius: "var(--r-btn)",
      boxShadow: "var(--shadow-raised)",
      color: "var(--text-body)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.fg,
      display: "inline-flex",
      flex: "0 0 auto"
    }
  }, icon && typeof icon !== "string" ? icon : lbIco(icon || t.icon)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-body-strong)"
    }
  }, title), children && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: title ? "var(--text-small)" : "var(--text-body-md)",
      color: title ? "var(--text-muted)" : "var(--text-body)",
      fontVariantNumeric: "tabular-nums"
    }
  }, children)), act, onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u0E1B\u0E34\u0E14",
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      display: "grid",
      placeItems: "center",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "var(--text-faint)",
      borderRadius: "var(--r-xs)",
      flex: "0 0 auto"
    }
  }, lbIco("x", 16)), duration > 0 && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      background: t.rule,
      opacity: .5,
      transformOrigin: "left",
      animation: `lb-toast-bar ${duration}ms linear forwards`
    }
  }));
}
function ToastRegion({
  placement = "top-right",
  children,
  style,
  ...rest
}) {
  const pos = placement === "top" ? {
    top: 12,
    left: 12,
    right: 12,
    alignItems: "center"
  } : placement === "bottom" ? {
    bottom: 84,
    left: 12,
    right: 12,
    alignItems: "center"
  } : {
    top: 16,
    right: 16,
    alignItems: "flex-end",
    width: 380
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    "aria-live": "polite",
    "data-heroui": "ToastProvider",
    "data-placement": placement,
    style: {
      position: "absolute",
      zIndex: "var(--z-toast)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      pointerEvents: "none",
      ...pos,
      ...style
    }
  }, rest), React.Children.map(children, c => c && /*#__PURE__*/React.createElement("div", {
    style: {
      pointerEvents: "auto",
      width: "100%",
      display: "flex",
      justifyContent: placement === "top-right" ? "flex-end" : "center"
    }
  }, c)));
}
Object.assign(__ds_scope, { Toast, ToastRegion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tooltip({
  label,
  children,
  placement = "top",
  isOpen,
  delay = 400,
  style,
  ...rest
}) {
  const [showS, setShow] = React.useState(false);
  const tm = React.useRef();
  const show = isOpen != null ? isOpen : showS;
  const pos = placement === "bottom" ? {
    top: "calc(100% + 6px)"
  } : {
    bottom: "calc(100% + 6px)"
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    },
    onMouseEnter: () => {
      tm.current = setTimeout(() => setShow(true), delay);
    },
    onMouseLeave: () => {
      clearTimeout(tm.current);
      setShow(false);
    },
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, rest), children, show && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    "data-heroui": "Tooltip",
    style: {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      ...pos,
      whiteSpace: "nowrap",
      padding: "6px 9px",
      background: "var(--surface-overlay)",
      border: "1px solid var(--line-strong)",
      borderRadius: "var(--r-xs)",
      font: "var(--text-small)",
      color: "var(--text-body)",
      boxShadow: "var(--shadow-raised)",
      zIndex: "var(--z-dropdown)",
      pointerEvents: "none"
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 16) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function useLBInteract(force) {
  const [s, set] = React.useState({
    h: false,
    p: false,
    f: false
  });
  const on = {
    onMouseEnter: () => set(x => ({
      ...x,
      h: true
    })),
    onMouseLeave: () => set(x => ({
      ...x,
      h: false,
      p: false
    })),
    onMouseDown: () => set(x => ({
      ...x,
      p: true
    })),
    onMouseUp: () => set(x => ({
      ...x,
      p: false
    }))
  };
  const f = {
    onFocus: e => set(x => ({
      ...x,
      f: e.target.matches(":focus-visible")
    })),
    onBlur: () => set(x => ({
      ...x,
      f: false
    }))
  };
  return [{
    hover: force === "hover" || s.h,
    press: force === "pressed" || s.p,
    focus: force === "focus" || s.f
  }, on, f];
}
function Checkbox({
  checked = false,
  isSelected,
  indeterminate = false,
  isIndeterminate,
  onChange,
  label,
  description,
  disabled = false,
  isDisabled,
  isInvalid,
  forceState,
  style,
  ...rest
}) {
  const on_ = isSelected != null ? isSelected : checked,
    mixed = indeterminate || isIndeterminate,
    off = disabled || isDisabled;
  const [st, on, f] = useLBInteract(forceState);
  const filled = (on_ || mixed) && !off;
  const bg = off ? on_ || mixed ? "var(--surface-hover)" : "var(--surface-raised)" : filled ? st.press ? "var(--accent-press)" : st.hover ? "var(--accent-hover)" : "var(--accent)" : st.hover ? "var(--surface-hover)" : "var(--surface-input)";
  const bd = off ? "var(--line-hairline)" : isInvalid ? "var(--danger)" : filled ? "transparent" : st.hover ? "var(--line-accent)" : "var(--line-strong)";
  return /*#__PURE__*/React.createElement("label", _extends({
    "data-heroui": "Checkbox"
  }, on, {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      cursor: off ? "not-allowed" : "pointer",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: on_,
    disabled: off,
    "aria-invalid": isInvalid || undefined
  }, f, {
    onChange: e => onChange && onChange(e.target.checked),
    ref: el => {
      if (el) el.indeterminate = !!mixed;
    },
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1,
      margin: 0,
      pointerEvents: "none"
    }
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 22,
      height: 22,
      flex: "0 0 auto",
      marginTop: 1,
      display: "grid",
      placeItems: "center",
      borderRadius: "var(--r-xs)",
      background: bg,
      border: `1px solid ${bd}`,
      color: off ? "var(--text-faint)" : "var(--text-on-accent)",
      transform: st.press && !off ? "scale(.92)" : "none",
      boxShadow: st.focus ? "var(--glow-focus)" : "none",
      transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-out)"
    }
  }, (on_ || mixed) && lbIco(mixed ? "minus" : "check", 16)), (label || description) && /*#__PURE__*/React.createElement("span", null, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-body-md)",
      color: off ? "var(--text-faint)" : "var(--text-body)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 16) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function Input({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  suffix,
  error,
  isInvalid,
  disabled = false,
  isDisabled,
  loading = false,
  isPending,
  forceState,
  numeric = false,
  style,
  ...rest
}) {
  const [focusS, setFocus] = React.useState(false);
  const [hoverS, setHover] = React.useState(false);
  const off = disabled || isDisabled,
    bad = !!error || isInvalid,
    pending = loading || isPending;
  const focus = forceState === "focus" || focusS,
    hover = forceState === "hover" || hoverS;
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const bd = off ? "var(--line-hairline)" : bad ? "var(--danger)" : focus ? "var(--accent)" : hover ? "var(--line-strong)" : "var(--line)";
  const pre = typeof prefix === "string" && prefix.length > 2 ? lbIco(prefix) : prefix;
  return /*#__PURE__*/React.createElement("label", {
    "data-heroui": "TextField",
    "data-invalid": bad || undefined,
    "data-disabled": off || undefined,
    style: {
      display: "block",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginBottom: 6,
      font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-ui)",
      color: off ? "var(--text-faint)" : "var(--text-muted)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 48,
      padding: "0 12px",
      background: off ? "var(--surface-raised)" : "var(--surface-input)",
      borderRadius: "var(--r-input)",
      border: `1px solid ${bd}`,
      boxShadow: focus && !off ? "var(--glow-focus)" : "none",
      cursor: off ? "not-allowed" : "text",
      transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)"
    }
  }, pre && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      display: "inline-flex"
    }
  }, pre), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: off,
    "aria-invalid": bad || undefined,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      caretColor: "var(--accent)",
      color: off ? "var(--text-faint)" : "var(--text-body)",
      font: "var(--text-body-md)",
      fontVariantNumeric: numeric ? "tabular-nums" : "normal",
      cursor: off ? "not-allowed" : "text"
    }
  }, rest)), pending && NS.Spinner ? React.createElement(NS.Spinner, {
    size: "sm",
    color: "var(--text-faint)"
  }) : bad ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-danger)",
      display: "inline-flex"
    }
  }, lbIco("circle-alert")) : suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      display: "inline-flex",
      fontVariantNumeric: "tabular-nums"
    }
  }, suffix)), bad && error ? /*#__PURE__*/React.createElement("span", {
    role: "alert",
    style: {
      display: "block",
      marginTop: 6,
      font: "var(--text-small)",
      color: "var(--text-danger)"
    }
  }, error) : description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 6,
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, description));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/QuantityStepper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 16) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function QuantityStepper({
  value = 1,
  onChange,
  min = 0,
  max = 99,
  size = "md",
  disabled = false,
  style,
  ...rest
}) {
  const h = size === "lg" ? 48 : 36;
  const btn = (icon, next, enabled, label) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    disabled: !enabled || disabled,
    onClick: () => enabled && !disabled && onChange && onChange(next),
    onMouseEnter: e => {
      if (enabled && !disabled) e.currentTarget.style.background = "var(--surface-hover)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = "transparent";
    },
    style: {
      width: h,
      height: h,
      display: "grid",
      placeItems: "center",
      background: "transparent",
      border: "none",
      borderRadius: "var(--r-btn)",
      color: enabled && !disabled ? "var(--text-body)" : "var(--text-faint)",
      cursor: enabled && !disabled ? "pointer" : "not-allowed"
    }
  }, lbIco(icon, size === "lg" ? 20 : 16));
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "group",
    "aria-label": "\u0E08\u0E33\u0E19\u0E27\u0E19",
    "data-component": "QuantityStepper",
    style: {
      display: "inline-flex",
      alignItems: "center",
      background: "var(--surface-input)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-btn)",
      ...style
    }
  }, rest), btn("minus", value - 1, value > min, "ลด"), /*#__PURE__*/React.createElement("span", {
    "aria-live": "polite",
    style: {
      minWidth: size === "lg" ? 40 : 28,
      textAlign: "center",
      font: "var(--fw-bold) var(--fs-body)/1 var(--font-numeric)",
      fontVariantNumeric: "tabular-nums",
      color: disabled ? "var(--text-faint)" : "var(--text-body)"
    }
  }, value), btn("plus", value + 1, value < max, "เพิ่ม"));
}
Object.assign(__ds_scope, { QuantityStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/QuantityStepper.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useLBInteract(force) {
  const [s, set] = React.useState({
    h: false,
    p: false,
    f: false
  });
  const on = {
    onMouseEnter: () => set(x => ({
      ...x,
      h: true
    })),
    onMouseLeave: () => set(x => ({
      ...x,
      h: false,
      p: false
    })),
    onMouseDown: () => set(x => ({
      ...x,
      p: true
    })),
    onMouseUp: () => set(x => ({
      ...x,
      p: false
    }))
  };
  const f = {
    onFocus: e => set(x => ({
      ...x,
      f: e.target.matches(":focus-visible")
    })),
    onBlur: () => set(x => ({
      ...x,
      f: false
    }))
  };
  return [{
    hover: force === "hover" || s.h,
    press: force === "pressed" || s.p,
    focus: force === "focus" || s.f
  }, on, f];
}
function Radio({
  checked = false,
  isSelected,
  onChange,
  label,
  description,
  trailing,
  name,
  value,
  disabled = false,
  isDisabled,
  forceState,
  style,
  ...rest
}) {
  const sel = isSelected != null ? isSelected : checked,
    off = disabled || isDisabled;
  const [st, on, f] = useLBInteract(forceState);
  const bd = off ? "var(--line-hairline)" : sel ? st.hover ? "var(--accent-hover)" : "var(--accent)" : st.hover ? "var(--line-accent)" : "var(--line-strong)";
  return /*#__PURE__*/React.createElement("label", _extends({
    "data-heroui": "Radio"
  }, on, {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      cursor: off ? "not-allowed" : "pointer",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    name: name,
    value: value,
    checked: sel,
    disabled: off
  }, f, {
    onChange: () => onChange && onChange(true),
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1,
      margin: 0,
      pointerEvents: "none"
    }
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 22,
      height: 22,
      flex: "0 0 auto",
      borderRadius: 999,
      display: "grid",
      placeItems: "center",
      background: off ? "var(--surface-raised)" : st.hover && !sel ? "var(--surface-hover)" : "var(--surface-input)",
      border: `${sel && !off ? 2 : 1}px solid ${bd}`,
      transform: st.press && !off ? "scale(.92)" : "none",
      boxShadow: st.focus ? "var(--glow-focus)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-out), transform var(--dur-instant) var(--ease-out)"
    }
  }, sel && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: off ? "var(--text-faint)" : "var(--accent)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-body-md)",
      color: off ? "var(--text-faint)" : "var(--text-body)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, description)), trailing && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-body-md)",
      color: off ? "var(--text-faint)" : "var(--text-muted)",
      fontVariantNumeric: "tabular-nums"
    }
  }, trailing));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 16) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function SearchField({
  value = "",
  onChange,
  placeholder = "ค้นหา",
  disabled = false,
  isDisabled,
  isPending,
  forceState,
  style,
  ...rest
}) {
  const [focusS, setFocus] = React.useState(false),
    [hoverS, setHover] = React.useState(false);
  const off = disabled || isDisabled,
    focus = forceState === "focus" || focusS,
    hover = forceState === "hover" || hoverS;
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return /*#__PURE__*/React.createElement("span", _extends({
    "data-heroui": "SearchField",
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 40,
      padding: "0 6px 0 10px",
      flex: 1,
      background: off ? "var(--surface-raised)" : "var(--surface-input)",
      borderRadius: "var(--r-input)",
      border: "1px solid " + (off ? "var(--line-hairline)" : focus ? "var(--accent)" : hover ? "var(--line-strong)" : "var(--line)"),
      boxShadow: focus && !off ? "var(--glow-focus)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-out)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      display: "inline-flex"
    }
  }, lbIco("search")), /*#__PURE__*/React.createElement("input", {
    type: "search",
    value: value,
    placeholder: placeholder,
    disabled: off,
    "aria-label": placeholder,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    onKeyDown: e => {
      if (e.key === "Escape" && onChange) onChange("");
    },
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      appearance: "none",
      color: off ? "var(--text-faint)" : "var(--text-body)",
      font: "var(--text-body-md)",
      caretColor: "var(--accent)"
    }
  }), isPending && NS.Spinner ? React.createElement(NS.Spinner, {
    size: "sm",
    color: "var(--text-faint)"
  }) : value && !off && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u0E25\u0E49\u0E32\u0E07\u0E04\u0E33\u0E04\u0E49\u0E19\u0E2B\u0E32",
    onClick: () => onChange && onChange(""),
    style: {
      width: 28,
      height: 28,
      display: "grid",
      placeItems: "center",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "var(--text-faint)",
      borderRadius: "var(--r-xs)"
    }
  }, lbIco("x")));
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function LBSegment({
  o,
  on,
  size,
  force,
  onPick
}) {
  const [h, setH] = React.useState(false),
    [p, setP] = React.useState(false),
    [f, setF] = React.useState(false);
  const off = o.disabled,
    hover = (force === "hover" || h) && !off && !on,
    press = (force === "pressed" || p) && !off,
    focus = force === "focus" || f;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "tab",
    "aria-selected": on,
    disabled: off,
    "data-selected": on || undefined,
    onClick: () => !off && onPick(o.value),
    onMouseEnter: () => setH(true),
    onMouseLeave: () => {
      setH(false);
      setP(false);
    },
    onMouseDown: () => setP(true),
    onMouseUp: () => setP(false),
    onFocus: e => setF(e.target.matches(":focus-visible")),
    onBlur: () => setF(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: size === "sm" ? 30 : 36,
      padding: size === "sm" ? "0 10px" : "0 14px",
      border: "none",
      borderRadius: 8,
      outline: "none",
      background: on ? press ? "var(--accent-press)" : "var(--accent)" : press ? "var(--surface-press)" : hover ? "var(--surface-hover)" : "transparent",
      color: off ? "var(--text-faint)" : on ? "var(--text-on-accent)" : hover ? "var(--text-body)" : "var(--text-muted)",
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)",
      cursor: off ? "not-allowed" : "pointer",
      whiteSpace: "nowrap",
      boxShadow: focus ? "var(--glow-focus)" : "none",
      transition: "background var(--dur-fast) var(--ease-out)"
    }
  }, o.label, o.count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: "tabular-nums"
    }
  }, o.count));
}
function SegmentedControl({
  value,
  onChange,
  options = [],
  size = "md",
  disabled = false,
  isDisabled,
  forceState,
  forceStateFor,
  style,
  ...rest
}) {
  const off = disabled || isDisabled;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    "data-heroui": "Tabs",
    "data-variant": "secondary",
    style: {
      display: "inline-flex",
      padding: 3,
      gap: 2,
      background: "var(--surface-input)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-btn)",
      ...style
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement(LBSegment, {
    key: o.value,
    o: off ? {
      ...o,
      disabled: true
    } : o,
    on: o.value === value,
    size: size,
    force: forceStateFor === o.value ? forceState : undefined,
    onPick: v => onChange && onChange(v)
  })));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const lbIco = (name, size = 16) => {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return NS.Icon ? React.createElement(NS.Icon, {
    name,
    size
  }) : null;
};
function Select({
  label,
  description,
  value,
  onChange,
  options = [],
  placeholder = "เลือก",
  error,
  isInvalid,
  disabled = false,
  isDisabled,
  isOpen,
  forceState,
  style,
  ...rest
}) {
  const [openS, setOpen] = React.useState(false);
  const [hoverS, setHover] = React.useState(false);
  const [focusS, setFocus] = React.useState(false);
  const ref = React.useRef(null);
  const off = disabled || isDisabled,
    bad = !!error || isInvalid;
  const open = isOpen != null ? isOpen : openS;
  const hover = forceState === "hover" || hoverS,
    focus = forceState === "focus" || focusS || open;
  React.useEffect(() => {
    if (!openS) return;
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openS]);
  const cur = options.find(o => o.value === value);
  const bd = off ? "var(--line-hairline)" : bad ? "var(--danger)" : focus ? "var(--accent)" : hover ? "var(--line-strong)" : "var(--line)";
  return /*#__PURE__*/React.createElement("div", _extends({
    ref: ref,
    "data-heroui": "Select",
    "data-invalid": bad || undefined,
    style: {
      display: "block",
      position: "relative",
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginBottom: 6,
      font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-ui)",
      color: off ? "var(--text-faint)" : "var(--text-muted)"
    }
  }, label), /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: off,
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    "aria-invalid": bad || undefined,
    onClick: () => setOpen(o => !o),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: e => setFocus(e.target.matches(":focus-visible")),
    onBlur: () => setFocus(false),
    onKeyDown: e => {
      if (e.key === "Escape") setOpen(false);
    },
    style: {
      width: "100%",
      height: 48,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 12px",
      textAlign: "left",
      outline: "none",
      background: off ? "var(--surface-raised)" : "var(--surface-input)",
      border: `1px solid ${bd}`,
      borderRadius: "var(--r-input)",
      boxShadow: focus && !off ? "var(--glow-focus)" : "none",
      cursor: off ? "not-allowed" : "pointer",
      color: off || !cur ? "var(--text-faint)" : "var(--text-body)",
      font: "var(--text-body-md)",
      transition: "border-color var(--dur-fast) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, cur ? cur.label : placeholder), bad && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-danger)",
      display: "inline-flex"
    }
  }, lbIco("circle-alert")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      display: "inline-flex",
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform var(--dur-base) var(--ease-out)"
    }
  }, lbIco("chevron-down"))), open && !off && /*#__PURE__*/React.createElement("div", {
    role: "listbox",
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "calc(100% + 6px)",
      zIndex: "var(--z-dropdown)",
      padding: 4,
      background: "var(--surface-overlay)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-card)",
      boxShadow: "var(--shadow-raised)"
    }
  }, options.map(o => {
    const sel = o.value === value;
    return /*#__PURE__*/React.createElement("div", {
      key: o.value,
      role: "option",
      "aria-selected": sel,
      "aria-disabled": o.disabled || undefined,
      onClick: () => {
        if (o.disabled) return;
        onChange && onChange(o.value);
        setOpen(false);
      },
      onMouseEnter: e => {
        if (!o.disabled) e.currentTarget.style.background = "var(--surface-hover)";
      },
      onMouseLeave: e => {
        e.currentTarget.style.background = "transparent";
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: 40,
        padding: "0 10px",
        borderRadius: "var(--r-sm)",
        cursor: o.disabled ? "not-allowed" : "pointer",
        font: sel ? "var(--text-body-strong)" : "var(--text-body-md)",
        color: o.disabled ? "var(--text-faint)" : "var(--text-body)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, o.label), sel && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-accent)",
        display: "inline-flex"
      }
    }, lbIco("check")));
  })), bad && error ? /*#__PURE__*/React.createElement("span", {
    role: "alert",
    style: {
      display: "block",
      marginTop: 6,
      font: "var(--text-small)",
      color: "var(--text-danger)"
    }
  }, error) : description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 6,
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, description));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function useLBInteract(force) {
  const [s, set] = React.useState({
    h: false,
    p: false,
    f: false
  });
  const on = {
    onMouseEnter: () => set(x => ({
      ...x,
      h: true
    })),
    onMouseLeave: () => set(x => ({
      ...x,
      h: false,
      p: false
    })),
    onMouseDown: () => set(x => ({
      ...x,
      p: true
    })),
    onMouseUp: () => set(x => ({
      ...x,
      p: false
    }))
  };
  const f = {
    onFocus: e => set(x => ({
      ...x,
      f: e.target.matches(":focus-visible")
    })),
    onBlur: () => set(x => ({
      ...x,
      f: false
    }))
  };
  return [{
    hover: force === "hover" || s.h,
    press: force === "pressed" || s.p,
    focus: force === "focus" || s.f
  }, on, f];
}
function Switch({
  checked = false,
  isSelected,
  onChange,
  label,
  description,
  disabled = false,
  isDisabled,
  forceState,
  style,
  ...rest
}) {
  const on_ = isSelected != null ? isSelected : checked,
    off = disabled || isDisabled;
  const [st, on, f] = useLBInteract(forceState);
  const track = off ? "var(--surface-raised)" : on_ ? st.hover ? "var(--accent-hover)" : "var(--accent)" : st.hover ? "var(--surface-press)" : "var(--surface-hover)";
  const thumbW = st.press && !off ? 26 : 22;
  return /*#__PURE__*/React.createElement("label", _extends({
    "data-heroui": "Switch"
  }, on, {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      cursor: off ? "not-allowed" : "pointer",
      ...style
    }
  }, rest), (label || description) && /*#__PURE__*/React.createElement("span", null, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-body-md)",
      color: off ? "var(--text-faint)" : "var(--text-body)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, description)), /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: on_,
    disabled: off
  }, f, {
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1,
      margin: 0,
      pointerEvents: "none"
    }
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 48,
      height: 28,
      borderRadius: 999,
      padding: 2,
      flex: "0 0 auto",
      background: track,
      border: "1px solid " + (on_ && !off ? "transparent" : "var(--line)"),
      boxShadow: st.focus ? "var(--glow-focus)" : "none",
      transition: "background var(--dur-base) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: thumbW,
      height: 22,
      borderRadius: 999,
      background: off ? "var(--text-faint)" : on_ ? "var(--text-on-accent)" : "var(--text-muted)",
      transform: on_ ? `translateX(${42 - thumbW}px)` : "translateX(0)",
      transition: "transform var(--dur-base) var(--ease-out), width var(--dur-instant) var(--ease-out)"
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TabBar({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: "flex",
      background: "var(--surface-bar)",
      backdropFilter: "var(--blur-bar)",
      position: "relative",
      zIndex: "var(--z-sticky)",
      borderTop: "1px solid var(--line-hairline)",
      padding: "6px 4px 10px",
      ...style
    }
  }, rest), items.map(it => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onChange && onChange(it.value),
      style: {
        flex: 1,
        display: "grid",
        justifyItems: "center",
        gap: 3,
        padding: "6px 0",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: on ? "var(--text-accent)" : "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        display: "inline-flex"
      }
    }, it.icon, it.badge ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: -3,
        right: -8,
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        borderRadius: 999,
        background: "var(--accent)",
        color: "var(--text-on-accent)",
        font: "var(--fw-bold) 10px/16px var(--font-ui)",
        fontVariantNumeric: "tabular-nums",
        textAlign: "center"
      }
    }, it.badge > 99 ? "99+" : it.badge) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-micro)/1.3 var(--font-ui)"
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tabs({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    "data-heroui": "Tabs",
    style: {
      display: "flex",
      gap: 20,
      borderBottom: "1px solid var(--line-hairline)",
      ...style
    }
  }, rest), items.map(it => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onChange && onChange(it.value),
      style: {
        position: "relative",
        padding: "12px 0",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: on ? "var(--text-body)" : "var(--text-faint)",
        font: on ? "var(--text-body-strong)" : "var(--text-body-md)"
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontVariantNumeric: "tabular-nums",
        color: on ? "var(--text-accent)" : "var(--text-faint)"
      }
    }, it.count), on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        background: "var(--accent)",
        borderRadius: 2
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TopBar({
  title,
  subtitle,
  left,
  right,
  sticky = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      position: sticky ? "sticky" : "static",
      top: 0,
      zIndex: "var(--z-sticky)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      minHeight: "var(--bar-height)",
      padding: "8px var(--gutter-phone)",
      background: "var(--surface-bar)",
      backdropFilter: "var(--blur-bar)",
      borderBottom: "1px solid var(--line-hairline)",
      ...style
    }
  }, rest), left, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-subhead)",
      color: "var(--text-body)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, subtitle)), right && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, right));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/pos/NotificationBell.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function NotificationBell({
  count = 0,
  notifications = [],
  onMarkAllRead,
  isOpen,
  placement = "right",
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const ref = React.useRef(null);
  const [openS, setOpen] = React.useState(false);
  const open = isOpen != null ? isOpen : openS;
  const [h, setH] = React.useState(false);
  React.useEffect(() => {
    if (!openS) return;
    const x = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", x);
    return () => document.removeEventListener("mousedown", x);
  }, [openS]);
  const label = count > 99 ? "99+" : String(count);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    "data-component": "NotificationBell",
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": count ? `แจ้งเตือน ${label} รายการใหม่` : "แจ้งเตือน",
    "aria-expanded": open,
    onClick: () => setOpen(o => !o),
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      width: 44,
      height: 44,
      display: "grid",
      placeItems: "center",
      position: "relative",
      border: "none",
      cursor: "pointer",
      borderRadius: "var(--r-btn)",
      background: open ? "var(--surface-hover)" : h ? "var(--surface-raised)" : "transparent",
      color: open || h ? "var(--text-body)" : "var(--text-muted)",
      transition: "background var(--dur-fast) var(--ease-out)"
    }
  }, NS.Icon && React.createElement(NS.Icon, {
    name: "bell",
    size: 20
  }), count > 0 && /*#__PURE__*/React.createElement("span", {
    "data-heroui": "Badge",
    style: {
      position: "absolute",
      top: 5,
      left: 22,
      minWidth: 18,
      height: 18,
      padding: "0 5px",
      borderRadius: 999,
      background: "var(--accent)",
      color: "var(--text-on-accent)",
      border: "2px solid var(--bg-app)",
      boxSizing: "content-box",
      font: "var(--fw-bold) 10px/18px var(--font-ui)",
      fontVariantNumeric: "tabular-nums",
      textAlign: "center",
      whiteSpace: "nowrap"
    }
  }, label)), open && NS.NotificationFeed && React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      [placement === "left" ? "left" : "right"]: 0,
      zIndex: "var(--z-dropdown)"
    }
  }, React.createElement(NS.NotificationFeed, {
    notifications,
    onMarkAllRead
  })));
}
Object.assign(__ds_scope, { NotificationBell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pos/NotificationBell.jsx", error: String((e && e.message) || e) }); }

// components/pos/NotificationFeed.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const NF_TYPES = {
  order_new: {
    icon: "receipt-text",
    fg: "var(--text-accent)",
    bg: "var(--accent-soft)"
  },
  order_ready: {
    icon: "concierge-bell",
    fg: "var(--success-fg)",
    bg: "var(--success-bg)"
  },
  call_staff: {
    icon: "hand",
    fg: "var(--warning-fg)",
    bg: "var(--warning-bg)"
  },
  payment_received: {
    icon: "banknote",
    fg: "var(--success-fg)",
    bg: "var(--success-bg)"
  },
  payment_failed: {
    icon: "circle-x",
    fg: "var(--text-danger)",
    bg: "var(--danger-bg)"
  },
  bottle_expiring: {
    icon: "wine",
    fg: "var(--bottle-keep)",
    bg: "var(--bottle-keep-bg)"
  }
};
const NOTIFICATION_TYPES = NF_TYPES;
function LBNotifRow({
  n,
  onPress
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const t = NF_TYPES[n.type] || NF_TYPES.order_new;
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onPress && onPress(n),
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      width: "100%",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      padding: "10px 14px",
      textAlign: "left",
      border: "none",
      cursor: "pointer",
      background: h ? "var(--surface-hover)" : n.unread ? "var(--accent-soft)" : "transparent",
      transition: "background var(--dur-fast) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flex: "0 0 auto",
      background: t.bg,
      color: t.fg
    }
  }, NS.Icon && React.createElement(NS.Icon, {
    name: t.icon,
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: n.unread ? "var(--text-body-strong)" : "var(--text-body-md)",
      color: n.unread ? "var(--text-body)" : "var(--text-muted)"
    }
  }, n.title), n.text && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-small)",
      color: "var(--text-muted)",
      fontVariantNumeric: "tabular-nums"
    }
  }, n.text), n.time && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 2,
      font: "var(--text-small)",
      color: "var(--text-faint)",
      fontVariantNumeric: "tabular-nums"
    }
  }, n.time)), n.unread && /*#__PURE__*/React.createElement("span", {
    "aria-label": "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E48\u0E32\u0E19",
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: "var(--accent)",
      marginTop: 8,
      flex: "0 0 auto"
    }
  }));
}
function NotificationFeed({
  notifications = [],
  onMarkAllRead,
  onItemPress,
  width = 360,
  maxHeight = 440,
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const unread = notifications.filter(n => n.unread).length;
  const groups = [["today", "วันนี้"], ["earlier", "ก่อนหน้านี้"]].map(([k, l]) => [l, notifications.filter(n => (n.group || "today") === k)]).filter(g => g[1].length);
  return /*#__PURE__*/React.createElement("div", _extends({
    "data-component": "NotificationFeed",
    role: "dialog",
    "aria-label": "\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19",
    style: {
      width,
      background: "var(--surface-overlay)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-card-lg)",
      boxShadow: "var(--shadow-dialog)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 14px",
      borderBottom: "1px solid var(--line-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: "var(--text-body-strong)",
      color: "var(--text-body)"
    }
  }, "\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 ", unread > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-accent)",
      fontVariantNumeric: "tabular-nums"
    }
  }, unread)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: !unread,
    onClick: onMarkAllRead,
    style: {
      background: "transparent",
      border: "none",
      padding: "6px 4px",
      cursor: unread ? "pointer" : "default",
      color: unread ? "var(--text-accent)" : "var(--text-faint)",
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)"
    }
  }, "\u0E2D\u0E48\u0E32\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E41\u0E25\u0E49\u0E27")), /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: "auto",
      maxHeight
    }
  }, !notifications.length && NS.EmptyState ? React.createElement(NS.EmptyState, {
    icon: "bell-off",
    title: "ไม่มีแจ้งเตือน",
    description: "ออเดอร์ใหม่และการเรียกพนักงานจะขึ้นที่นี่"
  }) : groups.map(([label, items]) => /*#__PURE__*/React.createElement("div", {
    key: label
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px 4px",
      font: "var(--fw-semibold) var(--fs-micro)/1.4 var(--font-ui)",
      color: "var(--text-faint)"
    }
  }, label), items.map((n, i) => /*#__PURE__*/React.createElement(LBNotifRow, {
    key: n.id || label + i,
    n: n,
    onPress: onItemPress
  }))))));
}
Object.assign(__ds_scope, { NOTIFICATION_TYPES, NotificationFeed });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pos/NotificationFeed.jsx", error: String((e && e.message) || e) }); }

// components/pos/PosRail.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const RAIL_NAV = [{
  value: "tables",
  label: "โต๊ะ",
  icon: "grid-2x2"
}, {
  value: "orders",
  label: "ออเดอร์",
  icon: "receipt-text"
}, {
  value: "pay",
  label: "ชำระเงิน",
  icon: "banknote"
}, {
  value: "menu",
  label: "เมนู",
  icon: "book-open"
}, {
  value: "guests",
  label: "แขก",
  icon: "users"
}, {
  value: "reports",
  label: "รายงาน",
  icon: "chart-column"
}, {
  value: "settings",
  label: "ตั้งค่า",
  icon: "settings"
}];
function LBRailItem({
  item,
  on,
  badge,
  onPick,
  force
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  const [h, setH] = React.useState(false),
    [f, setF] = React.useState(false);
  const hover = (force === "hover" || h) && !on,
    focus = force === "focus" || f;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-current": on ? "page" : undefined,
    "aria-label": item.label + (badge ? ` (${badge})` : ""),
    onClick: () => onPick(item.value),
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    onFocus: e => setF(e.target.matches(":focus-visible")),
    onBlur: () => setF(false),
    style: {
      width: 64,
      height: 64,
      display: "grid",
      justifyItems: "center",
      alignContent: "center",
      gap: 4,
      padding: 0,
      position: "relative",
      outline: "none",
      borderRadius: "var(--r-btn)",
      background: on ? "var(--accent-soft)" : hover ? "var(--surface-hover)" : "transparent",
      border: "none",
      cursor: "pointer",
      color: on ? "var(--text-accent)" : hover ? "var(--text-body)" : "var(--text-faint)",
      boxShadow: focus ? "var(--glow-focus)" : "none",
      transition: "background var(--dur-fast) var(--ease-out)"
    }
  }, NS.Icon && React.createElement(NS.Icon, {
    name: item.icon,
    size: 24
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) 10px/1.2 var(--font-ui)"
    }
  }, item.label), badge > 0 && /*#__PURE__*/React.createElement("span", {
    "data-heroui": "Badge",
    style: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 18,
      height: 18,
      padding: "0 5px",
      borderRadius: 999,
      background: "var(--accent)",
      color: "var(--text-on-accent)",
      border: "2px solid var(--bg-sunken)",
      boxSizing: "content-box",
      font: "var(--fw-bold) 10px/18px var(--font-ui)",
      fontVariantNumeric: "tabular-nums",
      textAlign: "center"
    }
  }, badge > 99 ? "99+" : badge));
}
function PosRail({
  value,
  onChange,
  badges = {},
  items = RAIL_NAV,
  forceState,
  forceStateFor,
  style,
  ...rest
}) {
  const NS = window.TheLoftBarDesignSystem_99bbff || {};
  return /*#__PURE__*/React.createElement("nav", _extends({
    "data-component": "PosRail",
    "aria-label": "\u0E40\u0E21\u0E19\u0E39\u0E2B\u0E25\u0E31\u0E01",
    style: {
      width: 88,
      display: "grid",
      gridTemplateRows: "56px 1fr 64px",
      background: "var(--bg-sunken)",
      borderRight: "1px solid var(--line-hairline)",
      flexShrink: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center",
      borderBottom: "1px solid var(--line-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-bold) 12px/1.2 var(--font-ui)",
      color: "var(--text-accent)",
      letterSpacing: "0.08em",
      textAlign: "center"
    }
  }, "THE", /*#__PURE__*/React.createElement("br", null), "LOFT")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4,
      justifyItems: "center",
      alignContent: "start",
      padding: "8px 0"
    }
  }, items.map(it => /*#__PURE__*/React.createElement(LBRailItem, {
    key: it.value,
    item: it,
    on: it.value === value,
    badge: badges[it.value],
    force: forceStateFor === it.value ? forceState : undefined,
    onPick: v => onChange && onChange(v)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center",
      borderTop: "1px solid var(--line-hairline)"
    }
  }, NS.IconButton && React.createElement(NS.IconButton, {
    icon: "log-out",
    label: "ออกจากระบบ"
  })));
}
Object.assign(__ds_scope, { PosRail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pos/PosRail.jsx", error: String((e && e.message) || e) }); }

// guidelines/cd-00/artboard.js
try { (() => {
/* CD-00 artboard frame: header + theme switch + one pane per theme. Plain JS (no JSX) so pages can load it with a normal <script>. */
(function () {
  const h = React.createElement;
  const NS = () => window.TheLoftBarDesignSystem_99bbff || {};
  const C = n => NS()[n] || (() => null);
  const KEY = "lb-cd00-view";
  function parse(c) {
    const m = (c || "").match(/[\d.]+/g);
    if (!m) return null;
    return {
      r: +m[0],
      g: +m[1],
      b: +m[2],
      a: m[3] != null ? +m[3] : 1
    };
  }
  function over(f, b) {
    return {
      r: f.r * f.a + b.r * (1 - f.a),
      g: f.g * f.a + b.g * (1 - f.a),
      b: f.b * f.a + b.b * (1 - f.a),
      a: 1
    };
  }
  function lum(c) {
    return [c.r, c.g, c.b].map(v => {
      v /= 255;
      return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
    }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  }
  function ratio(a, b) {
    const x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }
  function hex(c) {
    if (!c) return "";
    const t = v => Math.round(v).toString(16).padStart(2, "0");
    return ("#" + t(c.r) + t(c.g) + t(c.b)).toUpperCase() + (c.a < 1 ? " · " + Math.round(c.a * 100) + "%" : "");
  }
  function paneBg(el) {
    const p = el && el.closest("[data-pane]");
    return parse(p ? getComputedStyle(p).backgroundColor : "rgb(28,22,16)");
  }
  function Label({
    children,
    style
  }) {
    return h("div", {
      style: {
        font: "var(--fw-semibold) 11px/1.4 var(--font-ui)",
        letterSpacing: ".06em",
        color: "var(--text-faint)",
        ...style
      }
    }, children);
  }
  function Section({
    title,
    note,
    children,
    style
  }) {
    return h("section", {
      style: {
        display: "grid",
        gap: 12,
        ...style
      }
    }, h("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        borderBottom: "1px solid var(--line-hairline)",
        paddingBottom: 6
      }
    }, h("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, title), note && h("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, note)), children);
  }
  function Spec({
    label,
    children,
    style
  }) {
    return h("div", {
      style: {
        display: "grid",
        gap: 6,
        justifyItems: "start",
        alignContent: "start",
        minWidth: 0,
        ...style
      }
    }, children, h(Label, {
      style: {
        letterSpacing: 0,
        fontWeight: 400
      }
    }, label));
  }
  function Swatch({
    token,
    border
  }) {
    const ref = React.useRef(null);
    const [v, setV] = React.useState("");
    React.useEffect(() => {
      const id = setTimeout(() => {
        if (ref.current) setV(hex(parse(getComputedStyle(ref.current).backgroundColor)));
      }, 60);
      return () => clearTimeout(id);
    });
    return h("div", {
      style: {
        display: "grid",
        gap: 6,
        minWidth: 0
      }
    }, h("div", {
      ref,
      style: {
        height: 48,
        borderRadius: "var(--r-sm)",
        background: "var(" + token + ")",
        border: "1px solid " + (border || "var(--line)")
      }
    }), h("div", {
      style: {
        font: "var(--fw-semibold) 11px/1.3 ui-monospace,Menlo,monospace",
        color: "var(--text-body)",
        wordBreak: "break-all"
      }
    }, token), h("div", {
      style: {
        font: "400 11px/1.3 ui-monospace,Menlo,monospace",
        color: "var(--text-faint)"
      }
    }, v));
  }
  function Pair({
    fg,
    bg,
    label,
    border,
    sample = "ข้อความ ฿120.00"
  }) {
    const ref = React.useRef(null);
    const [r, setR] = React.useState(null);
    React.useEffect(() => {
      const id = setTimeout(() => {
        const el = ref.current;
        if (!el) return;
        const cs = getComputedStyle(el);
        const base = paneBg(el);
        let b = parse(cs.backgroundColor);
        b = b && b.a < 1 ? over(b, base) : b;
        let f = parse(cs.color);
        f = f && f.a < 1 ? over(f, b) : f;
        if (b && f) setR(ratio(f, b));
      }, 80);
      return () => clearTimeout(id);
    });
    const ok = r && r >= 4.5;
    return h("div", {
      style: {
        display: "grid",
        gap: 4,
        minWidth: 0
      }
    }, h("div", {
      ref,
      style: {
        padding: "10px 12px",
        borderRadius: "var(--r-sm)",
        background: "var(" + bg + ")",
        color: "var(" + fg + ")",
        border: "1px solid " + (border ? "var(" + border + ")" : "var(--line-hairline)"),
        font: "var(--text-body-strong)",
        fontVariantNumeric: "tabular-nums",
        display: "flex",
        justifyContent: "space-between",
        gap: 8
      }
    }, h("span", null, sample), h("span", {
      style: {
        font: "var(--fw-bold) 11px/1.9 var(--font-ui)"
      }
    }, r ? r.toFixed(1) + ":1" : "")), h("div", {
      style: {
        font: "400 10.5px/1.35 ui-monospace,Menlo,monospace",
        color: ok ? "var(--text-faint)" : "var(--text-danger)"
      }
    }, (label || fg + " / " + bg) + (r && !ok ? " · < 4.5" : "")));
  }
  function Artboard({
    code,
    title,
    subtitle,
    render,
    cols
  }) {
    const [view, setViewS] = React.useState(() => {
      try {
        return localStorage.getItem(KEY) || "both";
      } catch (e) {
        return "both";
      }
    });
    const setView = v => {
      try {
        localStorage.setItem(KEY, v);
      } catch (e) {}
      setViewS(v);
    };
    const Seg = C("SegmentedControl");
    const themes = view === "both" ? ["dark", "light"] : [view];
    React.useEffect(() => {
      const d = () => window.lucide && window.lucide.createIcons && 0;
      d();
    }, [view]);
    return h("div", {
      style: {
        minHeight: "100vh",
        background: "var(--bg-sunken)",
        padding: 24,
        display: "grid",
        gap: 20,
        alignContent: "start"
      }
    }, h("header", {
      style: {
        display: "flex",
        alignItems: "flex-end",
        gap: 16
      }
    }, h("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, h(Label, null, code), h("div", {
      style: {
        font: "var(--text-title)",
        color: "var(--text-body)",
        marginTop: 2
      }
    }, title), subtitle && h("div", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)",
        marginTop: 2,
        maxWidth: 900
      }
    }, subtitle)), h("div", {
      style: {
        display: "grid",
        gap: 6,
        justifyItems: "end"
      }
    }, h(Label, null, "ธีม"), h(Seg, {
      value: view,
      onChange: setView,
      size: "sm",
      options: [{
        value: "both",
        label: "มืด + สว่าง"
      }, {
        value: "dark",
        label: "มืด"
      }, {
        value: "light",
        label: "สว่าง"
      }]
    }))), h("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(" + themes.length + ",minmax(0,1fr))",
        gap: 16,
        alignItems: "start"
      }
    }, themes.map(t => h("section", {
      key: t,
      "data-pane": t,
      "data-theme": t,
      className: t,
      style: {
        background: "var(--bg-app)",
        color: "var(--text-body)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card-lg)",
        padding: 24,
        display: "grid",
        gap: 28,
        minWidth: 0,
        position: "relative"
      }
    }, h("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, h("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "var(--accent)"
      }
    }), h("span", {
      style: {
        font: "var(--text-body-strong)"
      }
    }, t === "dark" ? "มืด" : "สว่าง"), h("span", {
      style: {
        font: "400 11px/1 ui-monospace,Menlo,monospace",
        color: "var(--text-faint)"
      }
    }, 'data-theme="' + t + '"')), render(t, {
      single: themes.length === 1
    })))));
  }
  function mount(props) {
    ReactDOM.createRoot(document.getElementById("root")).render(h(Artboard, props));
  }
  Object.assign(window, {
    LBArtboard: Artboard,
    LBSection: Section,
    LBSpec: Spec,
    LBSwatch: Swatch,
    LBPair: Pair,
    LBLabel: Label,
    lbMount: mount,
    lbC: C
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "guidelines/cd-00/artboard.js", error: String((e && e.message) || e) }); }

// ui_kits/customer-menu/CartScreen.jsx
try { (() => {
const {
  TopBar,
  IconButton,
  Icon,
  Button,
  CartLine,
  EmptyState,
  SegmentedControl,
  Card
} = window.TheLoftBarDesignSystem_99bbff;
function CartScreen({
  lines,
  setQty,
  remove,
  onBack,
  onSubmit
}) {
  const [mode, setMode] = React.useState("in");
  const total = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "statusbar"
  }, /*#__PURE__*/React.createElement("span", null, "19:46"), /*#__PURE__*/React.createElement("span", null, "\u0E42\u0E15\u0E4A\u0E30 4")), /*#__PURE__*/React.createElement(TopBar, {
    title: "\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13",
    subtitle: lines.length + " รายการ",
    sticky: false,
    left: /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-left"
      }),
      label: "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A",
      onClick: onBack
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "scroll",
    style: {
      padding: "0 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 0"
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    value: mode,
    onChange: setMode,
    options: [{
      value: "in",
      label: "ทานที่ร้าน"
    }, {
      value: "out",
      label: "กลับบ้าน"
    }]
  })), lines.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "shopping-basket",
      size: 30
    }),
    title: "\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32\u0E27\u0E48\u0E32\u0E07\u0E2D\u0E22\u0E39\u0E48",
    description: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21\u0E08\u0E32\u0E01\u0E40\u0E21\u0E19\u0E39\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22"
  }) : lines.map((l, i) => /*#__PURE__*/React.createElement(CartLine, {
    key: i,
    name: l.name,
    note: l.note,
    qty: l.qty,
    price: "฿" + (l.unit * l.qty).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    onQtyChange: q => setQty(i, q),
    onRemove: () => remove(i)
  })), /*#__PURE__*/React.createElement(Card, {
    tone: "flat",
    style: {
      marginTop: 16,
      display: "grid",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Row, {
    label: "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21",
    value: "฿" + total.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }), /*#__PURE__*/React.createElement(Row, {
    label: "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
    value: "\u0E3F0.00"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--line-hairline)"
    }
  }), /*#__PURE__*/React.createElement(Row, {
    label: "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E34\u0E49\u0E19",
    value: "฿" + total.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    strong: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderTop: "1px solid var(--line-hairline)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    block: true,
    size: "lg",
    disabled: lines.length === 0,
    onClick: onSubmit
  }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C")));
}
function Row({
  label,
  value,
  strong
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      font: strong ? "var(--text-body-strong)" : "var(--text-body-md)",
      color: strong ? "var(--text-body)" : "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: strong ? "var(--text-accent)" : "var(--text-muted)"
    }
  }, value));
}
Object.assign(window, {
  CartScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/customer-menu/CartScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/customer-menu/ItemSheet.jsx
try { (() => {
const {
  Dialog,
  Button,
  Radio,
  Checkbox,
  QuantityStepper
} = window.TheLoftBarDesignSystem_99bbff;
function ItemSheet({
  item,
  onClose,
  onAdd
}) {
  const [qty, setQty] = React.useState(1);
  const [ice, setIce] = React.useState("normal");
  const [extra, setExtra] = React.useState(false);
  if (!item) return null;
  const total = (item.price + (extra ? 60 : 0)) * qty;
  return /*#__PURE__*/React.createElement(Dialog, {
    variant: "sheet",
    title: item.name,
    onClose: onClose,
    actions: /*#__PURE__*/React.createElement(Button, {
      block: true,
      size: "lg",
      onClick: () => onAdd(item, qty, [ice === "none" ? "ไม่ใส่น้ำแข็ง" : null, extra ? "เพิ่มช็อต" : null].filter(Boolean).join(" · "), total)
    }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E07\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32 \xB7 ", "฿" + total.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)",
      marginBottom: 14
    }
  }, item.nameEn, item.note ? " · " + item.note : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)",
      color: "var(--text-body)",
      marginBottom: 8
    }
  }, "\u0E19\u0E49\u0E33\u0E41\u0E02\u0E47\u0E07"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    checked: ice === "normal",
    onChange: () => setIce("normal"),
    label: "\u0E1B\u0E01\u0E15\u0E34"
  }), /*#__PURE__*/React.createElement(Radio, {
    checked: ice === "none",
    onChange: () => setIce("none"),
    label: "\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E19\u0E49\u0E33\u0E41\u0E02\u0E47\u0E07"
  })), /*#__PURE__*/React.createElement(Checkbox, {
    checked: extra,
    onChange: setExtra,
    label: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E0A\u0E47\u0E2D\u0E15",
    description: "+\u0E3F60.00"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-body-strong)",
      color: "var(--text-body)"
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), /*#__PURE__*/React.createElement(QuantityStepper, {
    value: qty,
    onChange: setQty,
    min: 1,
    size: "lg"
  })));
}
Object.assign(window, {
  ItemSheet
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/customer-menu/ItemSheet.jsx", error: String((e && e.message) || e) }); }

// ui_kits/customer-menu/MenuScreen.jsx
try { (() => {
const {
  TopBar,
  Tag,
  MenuItemCard,
  Icon,
  Button,
  Card
} = window.TheLoftBarDesignSystem_99bbff;
function MenuScreen({
  cat,
  setCat,
  onOpen,
  cartCount,
  cartTotal,
  onCart
}) {
  const data = window.LOFT_MENU;
  const items = data.items.filter(i => cat === "ทั้งหมด" || i.cat === cat);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "statusbar"
  }, /*#__PURE__*/React.createElement("span", null, "19:42"), /*#__PURE__*/React.createElement("span", null, "\u0E42\u0E15\u0E4A\u0E30 4")), /*#__PURE__*/React.createElement(TopBar, {
    title: "\u0E40\u0E14\u0E2D\u0E30 \u0E25\u0E2D\u0E1F\u0E17\u0E4C \u0E1A\u0E32\u0E23\u0E4C",
    subtitle: "\u0E2A\u0E31\u0E48\u0E07\u0E08\u0E32\u0E01\u0E42\u0E15\u0E4A\u0E30\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E01\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19",
    right: /*#__PURE__*/React.createElement(Icon, {
      name: "wifi",
      size: 18,
      color: "var(--text-faint)"
    }),
    sticky: false
  }), /*#__PURE__*/React.createElement("div", {
    className: "scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chiprow"
  }, data.categories.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    selected: c === cat,
    onClick: () => setCat(c)
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10,
      padding: "0 16px 16px"
    }
  }, items.map(i => /*#__PURE__*/React.createElement(MenuItemCard, {
    key: i.id,
    name: i.name,
    nameEn: i.nameEn,
    price: "฿" + i.price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    note: i.note,
    soldOut: i.soldOut,
    onAdd: () => onOpen(i)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "flat",
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "qr-code",
    size: 20,
    color: "var(--text-faint)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, "\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E40\u0E04\u0E32\u0E19\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E41\u0E01\u0E19\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E40\u0E1E\u0E22\u0E4C\u0E15\u0E2D\u0E19\u0E1B\u0E34\u0E14\u0E1A\u0E34\u0E25")))), cartCount > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderTop: "1px solid var(--line-hairline)",
      background: "var(--surface-bar)",
      backdropFilter: "var(--blur-bar)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    block: true,
    size: "lg",
    onClick: onCart,
    iconLeft: /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 24,
        height: 24,
        borderRadius: 999,
        background: "color-mix(in oklab, var(--text-on-accent) 25%, transparent)",
        display: "grid",
        placeItems: "center",
        font: "var(--fw-bold) 13px/1 var(--font-ui)"
      }
    }, cartCount),
    iconRight: /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "auto",
        font: "var(--fw-bold) var(--fs-subhead)/1 var(--font-numeric)"
      }
    }, "฿" + cartTotal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })),
    style: {
      justifyContent: "flex-start",
      gap: 10
    }
  }, "\u0E14\u0E39\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32")));
}
Object.assign(window, {
  MenuScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/customer-menu/MenuScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/customer-menu/StatusScreen.jsx
try { (() => {
const {
  TopBar,
  Card,
  Badge,
  Button,
  Icon,
  Toast
} = window.TheLoftBarDesignSystem_99bbff;
function StatusScreen({
  lines,
  onMore
}) {
  const total = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const steps = [["ส่งไปที่บาร์แล้ว", "served"], ["กำลังทำ", "making"], ["เสิร์ฟแล้ว", "pending"]];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "statusbar"
  }, /*#__PURE__*/React.createElement("span", null, "19:47"), /*#__PURE__*/React.createElement("span", null, "\u0E42\u0E15\u0E4A\u0E30 4")), /*#__PURE__*/React.createElement(TopBar, {
    title: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C",
    subtitle: "\u0E42\u0E15\u0E4A\u0E30 4 \xB7 \u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C #A-128",
    sticky: false
  }), /*#__PURE__*/React.createElement("div", {
    className: "scroll",
    style: {
      padding: "12px 16px",
      display: "grid",
      gap: 12,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle",
      size: 18
    })
  }, "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E1A\u0E32\u0E23\u0E4C\u0E41\u0E25\u0E49\u0E27"), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: "grid",
      gap: 14
    }
  }, steps.map(([label, state], i) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 999,
      display: "grid",
      placeItems: "center",
      background: state === "pending" ? "transparent" : "var(--accent)",
      border: state === "pending" ? "1px solid var(--line-strong)" : "none",
      color: "var(--text-on-accent)",
      font: "var(--fw-bold) 12px/1 var(--font-ui)"
    }
  }, state === "pending" ? "" : "✓"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: state === "pending" ? "var(--text-body-md)" : "var(--text-body-strong)",
      color: state === "pending" ? "var(--text-faint)" : "var(--text-body)"
    }
  }, label), state === "making" && /*#__PURE__*/React.createElement(Badge, {
    tone: "making",
    dot: true
  }, "\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 6 \u0E19\u0E32\u0E17\u0E35")))), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-subhead)"
    }
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E1A\u0E34\u0E25"), lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 10,
      font: "var(--text-body-md)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-accent)",
      font: "var(--text-body-strong)"
    }
  }, l.qty, "\xD7"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, l.name, l.note && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, l.note)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "฿" + (l.unit * l.qty).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--line-hairline)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      font: "var(--text-price)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-body-strong)"
    }
  }, "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E34\u0E49\u0E19"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-accent)"
    }
  }, "฿" + total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    block: true,
    onClick: onMore,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 18
    })
  }, "\u0E2A\u0E31\u0E48\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21")));
}
Object.assign(window, {
  StatusScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/customer-menu/StatusScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/customer-menu/data.js
try { (() => {
window.LOFT_MENU = {
  categories: ["ทั้งหมด", "เบียร์สด", "ค็อกเทล", "ไฮบอล", "ไวน์", "ของทานเล่น"],
  items: [{
    id: "chang",
    cat: "เบียร์สด",
    name: "ช้างดราฟต์",
    nameEn: "Chang Draft",
    price: 120,
    note: "แก้ว 330 มล. เย็นจัด"
  }, {
    id: "singha",
    cat: "เบียร์สด",
    name: "สิงห์ดราฟต์",
    nameEn: "Singha Draft",
    price: 140,
    note: "แก้ว 330 มล."
  }, {
    id: "negroni",
    cat: "ค็อกเทล",
    name: "เนโกรนี",
    nameEn: "Negroni",
    price: 240,
    note: "จิน · คัมปารี · สวีทเวอร์มุต"
  }, {
    id: "oldf",
    cat: "ค็อกเทล",
    name: "โอลด์แฟชั่น",
    nameEn: "Old Fashioned",
    price: 260,
    note: "เบอร์เบิน · น้ำตาล · บิตเตอร์"
  }, {
    id: "lemon",
    cat: "ไฮบอล",
    name: "ไฮบอลมะนาวโซดา",
    nameEn: "Lemon Highball",
    price: 180,
    note: "วิสกี้ญี่ปุ่น · โซดา"
  }, {
    id: "yum",
    cat: "ของทานเล่น",
    name: "ยำหมูยอ",
    nameEn: "Spicy Moo Yor Salad",
    price: 150,
    soldOut: true
  }, {
    id: "nuts",
    cat: "ของทานเล่น",
    name: "ถั่วทอดสมุนไพร",
    nameEn: "Herb Fried Peanuts",
    price: 80
  }, {
    id: "wine",
    cat: "ไวน์",
    name: "ไวน์แดงแก้ว",
    nameEn: "House Red, Glass",
    price: 220
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/customer-menu/data.js", error: String((e && e.message) || e) }); }

// ui_kits/pos-desktop/FloorView.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  TableCard,
  StatTile,
  Icon,
  SegmentedControl
} = window.TheLoftBarDesignSystem_99bbff;
function FloorView({
  onOpenTable
}) {
  const [zone, setZone] = React.useState("all");
  const tables = [{
    label: "โต๊ะ 1",
    state: "free"
  }, {
    label: "โต๊ะ 2",
    state: "seated",
    time: "0:18",
    total: 420
  }, {
    label: "โต๊ะ 3",
    state: "free"
  }, {
    label: "โต๊ะ 4",
    state: "seated",
    time: "0:42",
    total: 780
  }, {
    label: "โต๊ะ 5",
    state: "seated",
    calling: true
  }, {
    label: "โต๊ะ 6",
    state: "free"
  }, {
    label: "บาร์ 1",
    state: "seated",
    time: "0:09",
    total: 240
  }, {
    label: "บาร์ 2",
    state: "closed",
    total: 360
  }, {
    label: "บาร์ 3",
    state: "free"
  }, {
    label: "บาร์ 4",
    state: "seated",
    time: "0:31",
    total: 1240
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "grid",
      gap: 20,
      alignContent: "start",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    label: "\u0E22\u0E2D\u0E14\u0E02\u0E32\u0E22\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49",
    value: "\u0E3F18,420.00",
    delta: "+12% \u0E08\u0E32\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E19",
    tone: "up",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "banknote",
      size: 14
    })
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "\u0E1A\u0E34\u0E25\u0E40\u0E1B\u0E34\u0E14\u0E2D\u0E22\u0E39\u0E48",
    value: "5",
    delta: "\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 \u0E3F768.00",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "receipt-text",
      size: 14
    })
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "\u0E41\u0E01\u0E49\u0E27\u0E17\u0E35\u0E48\u0E02\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27",
    value: "132",
    delta: "\u0E0A\u0E49\u0E32\u0E07\u0E14\u0E23\u0E32\u0E1F\u0E15\u0E4C\u0E02\u0E32\u0E22\u0E14\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "beer",
      size: 14
    })
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E2A\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22",
    value: "4:20 \u0E19.",
    delta: "\u0E40\u0E23\u0E47\u0E27\u0E02\u0E36\u0E49\u0E19 40 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35",
    tone: "up",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "timer",
      size: 14
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-heading)",
      flex: 1
    }
  }, "\u0E1C\u0E31\u0E07\u0E42\u0E15\u0E4A\u0E30"), /*#__PURE__*/React.createElement(SegmentedControl, {
    value: zone,
    onChange: setZone,
    options: [{
      value: "all",
      label: "ทั้งหมด"
    }, {
      value: "in",
      label: "ในร้าน"
    }, {
      value: "bar",
      label: "เคาน์เตอร์"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 12
    }
  }, tables.map(t => /*#__PURE__*/React.createElement(TableCard, _extends({
    key: t.label
  }, t, {
    onClick: () => onOpenTable(t.label)
  })))));
}
Object.assign(window, {
  FloorView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-desktop/FloorView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-desktop/OrderView.jsx
try { (() => {
const {
  Tag,
  MenuItemCard,
  CartLine,
  Button,
  Icon,
  Input,
  Badge
} = window.TheLoftBarDesignSystem_99bbff;
function OrderView({
  table,
  lines,
  add,
  setQty,
  remove,
  onPay
}) {
  const [cat, setCat] = React.useState("ทั้งหมด");
  const [q, setQ] = React.useState("");
  const data = window.LOFT_POS_MENU;
  const items = data.items.filter(i => (cat === "ทั้งหมด" || i.cat === cat) && i.name.includes(q));
  const total = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 380px",
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "grid",
      gap: 16,
      alignContent: "start",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    value: q,
    onChange: setQ,
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E21\u0E19\u0E39",
    prefix: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 18
    }),
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "scan-line",
      size: 18
    })
  }, "\u0E2A\u0E41\u0E01\u0E19\u0E1A\u0E32\u0E23\u0E4C\u0E42\u0E04\u0E49\u0E14")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, data.categories.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    selected: c === cat,
    onClick: () => setCat(c)
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 12
    }
  }, items.map(i => /*#__PURE__*/React.createElement(MenuItemCard, {
    key: i.id,
    layout: "tile",
    name: i.name,
    nameEn: i.nameEn,
    price: "฿" + i.price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    soldOut: i.soldOut,
    onAdd: () => add(i)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderLeft: "1px solid var(--line-hairline)",
      background: "var(--surface-overlay)",
      display: "grid",
      gridTemplateRows: "auto 1fr auto",
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderBottom: "1px solid var(--line-hairline)",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-heading)",
      flex: 1
    }
  }, table), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E1A\u0E34\u0E25 19:24")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 20px",
      overflow: "auto"
    }
  }, lines.map((l, i) => /*#__PURE__*/React.createElement(CartLine, {
    key: i,
    name: l.name,
    note: l.note,
    qty: l.qty,
    price: "฿" + (l.unit * l.qty).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    onQtyChange: v => setQty(i, v),
    onRemove: () => remove(i)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      borderTop: "1px solid var(--line-hairline)",
      display: "grid",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-subhead)",
      color: "var(--text-muted)"
    }
  }, "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E34\u0E49\u0E19"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-bold) var(--fs-pos-total)/1.1 var(--font-numeric)",
      color: "var(--text-accent)"
    }
  }, "฿" + total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    style: {
      flex: 1
    }
  }, "\u0E1E\u0E31\u0E01\u0E1A\u0E34\u0E25"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    style: {
      flex: 2
    },
    onClick: onPay,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "banknote",
      size: 20
    })
  }, "\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19")))));
}
Object.assign(window, {
  OrderView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-desktop/OrderView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-desktop/PayView.jsx
try { (() => {
const {
  Card,
  Radio,
  Button,
  Icon,
  Dialog,
  Toast,
  SegmentedControl
} = window.TheLoftBarDesignSystem_99bbff;
function PayView({
  table,
  total,
  onDone
}) {
  const [method, setMethod] = React.useState("pp");
  const [confirm, setConfirm] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [split, setSplit] = React.useState("1");
  const per = Math.round(total / Number(split));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: 24,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 20,
      alignContent: "start",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "var(--card-pad-lg)",
    style: {
      display: "grid",
      gap: 16,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-heading)"
    }
  }, table, " \xB7 \u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    checked: method === "pp",
    onChange: () => setMethod("pp"),
    label: "\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E40\u0E1E\u0E22\u0E4C / \u0E2A\u0E41\u0E01\u0E19\u0E08\u0E48\u0E32\u0E22",
    trailing: "QR"
  }), /*#__PURE__*/React.createElement(Radio, {
    checked: method === "cash",
    onChange: () => setMethod("cash"),
    label: "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14",
    trailing: "\u0E17\u0E2D\u0E19\u0E40\u0E2D\u0E07"
  }), /*#__PURE__*/React.createElement(Radio, {
    checked: method === "card",
    onChange: () => setMethod("card"),
    label: "\u0E1A\u0E31\u0E15\u0E23\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15",
    trailing: "EDC"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)",
      marginBottom: 8
    }
  }, "\u0E41\u0E22\u0E01\u0E1A\u0E34\u0E25"), /*#__PURE__*/React.createElement(SegmentedControl, {
    value: split,
    onChange: setSplit,
    options: [{
      value: "1",
      label: "ไม่แยก"
    }, {
      value: "2",
      label: "2 คน"
    }, {
      value: "3",
      label: "3 คน"
    }, {
      value: "4",
      label: "4 คน"
    }]
  }))), /*#__PURE__*/React.createElement(Card, {
    padding: "var(--card-pad-lg)",
    style: {
      display: "grid",
      gap: 14,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      font: "var(--text-body-md)",
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21"), /*#__PURE__*/React.createElement("span", null, "฿" + total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      font: "var(--text-body-md)",
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14"), /*#__PURE__*/React.createElement("span", null, "\u0E3F0.00")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--line-hairline)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-subhead)"
    }
  }, split === "1" ? "ต้องชำระ" : "ต่อคน (" + split + " คน)"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-bold) var(--fs-pos-total)/1.1 var(--font-numeric)",
      color: "var(--text-accent)"
    }
  }, "฿" + per.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), method === "pp" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center",
      gap: 8,
      padding: 20,
      background: "var(--qr-bg)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-card)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "qr-code",
    size: 96,
    color: "var(--qr-ink)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-small)",
      color: "var(--qr-ink)"
    }
  }, "\u0E2A\u0E41\u0E01\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E0A\u0E33\u0E23\u0E30 \xB7 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E40\u0E1E\u0E22\u0E4C")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    style: {
      flex: 1
    },
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "printer",
      size: 18
    })
  }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    style: {
      flex: 1
    },
    onClick: () => setConfirm(true)
  }, "\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E41\u0E25\u0E49\u0E27"))), done && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 24,
      bottom: 24,
      right: 24
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle",
      size: 18
    })
  }, "\u0E1B\u0E34\u0E14\u0E1A\u0E34\u0E25 ", table, " \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22 \xB7 ", "฿" + total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    title: "ปิดบิล " + table + "?",
    onClose: () => setConfirm(false),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      block: true,
      onClick: () => setConfirm(false)
    }, "\u0E22\u0E31\u0E07\u0E01\u0E48\u0E2D\u0E19"), /*#__PURE__*/React.createElement(Button, {
      block: true,
      onClick: () => {
        setConfirm(false);
        setDone(true);
        setTimeout(onDone, 1600);
      }
    }, "\u0E1B\u0E34\u0E14\u0E1A\u0E34\u0E25"))
  }, "\u0E22\u0E2D\u0E14 ", "฿" + total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), " \u0E08\u0E30\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E22\u0E2D\u0E14\u0E02\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E01\u0E30\u0E19\u0E35\u0E49"));
}
Object.assign(window, {
  PayView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-desktop/PayView.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-desktop/Sidebar.jsx
try { (() => {
const {
  Icon,
  IconButton,
  Tooltip
} = window.TheLoftBarDesignSystem_99bbff;
function Sidebar({
  view,
  setView
}) {
  const items = [["floor", "โต๊ะ", "grid-2x2"], ["order", "สั่งอาหาร", "utensils"], ["pay", "ชำระเงิน", "banknote"], ["report", "รายงาน", "chart-column"], ["settings", "ตั้งค่า", "settings"]];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 88,
      background: "var(--bg-sunken)",
      borderRight: "1px solid var(--line-hairline)",
      display: "grid",
      gridTemplateRows: "auto 1fr auto",
      padding: "16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      font: "var(--fw-bold) 13px/1.3 var(--font-ui)",
      color: "var(--text-accent)",
      padding: "0 8px 16px"
    }
  }, "THE", /*#__PURE__*/React.createElement("br", null), "LOFT"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6,
      justifyItems: "center",
      alignContent: "start"
    }
  }, items.map(([v, label, icon]) => /*#__PURE__*/React.createElement(Tooltip, {
    key: v,
    label: label,
    placement: "bottom"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setView(v),
    style: {
      width: 64,
      height: 64,
      display: "grid",
      placeItems: "center",
      gap: 4,
      borderRadius: "var(--r-btn)",
      background: view === v ? "var(--accent-soft-strong)" : "transparent",
      border: "none",
      cursor: "pointer",
      color: view === v ? "var(--text-accent)" : "var(--text-faint)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 24
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) 10px/1.2 var(--font-ui)"
    }
  }, label))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      justifyItems: "center"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "log-out",
      size: 22
    }),
    label: "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A"
  })));
}
Object.assign(window, {
  Sidebar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-desktop/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-desktop/data.js
try { (() => {
window.LOFT_POS_MENU = {
  categories: ["ทั้งหมด", "เบียร์สด", "ค็อกเทล", "ไฮบอล", "ไวน์", "ของทานเล่น"],
  items: [{
    id: "chang",
    cat: "เบียร์สด",
    name: "ช้างดราฟต์",
    nameEn: "Chang Draft",
    price: 120
  }, {
    id: "singha",
    cat: "เบียร์สด",
    name: "สิงห์ดราฟต์",
    nameEn: "Singha Draft",
    price: 140
  }, {
    id: "leo",
    cat: "เบียร์สด",
    name: "ลีโอขวด",
    nameEn: "Leo Bottle",
    price: 100
  }, {
    id: "negroni",
    cat: "ค็อกเทล",
    name: "เนโกรนี",
    nameEn: "Negroni",
    price: 240
  }, {
    id: "oldf",
    cat: "ค็อกเทล",
    name: "โอลด์แฟชั่น",
    nameEn: "Old Fashioned",
    price: 260
  }, {
    id: "marg",
    cat: "ค็อกเทล",
    name: "มาร์การิต้า",
    nameEn: "Margarita",
    price: 230
  }, {
    id: "lemon",
    cat: "ไฮบอล",
    name: "ไฮบอลมะนาวโซดา",
    nameEn: "Lemon Highball",
    price: 180
  }, {
    id: "wine",
    cat: "ไวน์",
    name: "ไวน์แดงแก้ว",
    nameEn: "House Red",
    price: 220
  }, {
    id: "nuts",
    cat: "ของทานเล่น",
    name: "ถั่วทอดสมุนไพร",
    nameEn: "Herb Peanuts",
    price: 80
  }, {
    id: "yum",
    cat: "ของทานเล่น",
    name: "ยำหมูยอ",
    nameEn: "Moo Yor Salad",
    price: 150,
    soldOut: true
  }, {
    id: "fries",
    cat: "ของทานเล่น",
    name: "เฟรนช์ฟรายส์",
    nameEn: "Fries",
    price: 120
  }, {
    id: "gai",
    cat: "ของทานเล่น",
    name: "ไก่ทอดกระเทียม",
    nameEn: "Garlic Fried Chicken",
    price: 180
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-desktop/data.js", error: String((e && e.message) || e) }); }

// ui_kits/pos-v2/Shell.jsx
try { (() => {
const {
  PosRail,
  NotificationBell,
  Avatar,
  Icon,
  IconButton
} = window.TheLoftBarDesignSystem_99bbff;
function PosShellClock() {
  const [t, setT] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(t.getHours()).padStart(2, "0"),
    mm = String(t.getMinutes()).padStart(2, "0");
  return /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-numeric)",
      color: "var(--text-muted)",
      fontVariantNumeric: "tabular-nums"
    }
  }, hh, ":", mm, " \u0E19.");
}
function PosAvatarMenu({
  name = "Beam"
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    "data-heroui": "Dropdown",
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(o => !o),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "4px 6px",
      borderRadius: "var(--r-btn)"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: name,
    size: "md",
    status: "online"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)",
      color: "var(--text-muted)"
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16
  }))), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      right: 0,
      width: 172,
      zIndex: "var(--z-dropdown)",
      background: "var(--surface-overlay)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-card)",
      boxShadow: "var(--shadow-dialog)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderBottom: "1px solid var(--line-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)"
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, "Manager")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(false),
    style: {
      width: "100%",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "var(--danger)",
      font: "var(--text-body-md)",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "log-out",
    size: 16
  }), "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A")));
}
function PosThemeToggle() {
  const [t, setT] = React.useState(() => document.documentElement.getAttribute("data-theme") || "dark");
  const flip = () => {
    const n = t === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", n);
    setT(n);
  };
  return /*#__PURE__*/React.createElement(IconButton, {
    icon: t === "light" ? "moon" : "sun",
    label: t === "light" ? "ธีมมืด" : "ธีมสว่าง",
    onPress: flip
  });
}
function PosTopBar({
  notifications = []
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 56,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 20px",
      background: "var(--bg-sunken)",
      borderBottom: "1px solid var(--line-hairline)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-bold) 13px/1 var(--font-ui)",
      color: "var(--text-accent)",
      letterSpacing: "0.08em"
    }
  }, "THE LOFT BAR"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 20,
      background: "var(--line)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)",
      color: "var(--text-muted)"
    }
  }, "\u0E40\u0E14\u0E2D\u0E30 \u0E25\u0E2D\u0E1F\u0E17\u0E4C \u0E1A\u0E32\u0E23\u0E4C")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "data-heroui": "Chip",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 14px",
      background: "var(--surface-raised)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-pill)",
      font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)",
      color: "var(--text-muted)",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "var(--success)"
    }
  }), "\u0E01\u0E30\u0E40\u0E1B\u0E34\u0E14 18:00 \xB7 Beam (Manager)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(PosShellClock, null), /*#__PURE__*/React.createElement(NotificationBell, {
    count: notifications.filter?.(n => n.unread).length || 0,
    notifications: notifications
  }), /*#__PURE__*/React.createElement(PosThemeToggle, null), /*#__PURE__*/React.createElement(PosAvatarMenu, null)));
}
function PosShell({
  value,
  onChange,
  badges = {},
  notifications = [],
  children,
  overlay
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1280,
      height: 800,
      display: "flex",
      background: "var(--bg-app)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(PosRail, {
    value: value,
    onChange: onChange,
    badges: badges
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(PosTopBar, {
    notifications: notifications
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: "auto",
      position: "relative"
    }
  }, children)), overlay);
}
Object.assign(window, {
  PosThemeToggle,
  PosShell,
  PosTopBar,
  PosShellClock,
  PosAvatarMenu
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-v2/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-v2/cd-02/cd02-kit.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
(() => {
  const DS = window.TheLoftBarDesignSystem_99bbff;
  const {
    Card,
    Badge,
    StatusChip,
    Button,
    Icon,
    IconButton,
    Alert,
    Skeleton,
    PosRail
  } = DS;
  const baht = n => "฿" + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const NUM = {
    fontVariantNumeric: "tabular-nums"
  };

  /* ---------- data (schema enums: free · open · seated · idle · closed · abandoned + calling flag). Numeric order always — call-staff cards keep their place (F3). ---------- */
  const CD02_COUNTER = [{
    id: "C1",
    state: "seated",
    guests: "ฟ้า",
    items: 3,
    total: 480,
    time: "0:42"
  }, {
    id: "C2",
    state: "free"
  }, {
    id: "C3",
    state: "idle",
    guests: "ภูมิ",
    items: 3,
    total: 420,
    time: "1:10",
    idleMin: 25
  }, {
    id: "C4",
    state: "open",
    time: "0:03"
  }, {
    id: "C5",
    state: "seated",
    calling: true,
    guests: "นิว",
    items: 2,
    total: 540,
    time: "0:50"
  }, {
    id: "C6",
    state: "seated",
    guests: "แนน, ปอ",
    items: 4,
    total: 760,
    time: "1:05"
  }, {
    id: "C7",
    state: "free"
  }, {
    id: "C8",
    state: "free"
  }];
  const CD02_TABLES = [{
    id: "T1",
    state: "free"
  }, {
    id: "T2",
    state: "seated",
    calling: true,
    guests: "มิ้นท์, เจ, ต้อม",
    items: 7,
    total: 1980,
    time: "2:10"
  }, {
    id: "T3",
    state: "seated",
    guests: "ต้น, บีม",
    items: 5,
    total: 1240,
    time: "1:24",
    newOrders: 2
  }, {
    id: "T4",
    state: "idle",
    guests: "กอล์ฟ",
    items: 2,
    total: 360,
    time: "1:52",
    idleMin: 25
  }, {
    id: "T5",
    state: "free"
  }, {
    id: "T6",
    state: "free"
  }];
  const CD02_NOTIFS = [{
    title: "T2 เรียกพนักงาน",
    time: "เมื่อกี้",
    unread: true
  }, {
    title: "ออเดอร์ใหม่ T3",
    text: "โอลด์แฟชั่น · สิงห์ดราฟต์ 2×",
    time: "3 นาทีที่แล้ว",
    unread: true
  }];

  /* ---------- shell: CD-01 top bar 56 + PosRail 88, rail โต๊ะ active ---------- */
  function Cd02Shell({
    width = 1280,
    height = 800,
    children,
    overlay,
    style
  }) {
    const Top = window.PosTopBar;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width,
        height,
        display: "flex",
        background: "var(--bg-app)",
        position: "relative",
        overflow: "hidden",
        flex: "0 0 auto",
        ...style
      }
    }, /*#__PURE__*/React.createElement(PosRail, {
      value: "tables",
      badges: {
        orders: 3
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0
      }
    }, Top && /*#__PURE__*/React.createElement(Top, {
      notifications: CD02_NOTIFS
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: "hidden",
        position: "relative"
      }
    }, children)), overlay);
  }

  /* ---------- TableCard: DS component (components/bar/TableCard). Wrapper keeps the board API {t,size,selected,compactMode}. ---------- */
  function TableCard({
    t,
    size = "large",
    selected = false,
    compactMode,
    style
  }) {
    return /*#__PURE__*/React.createElement(DS.TableCard, _extends({
      label: t.id
    }, t, {
      size: size,
      selected: selected,
      compactStatus: compactMode || "chip",
      style: style
    }));
  }

  /* ---------- grid ---------- */
  /* ใช้งาน = open + active + idle visits. "มีแขก" is reserved for the active chip. */
  function SummaryChips({
    counts = {
      inUse: 8,
      free: 6,
      calling: 2
    }
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral",
      variant: "outline",
      dot: true
    }, "ใช้งาน " + counts.inUse), /*#__PURE__*/React.createElement(StatusChip, {
      kind: "table",
      status: "free",
      label: "ว่าง " + counts.free
    }), counts.calling > 0 && /*#__PURE__*/React.createElement(StatusChip, {
      kind: "table",
      status: "calling",
      label: "เรียกพนักงาน " + counts.calling
    }));
  }
  function SectionHead({
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        font: "var(--text-subhead)",
        color: "var(--text-muted)",
        margin: "0 0 12px"
      }
    }, children);
  }
  function GridView({
    mode = "loaded",
    selected,
    counter = CD02_COUNTER,
    tables = CD02_TABLES,
    counts
  }) {
    const loading = mode === "loading",
      empty = mode === "empty",
      error = mode === "error";
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "20px 24px 24px",
        height: "100%",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-title)",
        color: "var(--text-body)"
      }
    }, "\u0E42\u0E15\u0E4A\u0E30"), loading ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      width: 64,
      height: 24,
      rounded: true
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: 56,
      height: 24,
      rounded: true
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: 96,
      height: 24,
      rounded: true
    })) : !empty && !error && /*#__PURE__*/React.createElement(SummaryChips, {
      counts: counts
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      iconLeft: "plus",
      isDisabled: loading || empty
    }, "\u0E40\u0E1B\u0E34\u0E14\u0E42\u0E15\u0E4A\u0E30")), mode === "disconnected" && /*#__PURE__*/React.createElement(Alert, {
      tone: "warning",
      icon: "wifi-off",
      title: "\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E02\u0E32\u0E14 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E32\u0E08\u0E44\u0E21\u0E48\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15",
      style: {
        marginBottom: 20
      }
    }), error && /*#__PURE__*/React.createElement(Alert, {
      tone: "danger",
      title: "\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E42\u0E15\u0E4A\u0E30\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm",
        iconLeft: "rotate-cw"
      }, "\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07")
    }, "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14"), empty && /*#__PURE__*/React.createElement("div", {
      style: {
        height: "calc(100% - 64px)",
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        justifyItems: "center",
        gap: 12,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-raised)",
        color: "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "grid-2x2",
      size: 24
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E15\u0E4A\u0E30 \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E42\u0E15\u0E4A\u0E30\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      iconLeft: "settings"
    }, "\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32"))), !empty && !error && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SectionHead, null, "\u0E40\u0E04\u0E32\u0E19\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,120px)",
        gap: 12,
        marginBottom: 28
      }
    }, counter.map(t => loading ? /*#__PURE__*/React.createElement(Skeleton, {
      key: t.id,
      width: 120,
      height: 96,
      radius: "var(--r-card)"
    }) : /*#__PURE__*/React.createElement(TableCard, {
      key: t.id,
      t: t,
      size: "compact",
      selected: selected === t.id
    }))), /*#__PURE__*/React.createElement(SectionHead, null, "\u0E42\u0E15\u0E4A\u0E30"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
        gap: 12,
        paddingTop: 4
      }
    }, tables.map(t => loading ? /*#__PURE__*/React.createElement(Skeleton, {
      key: t.id,
      height: 140,
      radius: "var(--r-card)"
    }) : /*#__PURE__*/React.createElement(TableCard, {
      key: t.id,
      t: t,
      selected: selected === t.id
    })))));
  }

  /* ---------- QR placeholder (module grid on fixed --qr-bg / --qr-ink) ---------- */
  function QRMock({
    size = 200,
    seed = 7,
    dim = false
  }) {
    const N = 25;
    let s = seed * 9301 + 49297;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const inFinder = (x, y) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx - 1 && x < fx + 8 && y >= fy - 1 && y < fy + 8);
    let d = "";
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (inFinder(x, y)) continue;
      if (rnd() > .52) d += `M${x} ${y}h1v1h-1z`;
    }
    const finder = (fx, fy) => `M${fx} ${fy}h7v7h-7zM${fx + 1} ${fy + 1}v5h5v-5zM${fx + 2} ${fy + 2}h3v3h-3z`;
    d += finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        padding: size * .06,
        background: "var(--qr-bg)",
        borderRadius: "var(--r-sm)",
        opacity: dim ? .35 : 1,
        flex: "0 0 auto"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: `0 0 ${N} ${N}`,
      width: "100%",
      height: "100%",
      shapeRendering: "crispEdges"
    }, /*#__PURE__*/React.createElement("path", {
      d: d,
      fillRule: "evenodd",
      style: {
        fill: "var(--qr-ink)"
      }
    })));
  }

  /* ---------- board chrome ---------- */
  function BoardHead({
    id,
    title,
    note
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-micro)/1 var(--font-ui)",
        letterSpacing: "var(--ls-caps)",
        color: "var(--text-accent)"
      }
    }, "CD-02/", id), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, title), note && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, note));
  }
  function StateLabel({
    n,
    label,
    parts,
    inline
  }) {
    const num = /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 20,
        height: 20,
        borderRadius: "var(--r-pill)",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-raised)",
        flex: "0 0 auto",
        font: "var(--fw-bold) var(--fs-micro)/1 var(--font-ui)",
        color: "var(--text-muted)",
        ...NUM
      }
    }, n);
    const lab = /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-ui)",
        color: "var(--text-body)",
        whiteSpace: inline ? "nowrap" : "normal"
      }
    }, label);
    const p = parts && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)",
        whiteSpace: inline ? "nowrap" : "normal"
      }
    }, "HeroUI \xB7 ", parts);
    if (inline) return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: 20
      }
    }, num, lab, p);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "20px 1fr",
        columnGap: 8,
        rowGap: 0,
        alignItems: "center"
      }
    }, num, lab, p && /*#__PURE__*/React.createElement("span", {
      style: {
        gridColumn: 2
      }
    }, p));
  }
  function Board({
    children,
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: 1280,
        height: 800,
        background: "var(--bg-sunken)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflow: "hidden",
        ...style
      }
    }, children);
  }
  /* Modal panel frame: real Dialog inside a sized, relative backdrop box */
  function ModalFrame({
    w,
    h,
    zoom = 1,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: w,
        height: h,
        position: "relative",
        borderRadius: "var(--r-card)",
        overflow: "hidden",
        zoom,
        flex: "0 0 auto",
        background: "var(--bg-app)",
        border: "1px solid var(--line-hairline)"
      }
    }, children);
  }
  function Row({
    label,
    value,
    strong,
    tone
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        padding: "6px 0"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: strong ? "var(--text-body-strong)" : "var(--text-body-md)",
        color: strong ? "var(--text-body)" : "var(--text-muted)"
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        font: strong ? "var(--text-price)" : "var(--text-body-strong)",
        color: tone || "var(--text-body)",
        ...NUM
      }
    }, value));
  }
  Object.assign(window, {
    Cd02Shell,
    TableCard,
    GridView,
    SummaryChips,
    QRMock,
    BoardHead,
    StateLabel,
    Board,
    ModalFrame,
    Cd02Row: Row,
    cd02Baht: baht,
    CD02_COUNTER,
    CD02_TABLES
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-v2/cd-02/cd02-kit.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-v2/cd-02/cd02-panel.jsx
try { (() => {
(() => {
  const DS = window.TheLoftBarDesignSystem_99bbff;
  const {
    Badge,
    StatusChip,
    Button,
    Icon,
    IconButton,
    Alert,
    Skeleton
  } = DS;
  const baht = window.cd02Baht;
  const NUM = {
    fontVariantNumeric: "tabular-nums"
  };
  const T3_ORDERS = [{
    time: "19:02 น.",
    status: "sent",
    items: [{
      st: "ready",
      name: "ช้างดราฟต์",
      qty: 2,
      by: "ต้น",
      price: 240
    }, {
      st: "cancelled",
      name: "เฟรนช์ฟรายส์",
      qty: 1,
      mod: "สั่งผิด",
      by: "ต้น",
      price: 150
    }]
  }, {
    time: "19:48 น.",
    status: "accepted",
    items: [{
      st: "making",
      name: "เนโกรนี",
      qty: 1,
      mod: "น้ำแข็งก้อนใหญ่",
      by: "บีม",
      price: 280
    }, {
      st: "making",
      name: "ยำหมูยอ",
      qty: 1,
      mod: "ไม่เผ็ด",
      by: "ต้น",
      price: 180
    }]
  }, {
    time: "20:21 น.",
    status: "pending",
    items: [{
      st: "waiting",
      name: "โอลด์แฟชั่น",
      qty: 1,
      mod: "หวานน้อย",
      by: "บีม",
      price: 260
    }, {
      st: "waiting",
      name: "สิงห์ดราฟต์",
      qty: 2,
      by: "ต้น",
      price: 280
    }]
  }];
  const T4_ORDERS = [{
    time: "18:40 น.",
    status: "sent",
    items: [{
      st: "ready",
      name: "ไฮบอลมะนาว",
      qty: 1,
      by: "กอล์ฟ",
      price: 180
    }, {
      st: "ready",
      name: "ถั่วทอดสมุนไพร",
      qty: 1,
      mod: "เพิ่มพริก",
      by: "กอล์ฟ",
      price: 180
    }]
  }];
  function ItemRow({
    it
  }) {
    const x = it.st === "cancelled";
    const strike = x ? {
      textDecoration: "line-through",
      color: "var(--text-faint)"
    } : {};
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "64px 1fr auto",
        gap: 10,
        alignItems: "start",
        padding: "8px 0"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        paddingTop: 2
      }
    }, /*#__PURE__*/React.createElement(StatusChip, {
      kind: "item",
      status: it.st,
      size: "sm"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: "var(--fw-semibold) var(--fs-body)/1.4 var(--font-ui)",
        color: "var(--text-body)",
        ...strike
      }
    }, it.qty > 1 && /*#__PURE__*/React.createElement("span", {
      style: NUM
    }, it.qty, "\xD7 "), it.name), /*#__PURE__*/React.createElement("div", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)",
        lineHeight: 1.4
      }
    }, it.mod ? it.mod + " · " : "", "\u0E2A\u0E31\u0E48\u0E07\u0E42\u0E14\u0E22 ", it.by)), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)",
        ...NUM,
        ...strike
      }
    }, baht(it.price)));
  }
  function OrderGroup({
    o,
    first
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: first ? "none" : "1px solid var(--line-hairline)",
        paddingTop: first ? 0 : 10,
        marginTop: first ? 0 : 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "2px 0"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "receipt-text",
      size: 16,
      color: "var(--text-faint)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-ui)",
        color: "var(--text-muted)",
        ...NUM
      }
    }, o.time), /*#__PURE__*/React.createElement(StatusChip, {
      kind: "order",
      status: o.status,
      size: "sm"
    })), o.items.map((it, i) => /*#__PURE__*/React.createElement(ItemRow, {
      key: i,
      it: it
    })));
  }
  function DropdownMenu() {
    const item = (icon, label) => /*#__PURE__*/React.createElement("div", {
      role: "menuitem",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 40,
        padding: "0 12px",
        borderRadius: "var(--r-sm)",
        font: "var(--text-body-md)",
        color: "var(--text-body)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 16,
      color: "var(--text-muted)"
    }), label);
    return /*#__PURE__*/React.createElement("div", {
      "data-heroui": "Dropdown",
      role: "menu",
      style: {
        position: "absolute",
        top: "calc(100% + 6px)",
        right: 0,
        width: 200,
        padding: 4,
        zIndex: "var(--z-dropdown)",
        background: "var(--surface-overlay)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
        boxShadow: "var(--shadow-raised)"
      }
    }, item("printer", "พิมพ์ QR ซ้ำ"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--surface-hover)",
        borderRadius: "var(--r-sm)"
      }
    }, item("refresh-cw", "สร้าง QR ใหม่")));
  }

  /* HeroUI Drawer placement="right", 400px */
  function TablePanel({
    variant = "active",
    height = 744,
    menuOpen = false,
    style,
    orders,
    sub,
    orderBtn = false,
    highlightFirst = false
  }) {
    const loading = variant === "loading",
      empty = variant === "empty",
      idle = variant === "idle",
      blocked = variant === "blocked";
    const meta = idle ? {
      id: "T4",
      status: "idle",
      open: "1:52",
      guest: "กอล์ฟ",
      orders: T4_ORDERS,
      sub: 360
    } : empty ? {
      id: "C4",
      status: "open",
      open: "0:03",
      guest: null,
      orders: [],
      sub: 0
    } : {
      id: "T3",
      status: "seated",
      open: "1:24",
      guest: "ต้น",
      orders: T3_ORDERS,
      sub: 1240
    };
    if (orders) meta.orders = orders;
    if (sub != null) meta.sub = sub;
    return /*#__PURE__*/React.createElement("aside", {
      "data-heroui": "Drawer",
      "aria-label": "โต๊ะ " + meta.id,
      style: {
        width: 400,
        height,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-overlay)",
        borderLeft: "1px solid var(--line)",
        boxShadow: "var(--shadow-dialog)",
        flex: "0 0 auto",
        ...style
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        padding: "14px 12px 12px 20px",
        borderBottom: "1px solid var(--line-hairline)",
        display: "grid",
        gap: 6
      }
    }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        height: 44
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      width: 110,
      height: 26
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: 56,
      height: 22,
      rounded: true
    })), /*#__PURE__*/React.createElement(Skeleton, {
      width: 160,
      height: 14
    })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-title)",
        color: "var(--text-body)"
      }
    }, "\u0E42\u0E15\u0E4A\u0E30 ", meta.id), /*#__PURE__*/React.createElement(StatusChip, {
      kind: "table",
      status: meta.status
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "ellipsis",
      label: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21",
      active: menuOpen
    }), menuOpen && /*#__PURE__*/React.createElement(DropdownMenu, null)), /*#__PURE__*/React.createElement(IconButton, {
      icon: "x",
      label: "\u0E1B\u0E34\u0E14"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...NUM
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 16
    }), "\u0E40\u0E1B\u0E34\u0E14 ", meta.open), meta.guest && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user",
      size: 16
    }), meta.guest), orderBtn && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      iconLeft: "plus"
    }, "\u0E2A\u0E31\u0E48\u0E07\u0E41\u0E17\u0E19\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"))))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        padding: "14px 20px"
      }
    }, idle && /*#__PURE__*/React.createElement(Alert, {
      tone: "warning",
      icon: "clock-alert",
      title: "\u0E42\u0E15\u0E4A\u0E30\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27 25 \u0E19\u0E32\u0E17\u0E35",
      style: {
        marginBottom: 14
      },
      action: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm"
      }, "\u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48"), /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm"
      }, "\u0E1B\u0E34\u0E14\u0E42\u0E15\u0E4A\u0E30"))
    }), loading && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 14
      }
    }, [0, 1].map(g => /*#__PURE__*/React.createElement("div", {
      key: g,
      style: {
        display: "grid",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      width: 70,
      height: 14
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: 64,
      height: 18,
      rounded: true
    })), [0, 1, 2].map(r => /*#__PURE__*/React.createElement("div", {
      key: r,
      style: {
        display: "grid",
        gridTemplateColumns: "64px 1fr 72px",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      height: 18,
      rounded: true
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      width: "70%",
      height: 15
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: "45%",
      height: 12
    })), /*#__PURE__*/React.createElement(Skeleton, {
      height: 15
    })))))), empty && /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        justifyItems: "center",
        gap: 10,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-raised)",
        color: "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "receipt-text",
      size: 24
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, "\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E08\u0E32\u0E01 QR \u0E02\u0E2D\u0E07\u0E42\u0E15\u0E4A\u0E30\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E17\u0E31\u0E19\u0E17\u0E35"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      iconLeft: "plus",
      style: {
        marginTop: 4
      }
    }, "\u0E2A\u0E31\u0E48\u0E07\u0E41\u0E17\u0E19\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"))), !loading && !empty && meta.orders.map((o, i) => highlightFirst && i === 0 ? /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        margin: "-6px -10px 6px",
        padding: "6px 10px",
        borderRadius: "var(--r-card)",
        background: "var(--accent-soft)",
        border: "1px solid var(--line-accent-soft)"
      }
    }, /*#__PURE__*/React.createElement(OrderGroup, {
      o: o,
      first: true
    })) : /*#__PURE__*/React.createElement(OrderGroup, {
      key: i,
      o: o,
      first: i === 0
    }))), /*#__PURE__*/React.createElement("footer", {
      style: {
        padding: "14px 20px 16px",
        borderTop: "1px solid var(--line)",
        background: "var(--surface-overlay)",
        boxShadow: "var(--shadow-sheet)",
        display: "grid",
        gap: 10,
        position: "relative",
        zIndex: "var(--z-sticky)"
      }
    }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Skeleton, {
      height: 14,
      width: "100%"
    }), /*#__PURE__*/React.createElement(Skeleton, {
      height: 40,
      width: "60%",
      style: {
        justifySelf: "end"
      }
    }), /*#__PURE__*/React.createElement(Skeleton, {
      height: 52,
      radius: "var(--r-btn)"
    })) : /*#__PURE__*/React.createElement(React.Fragment, null, blocked && /*#__PURE__*/React.createElement(Alert, {
      tone: "danger",
      icon: "loader",
      title: "\u0E21\u0E35\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E04\u0E49\u0E32\u0E07\u0E2D\u0E22\u0E39\u0E48 \u0E1B\u0E34\u0E14\u0E42\u0E15\u0E4A\u0E30\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"
    }, "\u0E23\u0E2D\u0E43\u0E2B\u0E49\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E22\u0E48\u0E2D\u0E22"), /*#__PURE__*/React.createElement("span", {
      style: NUM
    }, baht(meta.sub))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E34\u0E49\u0E19"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-pos-total)/1.2 var(--font-numeric)",
        color: "var(--text-accent)",
        ...NUM
      }
    }, baht(meta.sub)))), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      block: true,
      iconLeft: "banknote",
      isDisabled: empty,
      isPending: blocked
    }, "\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      iconLeft: "ban",
      isDisabled: empty,
      style: {
        flex: 1,
        background: "transparent"
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 / Comp"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      iconLeft: "log-out",
      isDisabled: blocked
    }, "\u0E1B\u0E34\u0E14\u0E42\u0E15\u0E4A\u0E30")))));
  }
  Object.assign(window, {
    Cd02OrderGroup: OrderGroup,
    TablePanel,
    Cd02DropdownMenu: DropdownMenu,
    CD02_T3_ORDERS: T3_ORDERS
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-v2/cd-02/cd02-panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-v2/cd-03/cd03-kit.jsx
try { (() => {
(() => {
  const DS = window.TheLoftBarDesignSystem_99bbff;
  const {
    Dialog,
    Button,
    IconButton,
    Badge,
    StatusChip,
    Icon,
    Alert,
    Radio,
    Select,
    Input,
    QuantityStepper,
    Spinner,
    PromptPayPanel,
    Card,
    Skeleton
  } = DS;
  const baht = n => "฿" + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const NUM = {
    fontVariantNumeric: "tabular-nums"
  };
  const QR = (s = 7) => React.createElement(window.QRMock, {
    size: 260,
    seed: s
  });
  function Divider({
    style,
    label
  }) {
    if (label) return /*#__PURE__*/React.createElement("div", {
      role: "separator",
      "data-heroui": "Divider",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        ...style
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: "var(--line)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-ui)",
        color: "var(--text-muted)",
        textAlign: "center"
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: "var(--line)"
      }
    }));
    return /*#__PURE__*/React.createElement("div", {
      role: "separator",
      "data-heroui": "Divider",
      style: {
        height: 1,
        background: "var(--line-hairline)",
        ...style
      }
    });
  }
  function SecLabel({
    children,
    extra
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, children, extra);
  }
  function ModalTitle({
    title = "ชำระเงิน — T3",
    sub,
    close = true
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        marginTop: -4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "grid",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-heading)",
        color: "var(--text-body)"
      }
    }, title), sub && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, sub)), close && /*#__PURE__*/React.createElement(IconButton, {
      icon: "x",
      label: "\u0E1B\u0E34\u0E14",
      style: {
        marginRight: -10,
        marginTop: -6
      }
    }));
  }
  /* radio card: HeroUI RadioGroup › Radio inside a 56px pressable surface */
  function RadioCard({
    sel,
    icon,
    label,
    tag,
    disabled
  }) {
    return /*#__PURE__*/React.createElement("div", {
      "data-heroui": "Radio",
      style: {
        minHeight: 56,
        boxSizing: "border-box",
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: "var(--r-btn)",
        background: sel ? "var(--accent-soft)" : "var(--surface-input)",
        border: "1px solid " + (sel ? "var(--line-accent)" : "var(--line)"),
        opacity: disabled ? 1 : 1
      }
    }, /*#__PURE__*/React.createElement(Radio, {
      isSelected: sel,
      isDisabled: disabled,
      label: "",
      style: {
        gap: 0
      }
    }), icon && /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 20,
      color: sel ? "var(--text-accent)" : "var(--text-muted)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-body-strong)",
        color: disabled ? "var(--text-faint)" : "var(--text-body)",
        whiteSpace: "nowrap"
      }
    }, label), tag);
  }
  function Row({
    label,
    value,
    strong,
    tone,
    sub
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        padding: "4px 0"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: strong ? "var(--text-body-strong)" : "var(--text-body-md)",
        color: strong ? "var(--text-body)" : "var(--text-muted)"
      }
    }, label, sub && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, sub)), /*#__PURE__*/React.createElement("span", {
      style: {
        font: strong ? "var(--text-price)" : "var(--text-body-strong)",
        color: tone || "var(--text-body)",
        ...NUM
      }
    }, value));
  }

  /* bill summary (HeroUI Card) */
  function BillSummary({
    total = 1240,
    paid = 0,
    payments
  }) {
    const rem = total - paid;
    return /*#__PURE__*/React.createElement("div", {
      "data-heroui": "Card",
      style: {
        padding: "12px 16px",
        background: "var(--surface-raised)",
        borderRadius: "var(--r-card)",
        display: "grid",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement(Row, {
      label: "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21",
      value: baht(total)
    }), /*#__PURE__*/React.createElement(Row, {
      label: "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27",
      value: baht(paid),
      tone: paid ? "var(--success-fg)" : undefined
    }), payments && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 6,
        padding: "6px 0 8px"
      }
    }, payments.map((p, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: "var(--surface-card)",
        borderRadius: "var(--r-sm)",
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: p.m === "cash" ? "banknote" : "qr-code",
      size: 16
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, p.m === "cash" ? "เงินสด" : "PromptPay", " \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: NUM
    }, p.t)), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-numeric)",
        color: p.s === "cancelled" ? "var(--text-faint)" : "var(--text-body)",
        textDecoration: p.s === "cancelled" ? "line-through" : "none",
        ...NUM
      }
    }, baht(p.a)), /*#__PURE__*/React.createElement(StatusChip, {
      kind: "payment",
      status: p.s,
      size: "sm"
    })))), /*#__PURE__*/React.createElement(Divider, {
      style: {
        margin: "6px 0 4px",
        background: "var(--line)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-pos-total)/1.2 var(--font-numeric)",
        color: "var(--text-accent)",
        ...NUM
      }
    }, baht(rem))));
  }

  /* ---------- CD-03/checkout ---------- */
  function CheckoutModal({
    state = "merge"
  }) {
    const split = state === "split",
      partial = state === "partial";
    const cash = partial;
    const pays = partial ? [{
      m: "qr",
      t: "20:41 น.",
      a: 500,
      s: "completed"
    }, {
      m: "qr",
      t: "20:44 น.",
      a: 740,
      s: "cancelled"
    }] : null;
    return /*#__PURE__*/React.createElement(Dialog, {
      isDismissable: false,
      style: {
        width: 560
      },
      title: /*#__PURE__*/React.createElement(ModalTitle, null),
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "lg"
      }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "lg",
        iconLeft: split ? "arrow-right" : cash ? "banknote" : "qr-code"
      }, split ? "ถัดไป" : cash ? "รับเงินสด" : "สร้าง QR"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 18
      }
    }, /*#__PURE__*/React.createElement(BillSummary, {
      paid: partial ? 500 : 0,
      payments: pays
    }), /*#__PURE__*/React.createElement("div", {
      role: "radiogroup",
      "data-heroui": "RadioGroup",
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(SecLabel, null, "\u0E27\u0E34\u0E18\u0E35\u0E41\u0E1A\u0E48\u0E07\u0E08\u0E48\u0E32\u0E22"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(RadioCard, {
      sel: !split,
      icon: "receipt-text",
      label: "\u0E23\u0E27\u0E21\u0E1A\u0E34\u0E25"
    }), /*#__PURE__*/React.createElement(RadioCard, {
      sel: split,
      icon: "users",
      label: "\u0E2B\u0E32\u0E23\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19"
    }))), /*#__PURE__*/React.createElement("div", {
      role: "radiogroup",
      "data-heroui": "RadioGroup",
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(SecLabel, null, "\u0E27\u0E34\u0E18\u0E35\u0E0A\u0E33\u0E23\u0E30"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(RadioCard, {
      sel: !cash,
      icon: "qr-code",
      label: "PromptPay QR",
      tag: /*#__PURE__*/React.createElement(Badge, {
        tone: "success",
        size: "sm",
        dot: true
      }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")
    }), /*#__PURE__*/React.createElement(RadioCard, {
      sel: cash,
      icon: "banknote",
      label: "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14"
    })))));
  }

  /* ---------- CD-03/split ---------- */
  function parts(total, n) {
    const c = Math.round(total * 100),
      b = Math.floor(c / n);
    return Array.from({
      length: n
    }, (_, i) => (i === n - 1 ? c - b * (n - 1) : b) / 100);
  }
  function SplitModal({
    n = 3,
    charge = false,
    selectOpen = false
  }) {
    const general = 1240,
      ps = parts(general, n);
    return /*#__PURE__*/React.createElement(Dialog, {
      isDismissable: false,
      style: {
        width: 560
      },
      title: /*#__PURE__*/React.createElement(ModalTitle, {
        sub: "\u0E2B\u0E32\u0E23\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19"
      }),
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "lg",
        iconLeft: "arrow-left"
      }, "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "lg"
      }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E41\u0E1A\u0E48\u0E07"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        display: "grid"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E04\u0E19"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, "2\u201310 \u0E04\u0E19")), /*#__PURE__*/React.createElement("span", {
      "data-heroui": "NumberField"
    }, /*#__PURE__*/React.createElement(QuantityStepper, {
      value: n,
      min: 2,
      max: 10,
      size: "lg"
    }))), /*#__PURE__*/React.createElement("div", {
      "data-heroui": "Card",
      style: {
        padding: "8px 16px",
        background: "var(--surface-raised)",
        borderRadius: "var(--r-card)"
      }
    }, ps.map((a, i) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, i > 0 && /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(Row, {
      label: "คนที่ " + (i + 1),
      value: baht(a + (charge && i === 0 ? 300 : 0)),
      sub: charge && i === 0 ? "รวมค่าเปิดขวด ฿300.00" : i === n - 1 && n === 3 ? "ปัดเศษสตางค์ไว้ที่คนสุดท้าย" : null
    }))), /*#__PURE__*/React.createElement(Divider, {
      style: {
        background: "var(--line)"
      }
    }), /*#__PURE__*/React.createElement(Row, {
      label: "\u0E23\u0E27\u0E21",
      value: baht(general + (charge ? 300 : 0)),
      strong: true
    })), charge && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(SecLabel, null, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E34\u0E14\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E19"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
        position: "relative",
        zIndex: "var(--z-dropdown)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        display: "grid"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E04\u0E48\u0E32\u0E40\u0E1B\u0E34\u0E14\u0E02\u0E27\u0E14"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)",
        ...NUM
      }
    }, baht(300))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 200
      }
    }, /*#__PURE__*/React.createElement(Select, {
      value: "p1",
      isOpen: selectOpen,
      options: [{
        value: "p1",
        label: "คิดกับ: คนที่ 1"
      }, {
        value: "p2",
        label: "คิดกับ: คนที่ 2"
      }, {
        value: "p3",
        label: "คิดกับ: คนที่ 3"
      }]
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "info",
      size: 16
    }), "\u0E2B\u0E32\u0E23\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B \u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E19")));
  }

  /* ---------- CD-03/promptpay ---------- */
  const PP_TEXT = {
    pending: null
  };
  function PPModal({
    state = "pending",
    part,
    amount = 1240,
    time = "21:14 น."
  }) {
    const ref = part ? "T3 · คนที่ " + part : "T3";
    const status = state === "disconnected" ? "pending" : state;
    const pending = status === "pending";
    let info;
    if (pending) info = /*#__PURE__*/React.createElement(React.Fragment, null, state === "disconnected" && /*#__PURE__*/React.createElement(Alert, {
      tone: "warning",
      icon: "wifi-off",
      title: "\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E02\u0E32\u0E14 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30\u2026"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, /*#__PURE__*/React.createElement(Spinner, {
      size: "md",
      color: "var(--text-accent)"
    }), "\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u2026"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-md)",
        color: "var(--text-muted)"
      }
    }, "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E22\u0E2D\u0E14\u0E40\u0E02\u0E49\u0E32"));
    if (status === "completed") info = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 48,
        height: 48,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "var(--success-bg)",
        color: "var(--success-fg)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 24
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-subhead)",
        color: "var(--text-body)",
        ...NUM
      }
    }, "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27 ", baht(amount), " \xB7 ", time), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)",
        ...NUM
      }
    }, "\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E38\u0E1B\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E43\u0E19 3 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35"));
    if (status === "failed") info = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Alert, {
      tone: "danger",
      title: "\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"
    }));
    if (status === "expired") info = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "timer-off",
      size: 20,
      color: "var(--text-muted)"
    }), "QR \u0E2B\u0E21\u0E14\u0E40\u0E27\u0E25\u0E32"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-md)",
        color: "var(--text-muted)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E22\u0E2D\u0E14\u0E40\u0E02\u0E49\u0E32 \u0E2A\u0E23\u0E49\u0E32\u0E07 QR \u0E43\u0E2B\u0E21\u0E48\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E41\u0E01\u0E19\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07"));
    const retry = status === "failed" || status === "expired";
    return /*#__PURE__*/React.createElement(Dialog, {
      isDismissable: false,
      style: {
        width: 720
      },
      title: /*#__PURE__*/React.createElement(ModalTitle, {
        sub: "PromptPay QR · " + (part ? "หารเท่ากัน" : "รวมบิล")
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "auto minmax(0,1fr)",
        gap: 24,
        alignItems: "stretch"
      }
    }, /*#__PURE__*/React.createElement(PromptPayPanel, {
      amount: baht(amount),
      reference: ref,
      qr: QR(part ? 3 + part : 7),
      qrSize: 260,
      expiresIn: "14:32",
      status: status,
      style: {
        boxShadow: "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 14,
        paddingTop: 4
      }
    }, info, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), retry && /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      block: true,
      iconLeft: "refresh-cw"
    }, "\u0E2A\u0E23\u0E49\u0E32\u0E07 QR \u0E43\u0E2B\u0E21\u0E48"), pending && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      iconLeft: "badge-check",
      style: {
        justifySelf: "start",
        color: "var(--text-accent)",
        textDecoration: "underline",
        textUnderlineOffset: 3,
        paddingLeft: 0
      }
    }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E14\u0E49\u0E27\u0E22\u0E15\u0E19\u0E40\u0E2D\u0E07"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg",
      block: true,
      iconLeft: "x"
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 QR")), status === "completed" && /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg",
      block: true
    }, "\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E38\u0E1B"), retry && /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      block: true
    }, "\u0E1B\u0E34\u0E14"))));
  }

  /* ---------- CD-03/split-progress ---------- */
  const SP = {
    "0": [["pending", null], ["pending", null], ["pending", null]],
    "2": [["completed", "21:08 น."], ["completed", "21:11 น."], ["pending", null]],
    "3": [["completed", "21:08 น."], ["completed", "21:11 น."], ["completed", "21:14 น."]]
  };
  function PartList({
    state = "2",
    selected,
    width
  }) {
    const rows = SP[state],
      ps = parts(1240, 3);
    const paidN = rows.filter(r => r[0] === "completed").length;
    const rem = ps.reduce((s, a, i) => s + (rows[i][0] === "completed" ? 0 : a), 0);
    const sel = selected != null ? selected : state === "0" ? 0 : state === "2" ? 2 : null;
    const done = paidN === 3;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(SecLabel, {
      extra: /*#__PURE__*/React.createElement(Badge, {
        tone: "neutral",
        size: "sm"
      }, "3 \u0E04\u0E19")
    }, "\u0E41\u0E1A\u0E48\u0E07\u0E08\u0E48\u0E32\u0E22"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 8
      }
    }, rows.map(([s, t], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      "data-heroui": "Card",
      style: {
        minHeight: 60,
        boxSizing: "border-box",
        padding: "8px 12px 8px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: "var(--r-card)",
        background: sel === i ? "var(--accent-soft)" : "var(--surface-card)",
        border: "1px solid " + (sel === i ? "var(--line-accent)" : "var(--line)")
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        display: "grid"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E04\u0E19\u0E17\u0E35\u0E48 ", i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-small)/1.4 var(--font-numeric)",
        color: "var(--text-muted)",
        ...NUM
      }
    }, baht(ps[i]))), /*#__PURE__*/React.createElement(StatusChip, {
      kind: "payment",
      status: s,
      size: "sm"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 92,
        display: "flex",
        justifyContent: "flex-end"
      }
    }, s === "completed" ? /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)",
        ...NUM
      }
    }, t) : /*#__PURE__*/React.createElement(Button, {
      variant: sel === i ? "primary" : "secondary",
      size: "sm",
      iconLeft: "qr-code"
    }, "\u0E41\u0E2A\u0E14\u0E07 QR"))))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        padding: "12px 14px",
        borderRadius: "var(--r-card)",
        background: done ? "var(--success-bg)" : "var(--surface-raised)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        font: "var(--text-body-strong)",
        color: done ? "var(--success-fg)" : "var(--text-body)",
        ...NUM
      }
    }, done && /*#__PURE__*/React.createElement(Icon, {
      name: "circle-check",
      size: 20
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27 ", paidN, "/3"), /*#__PURE__*/React.createElement("span", null, "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D ", baht(rem))), done && /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      block: true
    }, "\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E38\u0E1B"));
  }
  function SplitProgressModal({
    state = "2"
  }) {
    const sel = state === "0" ? 0 : 2;
    return /*#__PURE__*/React.createElement(Dialog, {
      isDismissable: false,
      style: {
        width: 880
      },
      title: /*#__PURE__*/React.createElement(ModalTitle, {
        sub: "\u0E2B\u0E32\u0E23\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19 \xB7 3 \u0E04\u0E19"
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) auto",
        gap: 24
      }
    }, /*#__PURE__*/React.createElement(PartList, {
      state: state,
      selected: sel
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 10,
        justifyItems: "center",
        alignContent: "start"
      }
    }, /*#__PURE__*/React.createElement(PromptPayPanel, {
      amount: baht(parts(1240, 3)[sel]),
      reference: "T3 · คนที่ " + (sel + 1) + "/3",
      qr: QR(4 + sel),
      qrSize: 260,
      expiresIn: "14:32",
      status: "pending",
      style: {
        boxShadow: "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(Spinner, {
      size: "sm",
      color: "var(--text-accent)"
    }), "\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u2026"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      style: {
        color: "var(--text-accent)",
        textDecoration: "underline",
        textUnderlineOffset: 3
      }
    }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E14\u0E49\u0E27\u0E22\u0E15\u0E19\u0E40\u0E2D\u0E07"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm"
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 QR")))));
  }

  /* ---------- CD-03/cash ---------- */
  function CashModal({
    state = "default"
  }) {
    const short = state === "short",
      busy = state === "confirming";
    const recv = short ? "1,000.00" : "1,500.00";
    const quick = v => /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      isDisabled: busy,
      style: {
        flex: 1
      }
    }, v);
    return /*#__PURE__*/React.createElement(Dialog, {
      isDismissable: false,
      style: {
        width: 560
      },
      title: /*#__PURE__*/React.createElement(ModalTitle, {
        sub: "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14 \xB7 \u0E23\u0E27\u0E21\u0E1A\u0E34\u0E25",
        close: !busy
      }),
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "lg",
        isDisabled: busy
      }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "lg",
        iconLeft: "banknote",
        isDisabled: short,
        isPending: busy
      }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        justifyItems: "center",
        gap: 2,
        padding: "14px 0",
        background: "var(--surface-raised)",
        borderRadius: "var(--r-card)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, "\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E0A\u0E33\u0E23\u0E30"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-pos-total)/1.2 var(--font-numeric)",
        color: "var(--text-accent)",
        ...NUM
      }
    }, baht(1240))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E21\u0E32",
      prefix: /*#__PURE__*/React.createElement("span", {
        style: {
          font: "var(--text-body-strong)",
          color: "var(--text-muted)"
        }
      }, "\u0E3F"),
      value: recv,
      numeric: true,
      isDisabled: busy,
      description: short ? undefined : "ไม่บังคับ — ใช้ช่วยทอนเงิน",
      error: short ? "เงินไม่พอ" : undefined
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, quick("฿500.00"), quick("฿1,000.00"), quick("พอดี"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        padding: "10px 16px",
        border: "1px solid " + (short ? "var(--danger-border)" : "var(--line)"),
        borderRadius: "var(--r-card)",
        background: short ? "var(--danger-bg)" : "transparent"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-subhead)",
        color: short ? "var(--text-danger)" : "var(--text-body)"
      }
    }, short ? "เงินไม่พอ" : "เงินทอน"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-title)/1.3 var(--font-numeric)",
        color: short ? "var(--text-danger)" : "var(--text-body)",
        ...NUM
      }
    }, short ? "ขาด " + baht(240) : baht(260)))));
  }

  /* ---------- CD-03/manual-confirm ---------- */
  function ManualModal({
    state = "open"
  }) {
    const other = state === "other",
      open = state === "open";
    return /*#__PURE__*/React.createElement(Dialog, {
      isDismissable: false,
      style: {
        width: 520
      },
      title: /*#__PURE__*/React.createElement(ModalTitle, {
        title: "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E48\u0E32\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27?",
        sub: "PromptPay QR · T3 · " + baht(1240)
      }),
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "lg"
      }, "\u0E1B\u0E34\u0E14"), /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "lg",
        iconLeft: "badge-check",
        isDisabled: !other
      }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E48\u0E32\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement(Alert, {
      tone: "warning",
      title: "\u0E43\u0E0A\u0E49\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E08\u0E32\u0E01\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23 \u2014 \u0E08\u0E30\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        zIndex: "var(--z-dropdown)"
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01)",
      placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25",
      value: other ? "other" : undefined,
      isOpen: open,
      options: [{
        value: "webhook",
        label: "เว็บฮุคไม่เข้า"
      }, {
        value: "direct",
        label: "ลูกค้าโอนเข้าบัญชีร้านโดยตรง"
      }, {
        value: "other",
        label: "อื่นๆ"
      }]
    })), other && /*#__PURE__*/React.createElement(Input, {
      label: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14",
      value: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E42\u0E0A\u0E27\u0E4C\u0E2A\u0E25\u0E34\u0E1B\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E1B\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23 \u0E22\u0E2D\u0E14\u0E40\u0E02\u0E49\u0E32\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E41\u0E25\u0E49\u0E27"
    })));
  }

  /* ---------- drawer (CD-02 Drawer 400) for in-flight / done ---------- */
  function PayDrawer({
    variant = "inflight",
    height = 744,
    style
  }) {
    const OG = window.Cd02OrderGroup,
      ORD = window.CD02_T3_ORDERS;
    const inflight = variant.startsWith("inflight"),
      withNew = variant === "inflight-new",
      done = variant.startsWith("done"),
      manual = variant === "done-manual";
    const NEW = {
      time: "21:10 น.",
      status: "pending",
      items: [{
        st: "waiting",
        name: "สิงห์ดราฟต์",
        qty: 1,
        by: "ต้น",
        price: 140
      }]
    };
    return /*#__PURE__*/React.createElement("aside", {
      "data-heroui": "Drawer",
      "aria-label": "\u0E42\u0E15\u0E4A\u0E30 T3",
      style: {
        width: 400,
        height,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-overlay)",
        borderLeft: "1px solid var(--line)",
        boxShadow: "var(--shadow-dialog)",
        flex: "0 0 auto",
        ...style
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        padding: "14px 12px 12px 20px",
        borderBottom: "1px solid var(--line-hairline)",
        display: "grid",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-title)",
        color: "var(--text-body)"
      }
    }, "\u0E42\u0E15\u0E4A\u0E30 T3"), /*#__PURE__*/React.createElement(StatusChip, {
      kind: "table",
      status: "seated"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "ellipsis",
      label: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "x",
      label: "\u0E1B\u0E34\u0E14"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...NUM
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 16
    }), "\u0E40\u0E1B\u0E34\u0E14 ", done ? "1:58" : "1:50"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user",
      size: 16
    }), "\u0E15\u0E49\u0E19"))), inflight && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 20px 0"
      }
    }, /*#__PURE__*/React.createElement(Alert, {
      tone: "info",
      icon: "lock",
      title: "กำลังรอการชำระเงิน " + baht(1240) + " — ยอดถูกล็อกไว้",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm",
        iconLeft: "qr-code"
      }, "\u0E14\u0E39 QR")
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        padding: "14px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: inflight ? "flex-end" : "flex-start"
      }
    }, inflight && /*#__PURE__*/React.createElement(React.Fragment, null, ORD.slice(withNew ? 1 : 0).map((o, i) => /*#__PURE__*/React.createElement(OG, {
      key: i,
      o: o,
      first: i === 0
    })), withNew && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Divider, {
      label: "\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E43\u0E2B\u0E21\u0E48\u0E2B\u0E25\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 QR \u2014 \u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E43\u0E19\u0E22\u0E2D\u0E14\u0E19\u0E35\u0E49",
      style: {
        margin: "12px 0 6px"
      }
    }), /*#__PURE__*/React.createElement(OG, {
      o: NEW,
      first: true
    }))), done && /*#__PURE__*/React.createElement(Receipt, {
      manual: manual
    })), /*#__PURE__*/React.createElement("footer", {
      style: {
        padding: "14px 20px 16px",
        borderTop: "1px solid var(--line)",
        background: "var(--surface-overlay)",
        boxShadow: "var(--shadow-sheet)",
        display: "grid",
        gap: 10,
        position: "relative",
        zIndex: "var(--z-sticky)"
      }
    }, inflight && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-pos-total)/1.2 var(--font-numeric)",
        color: "var(--text-accent)",
        ...NUM
      }
    }, baht(1240))), withNew && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E2B\u0E25\u0E31\u0E07\u0E0A\u0E33\u0E23\u0E30 (\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E43\u0E2B\u0E21\u0E48)"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-small)/1.5 var(--font-numeric)",
        color: "var(--text-body)",
        ...NUM
      }
    }, baht(140))), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      block: true,
      iconLeft: "banknote",
      isPending: true
    }, "\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      iconLeft: "ban",
      isDisabled: true,
      style: {
        flex: 1
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 / Comp"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      iconLeft: "log-out",
      isDisabled: true
    }, "\u0E1B\u0E34\u0E14\u0E42\u0E15\u0E4A\u0E30")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "lock",
      size: 16
    }), "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 QR \u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E41\u0E01\u0E49\u0E1A\u0E34\u0E25\u0E44\u0E14\u0E49")), done && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-pos-total)/1.2 var(--font-numeric)",
        color: "var(--success-fg)",
        ...NUM
      }
    }, baht(1240))), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      block: true,
      iconLeft: "log-out"
    }, "\u0E1B\u0E34\u0E14\u0E42\u0E15\u0E4A\u0E30"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      block: true,
      iconLeft: "arrow-left"
    }, "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E42\u0E15\u0E4A\u0E30"))));
  }
  function Receipt({
    manual
  }) {
    const items = [["ช้างดราฟต์", 2, 240], ["เนโกรนี", 1, 280], ["ยำหมูยอ", 1, 180], ["โอลด์แฟชั่น", 1, 260], ["สิงห์ดราฟต์", 2, 280]];
    return /*#__PURE__*/React.createElement("div", {
      "data-heroui": "Card",
      style: {
        padding: 16,
        background: "var(--surface-card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
        boxShadow: "var(--shadow-card), var(--highlight-top)",
        display: "grid",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E40\u0E14\u0E2D\u0E30 \u0E25\u0E2D\u0E1F\u0E17\u0E4C \u0E1A\u0E32\u0E23\u0E4C"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)",
        ...NUM
      }
    }, "21:14 \u0E19.")), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)",
        marginTop: -8
      }
    }, "\u0E42\u0E15\u0E4A\u0E30 T3 \xB7 \u0E15\u0E49\u0E19, \u0E1A\u0E35\u0E21"), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 2
      }
    }, items.map(([n, q, p]) => /*#__PURE__*/React.createElement("div", {
      key: n,
      style: {
        display: "flex",
        gap: 8,
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, q > 1 && /*#__PURE__*/React.createElement("span", {
      style: NUM
    }, q, "\xD7 "), n), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-body)",
        ...NUM
      }
    }, baht(p))))), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E23\u0E27\u0E21"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-price)",
        color: "var(--text-body)",
        ...NUM
      }
    }, baht(1240))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "qr-code",
      size: 16
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, "PromptPay \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: NUM
    }, baht(1240))), /*#__PURE__*/React.createElement(StatusChip, {
      kind: "payment",
      status: "completed",
      size: "sm"
    }), manual && /*#__PURE__*/React.createElement(Badge, {
      tone: "warning",
      size: "sm",
      dot: true
    }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E14\u0E49\u0E27\u0E22\u0E15\u0E19\u0E40\u0E2D\u0E07")));
  }

  /* board helpers */
  function Cd03Head({
    id,
    title,
    note
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-micro)/1 var(--font-ui)",
        letterSpacing: "var(--ls-caps)",
        color: "var(--text-accent)"
      }
    }, "CD-03/", id), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, title), note && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, note));
  }
  function Note({
    children,
    icon = "info",
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "10px 12px",
        border: "1px dashed var(--line-strong)",
        borderRadius: "var(--r-sm)",
        font: "var(--text-small)",
        color: "var(--text-muted)",
        ...style
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-faint)",
        display: "inline-flex",
        paddingTop: 2
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 16
    })), /*#__PURE__*/React.createElement("span", null, children));
  }
  function Frame({
    w,
    h,
    zoom = 1,
    children,
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: w,
        height: h,
        zoom,
        position: "relative",
        overflow: "hidden",
        flex: "0 0 auto",
        background: "var(--bg-app)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
        ...style
      }
    }, children);
  }
  /* full-screen context: grid + drawer + modal */
  function PayContext({
    modal,
    drawer
  }) {
    const {
      Cd02Shell,
      GridView,
      TablePanel
    } = window;
    return /*#__PURE__*/React.createElement(Cd02Shell, {
      overlay: /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          left: 88,
          top: 56,
          right: 0,
          bottom: 0,
          zIndex: "var(--z-scrim)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          top: 0,
          right: 0
        }
      }, drawer || /*#__PURE__*/React.createElement(TablePanel, null)), modal)
    }, /*#__PURE__*/React.createElement(GridView, {
      selected: "T3"
    }));
  }
  Object.assign(window, {
    cd03Baht: baht,
    cd03Parts: parts,
    CheckoutModal,
    SplitModal,
    PPModal,
    PartList,
    SplitProgressModal,
    CashModal,
    ManualModal,
    PayDrawer,
    Cd03Receipt: Receipt,
    Cd03Head,
    Cd03Note: Note,
    Cd03Frame: Frame,
    PayContext,
    BillSummary
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-v2/cd-03/cd03-kit.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-v2/cd-04/cd04-kit.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
(() => {
  const DS = window.TheLoftBarDesignSystem_99bbff;
  const {
    Badge,
    StatusChip,
    Button,
    Icon,
    IconButton,
    Alert,
    Skeleton,
    Tag,
    Tabs,
    SearchField,
    QuantityStepper,
    ToastRegion,
    Toast
  } = DS;
  const baht = n => "฿" + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const NUM = {
    fontVariantNumeric: "tabular-nums"
  };

  /* ---------- data: CD-01 menu + charge item ---------- */
  const MENU = [{
    id: "chang",
    name: "ช้างดราฟต์",
    cat: "draft",
    price: 120
  }, {
    id: "singha",
    name: "สิงห์ดราฟต์",
    cat: "draft",
    price: 140
  }, {
    id: "leo",
    name: "ลีโอขวด",
    cat: "draft",
    price: 100
  }, {
    id: "negroni",
    name: "เนโกรนี",
    cat: "cocktail",
    price: 240
  }, {
    id: "oldfa",
    name: "โอลด์แฟชั่น",
    cat: "cocktail",
    price: 260,
    from: true
  }, {
    id: "highball",
    name: "ไฮบอลมะนาวโซดา",
    cat: "highball",
    price: 180
  }, {
    id: "yum",
    name: "ยำหมูยอ",
    cat: "food",
    price: 150,
    soldOut: true
  }, {
    id: "nuts",
    name: "ถั่วทอดสมุนไพร",
    cat: "food",
    price: 80
  }, {
    id: "cork",
    name: "ค่าเปิดขวด",
    cat: "charge",
    price: 300,
    charge: true
  }];
  const CATS = [{
    value: "all",
    label: "ทั้งหมด"
  }, {
    value: "draft",
    label: "เบียร์สด"
  }, {
    value: "cocktail",
    label: "ค็อกเทล"
  }, {
    value: "highball",
    label: "ไฮบอล"
  }, {
    value: "food",
    label: "อาหาร"
  }, {
    value: "charge",
    label: "ค่าบริการ"
  }];
  const CART = [{
    id: "chang",
    name: "ช้างดราฟต์",
    qty: 2,
    by: "ต้น",
    price: 240
  }, {
    id: "oldfa",
    name: "โอลด์แฟชั่น",
    qty: 1,
    mod: "ปกติ · เชอร์รี่ · น้ำแข็งก้อนใหญ่",
    by: "บีม",
    price: 280
  }, {
    id: "leo",
    name: "ลีโอขวด",
    qty: 1,
    by: "ต้น",
    note: "ไม่ใส่น้ำแข็ง",
    price: 100
  }];
  const YUM = {
    id: "yum",
    name: "ยำหมูยอ",
    qty: 1,
    by: "บีม",
    price: 150,
    void: true
  };
  const CORK = {
    id: "cork",
    name: "ค่าเปิดขวด",
    qty: 1,
    by: "บีม",
    price: 300,
    charge: true
  };
  const qtyOf = lines => lines.reduce((m, l) => l.void ? m : (m[l.id] = (m[l.id] || 0) + l.qty, m), {});

  /* ---------- part markers (numbered → HeroUI legend) ---------- */
  const AnnotCtx = React.createContext(false);
  function Mk({
    n,
    style
  }) {
    const on = React.useContext(AnnotCtx);
    if (!on) return null;
    return /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        position: "absolute",
        zIndex: "var(--z-toast)",
        width: 20,
        height: 20,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "var(--text-body)",
        color: "var(--bg-app)",
        font: "var(--fw-bold) var(--fs-micro)/1 var(--font-ui)",
        boxShadow: "var(--shadow-raised)",
        pointerEvents: "none",
        ...NUM,
        ...style
      }
    }, n);
  }
  const PARTS = [[1, "ปุ่มกลับ", "Button ghost"], [2, "สถานะโต๊ะ", "Chip (StatusChip)"], [3, "ค้นหาเมนู", "SearchField"], [4, "หมวดเมนู", "Tabs"], [5, "ไทล์เมนู", "Card (pressable)"], [6, "จำนวนในตะกร้า", "Badge"], [7, "หมด", "Chip tone void"], [8, "ชื่อผู้สั่ง", "Chip (selectable)"], [9, "จำนวน", "NumberField (stepper)"], [10, "ลบรายการ", "Button isIconOnly"], [11, "เส้นคั่น", "Divider"], [12, "ส่งออเดอร์", "Button primary lg"]];
  function Divider({
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      role: "separator",
      "data-heroui": "Divider",
      style: {
        height: 1,
        background: "var(--line-hairline)",
        ...style
      }
    });
  }

  /* ---------- menu tile (HeroUI Card pressable · Badge · Chip) ---------- */
  function MenuTile({
    it,
    qty = 0,
    mk
  }) {
    const so = it.soldOut;
    return /*#__PURE__*/React.createElement("div", {
      role: "button",
      "aria-disabled": so || undefined,
      "data-heroui": "Card",
      style: {
        position: "relative",
        height: 96,
        padding: "10px 12px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "var(--surface-card)",
        border: "1px solid " + (qty ? "var(--line-accent-soft)" : "var(--line)"),
        borderRadius: "var(--r-card)",
        boxShadow: "var(--shadow-card), var(--highlight-top)",
        opacity: so ? .5 : 1,
        cursor: so ? "default" : "pointer",
        minWidth: 0
      }
    }, mk && !so && /*#__PURE__*/React.createElement(Mk, {
      n: 5,
      style: {
        left: -8,
        top: -8
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-body)/1.4 var(--font-ui)",
        color: "var(--text-body)",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        paddingRight: qty ? 20 : 0
      }
    }, it.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0
      }
    }, so ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(StatusChip, {
      kind: "menu",
      status: "soldout",
      size: "sm"
    }), mk && /*#__PURE__*/React.createElement(Mk, {
      n: 7,
      style: {
        left: -10,
        top: -12
      }
    })) : /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-body)/1.3 var(--font-numeric)",
        color: "var(--text-accent)",
        whiteSpace: "nowrap",
        ...NUM
      }
    }, it.from && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-regular) var(--fs-small)/1 var(--font-ui)",
        color: "var(--text-muted)",
        marginRight: 4
      }
    }, "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19"), baht(it.price)), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), it.from && !so && /*#__PURE__*/React.createElement(Icon, {
      name: "sliders-horizontal",
      size: 16,
      color: "var(--text-faint)"
    }), it.charge && /*#__PURE__*/React.createElement(Icon, {
      name: "user-round",
      size: 16,
      color: "var(--text-faint)"
    })), qty > 0 && /*#__PURE__*/React.createElement("span", {
      "data-heroui": "Badge",
      style: {
        position: "absolute",
        top: -8,
        right: -8,
        minWidth: 24,
        height: 24,
        padding: "0 7px",
        boxSizing: "border-box",
        borderRadius: "var(--r-pill)",
        background: "var(--accent)",
        color: "var(--text-on-accent)",
        display: "grid",
        placeItems: "center",
        font: "var(--fw-bold) var(--fs-small)/1 var(--font-numeric)",
        boxShadow: "0 0 0 2px var(--bg-app)",
        ...NUM
      }
    }, qty, mk && /*#__PURE__*/React.createElement(Mk, {
      n: 6,
      style: {
        right: -16,
        top: -14
      }
    })));
  }

  /* ---------- left: SearchField · Tabs · tile grid ---------- */
  function MenuPane({
    state = "loaded",
    query = "",
    cat = "all",
    qtys = {},
    tileMin = 150,
    pad = "16px 20px 20px 24px"
  }) {
    const loading = state === "loading",
      error = state === "error",
      nores = state === "noresult";
    const items = cat === "all" ? MENU : MENU.filter(m => m.cat === cat);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: pad,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        maxWidth: 360
      }
    }, /*#__PURE__*/React.createElement(Mk, {
      n: 3,
      style: {
        left: -8,
        top: -8
      }
    }), /*#__PURE__*/React.createElement(SearchField, {
      placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E21\u0E19\u0E39",
      value: nores ? "มาร์การิต้า" : query,
      isDisabled: loading || error
    })), loading ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 20,
        height: 47,
        alignItems: "center",
        borderBottom: "1px solid var(--line-hairline)"
      }
    }, [52, 60, 56, 44, 44, 60].map((w, i) => /*#__PURE__*/React.createElement(Skeleton, {
      key: i,
      width: w,
      height: 14
    }))) : /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(Mk, {
      n: 4,
      style: {
        left: -8,
        top: -4
      }
    }), /*#__PURE__*/React.createElement(Tabs, {
      items: CATS,
      value: cat,
      style: {
        gap: 18,
        flexWrap: "nowrap",
        overflow: "hidden"
      }
    })), error && /*#__PURE__*/React.createElement(Alert, {
      tone: "danger",
      title: "\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E21\u0E19\u0E39\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm",
        iconLeft: "rotate-cw"
      }, "\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07")
    }, "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14"), nores && /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        justifyItems: "center",
        gap: 8,
        textAlign: "center",
        marginTop: -40
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-raised)",
        color: "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search-x",
      size: 24
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E21\u0E19\u0E39\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, "\u0E25\u0E2D\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E14\u0E49\u0E27\u0E22\u0E04\u0E33\u0E2D\u0E37\u0E48\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07"))), !error && !nores && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill,minmax(${tileMin}px,1fr))`,
        gap: 12,
        paddingTop: 8,
        alignContent: "start"
      }
    }, loading ? Array.from({
      length: 9
    }).map((_, i) => /*#__PURE__*/React.createElement(Skeleton, {
      key: i,
      height: 96,
      radius: "var(--r-card)"
    })) : items.map((it, i) => /*#__PURE__*/React.createElement(MenuTile, {
      key: it.id,
      it: it,
      qty: qtys[it.id] || 0,
      mk: it.id === "chang" || it.id === "yum"
    }))));
  }

  /* ---------- name chips (Chip selectable) ---------- */
  function NameChips({
    value = "ต้น",
    disabled,
    invalid,
    mk,
    size
  }) {
    return /*#__PURE__*/React.createElement("div", {
      role: "group",
      "aria-label": "\u0E2A\u0E31\u0E48\u0E07\u0E42\u0E14\u0E22",
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        position: "relative"
      }
    }, mk && /*#__PURE__*/React.createElement(Mk, {
      n: 8,
      style: {
        left: -8,
        top: -8
      }
    }), ["ต้น", "บีม"].map(n => /*#__PURE__*/React.createElement(Tag, {
      key: n,
      isSelected: value === n,
      isDisabled: disabled,
      style: invalid ? {
        borderColor: "var(--danger)"
      } : size === "lg" ? {
        height: 44,
        padding: "0 18px"
      } : undefined
    }, n)), /*#__PURE__*/React.createElement(Tag, {
      isDisabled: disabled,
      style: size === "lg" ? {
        height: 44,
        padding: "0 18px"
      } : undefined
    }, "+ \u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E21\u0E48"));
  }

  /* ---------- cart line ---------- */
  function CartLineX({
    l,
    locked,
    mk,
    swipe
  }) {
    if (l.void) return /*#__PURE__*/React.createElement("div", {
      "data-state": "unavailable",
      style: {
        margin: "10px 0",
        padding: 12,
        display: "grid",
        gap: 8,
        background: "var(--status-void-bg)",
        border: "1px solid var(--status-void-border)",
        borderRadius: "var(--r-card)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: "grid",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        font: "var(--fw-semibold) var(--fs-body)/1.4 var(--font-ui)",
        color: "var(--text-body)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: NUM
    }, l.qty, "\xD7"), l.name, /*#__PURE__*/React.createElement(StatusChip, {
      kind: "menu",
      status: "soldout",
      size: "sm"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-semibold) var(--fs-small)/1.5 var(--font-ui)",
        color: "var(--status-void-fg)"
      }
    }, "\u0E2B\u0E21\u0E14\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E25\u0E1A\u0E2D\u0E2D\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E48\u0E07\u0E15\u0E48\u0E2D"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, "\u0E2A\u0E31\u0E48\u0E07\u0E42\u0E14\u0E22 ", l.by)), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-faint)",
        textDecoration: "line-through",
        ...NUM
      }
    }, baht(l.price))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "flex-end"
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      size: "sm",
      iconLeft: "trash-2",
      isDisabled: locked
    }, "\u0E25\u0E1A\u0E2D\u0E2D\u0E01")));
    const body = /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 0",
        display: "grid",
        gap: 8,
        position: "relative",
        background: swipe ? "var(--surface-overlay)" : undefined,
        transform: swipe ? "translateX(-88px)" : undefined
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: "grid",
        gap: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        font: "var(--fw-semibold) var(--fs-body)/1.4 var(--font-ui)",
        color: "var(--text-body)"
      }
    }, l.name, l.charge && /*#__PURE__*/React.createElement(Badge, {
      tone: "info",
      size: "sm"
    }, "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23")), l.mod && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, l.mod), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, "\u0E2A\u0E31\u0E48\u0E07\u0E42\u0E14\u0E22 ", l.by), l.note && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38: ", l.note)), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)",
        ...NUM
      }
    }, baht(l.price))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("span", {
      "data-heroui": "NumberField",
      style: {
        position: "relative"
      }
    }, mk && /*#__PURE__*/React.createElement(Mk, {
      n: 9,
      style: {
        left: -8,
        top: -8
      }
    }), /*#__PURE__*/React.createElement(QuantityStepper, {
      value: l.qty,
      min: 1,
      disabled: locked
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative"
      }
    }, mk && /*#__PURE__*/React.createElement(Mk, {
      n: 10,
      style: {
        right: -6,
        top: -8
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "x",
      label: "\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
      size: "sm",
      isDisabled: locked
    }))));
    if (!swipe) return body;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        overflow: "hidden",
        margin: "0 -20px",
        padding: "0 20px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        bottom: 0,
        right: 0,
        width: 88,
        display: "grid",
        placeItems: "center",
        background: "var(--danger-bg)",
        color: "var(--danger-fg)",
        borderLeft: "1px solid var(--danger-border)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "grid",
        justifyItems: "center",
        gap: 4,
        font: "var(--fw-semibold) var(--fs-small)/1 var(--font-ui)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash-2",
      size: 20
    }), "\u0E25\u0E1A")), body);
  }

  /* ---------- right: cart column 360 ---------- */
  function CartPane({
    lines: ln = CART,
    state = "ready",
    name = "ต้น",
    width = 360,
    top
  }) {
    const lines = state === "empty" ? [] : ln;
    const loading = state === "loading",
      empty = state === "empty" || lines.length === 0,
      sending = state === "sending",
      closed = state === "closed";
    const locked = sending || closed;
    const live = lines.filter(l => !l.void);
    const count = live.reduce((s, l) => s + l.qty, 0),
      total = live.reduce((s, l) => s + l.price, 0);
    const hasVoid = lines.some(l => l.void);
    return /*#__PURE__*/React.createElement("aside", {
      "aria-label": "\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32",
      style: {
        width,
        flex: "0 0 auto",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--line)",
        background: "var(--surface-overlay)",
        minHeight: 0
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        padding: "14px 20px 14px",
        display: "grid",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-heading)",
        color: "var(--text-body)"
      }
    }, "\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32"), loading ? /*#__PURE__*/React.createElement(Skeleton, {
      width: 28,
      height: 20,
      rounded: true
    }) : /*#__PURE__*/React.createElement(Badge, {
      tone: count ? "accent" : "neutral",
      size: "sm"
    }, /*#__PURE__*/React.createElement("span", {
      style: NUM
    }, count))), loading ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      width: 56,
      height: 36,
      rounded: true
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: 56,
      height: 36,
      rounded: true
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: 96,
      height: 36,
      rounded: true
    })) : /*#__PURE__*/React.createElement(NameChips, {
      value: name,
      disabled: locked,
      mk: true
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(Mk, {
      n: 11,
      style: {
        right: 12,
        top: -10
      }
    }), /*#__PURE__*/React.createElement(Divider, null)), top && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 20px 0",
        display: "grid",
        gap: 8
      }
    }, top), !top && hasVoid && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 20px 0"
      }
    }, /*#__PURE__*/React.createElement(Alert, {
      tone: "danger",
      title: "\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E2B\u0E21\u0E14\u0E41\u0E25\u0E49\u0E27 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        padding: "0 20px"
      }
    }, loading && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 20,
        paddingTop: 16
      }
    }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Skeleton, {
      width: "55%",
      height: 16
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: 64,
      height: 16
    })), /*#__PURE__*/React.createElement(Skeleton, {
      width: "40%",
      height: 12
    }), /*#__PURE__*/React.createElement(Skeleton, {
      width: 100,
      height: 36,
      radius: "var(--r-btn)"
    })))), !loading && empty && /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        justifyItems: "center",
        gap: 10,
        textAlign: "center",
        padding: "0 12px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "var(--surface-raised)",
        color: "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shopping-basket",
      size: 24
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E41\u0E15\u0E30\u0E40\u0E21\u0E19\u0E39\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E34\u0E48\u0E21"))), !loading && !empty && lines.map((l, i) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: l.id + i
    }, i > 0 && !l.void && !lines[i - 1].void && /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(CartLineX, {
      l: l,
      locked: locked,
      mk: i === 0,
      swipe: l.swipe
    })))), /*#__PURE__*/React.createElement("footer", {
      style: {
        padding: "14px 20px 16px",
        borderTop: "1px solid var(--line)",
        background: "var(--surface-overlay)",
        boxShadow: "var(--shadow-sheet)",
        display: "grid",
        gap: 12,
        position: "relative",
        zIndex: "var(--z-sticky)"
      }
    }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Skeleton, {
      width: "100%",
      height: 40
    }), /*#__PURE__*/React.createElement(Skeleton, {
      height: 52,
      radius: "var(--r-btn)"
    })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, "\u0E23\u0E27\u0E21"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-pos-total)/1.2 var(--font-numeric)",
        color: empty ? "var(--text-faint)" : "var(--text-accent)",
        ...NUM
      }
    }, baht(empty ? 0 : total))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(Mk, {
      n: 12,
      style: {
        left: -8,
        top: -8
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      block: true,
      iconLeft: "send",
      isPending: sending,
      isDisabled: empty || hasVoid || closed
    }, "\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C")))));
  }

  /* ---------- order screen content area ---------- */
  function OrderHeader() {
    return /*#__PURE__*/React.createElement("header", {
      style: {
        height: 64,
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 20px 0 12px",
        borderBottom: "1px solid var(--line-hairline)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(Mk, {
      n: 1,
      style: {
        left: -6,
        top: -8
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      iconLeft: "arrow-left"
    }, "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E42\u0E15\u0E4A\u0E30 T3")), /*#__PURE__*/React.createElement("span", {
      role: "separator",
      "data-heroui": "Divider",
      style: {
        width: 1,
        height: 24,
        background: "var(--line)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-title)",
        color: "var(--text-body)",
        whiteSpace: "nowrap"
      }
    }, "\u0E2A\u0E31\u0E48\u0E07\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C \u2014 T3"), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(Mk, {
      n: 2,
      style: {
        right: -14,
        top: -10
      }
    }), /*#__PURE__*/React.createElement(StatusChip, {
      kind: "table",
      status: "seated"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        font: "var(--text-small)",
        color: "var(--text-muted)",
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "users",
      size: 16
    }), "\u0E15\u0E49\u0E19, \u0E1A\u0E35\u0E21"));
  }
  function OrderView({
    menu = {},
    cart = {},
    toasts,
    tileMin
  }) {
    const lines = cart.lines || CART;
    const qtys = menu.qtys || (cart.state === "empty" ? {} : qtyOf(lines));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(OrderHeader, null), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minHeight: 0,
        display: "flex"
      }
    }, /*#__PURE__*/React.createElement(MenuPane, _extends({}, menu, {
      qtys: qtys,
      tileMin: tileMin
    })), /*#__PURE__*/React.createElement(CartPane, _extends({}, cart, {
      lines: cart.state === "empty" ? [] : lines
    }))), toasts && /*#__PURE__*/React.createElement(ToastRegion, {
      placement: "top-right",
      style: {
        top: 76
      }
    }, toasts));
  }

  /* ---------- board chrome ---------- */
  function Cd04Head({
    id,
    title,
    note
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--fw-bold) var(--fs-micro)/1 var(--font-ui)",
        letterSpacing: "var(--ls-caps)",
        color: "var(--text-accent)"
      }
    }, "CD-04/", id), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-subhead)",
        color: "var(--text-body)"
      }
    }, title), note && /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-faint)"
      }
    }, note));
  }
  function Frame({
    w,
    h,
    zoom = 1,
    children,
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: w,
        height: h,
        zoom,
        position: "relative",
        overflow: "hidden",
        flex: "0 0 auto",
        background: "var(--bg-app)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
        ...style
      }
    }, children);
  }
  function Note({
    children,
    icon = "info",
    style
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "10px 12px",
        border: "1px dashed var(--line-strong)",
        borderRadius: "var(--r-sm)",
        font: "var(--text-small)",
        color: "var(--text-muted)",
        ...style
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-faint)",
        display: "inline-flex",
        paddingTop: 2
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 16
    })), /*#__PURE__*/React.createElement("span", null, children));
  }
  Object.assign(window, {
    CD04_MENU: MENU,
    CD04_CART: CART,
    CD04_YUM: YUM,
    CD04_CORK: CORK,
    CD04_PARTS: PARTS,
    Cd04AnnotCtx: AnnotCtx,
    Cd04Mk: Mk,
    MenuTile,
    MenuPane,
    NameChips,
    CartLineX,
    CartPane,
    OrderHeader,
    OrderView,
    Cd04Head,
    Cd04Frame: Frame,
    Cd04Note: Note,
    Cd04Divider: Divider,
    cd04Baht: baht,
    cd04QtyOf: qtyOf
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-v2/cd-04/cd04-kit.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pos-v2/cd-04/cd04-sheets.jsx
try { (() => {
(() => {
  const DS = window.TheLoftBarDesignSystem_99bbff;
  const {
    Dialog,
    Button,
    IconButton,
    Badge,
    Radio,
    Checkbox,
    QuantityStepper,
    Icon
  } = DS;
  const baht = window.cd04Baht;
  const NUM = {
    fontVariantNumeric: "tabular-nums"
  };
  const {
    NameChips
  } = window;

  /* option row: touch-sized (52px) wrapper around HeroUI Radio / Checkbox */
  function Opt({
    sel,
    off,
    invalid,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: 52,
        boxSizing: "border-box",
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        borderRadius: "var(--r-btn)",
        background: sel && !off ? "var(--accent-soft)" : "var(--surface-input)",
        border: "1px solid " + (invalid ? "var(--danger)" : sel && !off ? "var(--line-accent)" : "var(--line)")
      }
    }, children);
  }
  function Group({
    label,
    tag,
    tagTone = "neutral",
    helper,
    error,
    heroui,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      role: "group",
      "data-heroui": heroui,
      "aria-invalid": error ? true : undefined,
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: error ? "var(--text-danger)" : "var(--text-body)",
        whiteSpace: "nowrap"
      }
    }, label), tag && /*#__PURE__*/React.createElement(Badge, {
      tone: error ? "danger" : tagTone,
      size: "sm"
    }, tag)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 6
      }
    }, children), helper && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        alignItems: "center",
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "info",
      size: 16
    }), helper), error && /*#__PURE__*/React.createElement("div", {
      "data-heroui": "FieldError",
      style: {
        display: "flex",
        gap: 6,
        alignItems: "center",
        font: "var(--fw-semibold) var(--fs-small)/1.5 var(--font-ui)",
        color: "var(--text-danger)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "circle-alert",
      size: 16
    }), error));
  }
  function TextAreaField({
    label,
    placeholder,
    value
  }) {
    return /*#__PURE__*/React.createElement("label", {
      "data-heroui": "TextArea",
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, label), /*#__PURE__*/React.createElement("textarea", {
      readOnly: true,
      rows: 2,
      placeholder: placeholder,
      value: value || "",
      style: {
        resize: "none",
        boxSizing: "border-box",
        width: "100%",
        minHeight: 76,
        padding: "10px 12px",
        background: "var(--surface-input)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-input)",
        color: "var(--text-body)",
        font: "var(--text-body-md)",
        outline: "none"
      }
    }));
  }

  /* CD-04/item-sheet — HeroUI Modal 680, two columns so it fits 1280×800 and 1024×768 without scrolling */
  function ItemSheet({
    state = "default"
  }) {
    const req = state === "required",
      max = state === "max";
    const ice = req ? null : "large";
    const tops = max ? ["peel", "cherry"] : ["cherry"];
    const TOPS = [["peel", "เปลือกส้ม", 0], ["cherry", "เชอร์รี่", 20], ["smoke", "ควันซินนามอน", 20]];
    const price = 260 + TOPS.filter(t => tops.includes(t[0])).reduce((s, t) => s + t[2], 0);
    return /*#__PURE__*/React.createElement(Dialog, {
      isDismissable: false,
      style: {
        width: 680,
        padding: 0,
        maxWidth: "calc(100% - 32px)"
      },
      title: /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "20px 16px 0 24px"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          display: "grid",
          gap: 2
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          font: "var(--text-heading)",
          color: "var(--text-body)"
        }
      }, "\u0E42\u0E2D\u0E25\u0E14\u0E4C\u0E41\u0E1F\u0E0A\u0E31\u0E48\u0E19"), /*#__PURE__*/React.createElement("span", {
        style: {
          font: "var(--text-small)",
          color: "var(--text-muted)"
        }
      }, "\u0E04\u0E47\u0E2D\u0E01\u0E40\u0E17\u0E25 \xB7 \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 ", /*#__PURE__*/React.createElement("span", {
        style: NUM
      }, baht(260)))), /*#__PURE__*/React.createElement(IconButton, {
        icon: "x",
        label: "\u0E1B\u0E34\u0E14"
      }))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
        gap: 24,
        padding: "8px 24px 20px",
        borderBottom: "1px solid var(--line-hairline)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 20,
        alignContent: "start"
      }
    }, /*#__PURE__*/React.createElement(Group, {
      label: "\u0E02\u0E19\u0E32\u0E14",
      tag: "\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01 1",
      heroui: "RadioGroup"
    }, /*#__PURE__*/React.createElement(Opt, {
      sel: true
    }, /*#__PURE__*/React.createElement(Radio, {
      isSelected: true,
      label: "\u0E1B\u0E01\u0E15\u0E34",
      trailing: baht(260),
      style: {
        flex: 1
      }
    })), /*#__PURE__*/React.createElement(Opt, null, /*#__PURE__*/React.createElement(Radio, {
      label: "\u0E14\u0E31\u0E1A\u0E40\u0E1A\u0E34\u0E25",
      trailing: baht(360),
      style: {
        flex: 1
      }
    }))), /*#__PURE__*/React.createElement(Group, {
      label: "\u0E17\u0E47\u0E2D\u0E1B\u0E1B\u0E34\u0E49\u0E07",
      tag: "\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A \xB7 \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 2",
      heroui: "CheckboxGroup",
      helper: max ? "เลือกได้สูงสุด 2" : null
    }, TOPS.map(([k, l, p]) => {
      const on = tops.includes(k),
        off = max && !on;
      return /*#__PURE__*/React.createElement(Opt, {
        key: k,
        sel: on,
        off: off
      }, /*#__PURE__*/React.createElement(Checkbox, {
        isSelected: on,
        isDisabled: off,
        label: l,
        style: {
          flex: 1,
          alignItems: "center"
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          font: "var(--text-body-md)",
          color: off ? "var(--text-faint)" : "var(--text-muted)",
          ...NUM
        }
      }, "+", baht(p)));
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 20,
        alignContent: "start"
      }
    }, /*#__PURE__*/React.createElement(Group, {
      label: "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E41\u0E02\u0E47\u0E07",
      tag: "\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01 1",
      tagTone: "neutral",
      heroui: "RadioGroup",
      error: req ? "กรุณาเลือกระดับน้ำแข็ง" : null
    }, [["large", "ก้อนใหญ่"], ["normal", "ปกติ"], ["none", "ไม่ใส่"]].map(([k, l]) => /*#__PURE__*/React.createElement(Opt, {
      key: k,
      sel: ice === k,
      invalid: req
    }, /*#__PURE__*/React.createElement(Radio, {
      isSelected: ice === k,
      label: l,
      style: {
        flex: 1
      }
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E2A\u0E31\u0E48\u0E07\u0E42\u0E14\u0E22"), /*#__PURE__*/React.createElement(NameChips, {
      value: "\u0E1A\u0E35\u0E21",
      size: "lg"
    })), /*#__PURE__*/React.createElement(TextAreaField, {
      label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)",
      placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2B\u0E27\u0E32\u0E19\u0E19\u0E49\u0E2D\u0E22"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "16px 24px 20px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      "data-heroui": "NumberField"
    }, /*#__PURE__*/React.createElement(QuantityStepper, {
      value: 1,
      min: 1,
      size: "lg"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "lg"
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      iconLeft: "plus",
      isDisabled: req
    }, /*#__PURE__*/React.createElement("span", {
      style: NUM
    }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E07\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32 \xB7 ", baht(price)))));
  }

  /* CD-04/charge — small Modal, name required */
  function ChargeSheet({
    chosen
  }) {
    return /*#__PURE__*/React.createElement(Dialog, {
      isDismissable: false,
      style: {
        width: 420
      },
      title: "\u0E04\u0E34\u0E14\u0E01\u0E31\u0E1A\u0E43\u0E04\u0E23?",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary"
      }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        iconLeft: "plus",
        isDisabled: !chosen
      }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E07\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        padding: "10px 14px",
        background: "var(--surface-raised)",
        borderRadius: "var(--r-card)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E04\u0E48\u0E32\u0E40\u0E1B\u0E34\u0E14\u0E02\u0E27\u0E14"), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-price)",
        color: "var(--text-accent)",
        ...NUM
      }
    }, baht(300))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-body-strong)",
        color: "var(--text-body)"
      }
    }, "\u0E2A\u0E31\u0E48\u0E07\u0E42\u0E14\u0E22"), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral",
      size: "sm"
    }, "\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01 1")), /*#__PURE__*/React.createElement(NameChips, {
      value: chosen,
      size: "lg"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-small)",
        color: "var(--text-muted)"
      }
    }, "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"))));
  }

  /* CD-04/leave-confirm — AlertDialog */
  function LeaveDialog() {
    return /*#__PURE__*/React.createElement(Dialog, {
      tone: "danger",
      isDismissable: false,
      title: "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32?",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary"
      }, "\u0E2D\u0E22\u0E39\u0E48\u0E15\u0E48\u0E2D"), /*#__PURE__*/React.createElement(Button, {
        variant: "danger",
        iconLeft: "trash-2"
      }, "\u0E17\u0E34\u0E49\u0E07\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32"))
    }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E15\u0E30\u0E01\u0E23\u0E49\u0E32\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07");
  }
  Object.assign(window, {
    ItemSheet,
    ChargeSheet,
    LeaveDialog,
    Cd04Opt: Opt,
    Cd04Group: Group,
    Cd04TextArea: TextAreaField
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-v2/cd-04/cd04-sheets.jsx", error: String((e && e.message) || e) }); }

// ui_kits/staff-mobile/OrdersScreen.jsx
try { (() => {
const {
  TopBar,
  IconButton,
  Icon,
  Tabs,
  OrderTicket,
  Button,
  EmptyState,
  Toast
} = window.TheLoftBarDesignSystem_99bbff;
function OrdersScreen({
  orders,
  advance,
  toast
}) {
  const [tab, setTab] = React.useState("new");
  const filtered = orders.filter(o => o.status === tab);
  const count = s => orders.filter(o => o.status === s).length;
  const nextLabel = {
    new: "รับออเดอร์",
    making: "เสิร์ฟแล้ว"
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "statusbar"
  }, /*#__PURE__*/React.createElement("span", null, "19:48"), /*#__PURE__*/React.createElement("span", null, "\u0E01\u0E30\u0E14\u0E36\u0E01 \xB7 \u0E1D\u0E49\u0E32\u0E22")), /*#__PURE__*/React.createElement(TopBar, {
    title: "\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E40\u0E02\u0E49\u0E32",
    subtitle: "\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34",
    sticky: false,
    right: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "bell"
      }),
      label: "\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19",
      active: true
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "refresh-cw"
      }),
      label: "\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A"
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: "new",
      label: "ใหม่",
      count: count("new")
    }, {
      value: "making",
      label: "กำลังทำ",
      count: count("making")
    }, {
      value: "served",
      label: "เสิร์ฟแล้ว",
      count: count("served")
    }]
  })), /*#__PURE__*/React.createElement("div", {
    className: "scroll",
    style: {
      padding: "12px 16px",
      display: "grid",
      gap: 12,
      alignContent: "start"
    }
  }, filtered.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "receipt-text",
      size: 30
    }),
    title: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E19\u0E35\u0E49",
    description: "\u0E2D\u0E2D\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E43\u0E2B\u0E21\u0E48\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E17\u0E31\u0E19\u0E17\u0E35"
  }) : filtered.map(o => /*#__PURE__*/React.createElement(OrderTicket, {
    key: o.id,
    table: o.table,
    time: o.time,
    status: o.status,
    statusLabel: o.statusLabel,
    lines: o.lines,
    total: o.total,
    actions: o.status === "served" ? /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      iconLeft: /*#__PURE__*/React.createElement(Icon, {
        name: "receipt-text",
        size: 16
      })
    }, "\u0E14\u0E39\u0E1A\u0E34\u0E25") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost"
    }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      onClick: () => advance(o.id)
    }, nextLabel[o.status]))
  }))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 88
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle",
      size: 18
    })
  }, toast)));
}
Object.assign(window, {
  OrdersScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/staff-mobile/OrdersScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/staff-mobile/StockScreen.jsx
try { (() => {
const {
  TopBar,
  Icon,
  Input,
  Card,
  Switch,
  Badge,
  Button
} = window.TheLoftBarDesignSystem_99bbff;
function StockScreen() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState([{
    name: "ช้างดราฟต์",
    left: "ถัง 1 · ~18 แก้ว",
    on: true,
    low: true
  }, {
    name: "สิงห์ดราฟต์",
    left: "ถัง 2 · ~60 แก้ว",
    on: true
  }, {
    name: "คัมปารี",
    left: "ขวด 1 · ~12 แก้ว",
    on: true,
    low: true
  }, {
    name: "ยำหมูยอ",
    left: "วัตถุดิบหมด",
    on: false
  }, {
    name: "ถั่วทอดสมุนไพร",
    left: "พอ",
    on: true
  }]);
  const toggle = (i, v) => setRows(r => r.map((x, j) => j === i ? {
    ...x,
    on: v
  } : x));
  const list = rows.filter(r => r.name.includes(q));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "statusbar"
  }, /*#__PURE__*/React.createElement("span", null, "19:48"), /*#__PURE__*/React.createElement("span", null, "\u0E01\u0E30\u0E14\u0E36\u0E01 \xB7 \u0E1D\u0E49\u0E32\u0E22")), /*#__PURE__*/React.createElement(TopBar, {
    title: "\u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E41\u0E25\u0E30\u0E40\u0E21\u0E19\u0E39",
    subtitle: "\u0E1B\u0E34\u0E14\u0E02\u0E32\u0E22\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E2B\u0E21\u0E14",
    sticky: false
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 16px"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    value: q,
    onChange: setQ,
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E21\u0E19\u0E39\u0E2B\u0E23\u0E37\u0E2D\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A",
    prefix: /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 18
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "scroll",
    style: {
      padding: "0 16px 16px",
      display: "grid",
      gap: 10,
      alignContent: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "accent",
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 18,
    color: "var(--text-accent)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-body)"
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E32\u0E14\u0E27\u0E48\u0E32\u0E0A\u0E49\u0E32\u0E07\u0E14\u0E23\u0E32\u0E1F\u0E15\u0E4C\u0E08\u0E30\u0E2B\u0E21\u0E14\u0E01\u0E48\u0E2D\u0E19\u0E1B\u0E34\u0E14\u0E23\u0E49\u0E32\u0E19 \u0E2A\u0E31\u0E48\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21 1 \u0E16\u0E31\u0E07")), list.map((r, i) => /*#__PURE__*/React.createElement(Card, {
    key: r.name,
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: "var(--text-body-strong)"
    }
  }, r.name), r.low && /*#__PURE__*/React.createElement(Badge, {
    tone: "new",
    dot: true
  }, "\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-faint)"
    }
  }, r.left), /*#__PURE__*/React.createElement(Switch, {
    checked: r.on,
    onChange: v => toggle(i, v),
    label: "\u0E40\u0E1B\u0E34\u0E14\u0E02\u0E32\u0E22\u0E40\u0E21\u0E19\u0E39\u0E19\u0E35\u0E49"
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    block: true,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "clipboard-list",
      size: 18
    })
  }, "\u0E19\u0E31\u0E1A\u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E1B\u0E34\u0E14\u0E23\u0E49\u0E32\u0E19")));
}
Object.assign(window, {
  StockScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/staff-mobile/StockScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/staff-mobile/TablesScreen.jsx
try { (() => {
const {
  TopBar,
  Icon,
  TableCard,
  SegmentedControl,
  IconButton
} = window.TheLoftBarDesignSystem_99bbff;
function TablesScreen() {
  const [zone, setZone] = React.useState("in");
  const tables = [{
    label: "โต๊ะ 1",
    state: "free"
  }, {
    label: "โต๊ะ 2",
    state: "seated",
    time: "0:18",
    total: 420
  }, {
    label: "โต๊ะ 3",
    state: "free"
  }, {
    label: "โต๊ะ 4",
    state: "seated",
    time: "0:42",
    total: 780
  }, {
    label: "โต๊ะ 5",
    state: "seated",
    calling: true
  }, {
    label: "บาร์ 1",
    state: "seated",
    time: "0:09",
    total: 240
  }, {
    label: "บาร์ 2",
    state: "closed",
    total: 360
  }, {
    label: "บาร์ 3",
    state: "free"
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "statusbar"
  }, /*#__PURE__*/React.createElement("span", null, "19:48"), /*#__PURE__*/React.createElement("span", null, "\u0E01\u0E30\u0E14\u0E36\u0E01 \xB7 \u0E1D\u0E49\u0E32\u0E22")), /*#__PURE__*/React.createElement(TopBar, {
    title: "\u0E42\u0E15\u0E4A\u0E30",
    subtitle: "\u0E40\u0E1B\u0E34\u0E14\u0E2D\u0E22\u0E39\u0E48 4 \xB7 \u0E27\u0E48\u0E32\u0E07 3",
    sticky: false,
    right: /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "plus"
      }),
      label: "\u0E40\u0E1B\u0E34\u0E14\u0E1A\u0E34\u0E25\u0E43\u0E2B\u0E21\u0E48",
      variant: "solid"
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 16px 0"
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    value: zone,
    onChange: setZone,
    options: [{
      value: "in",
      label: "ในร้าน"
    }, {
      value: "bar",
      label: "เคาน์เตอร์บาร์"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    className: "scroll",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, tables.map(t => /*#__PURE__*/React.createElement(TableCard, {
    label: undefined,
    state: undefined
  })))));
}
Object.assign(window, {
  TablesScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/staff-mobile/TablesScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CartLine = __ds_scope.CartLine;

__ds_ns.MenuItemCard = __ds_scope.MenuItemCard;

__ds_ns.OrderTicket = __ds_scope.OrderTicket;

__ds_ns.PromptPayPanel = __ds_scope.PromptPayPanel;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.TableCard = __ds_scope.TableCard;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.LUCIDE_VERSION = __ds_scope.LUCIDE_VERSION;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.STATUS_CHIP_SETS = __ds_scope.STATUS_CHIP_SETS;

__ds_ns.StatusChip = __ds_scope.StatusChip;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToastRegion = __ds_scope.ToastRegion;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.QuantityStepper = __ds_scope.QuantityStepper;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.NotificationBell = __ds_scope.NotificationBell;

__ds_ns.NOTIFICATION_TYPES = __ds_scope.NOTIFICATION_TYPES;

__ds_ns.NotificationFeed = __ds_scope.NotificationFeed;

__ds_ns.PosRail = __ds_scope.PosRail;

})();
