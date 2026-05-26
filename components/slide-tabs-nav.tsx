"use client";

import Link from "next/link";
import type { CSSProperties, FocusEvent } from "react";
import { useRef, useState } from "react";

import type { SiteNavigationItem } from "@/lib/site-settings";

type CursorPosition = {
  left: number;
  opacity: number;
  width: number;
};

type SlideTabsNavProps = {
  items: SiteNavigationItem[];
};

type SlideTabProps = {
  isActive: boolean;
  item: SiteNavigationItem;
  itemKey: string;
  setActiveKey: (key: null | string) => void;
  setPosition: (position: CursorPosition) => void;
};

const tabsStyle: CSSProperties = {
  background: "var(--surface)",
  border: "2px solid var(--line)",
  borderRadius: "999px",
  display: "flex",
  flex: "0 1 auto",
  isolation: "isolate",
  listStyle: "none",
  margin: 0,
  maxWidth: "100%",
  overflowX: "auto",
  padding: "0.25rem",
  position: "relative",
  scrollbarWidth: "none",
  width: "fit-content",
};

const tabItemStyle: CSSProperties = {
  flex: "0 0 auto",
  position: "relative",
  zIndex: 1,
};

const tabLinkStyle: CSSProperties = {
  borderRadius: "999px",
  color: "var(--site-foreground)",
  cursor: "pointer",
  display: "block",
  fontSize: "clamp(0.62rem, 2vw, 0.8rem)",
  fontWeight: 850,
  letterSpacing: 0,
  lineHeight: 1,
  mixBlendMode: "normal",
  padding: "0.4rem clamp(0.45rem, 1.6vw, 0.85rem)",
  textDecoration: "none",
  textTransform: "uppercase",
  transition: "color 120ms ease",
};

const cursorStyle: CSSProperties = {
  background: "var(--site-accent)",
  borderRadius: "999px",
  height: "calc(100% - 0.5rem)",
  left: 0,
  pointerEvents: "none",
  position: "absolute",
  top: "0.25rem",
  transition: "opacity 120ms ease, transform 180ms ease, width 180ms ease",
  zIndex: 0,
};

function getHiddenPosition(position: CursorPosition): CursorPosition {
  return {
    ...position,
    opacity: 0,
  };
}

function SlideTab({
  isActive,
  item,
  itemKey,
  setActiveKey,
  setPosition,
}: SlideTabProps) {
  const ref = useRef<HTMLLIElement>(null);

  function showCursor() {
    if (!ref.current) {
      return;
    }

    setPosition({
      left: ref.current.offsetLeft,
      opacity: 1,
      width: ref.current.getBoundingClientRect().width,
    });
    setActiveKey(itemKey);
  }

  return (
    <li className="site-nav-tab-item" ref={ref} style={tabItemStyle}>
      <Link
        className="site-nav-tab-link"
        href={item.url}
        onFocus={showCursor}
        onMouseEnter={showCursor}
        rel={item.newTab ? "noreferrer" : undefined}
        style={{
          ...tabLinkStyle,
          color: isActive ? "var(--accent-contrast)" : "var(--site-foreground)",
        }}
        target={item.newTab ? "_blank" : undefined}
      >
        {item.label}
      </Link>
    </li>
  );
}

export function SlideTabsNav({ items }: SlideTabsNavProps) {
  const [activeKey, setActiveKey] = useState<null | string>(null);
  const [position, setPosition] = useState<CursorPosition>({
    left: 0,
    opacity: 0,
    width: 0,
  });

  function hideCursor() {
    setActiveKey(null);
    setPosition(getHiddenPosition);
  }

  function hideCursorOnBlur(event: FocusEvent<HTMLUListElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      hideCursor();
    }
  }

  return (
    <ul
      className="site-nav-tabs"
      data-site-nav-tabs
      onBlur={hideCursorOnBlur}
      onMouseLeave={hideCursor}
      style={tabsStyle}
    >
      {items.map((item) => {
        const itemKey = `${item.label}-${item.url}`;

        return (
          <SlideTab
            isActive={activeKey === itemKey}
            item={item}
            itemKey={itemKey}
            key={itemKey}
            setActiveKey={setActiveKey}
            setPosition={setPosition}
          />
        );
      })}
      <li
        aria-hidden="true"
        className="site-nav-cursor"
        data-site-nav-cursor
        role="presentation"
        style={{
          ...cursorStyle,
          opacity: position.opacity,
          transform: `translateX(${position.left}px)`,
          width: `${position.width}px`,
        }}
      />
    </ul>
  );
}
