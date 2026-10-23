"use client";

import { Tabs } from "@heroui/react";
import { useState } from "react";
import { Overview } from "./Overview";
import { Today } from "./Today";

type ReportTab = "overview" | "today";

const TAB_KEY = "reports.tab";

// Last tab per browser (Q1 = A); storage can be blocked, so every access is guarded.
function readTab(): ReportTab {
  try {
    return globalThis.localStorage?.getItem(TAB_KEY) === "today" ? "today" : "overview";
  } catch {
    return "overview";
  }
}

function writeTab(tab: ReportTab): void {
  try {
    globalThis.localStorage?.setItem(TAB_KEY, tab);
  } catch {
    // Remembering the tab is a convenience only.
  }
}

export function ReportsTabs() {
  const [tab, setTab] = useState<ReportTab>(readTab);

  return (
    <Tabs
      selectedKey={tab}
      onSelectionChange={(key) => {
        const next = key === "today" ? "today" : "overview";
        setTab(next);
        writeTab(next);
      }}
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="มุมมองรายงาน">
          <Tabs.Tab id="overview">
            ภาพรวมรายได้
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="today">
            วันนี้
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="overview" className="pt-4">
        <Overview />
      </Tabs.Panel>
      <Tabs.Panel id="today" className="pt-4">
        <Today />
      </Tabs.Panel>
    </Tabs>
  );
}
