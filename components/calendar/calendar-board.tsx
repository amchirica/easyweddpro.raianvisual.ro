"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ro, enUS } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { CalendarEventDialog } from "@/components/calendar/calendar-event-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteCalendarEventAction, moveCalendarEventAction } from "@/lib/actions/calendar";
import { dateKeyInTimeZone, formatEventTime } from "@/lib/calendar/timezone";
import { mapCalendarEventRow, type CalendarEventItem } from "@/lib/calendar/mappers";
import { CALENDAR_EVENT_STATUSES, type CalendarEventStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "day" | "list";
type StatusFilter = CalendarEventStatus | "all";

const STATUS_TONE: Record<CalendarEventStatus, "success" | "warning" | "danger"> = {
  confirmed: "success",
  tentative: "warning",
  cancelled: "danger",
};

const VIEW_OPTIONS: { value: CalendarView; labelKey: string }[] = [
  { value: "month", labelKey: "common.month" },
  { value: "week", labelKey: "common.week" },
  { value: "day", labelKey: "common.day" },
  { value: "list", labelKey: "common.list" },
];

function matchesSearch(event: CalendarEventItem, query: string): boolean {
  if (!query) return true;
  const haystack = `${event.title} ${event.location} ${event.description}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

type CalendarBoardProps = {
  initialEvents: CalendarEventItem[];
  canWrite: boolean;
  clients?: { id: string; name: string }[];
  error?: string | null;
};

export function CalendarBoard({
  initialEvents,
  canWrite,
  clients = [],
  error,
}: CalendarBoardProps) {
  const { t, locale } = useI18n();
  const dateLocale = locale === "en" ? enUS : ro;
  const [events, setEvents] = useState<CalendarEventItem[]>(initialEvents);
  const [view, setView] = useState<CalendarView>("month");
  const [focusedDate, setFocusedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    initial?: CalendarEventItem;
    defaultDate?: string;
  }>({ open: false, mode: "create" });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const event of events) {
      if (event.eventType.trim()) set.add(event.eventType.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(
      (event) =>
        matchesSearch(event, search) &&
        (statusFilter === "all" || event.status === statusFilter) &&
        (typeFilter === "all" || event.eventType === typeFilter),
    );
  }, [events, search, statusFilter, typeFilter]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const event of filteredEvents) {
      const key = dateKeyInTimeZone(event.startsAt);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    }
    return map;
  }, [filteredEvents]);

  function openCreateDialog(defaultDate?: string) {
    if (!canWrite) {
      toast(t("modules.calendar.needWriteAdd"), "info");
      return;
    }
    setDialogState({ open: true, mode: "create", defaultDate });
  }

  function openEditDialog(eventItem: CalendarEventItem) {
    if (!canWrite) {
      toast("Nu ai permisiunea de a edita evenimente.", "info");
      return;
    }
    setDialogState({ open: true, mode: "edit", initial: eventItem });
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogState((current) => ({ ...current, open }));
  }

  function handleDialogSuccess(eventItem: CalendarEventItem) {
    setEvents((current) => {
      const exists = current.some((item) => item.id === eventItem.id);
      return exists
        ? current.map((item) => (item.id === eventItem.id ? eventItem : item))
        : [eventItem, ...current];
    });
  }

  async function handleDelete(eventItem: CalendarEventItem) {
    if (!canWrite) {
      toast(t("modules.calendar.needWriteDelete"), "info");
      return;
    }
    const confirmed = window.confirm(t("modules.calendar.deleteConfirm", { title: eventItem.title }));
    if (!confirmed) return;

    setPendingId(eventItem.id);
    const result = await deleteCalendarEventAction(eventItem.id);
    setPendingId(null);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }

    setEvents((current) => current.filter((item) => item.id !== eventItem.id));
    toast(result?.success ?? t("modules.calendar.deleted"), "success");
  }

  async function handleQuickMove(eventItem: CalendarEventItem, deltaDays: number) {
    if (!canWrite) {
      toast("Nu ai permisiunea de a reprograma evenimente.", "info");
      return;
    }

    const previous = events;
    const startsAt = addDays(new Date(eventItem.startsAt), deltaDays).toISOString();
    const endsAt = addDays(new Date(eventItem.endsAt), deltaDays).toISOString();

    setPendingId(eventItem.id);
    setEvents((current) =>
      current.map((item) => (item.id === eventItem.id ? { ...item, startsAt, endsAt } : item)),
    );

    const result = await moveCalendarEventAction(eventItem.id, { startsAt, endsAt });
    setPendingId(null);

    if (result?.error || !result?.data) {
      setEvents(previous);
      toast(result?.error ?? "Nu am putut reprograma evenimentul.", "error");
      return;
    }

    setEvents((current) =>
      current.map((item) => (item.id === eventItem.id ? mapCalendarEventRow(result.data!.event) : item)),
    );
    toast(result.success ?? "Eveniment reprogramat.", "success");
  }

  function shiftFocusedDate(direction: 1 | -1) {
    setFocusedDate((current) => {
      if (view === "week") return addWeeks(current, direction);
      if (view === "day") return addDays(current, direction);
      return addMonths(current, direction);
    });
  }

  const periodLabel = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(focusedDate, { weekStartsOn: 1 });
      const end = endOfWeek(focusedDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: dateLocale })} – ${format(end, "d MMM yyyy", { locale: dateLocale })}`;
    }
    if (view === "day") {
      return format(focusedDate, "EEEE, d MMMM yyyy", { locale: dateLocale });
    }
    if (view === "list") {
      return t("modules.calendar.allEvents");
    }
    return format(focusedDate, "LLLL yyyy", { locale: dateLocale });
  }, [view, focusedDate, dateLocale, t]);

  return (
    <ModuleShell
      title={t("modules.calendar.title")}
      description={t("modules.calendar.description")}
      actions={
        <Button type="button" onClick={() => openCreateDialog()}>
          <Plus data-icon="inline-start" />
          {t("modules.calendar.new")}
        </Button>
      }
    >
      <div className="space-y-5">
        {error ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block flex-1 sm:max-w-xs">
              <span className="sr-only">{t("modules.calendar.searchSr")}</span>
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("modules.calendar.searchPlaceholder")}
                className="h-9 pl-9"
              />
            </label>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter((value as StatusFilter) ?? "all")}
            >
              <SelectTrigger className="h-9 w-full sm:w-44">
                <SelectValue placeholder="Toate statusurile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate statusurile</SelectItem>
                {CALENDAR_EVENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status.calendar.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? "all")}>
              <SelectTrigger className="h-9 w-full sm:w-44">
                <SelectValue placeholder="Toate tipurile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                {typeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-border bg-background/40 p-1">
            {VIEW_OPTIONS.map((option) => {
              const active = view === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(!active && "text-muted-foreground")}
                  onClick={() => setView(option.value)}
                  aria-pressed={active}
                >
                  {t(option.labelKey)}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-lg font-medium text-foreground capitalize">
            {periodLabel}
          </p>
          {view !== "list" ? (
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="icon-sm" onClick={() => shiftFocusedDate(-1)}>
                <ChevronLeft />
                <span className="sr-only">{t("modules.calendar.prevPeriod")}</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setFocusedDate(new Date())}>
                  {t("common.today")}
              </Button>
              <Button type="button" variant="outline" size="icon-sm" onClick={() => shiftFocusedDate(1)}>
                <ChevronRight />
                <span className="sr-only">{t("modules.calendar.nextPeriod")}</span>
              </Button>
            </div>
          ) : null}
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t("modules.calendar.empty")}
            description={t("modules.calendar.emptyHint")}
            action={
              canWrite ? (
                <Button type="button" onClick={() => openCreateDialog()}>
                  <Plus data-icon="inline-start" />
                  Eveniment nou
                </Button>
              ) : undefined
            }
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("modules.calendar.emptyFiltered")}
            description={t("modules.calendar.emptyFilteredHint")}
          />
        ) : view === "month" ? (
          <MonthGrid
            focusedDate={focusedDate}
            eventsByDay={eventsByDay}
            canWrite={canWrite}
            onDayClick={(date) => openCreateDialog(dayKey(date))}
            onEventClick={openEditDialog}
          />
        ) : view === "week" ? (
          <WeekGrid
            focusedDate={focusedDate}
            eventsByDay={eventsByDay}
            canWrite={canWrite}
            onDayClick={(date) => openCreateDialog(dayKey(date))}
            onEventClick={openEditDialog}
          />
        ) : view === "day" ? (
          <DayAgenda
            focusedDate={focusedDate}
            eventsByDay={eventsByDay}
            canWrite={canWrite}
            pendingId={pendingId}
            onEventClick={openEditDialog}
            onDelete={handleDelete}
            onQuickMove={handleQuickMove}
          />
        ) : (
          <EventsListView
            events={filteredEvents}
            canWrite={canWrite}
            pendingId={pendingId}
            onEventClick={openEditDialog}
            onDelete={handleDelete}
            onQuickMove={handleQuickMove}
          />
        )}
      </div>

      <CalendarEventDialog
        open={dialogState.open}
        onOpenChange={handleDialogOpenChange}
        mode={dialogState.mode}
        initial={dialogState.initial}
        defaultDate={dialogState.defaultDate}
        clients={clients}
        onSuccess={handleDialogSuccess}
      />
    </ModuleShell>
  );
}

function EventColorDot({ color }: { color: string | null }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: color || "var(--champagne)" }}
      aria-hidden
    />
  );
}

type MonthGridProps = {
  focusedDate: Date;
  eventsByDay: Map<string, CalendarEventItem[]>;
  canWrite: boolean;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEventItem) => void;
};

function MonthGrid({ focusedDate, eventsByDay, canWrite, onDayClick, onEventClick }: MonthGridProps) {
  const { locale } = useI18n();
  const dateLocale = locale === "en" ? enUS : ro;
  const days = useMemo(() => {
    const monthStart = startOfMonth(focusedDate);
    const monthEnd = endOfMonth(focusedDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [focusedDate]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) }).map((day) =>
      format(day, "EEE", { locale: dateLocale }),
    );
  }, [dateLocale]);

  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dayKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, focusedDate);
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(day)}
              disabled={!canWrite}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r border-border/60 p-1.5 text-left align-top transition-colors last:border-r-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                canWrite && "hover:bg-white/[0.03]",
                !inMonth && "bg-background/20 text-muted-soft",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  isToday(day) ? "bg-champagne text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-col gap-1">
                {visible.map((event) => (
                  <span
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onEventClick(event);
                    }}
                    onKeyDown={(keyEvent) => {
                      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                        keyEvent.stopPropagation();
                        onEventClick(event);
                      }
                    }}
                    className="flex items-center gap-1 truncate rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-foreground hover:bg-white/[0.08]"
                    title={event.title}
                  >
                    <EventColorDot color={event.color} />
                    <span className="truncate">
                      {!event.allDay ? `${formatEventTime(event.startsAt)} ` : ""}
                      {event.title}
                    </span>
                  </span>
                ))}
                {overflow > 0 ? (
                  <span className="px-1.5 text-[11px] text-muted-soft">+{overflow} altele</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type WeekGridProps = MonthGridProps;

function WeekGrid({ focusedDate, eventsByDay, canWrite, onDayClick, onEventClick }: WeekGridProps) {
  const { t, locale } = useI18n();
  const dateLocale = locale === "en" ? enUS : ro;
  const days = useMemo(() => {
    const start = startOfWeek(focusedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [focusedDate]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const key = dayKey(day);
        const dayEvents = eventsByDay.get(key) ?? [];

        return (
          <div key={key} className="surface-card flex min-h-40 flex-col gap-2 p-3">
            <button
              type="button"
              onClick={() => onDayClick(day)}
              disabled={!canWrite}
              className="flex items-center justify-between text-left"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {format(day, "EEE", { locale: dateLocale })}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday(day) ? "bg-champagne text-accent-foreground" : "text-foreground",
                )}
              >
                {format(day, "d")}
              </span>
            </button>

            <div className="flex flex-col gap-1.5">
              {dayEvents.length === 0 ? (
                <p className="text-xs text-muted-soft">{t("modules.calendar.noEvents")}</p>
              ) : (
                dayEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick(event)}
                    className="flex items-start gap-1.5 rounded-md bg-white/[0.04] px-2 py-1.5 text-left text-xs text-foreground hover:bg-white/[0.08]"
                  >
                    <EventColorDot color={event.color} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{event.title}</span>
                      <span className="text-muted-soft">
                        {event.allDay ? t("modules.calendar.allDay") : formatEventTime(event.startsAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type DayAgendaProps = {
  focusedDate: Date;
  eventsByDay: Map<string, CalendarEventItem[]>;
  canWrite: boolean;
  pendingId: string | null;
  onEventClick: (event: CalendarEventItem) => void;
  onDelete: (event: CalendarEventItem) => void;
  onQuickMove: (event: CalendarEventItem, deltaDays: number) => void;
};

function DayAgenda({
  focusedDate,
  eventsByDay,
  canWrite,
  pendingId,
  onEventClick,
  onDelete,
  onQuickMove,
}: DayAgendaProps) {
  const { t } = useI18n();
  const dayEvents = eventsByDay.get(dayKey(focusedDate)) ?? [];

  if (dayEvents.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t("modules.calendar.emptyDay")}
        description={t("modules.calendar.emptyDayHint")}
      />
    );
  }

  return (
    <div className="surface-card divide-y divide-border">
      {dayEvents.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          canWrite={canWrite}
          pending={pendingId === event.id}
          onEventClick={onEventClick}
          onDelete={onDelete}
          onQuickMove={onQuickMove}
          showDate={false}
        />
      ))}
    </div>
  );
}

type EventsListViewProps = {
  events: CalendarEventItem[];
  canWrite: boolean;
  pendingId: string | null;
  onEventClick: (event: CalendarEventItem) => void;
  onDelete: (event: CalendarEventItem) => void;
  onQuickMove: (event: CalendarEventItem, deltaDays: number) => void;
};

function EventsListView({
  events,
  canWrite,
  pendingId,
  onEventClick,
  onDelete,
  onQuickMove,
}: EventsListViewProps) {
  const { locale } = useI18n();
  const dateLocale = locale === "en" ? enUS : ro;
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const event of events) {
      const key = dateKeyInTimeZone(event.startsAt);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <div className="space-y-5">
      {grouped.map(([key, dayEvents]) => (
        <div key={key} className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {format(new Date(`${key}T00:00:00`), "EEEE, d MMMM yyyy", { locale: dateLocale })}
          </p>
          <div className="surface-card divide-y divide-border">
            {dayEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                canWrite={canWrite}
                pending={pendingId === event.id}
                onEventClick={onEventClick}
                onDelete={onDelete}
                onQuickMove={onQuickMove}
                showDate={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type EventRowProps = {
  event: CalendarEventItem;
  canWrite: boolean;
  pending: boolean;
  onEventClick: (event: CalendarEventItem) => void;
  onDelete: (event: CalendarEventItem) => void;
  onQuickMove: (event: CalendarEventItem, deltaDays: number) => void;
  showDate: boolean;
};

function EventRow({ event, canWrite, pending, onEventClick, onDelete, onQuickMove, showDate }: EventRowProps) {
  const { t, locale } = useI18n();
  const dateLocale = locale === "en" ? enUS : ro;
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => onEventClick(event)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <EventColorDot color={event.color} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {event.allDay
                ? t("modules.calendar.allDay")
                : `${formatEventTime(event.startsAt)} – ${formatEventTime(event.endsAt)}`}
              {showDate ? ` · ${format(new Date(event.startsAt), "d MMM", { locale: dateLocale })}` : ""}
            </span>
            {event.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {event.location}
              </span>
            ) : null}
            {event.eventType ? <span>{event.eventType}</span> : null}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-2 sm:justify-end">
        <StatusBadge label={t(`status.calendar.${event.status}`)} tone={STATUS_TONE[event.status]} />
        {canWrite ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={() => onQuickMove(event, -1)}
              aria-label={t("modules.calendar.rescheduleEarlier")}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={() => onQuickMove(event, 1)}
              aria-label={t("modules.calendar.rescheduleLater")}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={() => onDelete(event)}
              aria-label={t("modules.calendar.deleteAria")}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}