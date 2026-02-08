"use client";

import * as React from "react";

import {
  ArchiveIcon,
  CaretDownIcon,
  CheckIcon,
  ChevronLeftRightIcon,
  DotsIcon,
  ForwardIcon,
  PaperclipIcon,
  SearchIcon,
  SmileIcon,
  StarIcon,
  TemplateIcon,
} from "./icons";
import type { Email } from "./types";
import { backendStaticOrigin, formatReceivedAt, initials } from "./utils";

type Tab = "all" | "unread" | "archive";

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-[12px] font-semibold text-zinc-700">
      {initials(name)}
    </div>
  );
}

function Pill({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={
        "rounded-md px-3 py-1 text-xs font-medium transition-colors " +
        (active
          ? "bg-zinc-900 text-white"
          : "bg-white text-zinc-600 hover:bg-zinc-100")
      }
    >
      {children}
    </button>
  );
}

export default function EmailClient() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("all");
  const [query, setQuery] = React.useState("");
  const [headerQuery, setHeaderQuery] = React.useState("");

  const [emails, setEmails] = React.useState<Email[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [selected, setSelected] = React.useState<Email | null>(null);
  const [loadingList, setLoadingList] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const [composerTo, setComposerTo] = React.useState("Jane Doe");
  const [composerHtml, setComposerHtml] = React.useState(
    "<p>Hi Jane,</p><p><br/></p><p>Thank you for reaching out and for sharing your proposal! 🎉 After reviewing the attached document, I'm impressed by the alignment between our companies’ strengths.</p><p><br/></p><p>I'd like to explore this further and discuss how we can tailor the partnership. Are you available for a call or meeting next week?</p><p><br/></p><p>Warm regards,<br/>John Smith</p>",
  );

  const fetchList = React.useCallback(async () => {
    setLoadingList(true);
    try {
      const url = new URL("/api/emails", window.location.origin);
      url.searchParams.set("tab", tab);
      if (query.trim()) url.searchParams.set("q", query.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = (await res.json()) as { emails: Email[] };
      const list = data.emails ?? [];
      setEmails(list);
      if (selectedId == null && list.length > 0) setSelectedId(list[0].id);
      if (selectedId != null && !list.some((e) => e.id === selectedId)) {
        setSelectedId(list[0]?.id ?? null);
      }
    } finally {
      setLoadingList(false);
    }
  }, [query, selectedId, tab]);

  const fetchDetail = React.useCallback(async (id: number) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/emails/${id}`, { cache: "no-store" });
      const data = (await res.json()) as Email;
      setSelected(data);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

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

  React.useEffect(() => {
    // Cmd+K focuses the left header search
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isCmdK) return;
      e.preventDefault();
      const el = document.getElementById("global-search") as HTMLInputElement | null;
      el?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function updateEmail(id: number, patch: Partial<Email>) {
    const res = await fetch(`/api/emails/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as Email;

    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    if (selectedId === id) setSelected(updated);
  }

  async function createEmail() {
    const subject = "New message";
    const bodyText = composerHtml
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    const payload = {
      sender_name: "Richard Brown",
      sender_email: "richard.brown@company.com",
      to_name: composerTo,
      to_email:
        composerTo === "Jane Doe" ? "jane.doe@business.com" : "recipient@company.com",
      subject,
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
  }

  const unreadCount = emails.filter((e) => !e.is_read && !e.is_archived).length;

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-6">
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
        <div className="flex h-[780px]">
          {/* Sidebar */}
          <aside
            className={
              "border-r border-zinc-100 bg-[#fbfbfc] " +
              (sidebarCollapsed ? "w-[76px]" : "w-[260px]")
            }
          >
            <div className="flex h-full flex-col px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <StarIcon className="text-white" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="text-sm font-semibold text-zinc-900">Cusana</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeftRightIcon />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                <SearchIcon className="text-zinc-400" />
                {!sidebarCollapsed && (
                  <>
                    <input
                      id="global-search"
                      value={headerQuery}
                      onChange={(e) => setHeaderQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                    />
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                      ⌘ K
                    </span>
                  </>
                )}
              </div>

              <div className="mt-5 space-y-5 overflow-hidden">
                <nav className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold tracking-wider text-zinc-400">
                    {!sidebarCollapsed ? "" : ""}
                  </div>
                  {[
                    "Dashboard",
                    "Notifications",
                    "Tasks",
                    "Calendar",
                    "Widgets",
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 " +
                        (sidebarCollapsed ? "justify-center" : "")
                      }
                    >
                      <span className="h-2 w-2 rounded-full bg-zinc-300" />
                      {!sidebarCollapsed && <span>{label}</span>}
                    </button>
                  ))}
                </nav>

                <div>
                  {!sidebarCollapsed && (
                    <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-zinc-400">
                      MARKETING
                    </div>
                  )}
                  <div className="space-y-1">
                    {[
                      { label: "Product", active: false },
                      { label: "Emails", active: true },
                      { label: "Integration", active: false },
                      { label: "Contacts", active: false },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className={
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm " +
                          (item.active
                            ? "bg-zinc-100 text-zinc-900"
                            : "text-zinc-600 hover:bg-zinc-100") +
                          (sidebarCollapsed ? " justify-center" : "")
                        }
                      >
                        <span
                          className={
                            "h-2 w-2 rounded-full " +
                            (item.active ? "bg-orange-500" : "bg-zinc-300")
                          }
                        />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {!sidebarCollapsed && (
                    <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-zinc-400">
                      FAVORITE
                    </div>
                  )}
                  <div className="space-y-1">
                    {[
                      { label: "Opportunity Stages", color: "bg-red-400" },
                      { label: "Key Metrics", color: "bg-emerald-400" },
                      { label: "Product Plan", color: "bg-orange-400" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className={
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 " +
                          (sidebarCollapsed ? "justify-center" : "")
                        }
                      >
                        <span className={`h-2 w-2 rounded-full ${item.color}`} />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <div className="space-y-1">
                  {["Settings", "Help & Center"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 " +
                        (sidebarCollapsed ? "justify-center" : "")
                      }
                    >
                      <span className="h-2 w-2 rounded-full bg-zinc-300" />
                      {!sidebarCollapsed && <span>{label}</span>}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name="Richard Brown" />
                    {!sidebarCollapsed && (
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-900">
                          Richard Brown
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-zinc-100">
                          <div className="h-2 w-[62%] rounded-full bg-emerald-500" />
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

          {/* Main */}
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <header className="border-b border-zinc-100 bg-white px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-zinc-900">Emails</div>
                  <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 md:flex">
                    <SearchIcon className="text-zinc-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-[260px] bg-transparent outline-none placeholder:text-zinc-400"
                    />
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                      ⌘ K
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">
                    <SearchIcon className="text-zinc-400" />
                    <input
                      placeholder="Search Email"
                      className="w-[180px] bg-transparent outline-none placeholder:text-zinc-400"
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                    onClick={createEmail}
                  >
                    + New Message
                  </button>
                </div>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              {/* List */}
              <section className="w-[360px] border-r border-zinc-100 bg-white">
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Pill active={tab === "all"}>
                      All Mails
                    </Pill>
                    <Pill active={tab === "unread"}>
                      Unread{unreadCount ? ` (${unreadCount})` : ""}
                    </Pill>
                    <Pill active={tab === "archive"}>Archive</Pill>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                    aria-label="More"
                  >
                    <DotsIcon />
                  </button>
                </div>

                <div className="h-[calc(100%-52px)] overflow-auto">
                  {loadingList ? (
                    <div className="px-5 py-4 text-sm text-zinc-500">Loading…</div>
                  ) : emails.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-zinc-500">No emails.</div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {emails.map((e) => {
                        const active = selectedId === e.id;
                        return (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(e.id);
                              if (!e.is_read) updateEmail(e.id, { is_read: true });
                            }}
                            className={
                              "group flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-zinc-50 " +
                              (active ? "bg-zinc-50" : "")
                            }
                          >
                            <Avatar name={e.sender_name} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="truncate text-sm font-semibold text-zinc-900">
                                  {e.sender_name}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!e.is_read && (
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                  )}
                                  <span className="text-xs text-zinc-400">
                                    {formatReceivedAt(e.received_at)}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1 truncate text-sm font-semibold text-zinc-900">
                                {e.subject}
                              </div>
                              <div className="mt-1 truncate text-xs text-zinc-500">
                                {e.preview}
                              </div>
                              <div className="mt-2 hidden items-center gap-2 text-zinc-400 group-hover:flex">
                                <button
                                  type="button"
                                  className="rounded-md p-1 hover:bg-white hover:text-zinc-700"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    updateEmail(e.id, { is_archived: true });
                                  }}
                                  aria-label="Archive"
                                >
                                  <ArchiveIcon size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md p-1 hover:bg-white hover:text-zinc-700"
                                  aria-label="Forward"
                                  onClick={(ev) => ev.stopPropagation()}
                                >
                                  <ForwardIcon size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md p-1 hover:bg-white hover:text-zinc-700"
                                  aria-label="More"
                                  onClick={(ev) => ev.stopPropagation()}
                                >
                                  <DotsIcon size={16} />
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

              {/* Detail + Composer */}
              <section className="flex flex-1 flex-col bg-[#fbfbfc]">
                <div className="flex-1 overflow-auto p-6">
                  <div className="rounded-2xl border border-zinc-200 bg-white">
                    {/* Detail header */}
                    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={selected?.sender_name ?? ""} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-semibold text-zinc-900">
                              {selected?.sender_name ?? (selectedId ? "" : "Select an email")}
                            </div>
                            <div className="truncate text-xs text-zinc-400">
                              {selected?.sender_email ?? ""}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-zinc-400">
                            To: {selected?.to_name ?? ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-zinc-400">
                        <div className="hidden text-xs text-zinc-400 md:block">
                          {selected?.received_at ? new Date(selected.received_at).toLocaleString() : ""}
                        </div>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700"
                          aria-label="Mark as read"
                          onClick={() => selectedId && updateEmail(selectedId, { is_read: true })}
                        >
                          <CheckIcon />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700"
                          aria-label="Archive"
                          onClick={() => selectedId && updateEmail(selectedId, { is_archived: true })}
                        >
                          <ArchiveIcon />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700"
                          aria-label="Forward"
                        >
                          <ForwardIcon />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700"
                          aria-label="More"
                        >
                          <DotsIcon />
                        </button>
                      </div>
                    </div>

                    {/* Detail body */}
                    <div className="px-6 py-6">
                      {loadingDetail ? (
                        <div className="text-sm text-zinc-500">Loading…</div>
                      ) : selected ? (
                        <>
                          <div className="text-xl font-semibold text-zinc-900">
                            {selected.subject}
                          </div>
                          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-700">
                            {selected.body}
                          </div>

                          {!!(selected.attachments?.length ?? 0) && (
                            <div className="mt-6">
                              <div className="text-xs font-semibold text-zinc-500">Attachment</div>
                              <div className="mt-3 flex flex-wrap gap-3">
                                {selected.attachments!.map((a) => {
                                  const href = a.download_url
                                    ? `${backendStaticOrigin()}${a.download_url}`
                                    : undefined;
                                  return (
                                    <div
                                      key={a.filename}
                                      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                                    >
                                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-orange-500">
                                        <PaperclipIcon />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-zinc-900">
                                          {a.filename}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                          {a.size ?? ""}
                                          {href ? (
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
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-zinc-500">Select an email to view details.</div>
                      )}
                    </div>
                  </div>

                  {/* Composer */}
                  <div className="mt-6 rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-3">
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <span className="text-zinc-400">To:</span>
                        <select
                          className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700"
                          value={composerTo}
                          onChange={(e) => setComposerTo(e.target.value)}
                        >
                          <option>Jane Doe</option>
                          <option>Michael Lee</option>
                          <option>Support Team</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                          aria-label="Minimize"
                        >
                          <ForwardIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                          aria-label="Close"
                        >
                          <DotsIcon size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="px-6 py-4">
                      <div
                        className="min-h-[140px] rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-7 text-zinc-700 outline-none"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => setComposerHtml((e.target as HTMLDivElement).innerHTML)}
                        dangerouslySetInnerHTML={{ __html: composerHtml }}
                      />

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700"
                            aria-label="Attach"
                          >
                            <PaperclipIcon />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700"
                            aria-label="Emoji"
                          >
                            <SmileIcon />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700"
                            aria-label="Template"
                          >
                            <TemplateIcon />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-zinc-100 hover:text-zinc-700"
                            aria-label="More"
                          >
                            <DotsIcon />
                          </button>
                        </div>

                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={createEmail}
                            className="rounded-l-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                          >
                            Send Now
                          </button>
                          <button
                            type="button"
                            className="rounded-r-xl bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-800"
                            aria-label="Schedule"
                          >
                            <CaretDownIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
