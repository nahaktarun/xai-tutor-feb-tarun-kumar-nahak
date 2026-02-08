"use client";

import * as React from "react";

import {
  ArchiveIcon,
  BellIcon,
  CaretDownIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftRightIcon,
  ContactsIcon,
  DashboardIcon,
  DotsIcon,
  ForwardIcon,
  HelpIcon,
  IntegrationIcon,
  MailIcon,
  PaperclipIcon,
  ProductIcon,
  SearchIcon,
  SettingsIcon,
  SmileIcon,
  StarIcon,
  TasksIcon,
  TemplateIcon,
  TrashIcon,
  WidgetsIcon,
} from "./icons";
import type { Email } from "./types";
import { backendStaticOrigin, formatReceivedAt, initials } from "./utils";

type Tab = "all" | "unread" | "archive";

/* ── Tiny reusable components ────────────────────────────────── */

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm"
      ? "h-8 w-8 text-[11px]"
      : size === "lg"
        ? "h-10 w-10 text-[13px]"
        : "h-9 w-9 text-[12px]";
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 font-semibold text-zinc-700 shrink-0 ${dim}`}
    >
      {initials(name)}
    </div>
  );
}

function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none " +
        (active
          ? "bg-zinc-900 text-white shadow-sm"
          : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200")
      }
    >
      {children}
    </button>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <div
      className={
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors cursor-default " +
        (active
          ? "bg-zinc-100 font-semibold text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-50") +
        (collapsed ? " justify-center" : "")
      }
    >
      <span
        className={
          "inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0 " +
          (active ? "text-zinc-900" : "text-zinc-500")
        }
      >
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  );
}

/* ── Debounce hook ────────────────────────────────────────────── */

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* ── Main client ─────────────────────────────────────────────── */

export default function EmailClient() {
  /* ─ State ─ */
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [headerQuery, setHeaderQuery] = React.useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [emails, setEmails] = React.useState<Email[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [selected, setSelected] = React.useState<Email | null>(null);
  const [loadingList, setLoadingList] = React.useState(true);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // Composer state
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [composerTo, setComposerTo] = React.useState("Jane Doe");
  const [composerSubject, setComposerSubject] = React.useState("");
  const composerHtmlRef = React.useRef("");
  const composerRef = React.useRef<HTMLDivElement>(null);

  /* ─ Data fetching ─ */
  const fetchList = React.useCallback(async () => {
    setLoadingList(true);
    try {
      const url = new URL("/api/emails", window.location.origin);
      url.searchParams.set("tab", tab);
      if (debouncedSearch.trim())
        url.searchParams.set("q", debouncedSearch.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = (await res.json()) as { emails: Email[] };
      const list = data.emails ?? [];
      setEmails(list);
    } finally {
      setLoadingList(false);
    }
  }, [debouncedSearch, tab]);

  const fetchDetail = React.useCallback(async (id: number) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/emails/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Email;
      setSelected(data);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Auto-select first email when list changes
  React.useEffect(() => {
    if (
      emails.length > 0 &&
      (selectedId == null || !emails.some((e) => e.id === selectedId))
    ) {
      setSelectedId(emails[0].id);
    } else if (emails.length === 0) {
      setSelectedId(null);
      setSelected(null);
    }
  }, [emails, selectedId]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  React.useEffect(() => {
    if (selectedId == null) {
      setSelected(null);
      return;
    }
    fetchDetail(selectedId);
  }, [fetchDetail, selectedId]);

  // ⌘K shortcut
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ─ CRUD helpers ─ */
  async function updateEmail(id: number, patch: Partial<Email>) {
    const res = await fetch(`/api/emails/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as Email;
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    );
    if (selectedId === id) setSelected(updated);
    // Refresh list if the change affects tab membership
    if (patch.is_archived !== undefined || patch.is_read !== undefined) {
      fetchList();
    }
  }

  async function deleteEmail(id: number) {
    const res = await fetch(`/api/emails/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setSelected(null);
    }
  }

  async function createEmail() {
    const bodyText = (composerRef.current?.innerHTML ?? composerHtmlRef.current)
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (!bodyText && !composerSubject.trim()) return;

    const payload = {
      sender_name: "Richard Brown",
      sender_email: "richard.brown@company.com",
      to_name: composerTo,
      to_email:
        composerTo === "Jane Doe"
          ? "jane.doe@business.com"
          : composerTo === "Michael Lee"
            ? "michael.lee@cusana.io"
            : composerTo === "Sarah Connor"
              ? "sarah.connor@client.com"
              : composerTo === "Natasha Brown"
                ? "natasha.brown@kozuki.com"
                : "support@cusana.io",
      subject: composerSubject.trim() || "No Subject",
      body: bodyText || "(empty)",
      is_read: true,
      is_archived: false,
    };

    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const created = (await res.json()) as Email;
    setEmails((prev) => [created, ...prev]);
    setSelectedId(created.id);
    // Reset composer
    setComposerSubject("");
    composerHtmlRef.current = "";
    if (composerRef.current) composerRef.current.innerHTML = "";
    setComposerOpen(false);
  }

  function openNewMessage() {
    setComposerOpen(true);
    setComposerTo("Jane Doe");
    setComposerSubject("");
    composerHtmlRef.current = "";
    setTimeout(() => {
      if (composerRef.current) composerRef.current.innerHTML = "";
    }, 0);
  }

  function openReply() {
    if (!selected) return;
    setComposerOpen(true);
    setComposerTo(selected.sender_name);
    setComposerSubject(`Re: ${selected.subject}`);
    const replyHtml = `<p>Hi ${selected.sender_name.split(" ")[0]},</p><p><br/></p><p></p><p><br/></p><p>Warm regards,<br/>Richard Brown</p>`;
    composerHtmlRef.current = replyHtml;
    setTimeout(() => {
      if (composerRef.current) composerRef.current.innerHTML = replyHtml;
    }, 0);
  }

  const unreadCount = emails.filter(
    (e) => !e.is_read && !e.is_archived,
  ).length;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f4f6]">
      {/* ─────────── Sidebar ─────────── */}
      <aside
        className={
          "flex flex-col border-r border-zinc-200/60 bg-[#fbfbfc] transition-all duration-200 shrink-0 " +
          (sidebarCollapsed ? "w-[76px]" : "w-[260px]")
        }
      >
        <div className="flex h-full flex-col px-4 py-4">
          {/* Logo + collapse */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shrink-0">
                <StarIcon className="text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-1 text-sm font-bold text-zinc-900">
                  Cusana
                  <CaretDownIcon size={14} className="text-zinc-400" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 hover:bg-zinc-50 transition-colors shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeftRightIcon />
            </button>
          </div>

          {/* Search bar */}
          {!sidebarCollapsed && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
              <SearchIcon className="text-zinc-400 shrink-0" size={18} />
              <input
                id="global-search"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              />
              <span className="flex h-6 items-center whitespace-nowrap rounded-lg bg-zinc-100 px-2 text-[10px] font-semibold text-zinc-500">
                ⌘ K
              </span>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-5 flex-1 overflow-auto pr-1">
            <div className="space-y-5 pb-4">
              {/* Main nav */}
              <nav className="space-y-0.5">
                <SidebarItem
                  icon={<DashboardIcon />}
                  label="Dashboard"
                  collapsed={sidebarCollapsed}
                />
                <SidebarItem
                  icon={<BellIcon />}
                  label="Notifications"
                  collapsed={sidebarCollapsed}
                />
                <SidebarItem
                  icon={<TasksIcon />}
                  label="Tasks"
                  collapsed={sidebarCollapsed}
                />
                <SidebarItem
                  icon={<CalendarIcon />}
                  label="Calendar"
                  collapsed={sidebarCollapsed}
                />
                <SidebarItem
                  icon={<WidgetsIcon />}
                  label="Widgets"
                  collapsed={sidebarCollapsed}
                />
              </nav>

              {/* Marketing */}
              <div>
                {!sidebarCollapsed && (
                  <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Marketing
                  </div>
                )}
                <div className="space-y-0.5">
                  <SidebarItem
                    icon={<ProductIcon />}
                    label="Product"
                    collapsed={sidebarCollapsed}
                  />
                  <SidebarItem
                    icon={<MailIcon />}
                    label="Emails"
                    active
                    collapsed={sidebarCollapsed}
                  />
                  <SidebarItem
                    icon={<IntegrationIcon />}
                    label="Integration"
                    collapsed={sidebarCollapsed}
                  />
                  <SidebarItem
                    icon={<ContactsIcon />}
                    label="Contacts"
                    collapsed={sidebarCollapsed}
                  />
                </div>
              </div>

              {/* Favorites */}
              <div>
                {!sidebarCollapsed && (
                  <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Favorite
                  </div>
                )}
                <div className="space-y-0.5">
                  {(
                    [
                      { label: "Opportunity Stages", color: "bg-red-400" },
                      { label: "Key Metrics", color: "bg-emerald-400" },
                      { label: "Product Plan", color: "bg-orange-400" },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.label}
                      className={
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors cursor-default " +
                        (sidebarCollapsed ? "justify-center" : "")
                      }
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-[3px] shrink-0 ${item.color}`}
                      />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: settings + profile */}
          <div className="mt-auto border-t border-zinc-100 pt-3">
            <div className="space-y-0.5">
              <SidebarItem
                icon={<SettingsIcon />}
                label="Settings"
                collapsed={sidebarCollapsed}
              />
              <SidebarItem
                icon={<HelpIcon />}
                label="Help & Center"
                collapsed={sidebarCollapsed}
              />
            </div>

            <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="flex items-center gap-3">
                <Avatar name="Richard Brown" />
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-zinc-900">
                      Richard Brown
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: "62%" }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      6.2GB of 10GB has been used
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─────────── Main area ─────────── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Header */}
        <header className="border-b border-zinc-200/60 bg-white px-6 py-3 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold text-zinc-900">Emails</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 shadow-sm">
                <SearchIcon className="text-zinc-400 shrink-0" />
                <input
                  placeholder="Search Email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[180px] bg-transparent outline-none placeholder:text-zinc-400 text-zinc-700"
                />
              </div>
              <button
                type="button"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors"
                onClick={openNewMessage}
              >
                + New Message
              </button>
            </div>
          </div>
        </header>

        {/* Content: list + detail */}
        <div className="flex flex-1 overflow-hidden">
          {/* ─── Email list ─── */}
          <section className="w-[360px] shrink-0 border-r border-zinc-200/60 bg-white flex flex-col">
            {/* Tab filters */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <Pill active={tab === "all"} onClick={() => setTab("all")}>
                  All Mails
                </Pill>
                <Pill
                  active={tab === "unread"}
                  onClick={() => setTab("unread")}
                >
                  Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </Pill>
                <Pill
                  active={tab === "archive"}
                  onClick={() => setTab("archive")}
                >
                  Archive
                </Pill>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                aria-label="More options"
              >
                <DotsIcon size={16} />
              </button>
            </div>

            {/* Email items */}
            <div className="flex-1 overflow-auto">
              {loadingList ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                </div>
              ) : emails.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-zinc-400">
                  No emails found.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {emails.map((e) => {
                    const isActive = selectedId === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(e.id);
                          if (!e.is_read)
                            updateEmail(e.id, { is_read: true });
                        }}
                        className={
                          "group flex w-full items-start gap-3 px-5 py-4 text-left transition-colors " +
                          (isActive
                            ? "bg-zinc-50 border-l-2 border-l-zinc-900"
                            : "border-l-2 border-l-transparent hover:bg-zinc-50/60")
                        }
                      >
                        <Avatar name={e.sender_name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={
                                "truncate text-sm " +
                                (e.is_read
                                  ? "font-medium text-zinc-700"
                                  : "font-semibold text-zinc-900")
                              }
                            >
                              {e.sender_name}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {!e.is_read && (
                                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                              )}
                              <span className="text-[11px] text-zinc-400 whitespace-nowrap">
                                {formatReceivedAt(e.received_at)}
                              </span>
                            </div>
                          </div>
                          <div
                            className={
                              "mt-0.5 truncate text-sm " +
                              (e.is_read
                                ? "font-medium text-zinc-600"
                                : "font-semibold text-zinc-900")
                            }
                          >
                            {e.subject}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-zinc-400 leading-relaxed">
                            {e.preview}
                          </div>
                          {/* Hover action icons */}
                          <div className="mt-2 hidden items-center gap-1 text-zinc-400 group-hover:flex">
                            <button
                              type="button"
                              className="rounded-md p-1 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                updateEmail(e.id, { is_archived: true });
                              }}
                              aria-label="Archive"
                              title="Archive"
                            >
                              <ArchiveIcon size={15} />
                            </button>
                            <button
                              type="button"
                              className="rounded-md p-1 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                              aria-label="Forward"
                              title="Forward"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              <ForwardIcon size={15} />
                            </button>
                            <button
                              type="button"
                              className="rounded-md p-1 hover:bg-red-100 hover:text-red-600 transition-colors"
                              aria-label="Delete"
                              title="Delete"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                deleteEmail(e.id);
                              }}
                            >
                              <TrashIcon size={15} />
                            </button>
                            <button
                              type="button"
                              className="rounded-md p-1 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                              aria-label="More"
                              title="More"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              <DotsIcon size={15} />
                            </button>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ─── Detail + Composer ─── */}
          <section className="flex flex-1 flex-col bg-[#f9fafb] overflow-hidden">
            <div className="flex-1 overflow-auto p-6">
              {/* Email detail card */}
              <article className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                {/* Detail header */}
                <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={selected?.sender_name ?? ""}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-zinc-900">
                          {selected?.sender_name ??
                            (selectedId ? "" : "Select an email")}
                        </span>
                        {selected?.sender_email && (
                          <span className="text-xs text-zinc-400">
                            &lt;{selected.sender_email}&gt;
                          </span>
                        )}
                      </div>
                      {selected && (
                        <div className="mt-0.5 text-xs text-zinc-400">
                          To: {selected.to_name}{" "}
                          <span className="text-zinc-300">
                            &lt;{selected.to_email}&gt;
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {selected?.received_at && (
                      <span className="mr-2 text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(selected.received_at).toLocaleDateString(
                          [],
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}{" "}
                        {new Date(selected.received_at).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                      aria-label="Mark as read"
                      title="Mark as read"
                      onClick={() =>
                        selectedId &&
                        updateEmail(selectedId, { is_read: true })
                      }
                    >
                      <CheckIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                      aria-label="Archive"
                      title="Archive"
                      onClick={() =>
                        selectedId &&
                        updateEmail(selectedId, { is_archived: true })
                      }
                    >
                      <ArchiveIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                      aria-label="Forward"
                      title="Forward"
                    >
                      <ForwardIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      aria-label="Delete"
                      title="Delete"
                      onClick={() =>
                        selectedId && deleteEmail(selectedId)
                      }
                    >
                      <TrashIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                      aria-label="More options"
                      title="More options"
                    >
                      <DotsIcon size={16} />
                    </button>
                  </div>
                </div>

                {/* Detail body */}
                <div className="px-6 py-6">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                    </div>
                  ) : selected ? (
                    <>
                      <h2 className="text-xl font-bold text-zinc-900">
                        {selected.subject}
                      </h2>
                      <div className="mt-5 whitespace-pre-line text-sm leading-7 text-zinc-600">
                        {selected.body}
                      </div>

                      {/* Attachments */}
                      {(selected.attachments?.length ?? 0) > 0 && (
                        <div className="mt-6 pt-4 border-t border-zinc-100">
                          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                            Attachment
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {selected.attachments!.map((a) => {
                              const href = a.download_url
                                ? `${backendStaticOrigin()}${a.download_url}`
                                : undefined;
                              return (
                                <div
                                  key={a.filename}
                                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 hover:border-zinc-300 transition-colors"
                                >
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-zinc-200 text-orange-500 shadow-sm shrink-0">
                                    <PaperclipIcon size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-zinc-900">
                                      {a.filename}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                      {a.size ?? ""}
                                      {href && (
                                        <>
                                          {a.size ? " • " : ""}
                                          <a
                                            className="font-semibold text-blue-600 hover:underline"
                                            href={href}
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            Download
                                          </a>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Reply button */}
                      {!composerOpen && (
                        <div className="mt-6 pt-4 border-t border-zinc-100">
                          <button
                            type="button"
                            onClick={openReply}
                            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            ↩ Reply
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                      <MailIcon size={40} />
                      <div className="mt-3 text-sm">
                        Select an email to view details
                      </div>
                    </div>
                  )}
                </div>
              </article>

              {/* ─── Composer ─── */}
              {composerOpen && (
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white shadow-lg">
                  {/* Composer header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-3">
                    <div className="flex items-center gap-3 text-sm text-zinc-600">
                      <span className="text-zinc-400 font-medium">To:</span>
                      <select
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 outline-none focus:border-zinc-400 transition-colors"
                        value={composerTo}
                        onChange={(e) => setComposerTo(e.target.value)}
                      >
                        <option>Jane Doe</option>
                        <option>Michael Lee</option>
                        <option>Support Team</option>
                        <option>Sarah Connor</option>
                        <option>Natasha Brown</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setComposerOpen(false)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors text-sm"
                      aria-label="Close composer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Subject */}
                  <div className="border-b border-zinc-100 px-6 py-2">
                    <input
                      type="text"
                      placeholder="Subject"
                      value={composerSubject}
                      onChange={(e) =>
                        setComposerSubject(e.target.value)
                      }
                      className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 font-medium"
                    />
                  </div>

                  {/* Body */}
                  <div className="px-6 py-4">
                    <div
                      ref={composerRef}
                      className="min-h-[140px] rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-7 text-zinc-700 outline-none focus:border-zinc-400 transition-colors"
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        composerHtmlRef.current = (e.target as HTMLDivElement).innerHTML;
                      }}
                    />

                    {/* Composer actions */}
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-0">
                        <button
                          type="button"
                          onClick={createEmail}
                          className="rounded-l-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                        >
                          Send Now
                        </button>
                        <button
                          type="button"
                          className="rounded-r-xl bg-zinc-900 px-3 py-2.5 text-white hover:bg-zinc-800 transition-colors border-l border-zinc-700 shadow-sm"
                          aria-label="Schedule send"
                          title="Schedule"
                        >
                          <CaretDownIcon size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-0.5 text-zinc-400">
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                          aria-label="Attach file"
                          title="Attach"
                        >
                          <PaperclipIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                          aria-label="Insert emoji"
                          title="Emoji"
                        >
                          <SmileIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                          aria-label="Use template"
                          title="Template"
                        >
                          <TemplateIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                          aria-label="More options"
                          title="More"
                        >
                          <DotsIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
