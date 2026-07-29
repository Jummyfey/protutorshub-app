import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Calculator,
  Check,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Flag,
  Headphones,
  Home,
  LayoutDashboard,
  LineChart,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PieChart,
  Settings,
  ShieldCheck,
  Star,
  Target,
  User,
  XCircle,
} from "lucide-react";
import ResultsPage from "./ResultsPage";
import StatisticsPage from "./StatisticsPage";
import SuccessTrackPage from "./SuccessTrackPage";
import TutorHelpPage from "./TutorHelpPage";
import RecommendationsPage from "./RecommendationsPage";
import NeedTutorCard from "../components/NeedTutorCard";
import {
  verifyFlutterwaveSubscriptionPaymentForUser,
} from "../services/backendSync";
import { supabaseFunctionRequest } from "../services/supabaseRestClient";
import {
  generateWeeklyReport,
  getDefaultParentNotificationPreferences,
  getCachedActivityEvents,
  loadChildActivityEvents,
  loadParentDashboardByInvite,
  loadParentNotificationPreferences,
  saveParentNotificationPreferences,
  saveParentControlsByInvite,
  saveParentNotificationPreferencesByInvite,
  saveParentPushSubscriptionByInvite,
  saveParentTimetable,
} from "../services/parentMonitoring";
import { TOPIC_NAMES } from "../utils/resultsStorage";
import {
  generateParentStudyRoadmap,
  getDefaultParentSchedule,
  getParentSchedule,
  saveParentSchedule,
  getStudyGuideProgress,
  WEEK_DAYS,
} from "../utils/studyPlanStorage";

const EVENT_LABELS = {
  logged_in: "Logged In",
  logged_out: "Logged Out",
  app_opened: "App opened",
  dashboard_browsing: "Dashboard browsing",
  page_opened: "Page opened",
  page_heartbeat: "Page active",
  page_visited: "Page visited",
  session_started: "Session started",
  session_paused: "Break taken",
  session_resumed: "Session resumed",
  revision_session_started: "Revision session started",
  assignment_started: "Assignment started",
  live_lesson_joined: "Live lesson joined",
  live_lesson_left: "Live lesson left",
  study_guide_opened: "Study guide opened",
  study_guide_completed: "Study guide completed",
  practice_started: "Practice started",
  practice_completed: "Practice completed",
  mistakes_reviewed: "Mistakes reviewed",
  session_completed: "Session completed",
  mock_started: "Mock started",
  mock_completed: "Mock completed",
  session_missed: "Session missed",
  parent_lesson_reminder_due: "Lesson reminder",
  parent_lesson_inactivity: "Student inactivity",
  student_lesson_reminder_due: "Lesson reminder",
  session_abandoned: "Session abandoned",
};

const DURATION_OPTIONS = [
  { label: "30 mins", value: 30 },
  { label: "45 mins", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
];

const FLUTTERWAVE_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";
const ELITE_PRICES = { monthly: 7500, yearly: 75000 };
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const SCHEDULED_LESSON_INACTIVITY_MINUTES = 20;
const READ_PARENT_NOTIFICATIONS_KEY = "proTutorsHub_readParentNotifications";
const PARENT_PORTAL_PAGES = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "liveDashboard", label: "Live Monitoring", icon: Eye },
  { id: "historyDashboard", label: "Activity History", icon: Clock },
  { id: "overview", label: "Rules & Accountability", icon: ShieldCheck },
  { id: "monitoring", label: "Monitoring & Alerts", icon: Bell },
  { id: "reportsPage", label: "Reports", icon: FileText },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
  { id: "suggestions", label: "Suggestions", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "tutorHelp", label: "Help & Support", icon: Headphones },
];

const TUTORIALS = [
  {
    id: "parent-rules",
    title: "Set Parent Rules",
    summary: "Control study discipline and weekly targets.",
    steps: [
      "Open Parent Rules & Accountability.",
      "Tap Edit Parent Rules.",
      "Choose minimum study days, daily minutes and weekly target score.",
      "Select mandatory topics for the week.",
      "Tap Save Parent Rules.",
    ],
  },
  {
    id: "timetable",
    title: "Set The Timetable",
    summary: "Choose days, lesson time, duration and topics.",
    steps: [
      "Open Parent Rules & Accountability.",
      "Tap Edit Timetable.",
      "Enable the days the learner should study.",
      "Choose the topics, duration and lesson time for each day.",
      "Choose how many minutes before lesson the reminder email should come.",
      "Tap Save Timetable.",
    ],
  },
  {
    id: "lock-plan",
    title: "Lock Student Editing",
    summary: "Stop the student from changing the parent timetable.",
    steps: [
      "Open Parent Rules & Accountability.",
      "Tap Edit Timetable.",
      "Turn on Lock timetable for student.",
      "Tap Save Timetable.",
      "The student can still see the plan, but cannot edit it until the parent unlocks it.",
    ],
  },
  {
    id: "alerts",
    title: "Enable Lesson Emails",
    summary: "Receive reminder emails and the reports the parent chooses.",
    steps: [
      "Open Parent Monitoring Preferences.",
      "Tap Edit Monitoring Settings.",
      "Enter the parent email address.",
      "Turn on Email alerts.",
      "Choose Daily report, Weekly report, or both.",
      "Live starts, breaks, abandoned sessions and completions stay inside the dashboard and selected reports.",
      "Tap Save Monitoring Settings.",
    ],
  },
  {
    id: "phone-notifications",
    title: "Enable Phone Notifications",
    summary: "Allow alerts to appear on the parent phone.",
    steps: [
      "Install the parent dashboard on the parent phone.",
      "Open it from the installed app icon.",
      "Open Parent Monitoring Preferences.",
      "Tap Enable Phone Notifications.",
      "Allow notifications when the phone asks.",
    ],
  },
  {
    id: "reports",
    title: "Daily And Weekly Reports",
    summary: "Understand when reports are sent.",
    steps: [
      "Daily reports are sent only on days scheduled in the parent timetable.",
      "If the learner studies on an unscheduled day, it will not trigger a daily report.",
      "Weekly reports include all study activity from the week.",
      "The parent can set how many minutes before the lesson the reminder email should arrive.",
      "Live starts, breaks, abandoned sessions and completions are monitored in the dashboard instead of being sent one by one.",
      "Turn on Daily report, Weekly report, or both under Parent Monitoring Preferences.",
    ],
  },
];

export default function ParentDashboardPage({
  attempts,
  inviteToken,
}) {
  const [activePortalPage, setActivePortalPage] = useState("dashboard");
  const [parentPageHistory, setParentPageHistory] = useState(["dashboard"]);
  const [isParentMenuOpen, setIsParentMenuOpen] = useState(false);
  const [isParentSidebarCollapsed, setIsParentSidebarCollapsed] = useState(false);
  const [activeTimetableDay, setActiveTimetableDay] = useState("");
  const [childAvatar, setChildAvatar] = useState("");
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(READ_PARENT_NOTIFICATIONS_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [childAttempts, setChildAttempts] = useState([]);
  const [childPackage, setChildPackage] = useState("elite");
  const [childSubscription, setChildSubscription] = useState(null);
  const [upgradeBillingCycle, setUpgradeBillingCycle] = useState("monthly");
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [isUpgradeBusy, setIsUpgradeBusy] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [dashboardLink, setDashboardLink] = useState(null);
  const [timetable, setTimetable] = useState(() => getDefaultParentTimetable());
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [parentSchedule, setParentSchedule] = useState(() => getDefaultParentSchedule());
  const [locked, setLocked] = useState(false);
  const [isEditingTimetable, setIsEditingTimetable] = useState(false);
  const [isEditingParentControls, setIsEditingParentControls] = useState(false);
  const [pushStatus, setPushStatus] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [, setDashboardAlert] = useState(null);
  const timetableAlertKeys = useRef(new Set());
  const activePortalPageRef = useRef(activePortalPage);
  const parentPageHistoryRef = useRef(parentPageHistory);
  const parentBrowserHistoryReadyRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      const loadedDashboard = inviteToken ? await loadParentDashboardByInvite(inviteToken, 500) : null;
      const localCachedEvents = getCachedActivityEvents();
      const [loadedEvents, loadedPreferences] = loadedDashboard
        ? [mergeActivityEvents(loadedDashboard.events, localCachedEvents), null]
        : await Promise.all([
            loadChildActivityEvents(200),
            loadParentNotificationPreferences(),
          ]);

      if (!active) return;

      setEvents(sortEventsByNewest(loadedEvents));
      setPreferences(loadedPreferences);
      if (loadedDashboard) {
        setDashboardLink(loadedDashboard.link);
        if (loadedDashboard.link?.child_avatar_url) {
          setChildAvatar(loadedDashboard.link.child_avatar_url);
        }
        setSessions(loadedDashboard.sessions || []);
        setChildAttempts(loadedDashboard.attempts || []);
        setChildPackage(loadedDashboard.childPackage || "free");
        setChildSubscription(loadedDashboard.childSubscription || null);
        setTimetable(loadedDashboard.timetable?.length ? loadedDashboard.timetable : getDefaultParentTimetable());
        setReminderMinutes(loadedDashboard.reminderMinutes || 15);
        setLocked(Boolean(loadedDashboard.locked));
        setPreferences(loadedDashboard.preferences || {
          ...getDefaultParentNotificationPreferences(),
          parentId: loadedDashboard.link.parent_id,
          childId: loadedDashboard.link.child_id,
          enableParentDashboard: true,
          alertOnAppOpened: true,
          alertOnSessionStarted: true,
          alertOnSessionCompleted: true,
          alertOnMissedSession: true,
          receiveDailyReport: true,
          receiveWeeklyReport: false,
        });
        setParentSchedule({
          ...getDefaultParentSchedule(),
          ...(loadedDashboard.parentSchedule || {}),
        });
      }
    };

    const refreshDashboard = () => loadDashboard();

    loadDashboard();
    const timer = window.setInterval(loadDashboard, 1000);
    window.addEventListener("proTutorsHub:childActivityEvent", refreshDashboard);
    window.addEventListener("storage", refreshDashboard);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("proTutorsHub:childActivityEvent", refreshDashboard);
      window.removeEventListener("storage", refreshDashboard);
    };
  }, [inviteToken]);

  useEffect(() => {
    activePortalPageRef.current = activePortalPage;
  }, [activePortalPage]);

  useEffect(() => {
    parentPageHistoryRef.current = parentPageHistory;
  }, [parentPageHistory]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    if (!parentBrowserHistoryReadyRef.current) {
      window.history.replaceState(
        {
          ...(window.history.state || {}),
          proTutorsHubParentPage: activePortalPageRef.current,
          proTutorsHubParentHistory: parentPageHistoryRef.current,
        },
        "",
        window.location.href
      );
      parentBrowserHistoryReadyRef.current = true;
    }

    const handleParentPopState = (event) => {
      const state = event.state || {};
      const nextPage = state.proTutorsHubParentPage || "dashboard";
      const nextHistory = Array.isArray(state.proTutorsHubParentHistory)
        ? state.proTutorsHubParentHistory
        : [nextPage];

      activePortalPageRef.current = nextPage;
      parentPageHistoryRef.current = nextHistory.length ? nextHistory : [nextPage];
      setActivePortalPage(nextPage);
      setParentPageHistory(nextHistory.length ? nextHistory : [nextPage]);
      setIsParentMenuOpen(false);
    };

    window.addEventListener("popstate", handleParentPopState);
    return () => window.removeEventListener("popstate", handleParentPopState);
  }, []);

  useEffect(() => {
    const checkParentTimetableAlert = () => {
      const now = new Date();
      const today = now.toLocaleDateString("en-US", { weekday: "long" });
      const todayActivityEvents = events.filter((event) => new Date(event.timestamp).toDateString() === now.toDateString());
      const todayRows = timetable.filter((item) => item.day === today && item.enabled !== false);
      const emitAlert = (key, title, message) => {
        const storedKey = `proTutorsHub_parentAlertSent:${dashboardLink?.child_id || "child"}:${now.toISOString().slice(0, 10)}:${key}`;
        if (timetableAlertKeys.current.has(key)) return;
        if (typeof window !== "undefined" && window.localStorage.getItem(storedKey)) return;
        timetableAlertKeys.current.add(key);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storedKey, "true");
        }
        const alert = {
          title,
          message,
          timestamp: new Date().toLocaleString(),
        };
        setDashboardAlert(alert);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(title, { body: message });
        }
      };

      todayRows.forEach((item) => {
        if (!item.startTime) return false;
        const [hours, minutes] = item.startTime.split(":").map(Number);
        const startTime = new Date(now);
        startTime.setHours(hours || 0, minutes || 0, 0, 0);
        const endTime = new Date(startTime.getTime() + Number(item.duration || 60) * 60000);
        const topicLabel = item.topics?.join(", ") || "study";
        const lessonKey = `${item.day}-${item.startTime}`;
        const relevantEvents = todayActivityEvents.filter((event) => {
          const eventTime = new Date(event.timestamp);
          return eventTime >= startTime && eventTime <= endTime;
        });
        const activeEvents = relevantEvents.filter((event) =>
          ["logged_in", "app_opened", "page_opened", "page_heartbeat", "session_started", "session_resumed", "study_guide_opened", "practice_started", "mock_started", "live_lesson_joined"].includes(event.eventType)
        );
        const latestActiveEvent = sortEventsByNewest(activeEvents)[0] || null;
        const inactiveSince = latestActiveEvent ? new Date(latestActiveEvent.timestamp) : startTime;
        const inactiveMinutes = Math.floor((now.getTime() - inactiveSince.getTime()) / 60000);

        if (now >= startTime && now < new Date(startTime.getTime() + 60000)) {
          emitAlert(`${lessonKey}-started`, "Lesson has started", `${dashboardLink?.child_name || "The child"} has started the scheduled ${topicLabel} period.`);
        }

        if (now >= startTime && now <= endTime && inactiveMinutes >= SCHEDULED_LESSON_INACTIVITY_MINUTES) {
          const inactiveKey = latestActiveEvent?.id || "no-activity";
          emitAlert(
            `${lessonKey}-inactive-${inactiveKey}`,
            "Student inactive",
            `${dashboardLink?.child_name || "The child"} has been inactive for ${inactiveMinutes} minutes during the scheduled ${topicLabel} period.`
          );
        }
      });
    };

    checkParentTimetableAlert();
    const timer = window.setInterval(checkParentTimetableAlert, 30000);
    return () => window.clearInterval(timer);
  }, [dashboardLink, reminderMinutes, timetable, events]);

  const activeAttempts = childAttempts.length ? childAttempts : attempts;
  const parentScheduleWithTimetable = useMemo(
    () => deriveParentScheduleFromTimetable(parentSchedule, timetable),
    [parentSchedule, timetable]
  );
  const parentRoadmap = generateParentStudyRoadmap(parentScheduleWithTimetable);
  const notificationItems = useMemo(() => getParentNotifications(events), [events]);
  const unreadNotificationItems = notificationItems.filter((item) => !readNotificationIds.includes(item.id));
  const visibleNotificationItems = unreadNotificationItems.length ? unreadNotificationItems : notificationItems.slice(0, 12);

  const updateParentSchedule = (updates) => {
    setParentSchedule((current) => ({ ...current, ...updates }));
  };

  const startEditingParentRules = () => {
    setIsEditingParentControls(true);
  };

  const cancelParentRulesEdit = () => {
    setParentSchedule(getParentSchedule());
    setIsEditingParentControls(false);
  };

  const resetParentRules = () => {
    setParentSchedule(getDefaultParentSchedule());
    setIsEditingParentControls(true);
  };

  const updatePreferences = (updates) => {
    setPreferences((current) => ({ ...(current || {}), ...updates }));
  };

  const saveParentRules = async () => {
    if (isEditingParentControls) {
      const savedSchedule = saveParentSchedule(parentScheduleWithTimetable);
      setParentSchedule(savedSchedule);
      if (inviteToken) {
        await saveParentControlsByInvite(inviteToken, savedSchedule);
      }
      setDashboardAlert({
        title: "Parent rules saved",
        message: "The accountability rules have been saved for this learner.",
        timestamp: new Date().toLocaleString(),
      });
    }
    setIsEditingParentControls(!isEditingParentControls);
  };

  const saveMonitoringSettings = async () => {
    const normalizedPreferences = {
        ...(preferences || {}),
        enableWhatsAppAlerts: false,
        enableParentDashboard: preferences?.enableParentDashboard ?? true,
        parentWhatsAppNumber: "",
      };
    try {
      if (inviteToken && dashboardLink?.child_id) {
        await saveParentNotificationPreferencesByInvite(inviteToken, normalizedPreferences);
      } else {
        await saveParentNotificationPreferences(normalizedPreferences);
      }
      setDashboardAlert({
        title: "Monitoring settings saved",
        message: normalizedPreferences.parentEmail
          ? `Email alerts will be sent to ${normalizedPreferences.parentEmail}.`
          : "Dashboard preferences have been saved. Add an email to receive email alerts.",
        timestamp: new Date().toLocaleString(),
      });
    } catch (error) {
      setDashboardAlert({
        title: "Monitoring settings not saved",
        message: error.message || "Please check the parent dashboard link and try again.",
        timestamp: new Date().toLocaleString(),
      });
    }
  };

  const saveTimetable = async () => {
    if (isEditingTimetable && inviteToken) {
      const normalizedReminderMinutes = Math.max(1, Math.min(240, Number(reminderMinutes) || 15));
      await saveParentTimetable(inviteToken, timetable, normalizedReminderMinutes, locked);
      setReminderMinutes(normalizedReminderMinutes);
      setDashboardAlert({
        title: "Timetable saved",
        message: locked
          ? "The lesson schedule is saved and locked for the learner."
          : "The lesson schedule is saved and can still be edited by the learner.",
        timestamp: new Date().toLocaleString(),
      });
    }
    setIsEditingTimetable(!isEditingTimetable);
  };

  const childName = getFirstName(getLinkedChildName(dashboardLink, events));
  const openParentPage = (pageId) => {
    if (pageId === activePortalPageRef.current) {
      setIsParentMenuOpen(false);
      return;
    }

    const currentHistory = parentPageHistoryRef.current;
    const nextHistory = [...currentHistory, pageId].slice(-20);
    parentPageHistoryRef.current = nextHistory;
    activePortalPageRef.current = pageId;
    setParentPageHistory(nextHistory);
    setActivePortalPage(pageId);
    setIsParentMenuOpen(false);

    if (typeof window !== "undefined") {
      window.history.pushState(
        {
          ...(window.history.state || {}),
          proTutorsHubParentPage: pageId,
          proTutorsHubParentHistory: nextHistory,
        },
        "",
        window.location.href
      );
    }
  };
  const goParentBack = () => {
    setIsParentMenuOpen(false);
    if (typeof window !== "undefined" && parentPageHistoryRef.current.length > 1) {
      window.history.back();
      return;
    }

    activePortalPageRef.current = "dashboard";
    parentPageHistoryRef.current = ["dashboard"];
    setActivePortalPage("dashboard");
    setParentPageHistory(["dashboard"]);
  };
  const handleNotificationToggle = () => {
    setIsNotificationPanelOpen((current) => {
      const next = !current;
      if (next) {
        const nextReadIds = Array.from(new Set([...readNotificationIds, ...notificationItems.map((item) => item.id)]));
        setReadNotificationIds(nextReadIds);
        window.localStorage.setItem(READ_PARENT_NOTIFICATIONS_KEY, JSON.stringify(nextReadIds));
      }
      return next;
    });
  };
  const hasParentAccess = childPackage === "elite";
  const renewal = getRenewalState(childSubscription, childPackage);
  const startParentUpgrade = async () => {
    if (!dashboardLink?.child_id) return;
    if (hasParentAccess && !renewal.canRenew) {
      setUpgradeMessage(renewal.message);
      return;
    }

    setIsUpgradeBusy(true);
    setUpgradeMessage("");

    try {
      if (!FLUTTERWAVE_PUBLIC_KEY) {
        throw new Error("Flutterwave public key is not configured yet. Please contact Pro Tutors Hub support.");
      }

      await loadFlutterwaveInlineScript();
      const amount = upgradeBillingCycle === "yearly" ? ELITE_PRICES.yearly : ELITE_PRICES.monthly;
      const txRef = `pth-elite-${upgradeBillingCycle}-${dashboardLink.child_id}-${Date.now()}`;

      window.FlutterwaveCheckout({
        public_key: FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: txRef,
        amount,
        currency: "NGN",
        customer: {
          email: preferences?.parentEmail || "info@protutorshub.com",
          name: `${childName} Parent`,
        },
        customizations: {
          title: "Pro Tutors Hub",
          description: `Elite ${upgradeBillingCycle} subscription for ${childName}`,
          logo: `${window.location.origin}/app-icon-96.png`,
        },
        callback: async (response) => {
          if (response?.status !== "successful" && response?.status !== "completed") {
            setUpgradeMessage("Payment was not completed. Please try again.");
            setIsUpgradeBusy(false);
            return;
          }

          setUpgradeMessage("Payment received. Verifying subscription securely...");
          const verification = await verifyFlutterwaveSubscriptionPaymentForUser(dashboardLink.child_id, {
            transactionId: response.transaction_id || response.id,
            txRef: response.tx_ref || txRef,
            packageType: "elite",
            billingCycle: upgradeBillingCycle,
            expectedAmount: amount,
            currency: "NGN",
            customerEmail: preferences?.parentEmail || "",
          });

          if (verification?.ok) {
            setChildPackage("elite");
            setChildSubscription({
              package_type: "elite",
              subscription_status: "active",
              subscription_billing_cycle: verification.billingCycle,
              subscription_started_at: new Date().toISOString(),
              subscription_expires_at: verification.expiresAt,
            });
            setUpgradeMessage("Elite access verified. Parent controls are now active.");
            setActivePortalPage("overview");
          } else {
            setUpgradeMessage(verification?.message || "Payment could not be verified yet. Please contact support.");
          }
          setIsUpgradeBusy(false);
        },
        onclose: () => setIsUpgradeBusy(false),
      });
    } catch (error) {
      setUpgradeMessage(error.message || "Unable to open payment. Please try again.");
      setIsUpgradeBusy(false);
    }
  };
  const ParentPortalHeaderComponent = ({ title }) => (
    <ParentPortalHeader
      title={title}
      childName={childName}
      childAvatar={childAvatar}
      isMenuOpen={isParentMenuOpen}
      isSidebarCollapsed={isParentSidebarCollapsed}
      canGoBack={parentPageHistory.length > 1}
      activePage={activePortalPage}
      onMenuOpen={() => {
        const isPhoneWidth = typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;
        if (isPhoneWidth) {
          setIsParentSidebarCollapsed(false);
          setIsParentMenuOpen((value) => !value);
          return;
        }
        setIsParentSidebarCollapsed((isCollapsed) => {
          const nextCollapsed = !isCollapsed;
          setIsParentMenuOpen(false);
          return nextCollapsed;
        });
      }}
      onMenuClose={() => setIsParentMenuOpen(false)}
      onOpenPage={openParentPage}
      onBack={goParentBack}
      notifications={visibleNotificationItems}
      unreadNotificationCount={unreadNotificationItems.length}
      isNotificationPanelOpen={isNotificationPanelOpen}
      onNotificationToggle={handleNotificationToggle}
    />
  );

  if (!hasParentAccess && activePortalPage !== "upgrade") {
    return (
      <ParentUpgradeAccessPage
        HeaderComponent={ParentPortalHeaderComponent}
        childName={childName}
        billingCycle={upgradeBillingCycle}
        onBillingCycleChange={setUpgradeBillingCycle}
        onUpgrade={startParentUpgrade}
        busy={isUpgradeBusy}
        message={upgradeMessage}
        renewal={renewal}
      />
    );
  }

  if (activePortalPage === "upgrade") {
    return (
      <ParentUpgradeAccessPage
        HeaderComponent={ParentPortalHeaderComponent}
        childName={childName}
        billingCycle={upgradeBillingCycle}
        onBillingCycleChange={setUpgradeBillingCycle}
        onUpgrade={startParentUpgrade}
        busy={isUpgradeBusy}
        message={upgradeMessage}
        renewal={renewal}
        hasParentAccess={hasParentAccess}
      />
    );
  }

  if (activePortalPage === "dashboard") {
    return (
      <ParentOpenDashboardPage
        HeaderComponent={ParentPortalHeaderComponent}
        childName={childName}
        events={events}
        timetable={timetable}
        attempts={activeAttempts}
        onOpenLive={() => openParentPage("liveDashboard")}
        onOpenHistory={() => openParentPage("historyDashboard")}
        onOpenPage={openParentPage}
      />
    );
  }

  if (activePortalPage === "liveDashboard") {
    return (
      <ParentLiveDashboardPage
        HeaderComponent={ParentPortalHeaderComponent}
        childName={childName}
        events={events}
        timetable={timetable}
      />
    );
  }

  if (activePortalPage === "historyDashboard") {
    return (
      <ParentHistoryDashboardPage
        HeaderComponent={ParentPortalHeaderComponent}
        childName={childName}
        events={events}
        sessions={sessions}
        timetable={timetable}
        attempts={activeAttempts}
      />
    );
  }

  if (activePortalPage === "monitoring") {
    return (
      <ParentMonitoringAlertsPage
        HeaderComponent={ParentPortalHeaderComponent}
        preferences={preferences}
        onEdit={saveMonitoringSettings}
        onUpdate={updatePreferences}
        pushStatus={pushStatus}
        onEnablePush={async () => {
          try {
            await saveParentPushSubscriptionByInvite(inviteToken);
            setPushStatus("granted");
            setDashboardAlert({
              title: "Phone notifications enabled",
              message: "This device can now receive parent dashboard alerts.",
              timestamp: new Date().toLocaleString(),
            });
          } catch (error) {
            setPushStatus(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
            setDashboardAlert({
              title: "Notifications not enabled",
              message: error.message,
              timestamp: new Date().toLocaleString(),
            });
          }
        }}
      />
    );
  }

  if (activePortalPage === "reportsPage") {
    return (
      <ParentReportsPage
        HeaderComponent={ParentPortalHeaderComponent}
        events={events}
        attempts={activeAttempts}
        timetable={timetable}
        onOpenHistory={() => openParentPage("historyDashboard")}
      />
    );
  }

  if (activePortalPage === "todayProgress" || activePortalPage === "weeklySummary") {
    return (
      <ParentActivitySummaryPage
        HeaderComponent={ParentPortalHeaderComponent}
        title={activePortalPage === "todayProgress" ? "Today's Progress" : "Weekly Summary"}
        events={events}
        timetable={timetable}
        rangeType={activePortalPage === "todayProgress" ? "today" : "week"}
      />
    );
  }

  if (activePortalPage === "topicsCompleted") {
    return (
      <ParentTopicsCompletedPage
        HeaderComponent={ParentPortalHeaderComponent}
        events={events}
        attempts={activeAttempts}
      />
    );
  }

  if (activePortalPage === "pagesVisitedWeekly") {
    return (
      <ParentWeeklyPagesVisitedPage
        HeaderComponent={ParentPortalHeaderComponent}
        events={events}
      />
    );
  }

  if (activePortalPage === "timetable") {
    return (
      <ParentTimetablePage
        HeaderComponent={ParentPortalHeaderComponent}
        timetable={timetable}
        reminderMinutes={reminderMinutes}
        locked={locked}
        isEditing={isEditingTimetable}
        activeDay={activeTimetableDay}
        onToggleDay={(day) => setActiveTimetableDay(activeTimetableDay === day ? "" : day)}
        onChange={setTimetable}
        onReminderChange={setReminderMinutes}
        onLockedChange={setLocked}
        onSave={saveTimetable}
      />
    );
  }

  if (activePortalPage === "suggestions") {
    return (
      <ParentSuggestionsPage
        HeaderComponent={ParentPortalHeaderComponent}
        childName={childName}
        parentEmail={preferences?.parentEmail || ""}
      />
    );
  }

  if (activePortalPage === "settings") {
    return (
      <ParentPlaceholderPage
        HeaderComponent={ParentPortalHeaderComponent}
        title="Settings"
        message="Account and portal settings will appear here."
      />
    );
  }

  if (activePortalPage === "results") {
    return (
      <ResultsPage
        HeaderComponent={ParentPortalHeaderComponent}
        attempts={activeAttempts}
        userPackage={childPackage}
        onTutorHelp={() => openParentPage("tutorHelp")}
        parentMode
      />
    );
  }

  if (activePortalPage === "statistics") {
    return (
      <StatisticsPage
        HeaderComponent={ParentPortalHeaderComponent}
        attempts={activeAttempts}
        userPackage={childPackage}
        onTutorHelp={() => openParentPage("tutorHelp")}
        parentMode
      />
    );
  }

  if (activePortalPage === "successTrack") {
    return (
      <SuccessTrackPage
        HeaderComponent={ParentPortalHeaderComponent}
        attempts={activeAttempts}
        syllabusTopics={TOPIC_NAMES.map((topic) => ({ title: topic, lessons: [topic] }))}
        userPackage={childPackage}
        onTutorHelp={() => openParentPage("tutorHelp")}
        parentMode
      />
    );
  };

  if (activePortalPage === "tutorHelp") {
    return (
      <ParentPortalShell HeaderComponent={ParentPortalHeaderComponent} title="Tutor Help">
        <TutorHelpPage
          HeaderComponent={() => null}
          onPrevious={goParentBack}
          onNext={() => openParentPage("upgrade")}
        />
      </ParentPortalShell>
    );
  }

  if (activePortalPage === "recommendations") {
    return (
      <RecommendationsPage
        HeaderComponent={ParentPortalHeaderComponent}
        userName={`${childName} Parent`}
        userEmail={preferences?.parentEmail || ""}
        role="Parent app user"
        pageContext={`Parent portal for ${childName}`}
        parentMode
        onPrevious={() => openParentPage("tutorHelp")}
        onNext={() => openParentPage("upgrade")}
      />
    );
  }

  return (
    <ParentRulesPage
      HeaderComponent={ParentPortalHeaderComponent}
      parentSchedule={parentScheduleWithTimetable}
      parentRoadmap={parentRoadmap}
      events={events}
      timetable={timetable}
      isEditing={isEditingParentControls}
      onUpdate={updateParentSchedule}
      onSave={saveParentRules}
      onEdit={startEditingParentRules}
      onCancel={cancelParentRulesEdit}
      onReset={resetParentRules}
    />
  );
}

function ParentPortalShell({ HeaderComponent, title, children, isSidebarCollapsed = false, contentClassName = "" }) {
  return (
    <main className={`parent-app-shell ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {HeaderComponent({ title })}
      <div className={`parent-content-shell ${contentClassName}`}>{children}</div>
    </main>
  );
}

function ParentPageBanner({ title, subtitle, children }) {
  return (
    <section className="parent-panel parent-page-hero">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <small>Dashboard <ChevronRight size={13} /> {title}</small>
      </div>
      {children && <div className="parent-hero-actions">{children}</div>}
    </section>
  );
}

function ParentNumberedSection({ number, title, subtitle, children }) {
  return (
    <section className="parent-panel parent-number-section">
      <div className="parent-section-head">
        <span>{number}</span>
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </div>
      {children}
    </section>
  );
}

function ParentMetric({ icon, label, value, note, onEdit }) {
  return (
    <article className="parent-metric-card">
      <span>{React.createElement(icon, { size: 26 })}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <em>{note}</em>
      {onEdit && <button onClick={onEdit}><Edit3 size={15} /> Edit</button>}
    </article>
  );
}

function ParentSettingCard({ icon, title, note, checked, disabled, comingSoon = false, onChange }) {
  return (
    <article className={`parent-setting-card ${comingSoon ? "coming-soon" : ""}`}>
      <span>{React.createElement(icon, { size: 25 })}</span>
      <div><strong>{title}</strong><p>{note}</p>{comingSoon && <em>Coming soon</em>}</div>
      <label className="parent-switch">
        <small>{checked ? "On" : "Off"}</small>
        <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />
        <b />
      </label>
    </article>
  );
}

function ParentActionCard({ icon, title, note, checked, disabled, children, onChange }) {
  return (
    <article className="parent-action-card">
      {React.createElement(icon, { size: 30 })}
      <div><strong>{title}</strong><p>{note}</p>{children}</div>
      {typeof checked === "boolean" ? (
        <label className="parent-switch">
          <small>{checked ? "On" : "Off"}</small>
          <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />
          <b />
        </label>
      ) : (
      <ChevronRight size={18} />
      )}
    </article>
  );
}

function ToggleRow({ title, note, checked, disabled, onChange }) {
  return (
    <label className="parent-toggle-row">
      <span><strong>{title}</strong><em>{note}</em></span>
      <span className="parent-switch">
        <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
        <b />
      </span>
    </label>
  );
}

function ProgressLine({ value, color }) {
  return <span className="parent-progress-line"><b style={{ width: `${value}%`, background: color }} /></span>;
}

function MiniSessionTable({ events }) {
  const rows = sortEventsByNewest(events).slice(0, 5);
  const fallback = [
    ["Jun 11, 2026", "4:00 PM", "60 mins", "Algebra", "80%", "Completed"],
    ["Jun 10, 2026", "5:00 PM", "45 mins", "Fractions", "75%", "Completed"],
    ["Jun 9, 2026", "4:30 PM", "60 mins", "Word Problems", "70%", "Completed"],
    ["Jun 8, 2026", "5:15 PM", "30 mins", "Geometry", "-", "Abandoned"],
  ];
  return (
    <div className="parent-table-wrap">
      <table className="parent-dashboard-table parent-mini-table">
        <thead><tr><th>Date</th><th>Start Time</th><th>Duration</th><th>Topic</th><th>Score</th><th>Status</th></tr></thead>
        <tbody>
          {(rows.length ? rows.map((event) => [
            new Date(event.timestamp).toLocaleDateString(),
            new Date(event.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            event.duration ? formatDuration(event.duration) : "-",
            getEventTopic(event),
            typeof event.score === "number" ? `${event.score}%` : "-",
            getEventStatus(event),
          ]) : fallback).map((row, index) => (
            <tr key={`${row[0]}-${index}`}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatTime(value = "17:00") {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getNextTimetableSession(timetable = []) {
  const enabledRows = timetable.filter((row) => row.enabled !== false && row.startTime);
  if (!enabledRows.length) return null;
  const now = new Date();
  const todayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const todayIndex = WEEK_DAYS.indexOf(todayName);
  const candidates = [];

  enabledRows.forEach((row) => {
    const dayIndex = WEEK_DAYS.indexOf(row.day);
    if (dayIndex < 0) return;
    const [hours, minutes] = String(row.startTime || "17:00").split(":").map(Number);
    let offset = dayIndex - todayIndex;
    if (offset < 0) offset += 7;
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    if (date <= now) date.setDate(date.getDate() + 7);
    candidates.push({
      ...row,
      date,
      label: date.toDateString() === now.toDateString()
        ? "Today"
        : date.toDateString() === new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString()
          ? "Tomorrow"
          : row.day,
    });
  });

  return candidates.sort((a, b) => a.date.getTime() - b.date.getTime())[0] || null;
}

function deriveParentScheduleFromTimetable(parentSchedule = {}, timetable = []) {
  const activeRows = timetable.filter((row) => row.enabled !== false);
  const totalMinutes = activeRows.reduce((sum, row) => sum + (Number(row.duration) || 0), 0);
  const averageMinutes = activeRows.length ? Math.round(totalMinutes / activeRows.length) : 0;

  return {
    ...parentSchedule,
    minimumStudyDaysWeekly: activeRows.length,
    minimumDailyMinutes: averageMinutes,
    dailyMinutes: averageMinutes,
    readinessGoal: parentSchedule.readinessGoal || "Exam Ready",
    escalateMissedSessions: parentSchedule.escalateMissedSessions ?? true,
    missedSessionEscalationCount: parentSchedule.missedSessionEscalationCount || 2,
    escalateRepeatedInactivity: parentSchedule.escalateRepeatedInactivity ?? true,
    inactivityEscalationHours: parentSchedule.inactivityEscalationHours || 24,
    escalateLowParticipation: parentSchedule.escalateLowParticipation ?? true,
    lowParticipationPercent: parentSchedule.lowParticipationPercent || 50,
  };
}

function getEscalationSummary(events = [], timetable = [], parentSchedule = {}) {
  const now = new Date();
  const weekRange = getDateRange("week", "", "");
  const weekEvents = events.filter((event) => {
    const time = new Date(event.timestamp);
    return time >= weekRange.start && time <= weekRange.end;
  });
  const attendanceRows = getAttendanceRows(timetable, weekEvents, weekRange);
  const missedSessions = attendanceRows.filter((row) => row.status === "Missed").length;
  const latestActivity = sortEventsByNewest(events).find((event) => !["logged_out", "session_abandoned"].includes(event.eventType));
  const inactivityHours = latestActivity
    ? Math.max(0, Math.floor((now.getTime() - new Date(latestActivity.timestamp).getTime()) / 3600000))
    : 999;
  const activeDays = new Set(weekEvents.map((event) => new Date(event.timestamp).toDateString())).size;
  const expectedDays = Math.max(1, parentSchedule.minimumStudyDaysWeekly || timetable.filter((row) => row.enabled !== false).length || 1);
  const participationPercent = Math.min(100, Math.round((activeDays / expectedDays) * 100));

  return {
    missedSessions,
    inactivityHours,
    participationPercent,
    missedTriggered: Boolean(parentSchedule.escalateMissedSessions ?? true) && missedSessions >= (parentSchedule.missedSessionEscalationCount || 2),
    inactivityTriggered: Boolean(parentSchedule.escalateRepeatedInactivity ?? true) && inactivityHours >= (parentSchedule.inactivityEscalationHours || 24),
    participationTriggered: Boolean(parentSchedule.escalateLowParticipation ?? true) && participationPercent < (parentSchedule.lowParticipationPercent || 50),
  };
}

function ParentRulesPage({ HeaderComponent, parentSchedule, parentRoadmap, events, timetable, isEditing, onUpdate, onSave, onEdit, onCancel, onReset }) {
  const selectedTopics = parentSchedule.mandatoryTopics || [];
  const escalationSummary = getEscalationSummary(events, timetable, parentSchedule);
  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Progress Tracker">
      <section className="parent-panel parent-page-hero">
        <div className="parent-title-row">
          <div className="parent-icon-badge gold"><ShieldCheck size={28} /></div>
          <div>
            <h1>Rules & Accountability</h1>
            <p>Set rules, targets and expectations to guide your child's study.</p>
          </div>
        </div>
        <button className="parent-ghost-button"><Eye size={18} /> Preview for Child</button>
      </section>

      <ParentNumberedSection number="1" title="Study Requirements" subtitle="Set minimum study expectations for your child.">
        <div className="parent-card-grid four">
          <ParentMetric icon={CalendarDays} label="Minimum Study Days" value={`${parentSchedule.minimumStudyDaysWeekly || 0} days`} note="synced from timetable" />
          <ParentMetric icon={Clock} label="Minimum Daily Study" value={`${parentSchedule.minimumDailyMinutes || 0} mins`} note="average timetable duration" />
          <ParentMetric icon={Star} label="Minimum Weekly Score" value={`${parentSchedule.weeklyTargetScore || 80}%`} note="target score" onEdit={onEdit} />
          <ParentMetric icon={Target} label="Readiness Target" value={parentSchedule.readinessGoal || "Exam Ready"} note="readiness goal" />
        </div>
        {isEditing && (
          <div className="parent-form-grid">
            <label>Minimum Study Days<input value={`${parentSchedule.minimumStudyDaysWeekly || 0} days weekly`} disabled /></label>
            <label>Minimum Daily Study<input value={`${parentSchedule.minimumDailyMinutes || 0} mins average`} disabled /></label>
            <label>Weekly Target Score<input type="number" min="0" max="100" value={parentSchedule.weeklyTargetScore || 80} onChange={(event) => onUpdate({ weeklyTargetScore: Number(event.target.value) })} /></label>
            <label>Readiness Goal<input value={parentSchedule.readinessGoal || "Exam Ready"} disabled /></label>
          </div>
        )}
      </ParentNumberedSection>

      <ParentNumberedSection number="2" title="Mandatory Topics" subtitle="Select the topics your child must focus on.">
        <div className="parent-section-action"><button className="parent-outline-button" onClick={onEdit}>Manage Topics <ChevronRight size={16} /></button></div>
        <div className="parent-topic-grid">
          {TOPIC_NAMES.slice(0, 8).map((topic, index) => {
            const selected = selectedTopics.includes(topic);
            const Icon = [Calculator, BarChart3, PieChart, Target, LineChart, BookOpen, Star, ShieldCheck][index] || BookOpen;
            return (
              <button
                key={topic}
                className={`parent-topic-card ${selected ? "selected" : ""}`}
                disabled={!isEditing}
                onClick={() => onUpdate({ mandatoryTopics: selected ? selectedTopics.filter((item) => item !== topic) : [...selectedTopics, topic] })}
              >
                <span><Icon size={30} /></span>
                <strong>{topic}</strong>
                {selected && <b><Check size={15} /></b>}
              </button>
            );
          })}
        </div>
      </ParentNumberedSection>

      <ParentNumberedSection number="3" title="Schedule & Approval Control" subtitle="Control how and when changes can be made.">
        <div className="parent-card-grid three">
          <ParentSettingCard icon={ShieldCheck} title="Parent Approval Required" note="Approval needed for schedule or topic changes." checked={Boolean(parentSchedule.parentApprovalRequired)} disabled={!isEditing} onChange={(checked) => onUpdate({ parentApprovalRequired: checked })} />
          <ParentSettingCard icon={Lock} title="Lock Timetable Editing" note="Child cannot edit study timetable." checked={Boolean(parentSchedule.lockTimetableEditing ?? true)} disabled={!isEditing} onChange={(checked) => onUpdate({ lockTimetableEditing: checked })} />
          <ParentSettingCard icon={FileText} title="Require Completion Before Changes" note="Changes allowed only after session completion." checked={Boolean(parentSchedule.requireCompletionBeforeChanges ?? true)} disabled={!isEditing} onChange={(checked) => onUpdate({ requireCompletionBeforeChanges: checked })} />
        </div>
      </ParentNumberedSection>

      <ParentNumberedSection number="4" title="Accountability Alerts" subtitle="Get notified when your child does not meet expectations.">
        <div className="parent-card-grid four">
          <ParentSettingCard icon={Bell} title="Missed Session Alert" note="Notify me when a schedule is missed." checked={Boolean(parentSchedule.alertParentOnMissedSession)} disabled={!isEditing} onChange={(checked) => onUpdate({ alertParentOnMissedSession: checked })} />
          <ParentSettingCard icon={Bell} title="Abandoned Session Alert" note="Notify me when a session is abandoned." checked={Boolean(parentSchedule.alertOnAbandonedSession ?? true)} disabled={!isEditing} onChange={(checked) => onUpdate({ alertOnAbandonedSession: checked })} />
          <ParentSettingCard icon={Bell} title="Late Start Alert" note="Notify me when child starts late." checked={Boolean(parentSchedule.alertOnLateStart ?? true)} disabled={!isEditing} onChange={(checked) => onUpdate({ alertOnLateStart: checked })} />
          <ParentSettingCard icon={Bell} title="Low Activity Alert" note="Notify me when activity is below target." checked={Boolean(parentSchedule.alertOnLowActivity ?? true)} disabled={!isEditing} onChange={(checked) => onUpdate({ alertOnLowActivity: checked })} />
        </div>
      </ParentNumberedSection>

      <ParentNumberedSection number="5" title="Consequences & Escalation" subtitle="Set actions for repeated non-compliance.">
        <div className="parent-card-grid three">
          <ParentActionCard
            icon={AlertTriangle}
            title="Notify After Missed Sessions"
            note={`Notify me after ${parentSchedule.missedSessionEscalationCount || 2} missed sessions.`}
            checked={Boolean(parentSchedule.escalateMissedSessions ?? true)}
            disabled={!isEditing}
            onChange={(checked) => onUpdate({ escalateMissedSessions: checked })}
          >
            {isEditing && (
              <label className="parent-inline-setting">After
                <input type="number" min="1" max="10" value={parentSchedule.missedSessionEscalationCount || 2} onChange={(event) => onUpdate({ missedSessionEscalationCount: Number(event.target.value) })} />
                missed sessions
              </label>
            )}
          </ParentActionCard>
          <ParentActionCard
            icon={User}
            title="Highlight Repeated Inactivity"
            note={`Flag if inactive for ${parentSchedule.inactivityEscalationHours || 24} hours.`}
            checked={Boolean(parentSchedule.escalateRepeatedInactivity ?? true)}
            disabled={!isEditing}
            onChange={(checked) => onUpdate({ escalateRepeatedInactivity: checked })}
          >
            {isEditing && (
              <label className="parent-inline-setting">After
                <input type="number" min="1" max="168" value={parentSchedule.inactivityEscalationHours || 24} onChange={(event) => onUpdate({ inactivityEscalationHours: Number(event.target.value) })} />
                hours
              </label>
            )}
          </ParentActionCard>
          <ParentActionCard
            icon={Flag}
            title="Flag Low Participation"
            note={`Flag below ${parentSchedule.lowParticipationPercent || 50}% weekly participation.`}
            checked={Boolean(parentSchedule.escalateLowParticipation ?? true)}
            disabled={!isEditing}
            onChange={(checked) => onUpdate({ escalateLowParticipation: checked })}
          >
            {isEditing && (
              <label className="parent-inline-setting">Below
                <input type="number" min="1" max="100" value={parentSchedule.lowParticipationPercent || 50} onChange={(event) => onUpdate({ lowParticipationPercent: Number(event.target.value) })} />
                %
              </label>
            )}
          </ParentActionCard>
        </div>
        <div className="parent-escalation-status">
          <span className={escalationSummary.missedTriggered ? "warning" : ""}><b>Missed sessions</b><em>{escalationSummary.missedSessions}/{parentSchedule.missedSessionEscalationCount || 2}</em></span>
          <span className={escalationSummary.inactivityTriggered ? "warning" : ""}><b>Inactivity</b><em>{escalationSummary.inactivityHours}h/{parentSchedule.inactivityEscalationHours || 24}h</em></span>
          <span className={escalationSummary.participationTriggered ? "warning" : ""}><b>Participation</b><em>{escalationSummary.participationPercent}%</em></span>
        </div>
        <div className="parent-roadmap-strip">
          {parentRoadmap.map((item) => <span key={item.rule}><b>{item.rule}</b><em>{item.value}</em></span>)}
        </div>
      </ParentNumberedSection>

      <div className="parent-bottom-actions">
        <button className="parent-secondary-button" onClick={onReset}>Reset to Default</button>
        <span />
        <button className="parent-ghost-button" disabled={!isEditing} onClick={onCancel}>Cancel</button>
        <button className="parent-save-button" onClick={onSave}><Check size={18} /> {isEditing ? "Save Changes" : "Edit Rules"}</button>
      </div>
    </ParentPortalShell>
  );
}

function ParentMonitoringAlertsPage({ HeaderComponent, preferences, onEdit, onUpdate, pushStatus, onEnablePush }) {
  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Progress Tracker">
      <ParentPageBanner title="Monitoring & Alerts" subtitle="Manage how and when you receive alerts and notifications." />
      <section className="parent-panel">
        <h2>Alert Channels</h2>
        <p>Choose the channels through which you want to receive alerts.</p>
        <div className="parent-card-grid three">
          <ParentSettingCard icon={Mail} title="Scheduled Email" note="Lesson reminder and daily summary only" checked={Boolean(preferences?.enableEmailAlerts)} onChange={(checked) => onUpdate({ enableEmailAlerts: checked })} />
          <ParentSettingCard icon={MessageSquare} title="WhatsApp Alerts" note="Coming soon" checked={false} disabled comingSoon />
          <ParentSettingCard icon={LayoutDashboard} title="Dashboard Alerts" note="Get alerts in your dashboard" checked={Boolean(preferences?.enableParentDashboard ?? true)} onChange={(checked) => onUpdate({ enableParentDashboard: checked })} />
        </div>
      </section>
      <section className="parent-panel">
        <h2>Alert Types</h2>
        <div className="parent-toggle-list">
          {[
            ["alertOnSessionStarted", "In Class", "Phone/dashboard notice when your child starts class"],
            ["alertOnSessionAbandoned", "Abandoned Session", "Phone/dashboard notice when a session is abandoned"],
            ["alertOnMissedSession", "Missed Session", "Phone/dashboard notice when a session is missed"],
            ["receiveDailyReport", "Daily Email Summary", "Email summary after scheduled study days"],
            ["receiveWeeklyReport", "Weekly Email Summary", "Weekly progress summary by email"],
          ].map(([key, title, note]) => (
            <ToggleRow key={key} title={title} note={note} checked={Boolean(preferences?.[key])} onChange={(checked) => onUpdate({ [key]: checked })} />
          ))}
        </div>
      </section>
      <section className="parent-panel">
        <div className="parent-title-row small">
          <div><h2>Contact Information</h2><p>Ensure your contact information is up to date.</p></div>
          <button className="parent-outline-button" onClick={onEdit}><Check size={16} /> Save</button>
        </div>
        <div className="parent-form-grid two">
          <label>Parent Email<input type="email" value={preferences?.parentEmail || ""} onChange={(event) => onUpdate({ parentEmail: event.target.value })} placeholder="parent@example.com" /></label>
          <label>Phone Notifications<input value={pushStatus} disabled /></label>
        </div>
        <button className="parent-secondary-button" onClick={onEnablePush}>Enable Phone Notifications</button>
      </section>
    </ParentPortalShell>
  );
}

function ParentReportsPage({ HeaderComponent, events, attempts, timetable, onOpenHistory }) {
  const [rangeMode, setRangeMode] = useState("today");
  const [customStart, setCustomStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const analytics = getLearningAnalytics(events, attempts, timetable);
  const weeklyReport = generateWeeklyReport(attempts, events);
  const score = analytics.averageAccuracy || weeklyReport.averageScore || 0;
  const reportRange = getReportRange(rangeMode, customStart, customEnd);
  const reportRows = getReportRows(events, reportRange);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(reportRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedRows = reportRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeLabel = formatReportRangeLabel(reportRange);
  const rangeSeconds = reportRows.reduce((sum, row) => sum + row.durationSeconds, 0);
  const completedCount = reportRows.filter((row) => row.status === "Completed").length;
  const uniqueTopics = new Set(reportRows.map((row) => row.topic).filter((topic) => topic && topic !== "-"));
  const todayRange = getReportRange("today", "", "");
  const todayRows = getReportRows(events, todayRange);
  const todaySeconds = todayRows.reduce((sum, row) => sum + row.durationSeconds, 0);
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayGoalMinutes = timetable
    .filter((row) => row.day === todayName && row.enabled !== false)
    .reduce((sum, row) => sum + (Number(row.duration) || 0), 0) || 60;
  const todayGoalSeconds = todayGoalMinutes * 60;
  const todayProgressPercent = todayGoalSeconds ? Math.min(100, Math.round((todaySeconds / todayGoalSeconds) * 100)) : 0;
  const topicProgressRows = buildReportTopicRows(todayRows, timetable, todayName);
  const weeklyBars = buildWeeklyReportBars(events);

  const changeRangeMode = (mode) => {
    setRangeMode(mode);
    setPage(1);
  };

  const downloadReport = () => {
    downloadParentReportPdf({
      filename: "pro-tutors-hub-parent-report.pdf",
      title: "Parent Activity Report",
      rangeLabel,
      summary: [
        ["Study Time", formatDuration(rangeSeconds)],
        ["Activities", reportRows.length],
        ["Completed", completedCount],
        ["Topics", uniqueTopics.size],
        ["Average Score", `${score}%`],
        ["Weekly Sessions", weeklyReport.completedSessions || 0],
      ],
      rows: reportRows,
    });
  };
  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Progress Tracker" contentClassName="parent-report-content">
      <ParentPageBanner title="Reports" subtitle="View detailed reports and track your child's progress.">
        <button className="parent-save-button" onClick={downloadReport}><Download size={17} /> Download Report</button>
      </ParentPageBanner>
      <section className="parent-panel parent-report-controls">
        <div className="parent-title-row small">
          <div><h2>Statement Range</h2><p>{rangeLabel}</p></div>
          <button className="parent-outline-button" onClick={onOpenHistory}>Open full history</button>
        </div>
        <div className="parent-segmented-control" aria-label="Report range">
          <button className={rangeMode === "today" ? "active" : ""} onClick={() => changeRangeMode("today")}>Today</button>
          <button className={rangeMode === "week" ? "active" : ""} onClick={() => changeRangeMode("week")}>This Week</button>
          <button className={rangeMode === "custom" ? "active" : ""} onClick={() => changeRangeMode("custom")}>Custom Range</button>
        </div>
        {rangeMode === "custom" && (
          <div className="parent-form-grid two">
            <label>Start Date<input type="date" value={customStart} onChange={(event) => { setCustomStart(event.target.value); setPage(1); }} /></label>
            <label>End Date<input type="date" value={customEnd} onChange={(event) => { setCustomEnd(event.target.value); setPage(1); }} /></label>
          </div>
        )}
      </section>
      <div className="parent-card-grid four">
        <ParentMetric icon={Clock} label="Study Time" value={formatDuration(rangeSeconds)} note={rangeMode === "today" ? "today" : rangeMode === "week" ? "this week" : "custom range"} />
        <ParentMetric icon={BookOpen} label="Topics Touched" value={uniqueTopics.size} note="unique topics" />
        <ParentMetric icon={Star} label="Average Score" value={`${score}%`} note="from completed attempts" />
        <ParentMetric icon={BarChart3} label="Activities" value={reportRows.length} note={`${completedCount} completed`} />
      </div>
      <section className="parent-panel parent-progress-panel">
        <div className="parent-title-row small"><h2>Today's Progress</h2><button onClick={onOpenHistory}>View all</button></div>
        <div className="parent-report-grid">
          <div className="parent-ring" style={{ "--ring": `${todayProgressPercent}%` }}><strong>{todayProgressPercent}%</strong></div>
          <div><strong>Daily Goal Progress</strong><p>You have completed {Math.round(todaySeconds / 60)} of {todayGoalMinutes} minutes today.</p><ProgressLine color="#35c78a" value={todayProgressPercent} /><ProgressLine color="#f6bd37" value={Math.max(0, 100 - todayProgressPercent)} /></div>
          <div className="parent-topic-list">
            {topicProgressRows.map((row) => <span key={row.topic}><b>{row.topic}</b><em>{row.status}</em></span>)}
          </div>
        </div>
      </section>
      <section className="parent-panel">
        <div className="parent-title-row small"><h2>Weekly Summary</h2><button onClick={onOpenHistory}>View full summary</button></div>
        <div className="parent-bars">{weeklyBars.map((item) => <span key={item.day} title={`${item.day}: ${item.minutes} mins`} style={{ height: `${item.height}%` }} />)}</div>
      </section>
      <section className="parent-panel">
        <div className="parent-title-row small"><h2>Activity Statement</h2><button onClick={downloadReport}>Download PDF</button></div>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead><tr><th>Date</th><th>Time</th><th>Activity</th><th>Page</th><th>Topic</th><th>Duration</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              {paginatedRows.length ? paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.time}</td>
                  <td>{row.activity}</td>
                  <td>{row.page}</td>
                  <td>{row.topic}</td>
                  <td>{row.duration}</td>
                  <td>{row.score}</td>
                  <td>{row.status}</td>
                </tr>
              )) : <tr><td colSpan="8">No activities in this range yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="parent-pagination">
          <button disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {currentPage} of {pageCount}</span>
          <button disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
        </div>
      </section>
    </ParentPortalShell>
  );
}

function ParentActivitySummaryPage({ HeaderComponent, title, events, timetable, rangeType }) {
  const range = getDateRange(rangeType, "", "");
  const rangeEvents = events.filter((event) => {
    const time = new Date(event.timestamp);
    return (!range.start || time >= range.start) && (!range.end || time <= range.end);
  });
  const pageVisits = summarizePageVisits(rangeEvents);
  const attendanceRows = getAttendanceRows(timetable, rangeEvents, range);
  const scheduledDays = new Set(attendanceRows.map((row) => new Date(row.scheduledTime).toDateString()));
  const unscheduledEvents = rangeEvents.filter((event) => {
    const dayKey = new Date(event.timestamp).toDateString();
    return !scheduledDays.has(dayKey) && ["logged_in", "app_opened", "page_opened", "page_heartbeat", "page_visited"].includes(event.eventType);
  });
  const totalSeconds = pageVisits.reduce((sum, item) => sum + item.duration, 0);

  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title={title}>
      <ParentPageBanner title={title} subtitle="Synced from the student's real app activity, including page visits and time spent." />
      <div className="parent-card-grid three">
        <ParentMetric icon={Clock} label="Time In App" value={formatDuration(totalSeconds)} note="tracked page time" />
        <ParentMetric icon={LayoutDashboard} label="Pages Visited" value={pageVisits.length} note="unique page/topic views" />
        <ParentMetric icon={CalendarDays} label="Unscheduled Entries" value={unscheduledEvents.length} note="activity outside timetable days" />
      </div>
      <section className="parent-panel">
        <h2>Pages Visited</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead><tr><th>Page</th><th>Topic</th><th>Visits</th><th>Minutes Spent</th><th>Last Seen</th></tr></thead>
            <tbody>
              {pageVisits.length ? pageVisits.map((item) => (
                <tr key={`${item.page}-${item.topic}`}>
                  <td>{item.page}</td>
                  <td>{item.topic}</td>
                  <td>{item.visits}</td>
                  <td>{Math.max(1, Math.round(item.duration / 60))}</td>
                  <td>{new Date(item.lastSeen).toLocaleString()}</td>
                </tr>
              )) : <tr><td colSpan="5">No page activity has been synced for this period yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="parent-panel">
        <h2>Attendance Report</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead><tr><th>Scheduled Time</th><th>Actual Login Time</th><th>Status</th></tr></thead>
            <tbody>
              {attendanceRows.length ? attendanceRows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.scheduledTime).toLocaleString()}</td>
                  <td>{row.actualLoginTime ? new Date(row.actualLoginTime).toLocaleString() : "-"}</td>
                  <td>{row.status}</td>
                </tr>
              )) : <tr><td colSpan="3">No scheduled sessions in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="parent-panel">
        <h2>Activity Outside Timetable</h2>
        <div className="parent-live-feed">
          {unscheduledEvents.length ? unscheduledEvents.slice(0, 30).map((event) => (
            <article key={event.id}>
              <time>{new Date(event.timestamp).toLocaleString()}</time>
              <strong>{event.metadata?.page || getEventLabel(event.eventType)}</strong>
              <span>{event.metadata?.topic || getEventTopic(event)}</span>
            </article>
          )) : <div className="parent-empty-state">No outside-timetable activity for this period.</div>}
        </div>
      </section>
    </ParentPortalShell>
  );
}

function ParentTopicsCompletedPage({ HeaderComponent, events, attempts }) {
  const summary = getLearningCompletionSummary(events, attempts);

  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Topics Completed">
      <ParentPageBanner title="Topics Completed" subtitle="Study guide completions, practice tests and mock attempts synced from the student app." />
      <div className="parent-card-grid three">
        <ParentMetric icon={BookOpen} label="Studied Lessons" value={summary.studiedLessons.length} note="marked in Study Guide" />
        <ParentMetric icon={Calculator} label="Practice Tests" value={summary.practiceTotal} note="completed attempts" />
        <ParentMetric icon={FileText} label="Mock Tests" value={summary.mockTotal} note="timed mock attempts" />
      </div>
      <section className="parent-panel">
        <h2>Marked Study Guide Lessons</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead><tr><th>Topic</th><th>Lesson</th><th>Source</th></tr></thead>
            <tbody>
              {summary.studiedLessons.length ? summary.studiedLessons.map((item) => (
                <tr key={`${item.topic}-${item.lesson}`}>
                  <td>{item.topic}</td>
                  <td>{item.lesson}</td>
                  <td>{item.source}</td>
                </tr>
              )) : <tr><td colSpan="3">No lesson has been marked as studied yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="parent-panel">
        <h2>Practice Tests Completed</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead><tr><th>Topic</th><th>Lesson</th><th>Times Taken</th><th>Best Score</th><th>Last Taken</th></tr></thead>
            <tbody>
              {summary.practiceRows.length ? summary.practiceRows.map((item) => (
                <tr key={`${item.topic}-${item.lesson}`}>
                  <td>{item.topic}</td>
                  <td>{item.lesson}</td>
                  <td>{item.count}</td>
                  <td>{item.bestScore}%</td>
                  <td>{new Date(item.lastTaken).toLocaleString()}</td>
                </tr>
              )) : <tr><td colSpan="5">No practice test has been completed yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="parent-panel">
        <h2>Mock Tests Taken</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead><tr><th>Mock Type</th><th>Times Taken</th><th>Best Score</th><th>Last Taken</th></tr></thead>
            <tbody>
              {summary.mockRows.length ? summary.mockRows.map((item) => (
                <tr key={item.type}>
                  <td>{item.type}</td>
                  <td>{item.count}</td>
                  <td>{item.bestScore}%</td>
                  <td>{new Date(item.lastTaken).toLocaleString()}</td>
                </tr>
              )) : <tr><td colSpan="4">No mock test has been taken yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </ParentPortalShell>
  );
}

function ParentWeeklyPagesVisitedPage({ HeaderComponent, events }) {
  const [page, setPage] = useState(1);
  const range = getDateRange("week", "", "");
  const weekEvents = events.filter((event) => {
    const time = new Date(event.timestamp);
    return (!range.start || time >= range.start) && (!range.end || time <= range.end);
  });
  const pageVisits = summarizePageVisits(weekEvents);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(pageVisits.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = pageVisits.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalSeconds = pageVisits.reduce((sum, item) => sum + item.duration, 0);

  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Pages Visited">
      <ParentPageBanner title="Pages Visited This Week" subtitle="Every synced page visit from the student app, grouped by page, topic and time spent." />
      <div className="parent-card-grid three">
        <ParentMetric icon={LayoutDashboard} label="Pages Visited" value={pageVisits.length} note="unique page/topic visits" />
        <ParentMetric icon={Clock} label="Time In App" value={formatDuration(totalSeconds)} note="tracked this week" />
        <ParentMetric icon={CalendarDays} label="Report Range" value="This Week" note={`${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`} />
      </div>
      <section className="parent-panel">
        <h2>Weekly Page Visit Log</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead><tr><th>Page</th><th>Topic</th><th>Visits</th><th>Time Spent</th><th>Time Frame</th></tr></thead>
            <tbody>
              {rows.length ? rows.map((item) => (
                <tr key={`${item.page}-${item.topic}`}>
                  <td>{item.page}</td>
                  <td>{item.topic}</td>
                  <td>{item.visits}</td>
                  <td>{formatDuration(item.duration)}</td>
                  <td>{new Date(item.firstSeen).toLocaleString()} - {new Date(item.lastSeen).toLocaleString()}</td>
                </tr>
              )) : <tr><td colSpan="5">No page activity has been synced this week yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {pageVisits.length > pageSize && (
          <div className="parent-feed-pagination">
            <button disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page {currentPage} of {pageCount}</span>
            <button disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
          </div>
        )}
      </section>
    </ParentPortalShell>
  );
}

function ParentSuggestionsPage({ HeaderComponent, childName, parentEmail }) {
  const [form, setForm] = useState({ type: "Suggestion", parentName: "", email: parentEmail || "", message: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submitSuggestion = async () => {
    const cleanMessage = form.message.trim();
    if (cleanMessage.length < 10) {
      setStatus("Please enter at least 10 characters.");
      return;
    }
    setBusy(true);
    setStatus("");
    const subject = `Parent ${form.type}: ${childName}`;
    const message = [
      `New parent ${form.type.toLowerCase()} from the parent portal`,
      `Child: ${childName}`,
      form.parentName ? `Parent name: ${form.parentName}` : null,
      form.email ? `Parent email: ${form.email}` : null,
      "",
      cleanMessage,
    ].filter(Boolean).join("\n");
    try {
      const result = await supabaseFunctionRequest("send-parent-alert", {
        body: {
          notifications: [
            {
              channel: "email",
              recipient: "info@protutorshub.com",
              subject,
              message,
              html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#24123a"><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(message).replace(/\n/g, "<br />")}</p></div>`,
            },
          ],
        },
      });
      if (!result) throw new Error("Email service is not configured yet.");
      setStatus("Sent to Pro Tutors Hub. Thank you.");
      setForm((current) => ({ ...current, message: "" }));
    } catch (error) {
      setStatus(error.message || "Unable to send right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Suggestions">
      <ParentPageBanner title="Suggestions" subtitle="Send suggestions or complaints directly to Pro Tutors Hub." />
      <section className="parent-panel parent-suggestion-panel">
        <div className="parent-form-grid two">
          <label>Type
            <select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
              <option>Suggestion</option>
              <option>Complaint</option>
            </select>
          </label>
          <label>Parent Email
            <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="parent@example.com" />
          </label>
        </div>
        <label className="parent-textarea-label">Parent Name
          <input value={form.parentName} onChange={(event) => updateField("parentName", event.target.value)} placeholder="Your name" />
        </label>
        <label className="parent-textarea-label">Message
          <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Enter your suggestion or complaint..." />
        </label>
        <button className="parent-save-button" disabled={busy} onClick={submitSuggestion}>{busy ? "Sending..." : "Send to Pro Tutors Hub"}</button>
        {status && <p className="selector-note parent-form-status">{status}</p>}
      </section>
    </ParentPortalShell>
  );
}

function ParentTimetablePage({ HeaderComponent, timetable, reminderMinutes, locked, isEditing, activeDay, onToggleDay, onChange, onReminderChange, onLockedChange, onSave }) {
  const activeDays = timetable.filter((row) => row.enabled !== false).length;
  const next = getNextTimetableSession(timetable);
  const averageDailyMinutes = Math.round(
    timetable
      .filter((row) => row.enabled !== false)
      .reduce((sum, row) => sum + Number(row.duration || 0), 0) / Math.max(1, activeDays)
  );
  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Progress Tracker">
      <section className="parent-panel parent-page-hero">
        <div className="parent-title-row"><button className="parent-icon-button"><ArrowLeft size={24} /></button><div><h1>Timetable</h1><p>Manage your child's study timetable and schedule.</p></div></div>
        <button className="parent-save-button" onClick={onSave}><Edit3 size={18} /> {isEditing ? "Save Timetable" : "Edit Timetable"}</button>
      </section>
      <div className="parent-card-grid four">
        <ParentMetric icon={CalendarDays} label="Study Days" value={`${activeDays} days`} note="per week" onEdit={onSave} />
        <ParentMetric icon={Clock} label="Daily Study Time" value={`${averageDailyMinutes || 0} mins`} note="average scheduled day" onEdit={onSave} />
        <ParentMetric icon={CalendarDays} label="Next Session" value={next ? `${next.label}, ${formatTime(next.startTime)}` : "No session"} note={next?.day || "No enabled day"} onEdit={onSave} />
        <ParentMetric icon={ShieldCheck} label="Timetable Status" value={locked ? "Locked" : "Active"} note={isEditing ? "Editing timetable" : "Last updated today"} onEdit={onSave} />
      </div>
      <section className="parent-panel">
        <div className="parent-tabs"><button className="active"><CalendarDays size={18} /> Weekly Schedule</button><button><Clock size={18} /> Break Settings</button><button><Settings size={18} /> Study Preferences</button><button><Lock size={18} /> Lock & Restrictions</button></div>
        <div className="parent-title-row small"><div><h2>Weekly Schedule</h2><p>Set the days and time for your child's study sessions.</p></div><button className="parent-ghost-button">+ Add Study Day</button></div>
        <TimetableEditor timetable={timetable} disabled={!isEditing} onChange={onChange} activeDay={activeDay} onToggleDay={onToggleDay} />
      </section>
      <div className="parent-card-grid two">
        <section className="parent-panel"><h2>Session Reminders</h2><p>Get reminded before each study session.</p><div className="parent-form-grid two"><label>Reminder Time<input type="number" min="1" max="240" value={reminderMinutes} disabled={!isEditing} onChange={(event) => onReminderChange(event.target.value)} /></label><button className="parent-save-button" onClick={onSave}>Save</button></div></section>
        <ParentSettingCard icon={Lock} title="Timetable Lock" note="Prevent edits from the student side." checked={locked} disabled={!isEditing} onChange={onLockedChange} />
      </div>
    </ParentPortalShell>
  );
}

function ParentPlaceholderPage({ HeaderComponent, title, message }) {
  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Progress Tracker">
      <ParentPageBanner title={title} subtitle={message} />
    </ParentPortalShell>
  );
}

function TimetableEditor({ timetable, disabled, onChange, activeDay, onToggleDay }) {
  return (
    <div className="parent-timetable-grid">
      {timetable.map((row, index) => (
        <article className={`parent-timetable-row ${row.enabled === false ? "disabled" : ""}`} key={row.day}>
          <span className="parent-day-badge">{row.day.slice(0, 3).toUpperCase()}</span>
          <label className="parent-timetable-field">Start Time
            <input type="time" value={row.startTime} disabled={disabled} onChange={(event) => onChange((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item))} />
          </label>
          <label className="parent-timetable-field">Duration
            <select value={row.duration || 60} disabled={disabled} onChange={(event) => onChange((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, duration: Number(event.target.value) } : item))}>
              {DURATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="parent-topic-summary">
            <strong>{row.topics?.length ? row.topics.join(", ") : "No topic selected"}</strong>
            <span>{row.enabled === false ? "Not scheduled" : "Scheduled topic focus"}</span>
          </div>
          <label className="parent-switch">
            <small>{row.enabled === false ? "Off" : "On"}</small>
            <input type="checkbox" checked={row.enabled !== false} disabled={disabled} onChange={(event) => onChange((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item))} />
            <b />
          </label>
          {activeDay === row.day && !disabled && (
            <div className="parent-topic-picker">
              {TOPIC_NAMES.map((topic) => (
                <button
                  key={`${row.day}-${topic}`}
                  className={row.topics.includes(topic) ? "selected" : ""}
                  onClick={() => onChange((current) => current.map((item, itemIndex) => {
                    if (itemIndex !== index) return item;
                    return {
                      ...item,
                      topics: item.topics.includes(topic)
                        ? item.topics.filter((savedTopic) => savedTopic !== topic)
                        : [...item.topics, topic],
                    };
                  }))}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
          {!disabled && (
            <button type="button" className="parent-outline-button" onClick={() => onToggleDay(activeDay === row.day ? "" : row.day)}>
              {activeDay === row.day ? "Hide Topics" : "Edit Topics"}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

function getEventLabel(eventType) {
  return EVENT_LABELS[eventType] || String(eventType || "Activity").replace(/_/g, " ");
}

function sortEventsByNewest(events = []) {
  return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getFirstName(name = "") {
  const cleaned = String(name || "").trim();
  if (!cleaned || cleaned === "Linked student") return cleaned || "Linked student";
  return cleaned.split(/\s+/)[0] || cleaned;
}

function getLinkedChildName(link, events = []) {
  const names = [
    link?.child_name,
    ...events.map((event) => event?.metadata?.childName),
  ];
  return names.find((name) => {
    const cleaned = String(name || "").trim().toLowerCase();
    return cleaned && cleaned !== "linked student" && cleaned !== "student" && cleaned !== "your child";
  }) || "Linked student";
}

function mergeActivityEvents(...eventGroups) {
  const eventMap = new Map();
  eventGroups.flat().forEach((event) => {
    if (!event?.id) return;
    eventMap.set(event.id, event);
  });
  return sortEventsByNewest([...eventMap.values()]);
}

function getEventSubject(event) {
  if (!event) return "-";
  return event.metadata?.page || event.metadata?.subject || event.metadata?.sessionArea || getEventLabel(event.eventType);
}

function getEventTopic(event) {
  if (!event) return "-";
  return event.metadata?.topic || event.topics?.filter((topic) => topic && topic !== "-").join(", ") || event.metadata?.title || "-";
}

function getParentNotifications(events = []) {
  const notificationEventTypes = new Set([
    "logged_in",
    "logged_out",
    "page_opened",
    "page_visited",
    "session_started",
    "session_paused",
    "session_resumed",
    "session_completed",
    "session_missed",
    "parent_lesson_reminder_due",
    "parent_lesson_inactivity",
    "practice_completed",
    "mock_completed",
    "live_lesson_joined",
    "live_lesson_left",
  ]);

  return sortEventsByNewest(events)
    .filter((event) => notificationEventTypes.has(event.eventType))
    .slice(0, 40)
    .map((event) => {
      const page = event.metadata?.page || getEventSubject(event);
      const topic = event.metadata?.topic || getEventTopic(event);
      const messageParts = [];
      if (page && page !== "Mathematics") messageParts.push(page);
      if (topic && topic !== "General" && topic !== page) messageParts.push(topic);
      return {
        id: event.id || `${event.eventType}-${event.timestamp}`,
        title: getEventLabel(event.eventType),
        message: messageParts.length ? messageParts.join(" - ") : "Student activity recorded",
        timestamp: event.timestamp,
      };
    });
}

function getHomepageRecentAlerts(events = []) {
  const alertIconMap = {
    logged_in: BookOpen,
    logged_out: Clock,
    session_started: BookOpen,
    session_paused: Clock,
    session_resumed: Target,
    session_completed: Target,
    session_missed: AlertTriangle,
    parent_lesson_reminder_due: Bell,
    parent_lesson_inactivity: AlertTriangle,
    practice_started: BookOpen,
    practice_completed: Target,
    mock_started: FileText,
    mock_completed: Target,
    study_guide_opened: BookOpen,
    study_guide_completed: Target,
  };
  const alertEventTypes = new Set(Object.keys(alertIconMap));

  return sortEventsByNewest(events)
    .filter((event) => alertEventTypes.has(event.eventType))
    .map((event) => {
      const topic = getEventTopic(event);
      const subject = getEventSubject(event);
      const title = getEventLabel(event.eventType);
      const detail = [subject, topic]
        .filter((item, index, list) => item && item !== "-" && item !== title && list.indexOf(item) === index)
        .join(" - ");
      return {
        id: event.id || `${event.eventType}-${event.timestamp}`,
        icon: alertIconMap[event.eventType] || Bell,
        title,
        message: detail ? `Details: ${detail}` : "",
        timestamp: event.timestamp,
      };
    });
}

function getEventStatus(event) {
  if (!event) return "Offline";
  if (["session_completed", "practice_completed", "mock_completed", "study_guide_completed"].includes(event.eventType)) return "Completed";
  if (["logged_out", "session_abandoned"].includes(event.eventType)) return "Offline";
  if (event.eventType === "session_paused") return "Paused";
  if (event.eventType === "session_resumed") return "Active";
  return "In progress";
}

function getCurrentActivitySummary(childName, event) {
  if (!event || ["logged_out", "session_completed", "session_abandoned"].includes(event.eventType)) {
    return `${childName} is currently offline`;
  }

  if (event.eventType === "study_guide_opened") return `${childName} is currently studying a Mathematics Study Guide`;
  if (event.eventType === "practice_started") return `${childName} is currently taking a Practice Test`;
  if (event.eventType === "mock_started") return `${childName} is currently taking a Mock Examination`;
  if (event.eventType === "live_lesson_joined") return `${childName} is currently attending a Live Lesson`;
  if (event.eventType === "revision_session_started") return `${childName} is currently in a Revision Session`;
  if (event.eventType === "assignment_started") return `${childName} is currently working on an Assignment`;
  if (event.eventType === "session_paused") return `${childName}'s learning session is currently paused`;
  if (event.eventType === "session_resumed") return `${childName} has resumed learning`;
  if (event.eventType === "dashboard_browsing" || event.eventType === "app_opened") return `${childName} is currently browsing the dashboard`;
  return `${childName} is currently active: ${getEventLabel(event.eventType)}`;
}

function isPresenceEventOnline(event) {
  if (!event) return false;
  if (["logged_out", "session_abandoned"].includes(event.eventType)) return false;
  const age = Date.now() - new Date(event.timestamp).getTime();
  return age <= ONLINE_WINDOW_MS;
}

function getLiveSnapshot(events = [], childName = "Child") {
  const sortedEvents = sortEventsByNewest(events);
  const latest = sortedEvents[0] || null;
  const latestPresenceEvent = sortedEvents.find((event) => !["logged_out", "session_abandoned"].includes(event.eventType)) || latest;
  const detailedPageEventTypes = ["page_heartbeat", "page_opened", "page_visited", "study_guide_opened", "practice_started", "mock_started"];
  const latestPageEvent =
    sortedEvents.find((event) => detailedPageEventTypes.includes(event.eventType) && (event.metadata?.page || event.metadata?.topic || event.topics?.length)) ||
    sortedEvents.find((event) => ["app_opened", ...detailedPageEventTypes].includes(event.eventType));
  const online = isPresenceEventOnline(latestPresenceEvent);
  const page = online ? (latestPageEvent?.metadata?.page || getEventSubject(latestPageEvent) || "-") : "-";
  const topic = online ? (latestPageEvent?.metadata?.topic || getEventTopic(latestPageEvent) || "-") : "-";
  const status = online ? "Online" : "Offline";
  const activity = online
    ? latestPageEvent?.metadata?.page
      ? `${childName} is on ${page}${topic && topic !== page ? `: ${topic}` : ""}`
      : getCurrentActivitySummary(childName, latestPresenceEvent)
    : `${childName} is currently offline`;
  return { latest, latestPageEvent, online, page, topic, status, activity };
}

function summarizePageVisits(events = []) {
  const visitEvents = events.filter((event) => ["page_visited", "page_heartbeat"].includes(event.eventType));
  const sessions = new Map();
  visitEvents.forEach((event) => {
    const page = event.metadata?.page || getEventSubject(event);
    const topic = event.metadata?.topic || getEventTopic(event);
    const startedAt = event.metadata?.startedAt || event.timestamp;
    const sessionKey = `${page}|${topic}|${startedAt}`;
    const existing = sessions.get(sessionKey) || {
      page,
      topic,
      duration: 0,
      firstSeen: event.timestamp,
      lastSeen: event.timestamp,
    };
    existing.duration = Math.max(existing.duration, Number(event.duration) || 0);
    if (new Date(event.timestamp) < new Date(existing.firstSeen)) existing.firstSeen = event.timestamp;
    if (new Date(event.timestamp) > new Date(existing.lastSeen)) existing.lastSeen = event.timestamp;
    sessions.set(sessionKey, existing);
  });
  const grouped = new Map();
  sessions.forEach((session) => {
    const key = `${session.page}|${session.topic}`;
    const existing = grouped.get(key) || {
      page: session.page,
      topic: session.topic,
      duration: 0,
      visits: 0,
      firstSeen: session.firstSeen,
      lastSeen: session.lastSeen,
    };
    existing.duration += session.duration;
    existing.visits += 1;
    if (new Date(session.firstSeen) < new Date(existing.firstSeen)) existing.firstSeen = session.firstSeen;
    if (new Date(session.lastSeen) > new Date(existing.lastSeen)) existing.lastSeen = session.lastSeen;
    grouped.set(key, existing);
  });
  return [...grouped.values()].sort((a, b) => b.duration - a.duration);
}

function getLearningCompletionSummary(events = [], attempts = []) {
  const progress = getStudyGuideProgress();
  const studiedMap = new Map();
  progress.studiedLessons.forEach((lessonKey) => {
    const [topic, ...lessonParts] = String(lessonKey).split("::");
    studiedMap.set(lessonKey, {
      topic: topic || "Study Guide",
      lesson: lessonParts.join("::") || topic || "Lesson",
      source: "Marked as studied",
    });
  });
  events
    .filter((event) => event.eventType === "study_guide_completed")
    .forEach((event) => {
      const topic = event.metadata?.topic || event.topics?.[0] || "Study Guide";
      const lesson = event.metadata?.lesson || event.metadata?.title || "Lesson";
      studiedMap.set(`${topic}::${lesson}`, {
        topic,
        lesson,
        source: "Synced activity",
      });
    });

  const practiceMap = new Map();
  attempts
    .filter((attempt) => attempt.testType === "Practice Test")
    .forEach((attempt) => {
      const topic = attempt.topic || attempt.topicBreakdown?.[0]?.topic || "Practice Test";
      const lesson = attempt.lesson || "Practice";
      const key = `${topic}::${lesson}`;
      const existing = practiceMap.get(key) || {
        topic,
        lesson,
        count: 0,
        bestScore: 0,
        lastTaken: attempt.completedAt,
      };
      existing.count += 1;
      existing.bestScore = Math.max(existing.bestScore, Math.round(Number(attempt.percentage) || 0));
      if (new Date(attempt.completedAt) > new Date(existing.lastTaken)) existing.lastTaken = attempt.completedAt;
      practiceMap.set(key, existing);
    });

  const mockMap = new Map();
  attempts
    .filter((attempt) => attempt.testType === "Timed Mock")
    .forEach((attempt) => {
      const type = attempt.packageType ? `${attempt.packageType} mock` : "Timed Mock";
      const existing = mockMap.get(type) || {
        type,
        count: 0,
        bestScore: 0,
        lastTaken: attempt.completedAt,
      };
      existing.count += 1;
      existing.bestScore = Math.max(existing.bestScore, Math.round(Number(attempt.percentage) || 0));
      if (new Date(attempt.completedAt) > new Date(existing.lastTaken)) existing.lastTaken = attempt.completedAt;
      mockMap.set(type, existing);
    });

  const practiceRows = [...practiceMap.values()].sort((a, b) => new Date(b.lastTaken) - new Date(a.lastTaken));
  const mockRows = [...mockMap.values()].sort((a, b) => new Date(b.lastTaken) - new Date(a.lastTaken));
  return {
    studiedLessons: [...studiedMap.values()].sort((a, b) => a.topic.localeCompare(b.topic)),
    practiceRows,
    mockRows,
    practiceTotal: practiceRows.reduce((sum, item) => sum + item.count, 0),
    mockTotal: mockRows.reduce((sum, item) => sum + item.count, 0),
  };
}

function getTodayTargetMinutes(timetable = []) {
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return timetable
    .filter((row) => row.day === todayName && row.enabled !== false)
    .reduce((sum, row) => sum + Number(row.duration || 0), 0);
}

function formatDuration(seconds = 0) {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours) return `${hours}h ${remainingMinutes}m`;
  if (minutes) return `${minutes}m`;
  return `${totalSeconds}s`;
}

function getSessionStartTime(events, currentEvent) {
  if (!currentEvent) return null;
  const sessionId = currentEvent.metadata?.sessionId || currentEvent.metadata?.session_id;
  const possibleEvents = sessionId
    ? events.filter((event) => event.metadata?.sessionId === sessionId || event.metadata?.session_id === sessionId)
    : events.filter((event) => new Date(event.timestamp).toDateString() === new Date(currentEvent.timestamp).toDateString());
  return possibleEvents[possibleEvents.length - 1]?.timestamp || currentEvent.timestamp;
}

function getEventEndTime(event) {
  if (!event?.timestamp) return "";
  if (!event.duration) return event.timestamp;
  return new Date(new Date(event.timestamp).getTime() + Number(event.duration) * 1000).toISOString();
}

function getDateRange(filter, customStart, customEnd) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (filter === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "week") {
    const dayOffset = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - dayOffset);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    return {
      start: customStart ? new Date(`${customStart}T00:00:00`) : null,
      end: customEnd ? new Date(`${customEnd}T23:59:59`) : null,
    };
  }
  return { start, end };
}

function getDateListForAttendance(range = {}) {
  const now = new Date();
  const fallbackStart = new Date(now);
  fallbackStart.setDate(now.getDate() - 29);
  fallbackStart.setHours(0, 0, 0, 0);
  const start = range.start ? new Date(range.start) : fallbackStart;
  const end = range.end ? new Date(range.end) : now;
  const boundedEnd = end.getTime() > now.getTime() ? now : end;
  start.setHours(0, 0, 0, 0);
  boundedEnd.setHours(23, 59, 59, 999);
  const dates = [];
  const cursor = new Date(boundedEnd);
  cursor.setHours(0, 0, 0, 0);
  while (cursor >= start && dates.length < 120) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

function getAttendanceRows(timetable, events, range = {}) {
  const now = new Date();
  return getDateListForAttendance(range).flatMap((date) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    return timetable
      .filter((row) => row.day === weekday && row.enabled !== false)
      .map((row) => {
        const [hours, minutes] = (row.startTime || "00:00").split(":").map(Number);
        const scheduled = new Date(date);
        scheduled.setHours(hours || 0, minutes || 0, 0, 0);
        if (scheduled.getTime() > now) return null;
        const sessionEvents = events.filter((event) => new Date(event.timestamp).toDateString() === date.toDateString());
        const scheduledEnd = new Date(scheduled.getTime() + Number(row.duration || 60) * 60000);
        const loginEvent = sessionEvents.find((event) => {
          const eventTime = new Date(event.timestamp);
          const withinWindow = eventTime >= new Date(scheduled.getTime() - 15 * 60000) && eventTime <= scheduledEnd;
          return withinWindow && ["logged_in", "app_opened", "page_opened", "page_heartbeat", "session_started", "study_guide_opened", "practice_started", "mock_started", "live_lesson_joined"].includes(event.eventType);
        });
        let status = "Absent";
        if (loginEvent) {
          const loginTime = new Date(loginEvent.timestamp);
          status = loginTime.getTime() <= scheduled.getTime() + 10 * 60000 ? "Present" : "Late";
        }
        if (row.excused) status = "Excused";
        return {
          id: `${row.day}-${row.startTime}-${scheduled.toISOString()}`,
          scheduledTime: scheduled.toISOString(),
          actualLoginTime: loginEvent?.timestamp || "",
          status,
          topics: row.topics || [],
        };
      })
      .filter(Boolean);
  });
}

function getTodayAttendanceRows(timetable, events) {
  const now = new Date();
  const todayKey = now.toDateString();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const todayEvents = events.filter((event) => new Date(event.timestamp).toDateString() === todayKey);

  return timetable
    .filter((row) => row.day === weekday && row.enabled !== false)
    .map((row) => {
      const [hours, minutes] = (row.startTime || "00:00").split(":").map(Number);
      const scheduled = new Date(now);
      scheduled.setHours(hours || 0, minutes || 0, 0, 0);
      const scheduledEnd = new Date(scheduled.getTime() + Number(row.duration || 60) * 60000);
      const loginEvent = todayEvents.find((event) => {
        const eventTime = new Date(event.timestamp);
        const withinWindow = eventTime >= new Date(scheduled.getTime() - 15 * 60000) && eventTime <= scheduledEnd;
        return withinWindow && ["logged_in", "app_opened", "page_opened", "page_heartbeat", "session_started", "study_guide_opened", "practice_started", "mock_started", "live_lesson_joined"].includes(event.eventType);
      });
      let status = "Scheduled";
      if (loginEvent) {
        const loginTime = new Date(loginEvent.timestamp);
        status = loginTime.getTime() <= scheduled.getTime() + 10 * 60000 ? "Present" : "Late";
      } else if (scheduled.getTime() <= now.getTime()) {
        status = "Absent";
      }
      return {
        id: `${row.day}-${row.startTime}-${todayKey}`,
        scheduledTime: scheduled.toISOString(),
        actualLoginTime: loginEvent?.timestamp || "",
        status,
      };
    });
}

function getAttemptTimestamp(attempt) {
  return attempt?.completedAt || attempt?.submittedAt || attempt?.createdAt || attempt?.date || attempt?.timestamp || "";
}

function filterAttemptsByRange(attempts, range = {}) {
  return attempts.filter((attempt) => {
    const timestamp = getAttemptTimestamp(attempt);
    if (!timestamp) return true;
    const time = new Date(timestamp);
    return (!range.start || time >= range.start) && (!range.end || time <= range.end);
  });
}

function getLearningAnalytics(events, attempts, timetable, attendanceRowsOverride = null) {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const totalLearningSeconds = events.reduce((sum, event) => sum + (Number(event.duration) || 0), 0);
  const weeklyLearningSeconds = events.filter((event) => new Date(event.timestamp).getTime() >= weekAgo).reduce((sum, event) => sum + (Number(event.duration) || 0), 0);
  const monthlyLearningSeconds = events.filter((event) => new Date(event.timestamp).getTime() >= monthAgo).reduce((sum, event) => sum + (Number(event.duration) || 0), 0);
  const attendanceRows = attendanceRowsOverride || getAttendanceRows(timetable, events);
  const attended = attendanceRows.filter((row) => ["Present", "Late"].includes(row.status)).length;
  const scoredAttempts = attempts.filter((attempt) => typeof attempt.percentage === "number");
  return {
    totalLearningTime: formatDuration(totalLearningSeconds),
    studyGuidesCompleted: events.filter((event) => ["study_guide_completed", "session_completed"].includes(event.eventType) && String(event.metadata?.sessionArea || "").includes("study")).length,
    practiceTestsCompleted: events.filter((event) => event.eventType === "practice_completed").length,
    mockExamsCompleted: events.filter((event) => event.eventType === "mock_completed").length,
    attendanceRate: attendanceRows.length ? Math.round((attended / attendanceRows.length) * 100) : 0,
    averageAccuracy: scoredAttempts.length ? Math.round(scoredAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / scoredAttempts.length) : 0,
    weeklyLearningTime: formatDuration(weeklyLearningSeconds),
    monthlyLearningTime: formatDuration(monthlyLearningSeconds),
  };
}

function getParentInsightCards(events, attempts, timetable, attendanceRowsOverride = null) {
  const analytics = getLearningAnalytics(events, attempts, timetable, attendanceRowsOverride);
  const studyDays = new Set(events.map((event) => new Date(event.timestamp).toDateString())).size;
  const topics = Array.from(new Set(events.flatMap((event) => event.topics || [])));
  const latestScores = attempts.filter((attempt) => typeof attempt.percentage === "number").slice(0, 5);
  const improved = latestScores.length >= 2 && latestScores[0].percentage >= latestScores[latestScores.length - 1].percentage;
  return [
    { title: "Study Consistency", value: `${studyDays} active day${studyDays === 1 ? "" : "s"}`, note: studyDays >= 5 ? "Strong weekly consistency." : "Encourage a more regular routine." },
    { title: "Attendance Trend", value: `${analytics.attendanceRate}%`, note: analytics.attendanceRate >= 80 ? "Attendance is healthy." : "Attendance needs attention." },
    { title: "Subject Engagement", value: topics.slice(0, 2).join(", ") || "No topic yet", note: `${topics.length} topic area${topics.length === 1 ? "" : "s"} touched.` },
    { title: "Accuracy Trend", value: `${analytics.averageAccuracy}%`, note: improved ? "Recent results are improving." : "More practice will help accuracy grow." },
    { title: "Learning Streak", value: `${studyDays} day streak`, note: "Based on recorded learning days." },
    { title: "Time Spent Learning", value: analytics.totalLearningTime, note: "Total tracked learning time." },
  ];
}

function ParentOpenDashboardPage({ HeaderComponent, childName, events, timetable, attempts, onOpenLive, onOpenHistory, onOpenPage }) {
  const snapshot = getLiveSnapshot(events, childName);
  const todayEvents = events.filter((event) => new Date(event.timestamp).toDateString() === new Date().toDateString());
  const pageVisits = summarizePageVisits(todayEvents);
  const totalPageSeconds = pageVisits.reduce((sum, item) => sum + item.duration, 0);
  const nextTimetableSession = getNextTimetableSession(timetable);
  const completionSummary = getLearningCompletionSummary(events, attempts);
  const todayTargetMinutes = getTodayTargetMinutes(timetable);
  const recentAlerts = getHomepageRecentAlerts(events).slice(0, 3);
  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Progress Tracker">
      <section className="parent-panel parent-welcome">
        <div><h1>Welcome back, {childName}'s parent</h1><p>Here's how {childName} is doing today.</p></div>
        <div className="parent-date-card"><CalendarDays size={24} /><strong>Thursday, June 11, 2026</strong><span>8:39 PM</span></div>
      </section>
      <section className="parent-panel parent-status-panel">
        <div>
          <small>Current Status <b>{snapshot.online ? "Online" : "Offline"}</b></small>
          <h2>{snapshot.page}</h2>
          <p>Topic: {snapshot.topic}</p>
          <p>{snapshot.latest ? `Last update: ${new Date(snapshot.latest.timestamp).toLocaleTimeString()}` : "No activity yet"}</p>
          <button className="parent-save-button" onClick={onOpenLive}>View Live Monitoring <ChevronRight size={18} /></button>
        </div>
        <div className="parent-ring large" style={{ "--ring": totalPageSeconds ? "75%" : "0%" }}><strong>{Math.round(totalPageSeconds / 60)}</strong><span>mins</span></div>
        <div className="parent-status-stats">
          <ParentMiniStat icon={BookOpen} label="Topics Completed" value={completionSummary.studiedLessons.length} action="View all" onClick={() => onOpenPage("topicsCompleted")} />
          <ParentMiniStat icon={Clock} label="Pages Visited" value={pageVisits.length} action="View all" onClick={() => onOpenPage("pagesVisitedWeekly")} />
          <ParentMiniStat icon={Target} label="Daily Target" value={`${todayTargetMinutes} mins`} action="View details" onClick={() => onOpenPage("timetable")} />
        </div>
      </section>
      <div className="parent-dashboard-grid">
        <ParentDashboardCard icon={ShieldCheck} title="Rules & Accountability" button="Manage Rules" rows={[["Minimum Study Days", "5 days weekly"], ["Minimum Daily Study", "60 minutes"], ["Mandatory Topics", "2 topics"], ["Parent Approval", "Enabled"]]} onClick={() => onOpenPage("overview")} />
        <ParentDashboardCard icon={Bell} title="Monitoring & Alerts" button="Manage Alerts" rows={[["Email Alerts", "Enabled"], ["WhatsApp Alerts", "Disabled"], ["Dashboard Alerts", "Enabled"], ["Weekly Reports", "Enabled"]]} onClick={() => onOpenPage("monitoring")} />
        <ParentDashboardCard
          icon={LineChart}
          title="Reports"
          button="View Reports"
          rows={[["Today's Progress", "View"], ["Weekly Summary", "View"], ["Missed Sessions", "View"], ["Performance Trends", "View"]]}
          rowActions={{
            "Today's Progress": () => onOpenPage("todayProgress"),
            "Weekly Summary": () => onOpenPage("weeklySummary"),
          }}
          onClick={() => onOpenPage("reportsPage")}
        />
        <ParentDashboardCard icon={CalendarDays} title="Timetable" button="Manage Timetable" rows={[
          ["Study Days", `${timetable.filter((row) => row.enabled !== false).length} days configured`],
          ["Next Session", nextTimetableSession ? `${nextTimetableSession.label}, ${formatTime(nextTimetableSession.startTime)}` : "No enabled session"],
          ["Schedule Status", "Active"],
        ]} onClick={() => onOpenPage("timetable")} />
        <section className="parent-panel parent-wide-card">
          <h2><LineChart size={24} /> Monitoring Dashboard</h2>
          <div className="parent-card-grid two">
            <button className="parent-monitor-choice live" onClick={onOpenLive}><LineChart size={28} /><strong>Live Dashboard</strong><span>See what your child is doing right now.</span></button>
            <button className="parent-monitor-choice history" onClick={onOpenHistory}><Clock size={28} /><strong>Activity History</strong><span>View past sessions and progress history.</span></button>
          </div>
        </section>
      </div>
      <section className="parent-panel">
        <div className="parent-title-row small"><h2><Bell size={22} /> Recent Alerts</h2><button onClick={onOpenHistory}>View all alerts</button></div>
        <div className="parent-alert-strip">
          {recentAlerts.length ? recentAlerts.map((alert) => (
            <ParentAlertItem key={alert.id} icon={alert.icon} title={alert.title} note={alert.message} timestamp={alert.timestamp} />
          )) : (
            <div className="parent-empty-state">No study alerts yet. Alerts will appear when the learner starts, pauses, completes, misses, or abandons study activity.</div>
          )}
        </div>
      </section>
    </ParentPortalShell>
  );
}

function ParentMiniStat({ icon, label, value, action, onClick }) {
  return <div>{React.createElement(icon, { size: 25 })}<span>{label}</span><strong>{value}</strong><button onClick={onClick}>{action}</button></div>;
}

function ParentDashboardCard({ icon, title, rows, button, rowActions = {}, onClick }) {
  return (
    <section className="parent-panel parent-dashboard-card">
      <h2>{React.createElement(icon, { size: 25 })} {title}</h2>
      <div className="parent-dashboard-rows">
        {rows.map(([label, value]) => {
          const rowAction = rowActions[label];
          const content = <><b>{label}</b><em>{value}</em></>;
          return rowAction
            ? <button type="button" key={label} onClick={rowAction}>{content}</button>
            : <span key={label}>{content}</span>;
        })}
      </div>
      <button className="parent-save-button" onClick={onClick}>{button} <ChevronRight size={18} /></button>
    </section>
  );
}

function ParentAlertItem({ icon, title, note, timestamp }) {
  const formattedTimestamp = timestamp ? new Date(timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
  return (
    <article>
      {React.createElement(icon, { size: 24 })}
      <div>
        <strong>{title}</strong>
        {note ? <span>{note}</span> : null}
        {formattedTimestamp ? <small>{formattedTimestamp}</small> : null}
      </div>
    </article>
  );
}

function ParentLiveDashboardPage({ HeaderComponent, childName, events, timetable }) {
  const [now, setNow] = useState(0);
  const [feedPage, setFeedPage] = useState(1);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const latestEvent = sortEventsByNewest(events)[0];
  const snapshot = getLiveSnapshot(events, childName);
  const sessionStart = getSessionStartTime(events, latestEvent);
  const elapsed = sessionStart ? Math.max(0, Math.floor((now - new Date(sessionStart).getTime()) / 1000)) : 0;
  const attendanceRows = getTodayAttendanceRows(timetable, events);
  const activityFeedEvents = sortEventsByNewest(events).slice(0, 50);
  const feedPageSize = 5;
  const feedPageCount = Math.max(1, Math.ceil(activityFeedEvents.length / feedPageSize));
  const currentFeedPage = Math.min(feedPage, feedPageCount);
  const paginatedFeedEvents = activityFeedEvents.slice((currentFeedPage - 1) * feedPageSize, currentFeedPage * feedPageSize);

  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="Live Dashboard">
      <section className={`parent-panel parent-live-status ${latestEvent ? "online" : "offline"}`}>
        <span className="result-eyebrow">Current Status</span>
        <h1>{snapshot.activity}</h1>
        <p>{latestEvent ? `Last update: ${new Date(latestEvent.timestamp).toLocaleString()}` : "Waiting for the student's next activity."}</p>
      </section>
      <section className="parent-panel">
        <span className="result-eyebrow">Current Activity Details</span>
        <h2>Live Activity Overview</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead>
              <tr>
                <th>Activity Type</th>
                <th>Page</th>
                <th>Topic</th>
                <th>Session Start Time</th>
                <th>Time Spent</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{snapshot.online ? getEventLabel(snapshot.latest?.eventType) : "Offline"}</td>
                <td>{snapshot.page}</td>
                <td>{snapshot.topic}</td>
                <td>{snapshot.online && sessionStart ? new Date(sessionStart).toLocaleString() : "-"}</td>
                <td>{snapshot.online ? formatDuration(snapshot.latest?.duration || elapsed) : "-"}</td>
                <td>{snapshot.status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="parent-panel">
        <span className="result-eyebrow">Real-Time Activity Feed</span>
        <h2>Activity Feed</h2>
        <div className="parent-live-feed">
          {paginatedFeedEvents.length ? paginatedFeedEvents.map((event) => (
            <article key={event.id}>
              <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
              <strong>{getEventLabel(event.eventType)}</strong>
              <span>{getEventSubject(event)}{getEventTopic(event) !== "-" ? ` - ${getEventTopic(event)}` : ""}</span>
            </article>
          )) : (
            <div className="parent-empty-state">No live activity yet. This feed updates automatically when the learner uses the app.</div>
          )}
        </div>
        {activityFeedEvents.length > feedPageSize && (
          <div className="parent-feed-pagination">
            <button disabled={currentFeedPage <= 1} onClick={() => setFeedPage((page) => Math.max(1, page - 1))}>Previous</button>
            <span>Page {currentFeedPage} of {feedPageCount}</span>
            <button disabled={currentFeedPage >= feedPageCount} onClick={() => setFeedPage((page) => Math.min(feedPageCount, page + 1))}>Next</button>
          </div>
        )}
      </section>
      <section className="parent-panel">
        <span className="result-eyebrow">Attendance Watch</span>
        <h2>Today's Scheduled Attendance</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead>
              <tr><th>Scheduled Time</th><th>Actual Login Time</th><th>Attendance Status</th></tr>
            </thead>
            <tbody>
              {attendanceRows.length ? attendanceRows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.scheduledTime).toLocaleString()}</td>
                  <td>{row.actualLoginTime ? new Date(row.actualLoginTime).toLocaleString() : "-"}</td>
                  <td>{row.status}</td>
                </tr>
              )) : (
                <tr><td colSpan="3">No study session is scheduled for today.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </ParentPortalShell>
  );
}

function ParentHistoryDashboardPage({ HeaderComponent, childName, events, timetable, attempts }) {
  const [filter, setFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [timelinePage, setTimelinePage] = useState(1);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const pageSize = 5;
  const timelinePageSize = 5;
  const selectedRange = useMemo(() => getDateRange(filter, customStart, customEnd), [customEnd, customStart, filter]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const time = new Date(event.timestamp);
      const inRange = (!selectedRange.start || time >= selectedRange.start) && (!selectedRange.end || time <= selectedRange.end);
      const text = `${getEventLabel(event.eventType)} ${getEventSubject(event)} ${getEventTopic(event)} ${getEventStatus(event)}`.toLowerCase();
      return inRange && (!query || text.includes(query));
    });
  }, [events, search, selectedRange]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedRecord = filteredEvents.find((event) => event.id === selectedRecordId) || paginatedEvents[0];
  const selectedTimeline = selectedRecord
    ? filteredEvents
        .filter((event) => {
          const sameSession = selectedRecord.metadata?.sessionId && event.metadata?.sessionId === selectedRecord.metadata.sessionId;
          const sameDay = new Date(event.timestamp).toDateString() === new Date(selectedRecord.timestamp).toDateString();
          return sameSession || sameDay;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    : [];
  const timelinePageCount = Math.max(1, Math.ceil(selectedTimeline.length / timelinePageSize));
  const currentTimelinePage = Math.min(timelinePage, timelinePageCount);
  const paginatedTimeline = selectedTimeline.slice((currentTimelinePage - 1) * timelinePageSize, currentTimelinePage * timelinePageSize);
  const attendanceRows = getAttendanceRows(timetable, filteredEvents, selectedRange);
  const filteredAttempts = filterAttemptsByRange(attempts, selectedRange);
  const analytics = getLearningAnalytics(filteredEvents, filteredAttempts, timetable, attendanceRows);
  const insightCards = getParentInsightCards(filteredEvents, filteredAttempts, timetable, attendanceRows);

  return (
    <ParentPortalShell HeaderComponent={HeaderComponent} title="History Dashboard">
      <section className="parent-panel parent-page-hero">
        <div>
          <span className="result-eyebrow">History Dashboard</span>
          <h1>{childName} Activity History</h1>
          <p>Complete historical record of learning activities, attendance, timelines and parent insights.</p>
        </div>
        <div className="study-plan-score parent-history-score">
          <strong>{filteredEvents.length}</strong>
          <span>records found</span>
        </div>
      </section>
      <section className="parent-panel parent-history-filters">
        <div className="billing-toggle">
          {[
            ["today", "Today"],
            ["week", "This Week"],
            ["month", "This Month"],
            ["custom", "Custom Date Range"],
          ].map(([id, label]) => (
            <button key={id} className={filter === id ? "active" : ""} onClick={() => { setFilter(id); setPage(1); }}>{label}</button>
          ))}
        </div>
        {filter === "custom" && (
          <div className="parent-form-grid two">
            <label>Start Date<input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
            <label>End Date<input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
          </div>
        )}
        <label className="parent-search-field">
          Search activities, subjects or topics
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search study guide, mock, topic..." />
        </label>
      </section>
      <section className="parent-panel">
        <span className="result-eyebrow">Activity History Table</span>
        <h2>Learning Activities</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead>
              <tr>
                <th>Date</th><th>Activity Type</th><th>Page</th><th>Topic</th><th>Start Time</th><th>End Time</th><th>Duration</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.length ? paginatedEvents.map((event) => (
                <tr key={event.id} className={selectedRecord?.id === event.id ? "selected" : ""} onClick={() => { setSelectedRecordId(event.id); setTimelinePage(1); }}>
                  <td>{new Date(event.timestamp).toLocaleDateString()}</td>
                  <td>{getEventLabel(event.eventType)}</td>
                  <td>{getEventSubject(event)}</td>
                  <td>{getEventTopic(event)}</td>
                  <td>{new Date(event.timestamp).toLocaleTimeString()}</td>
                  <td>{event.duration ? new Date(getEventEndTime(event)).toLocaleTimeString() : "-"}</td>
                  <td>{event.duration ? formatDuration(event.duration) : "-"}</td>
                  <td>{getEventStatus(event)}</td>
                </tr>
              )) : (
                <tr><td colSpan="8">No history records match this filter yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="parent-pagination">
          <button disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {currentPage} of {pageCount}</span>
          <button disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
        </div>
      </section>
      <section className="parent-panel">
        <span className="result-eyebrow">Detailed Session Timeline</span>
        <h2>{selectedRecord ? getEventLabel(selectedRecord.eventType) : "Select a record"}</h2>
        <div className="parent-session-timeline">
          {paginatedTimeline.length ? paginatedTimeline.map((event) => (
            <article key={event.id}>
              <time>{new Date(event.timestamp).toLocaleString()}</time>
              <strong>{getEventLabel(event.eventType)}</strong>
              <span>{getEventTopic(event)}</span>
            </article>
          )) : <div className="parent-empty-state">Select an activity record to view its session timeline.</div>}
        </div>
        {selectedTimeline.length > timelinePageSize && (
          <div className="parent-pagination">
            <button disabled={currentTimelinePage <= 1} onClick={() => setTimelinePage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page {currentTimelinePage} of {timelinePageCount}</span>
            <button disabled={currentTimelinePage >= timelinePageCount} onClick={() => setTimelinePage((value) => Math.min(timelinePageCount, value + 1))}>Next</button>
          </div>
        )}
      </section>
      <section className="parent-panel">
        <span className="result-eyebrow">Attendance History</span>
        <h2>Scheduled Learning Attendance</h2>
        <div className="parent-table-wrap">
          <table className="parent-dashboard-table">
            <thead><tr><th>Scheduled Time</th><th>Actual Login Time</th><th>Attendance Status</th></tr></thead>
            <tbody>
              {attendanceRows.length ? attendanceRows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.scheduledTime).toLocaleString()}</td>
                  <td>{row.actualLoginTime ? new Date(row.actualLoginTime).toLocaleString() : "-"}</td>
                  <td>{row.status}</td>
                </tr>
              )) : <tr><td colSpan="3">No timetable attendance records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="success-dashboard-grid parent-history-summary">
        <InsightCard title="Total Learning Time" value={analytics.totalLearningTime} />
        <InsightCard title="Study Guides Completed" value={analytics.studyGuidesCompleted} />
        <InsightCard title="Practice Tests Completed" value={analytics.practiceTestsCompleted} />
        <InsightCard title="Mock Exams Completed" value={analytics.mockExamsCompleted} />
        <InsightCard title="Attendance Rate" value={`${analytics.attendanceRate}%`} />
        <InsightCard title="Average Accuracy" value={`${analytics.averageAccuracy}%`} />
        <InsightCard title="Weekly Learning Time" value={analytics.weeklyLearningTime} />
        <InsightCard title="Monthly Learning Time" value={analytics.monthlyLearningTime} />
      </section>
      <section className="parent-insight-grid">
        {insightCards.map((card) => (
          <article className="parent-panel parent-insight-card" key={card.title}>
            <span className="result-eyebrow">{card.title}</span>
            <h2>{card.value}</h2>
            <p>{card.note}</p>
          </article>
        ))}
      </section>
    </ParentPortalShell>
  );
}

function ActivityTimeline({ events }) {
  return (
    <section className="premium-panel">
      <span className="result-eyebrow">Recent Activity</span>
      <h2>Activity Timeline</h2>
      <div className="attempt-history-list">
        {(events.length ? events : [{ id: "empty", eventType: "No activity yet", timestamp: new Date().toISOString(), topics: [] }]).map((event) => (
          <div className="attempt-history-row" key={event.id}>
            <span>{new Date(event.timestamp).toLocaleString()}</span>
            <strong>{EVENT_LABELS[event.eventType] || event.eventType}</strong>
            <span>{event.topics?.join(", ") || "General"}</span>
            <span>{event.score ? `${event.score}%` : "-"}</span>
            <span>{event.duration ? `${Math.round(event.duration / 60)}m` : "-"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopicPanel({ title, items }) {
  return (
    <article className="premium-panel">
      <span className="result-eyebrow">Topics</span>
      <h2>{title}</h2>
      <div className="weak-area-list">
        {items.map((item) => (
          <div className="study-weak-card" key={item.topic}>
            <strong>{item.topic}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function ParentControlCard({ title, summary, active, onClick }) {
  return (
    <button className={`premium-panel success-metric-card parent-control-card ${active ? "active" : ""}`} onClick={onClick}>
      <span>{title}</span>
      <strong>{active ? "Close" : "Open"}</strong>
      <small>{summary}</small>
    </button>
  );
}

function TutorialCard({ tutorial, isOpen, onToggle }) {
  return (
    <article className={`study-plan-disclosure ${isOpen ? "open" : ""}`}>
      <button type="button" className="study-plan-disclosure-toggle" onClick={onToggle} aria-expanded={isOpen}>
        <span>
          <small className="result-eyebrow">Tutorial</small>
          <strong>{tutorial.title}</strong>
          <em>{tutorial.summary}</em>
        </span>
        <b>{isOpen ? "Close" : "Open"}</b>
      </button>
      {isOpen && (
        <div className="study-plan-disclosure-body">
          <ol className="tutorial-step-list">
            {tutorial.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

function ParentPortalHeader({
  title,
  childName,
  childAvatar,
  isMenuOpen,
  isSidebarCollapsed,
  activePage,
  canGoBack = false,
  onMenuOpen,
  onMenuClose,
  onOpenPage,
  onBack,
  notifications = [],
  unreadNotificationCount = 0,
  isNotificationPanelOpen = false,
  onNotificationToggle,
}) {
  const highlightedPage = ["liveDashboard", "historyDashboard"].includes(activePage) ? "dashboard" : activePage;
  const visibleMobilePages = ["dashboard", "liveDashboard", "historyDashboard", "reportsPage"];
  const displayChildName = getFirstName(childName && childName !== "Child" ? childName : "Linked student");

  return (
    <>
      <aside className={`parent-desktop-sidebar ${isMenuOpen ? "open" : ""} ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="parent-sidebar-logo"><img src="/logo.png" alt="Pro Tutors Hub" /></div>
        <nav>
          {PARENT_PORTAL_PAGES.map((page) => {
            const Icon = page.icon || LayoutDashboard;
            return (
              <button key={page.id} className={highlightedPage === page.id ? "active" : ""} onClick={() => onOpenPage(page.id)}>
                <Icon size={18} />
                <span>{page.label}</span>
                {page.badge && <b>{page.badge}</b>}
              </button>
            );
          })}
        </nav>
        <div className="parent-child-card">
          <ParentAvatar src={childAvatar} name={displayChildName} />
          <div><strong>{displayChildName}</strong><span>Student profile</span></div>
        </div>
        <div className="parent-help-card">
          <Headphones size={28} />
          <strong>Need Help?</strong>
          <span>Our support team is here to help.</span>
          <button onClick={() => onOpenPage("tutorHelp")}>Contact Support</button>
        </div>
      </aside>
      <div className="parent-topbar">
        <button className="parent-menu-button" onClick={onMenuOpen} aria-label="Toggle parent menu"><Menu size={24} /></button>
        <button
          className={`parent-menu-button ${!canGoBack ? "parent-back-placeholder" : ""}`}
          onClick={!canGoBack ? undefined : onBack}
          aria-label="Go back"
          tabIndex={!canGoBack ? -1 : 0}
        >
          <ArrowLeft size={22} />
        </button>
        <img src="/logo.png" alt="" />
        <div><strong>{title}</strong><span><b>{displayChildName}</b> Parent Portal</span></div>
        <div className="parent-top-actions">
          <button className="parent-bell" onClick={onNotificationToggle} aria-label="Show notifications">
            <Bell size={24} />
            {unreadNotificationCount > 0 && <b>{unreadNotificationCount}</b>}
          </button>
          {isNotificationPanelOpen && (
            <div className="parent-notification-panel">
              <h3>{unreadNotificationCount > 0 ? "New Notifications" : "Notifications"}</h3>
              <div>
                {notifications.length ? notifications.map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                    <time>{new Date(item.timestamp).toLocaleString()}</time>
                  </article>
                )) : <p>No new notifications.</p>}
              </div>
            </div>
          )}
          <ParentAvatar src={childAvatar} name={displayChildName} />
          <div className="parent-account-name"><strong>Adeniyi Ojo</strong><span>Parent Account</span></div>
        </div>
      </div>
      {isMenuOpen && <button className="sidebar-backdrop open" aria-label="Close parent menu" onClick={onMenuClose} />}
      <nav className="parent-mobile-nav">
        {visibleMobilePages.map((id) => {
          const page = PARENT_PORTAL_PAGES.find((item) => item.id === id);
          const Icon = page?.icon || LayoutDashboard;
          return <button key={id} className={highlightedPage === id ? "active" : ""} onClick={() => onOpenPage(id)}><Icon size={24} /><span>{page?.label.replace("Activity History", "History").replace("Live Monitoring", "Live")}</span></button>;
        })}
        <button onClick={onMenuOpen}><MoreHorizontal size={24} /><span>More</span></button>
      </nav>
    </>
  );
}

function ParentAvatar({ src, name = "Child" }) {
  const initials = String(name || "Child")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";
  return (
    <span className="parent-avatar">
      {src ? <img src={src} alt="" /> : <b>{initials}</b>}
    </span>
  );
}

function ParentUpgradeAccessPage({
  HeaderComponent,
  childName,
  billingCycle,
  onBillingCycleChange,
  onUpgrade,
  busy,
  message,
  renewal,
  hasParentAccess = false,
}) {
  const amount = billingCycle === "yearly" ? ELITE_PRICES.yearly : ELITE_PRICES.monthly;
  const blockRenewal = hasParentAccess && !renewal.canRenew;

  return (
    <main className="page-shell syllabus-page parent-dashboard-page">
      {React.createElement(HeaderComponent, { title: "Upgrade Access" })}
      <section className="premium-panel account-update-hero">
        <span className="result-eyebrow">Elite required</span>
        <h1>Upgrade {childName} to Elite</h1>
        <p>
          Parent controls and the separate parent portal are available only on Elite.
          Upgrade the child account tied to this parent link to continue.
        </p>
        <div className="billing-toggle" aria-label="Billing cycle">
          <button className={billingCycle === "monthly" ? "active" : ""} onClick={() => onBillingCycleChange("monthly")}>
            Monthly
          </button>
          <button className={billingCycle === "yearly" ? "active" : ""} onClick={() => onBillingCycleChange("yearly")}>
            Yearly
            <span>2 months free</span>
          </button>
        </div>
      </section>
      <section className="premium-panel subscription-card parent-upgrade-card">
        <span className="result-eyebrow">{hasParentAccess ? "Current Elite Plan" : "Parent Portal Access"}</span>
        <h2>Elite Access</h2>
        <p>Unlock parent controls, child progress reports, live monitoring and advanced success tracking.</p>
        <strong className="subscription-price">
          {formatNaira(amount)}
          <small>/{billingCycle === "yearly" ? "year" : "month"}</small>
        </strong>
        <button className="primary-button" disabled={busy || blockRenewal} onClick={onUpgrade}>
          {busy ? "Opening Payment..." : hasParentAccess ? "Renew Elite" : "Upgrade to Elite"}
        </button>
        {blockRenewal && <small className="selector-note">{renewal.message}</small>}
      </section>
      {message && <div className="auth-message account-payment-message">{message}</div>}
    </main>
  );
}

function getDefaultParentTimetable() {
  return WEEK_DAYS.map((day, index) => ({
    day,
    startTime: index < 5 ? "17:00" : "10:00",
    duration: 60,
    topics: [TOPIC_NAMES[index % TOPIC_NAMES.length]],
    enabled: index < 5,
  }));
}

function getRenewalState(subscriptionState, childPackage = "free") {
  if (!subscriptionState || childPackage === "free") {
    return { canRenew: true, isExpired: true, message: "Free access is active." };
  }

  const startedAt = subscriptionState.subscription_started_at
    ? new Date(subscriptionState.subscription_started_at).getTime()
    : 0;
  const expiresAt = subscriptionState.subscription_expires_at
    ? new Date(subscriptionState.subscription_expires_at).getTime()
    : 0;
  const now = Date.now();
  const cycle = subscriptionState.subscription_billing_cycle === "yearly" ? "yearly" : "monthly";
  const renewalDays = cycle === "yearly" ? 365 : 31;
  const renewalAt = startedAt + renewalDays * 24 * 60 * 60 * 1000;
  const isExpired = Boolean(expiresAt && now >= expiresAt);
  const canRenew = isExpired || Boolean(startedAt && now >= renewalAt);

  return {
    canRenew,
    isExpired,
    message: canRenew
      ? "Renewal is available."
      : `This subscription is active. Renewal opens on ${startedAt ? new Date(renewalAt).toLocaleDateString() : `day ${renewalDays}`}.`,
  };
}

function formatNaira(amount) {
  return `NGN ${Number(amount).toLocaleString("en-NG")}`;
}

function getReportRange(mode = "today", customStart = "", customEnd = "") {
  const now = new Date();
  const startOfDay = (date) => {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  };
  const endOfDay = (date) => {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  };

  if (mode === "week") {
    const start = startOfDay(now);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    return { start, end: endOfDay(now), mode };
  }

  if (mode === "custom") {
    const fallback = now.toISOString().slice(0, 10);
    const start = startOfDay(customStart || fallback);
    const end = endOfDay(customEnd || customStart || fallback);
    return start <= end ? { start, end, mode } : { start: end, end: start, mode };
  }

  return { start: startOfDay(now), end: endOfDay(now), mode: "today" };
}

function formatReportRangeLabel(range) {
  if (!range?.start || !range?.end) return "All available activities";
  const start = range.start.toLocaleDateString();
  const end = range.end.toLocaleDateString();
  return start === end ? start : `${start} to ${end}`;
}

function getReportRows(events = [], range) {
  return sortEventsByNewest(events)
    .filter((event) => {
      const time = new Date(event.timestamp);
      return (!range?.start || time >= range.start) && (!range?.end || time <= range.end);
    })
    .map((event) => {
      const date = new Date(event.timestamp);
      const durationSeconds = Number(event.duration) || 0;
      return {
        id: event.id || `${event.eventType}-${event.timestamp}`,
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        activity: getEventLabel(event.eventType),
        page: getEventSubject(event),
        topic: getEventTopic(event),
        duration: durationSeconds ? formatDuration(durationSeconds) : "-",
        durationSeconds,
        score: typeof event.score === "number" ? `${event.score}%` : "-",
        status: getEventStatus(event),
      };
    });
}

function buildReportTopicRows(todayRows = [], timetable = [], todayName = "") {
  const touchedTopics = new Map();
  todayRows.forEach((row) => {
    if (!row.topic || row.topic === "-") return;
    const existing = touchedTopics.get(row.topic) || { topic: row.topic, durationSeconds: 0, completed: false };
    existing.durationSeconds += row.durationSeconds || 0;
    existing.completed = existing.completed || row.status === "Completed";
    touchedTopics.set(row.topic, existing);
  });

  const scheduledTopics = timetable
    .filter((row) => row.day === todayName && row.enabled !== false)
    .flatMap((row) => row.topics || [])
    .filter(Boolean);

  scheduledTopics.forEach((topic) => {
    if (!touchedTopics.has(topic)) touchedTopics.set(topic, { topic, durationSeconds: 0, completed: false });
  });

  const rows = [...touchedTopics.values()].map((row) => ({
    topic: row.topic,
    status: row.completed ? "Completed" : row.durationSeconds ? "In Progress" : "Not Started",
  }));

  return rows.length ? rows.slice(0, 4) : [{ topic: "No topic activity yet", status: "Not Started" }];
}

function buildWeeklyReportBars(events = []) {
  const weekRange = getReportRange("week", "", "");
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayMinutes = Array(7).fill(0);
  events.forEach((event) => {
    const time = new Date(event.timestamp);
    if (time < weekRange.start || time > weekRange.end) return;
    const index = (time.getDay() + 6) % 7;
    dayMinutes[index] += Math.round((Number(event.duration) || 0) / 60);
  });
  const maxMinutes = Math.max(1, ...dayMinutes);
  return dayMinutes.map((minutes, index) => ({
    day: dayLabels[index],
    minutes,
    height: minutes ? Math.max(12, Math.round((minutes / maxMinutes) * 100)) : 6,
  }));
}

function downloadParentReportPdf({ filename, title, rangeLabel, summary = [], rows = [] }) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 42;
  const rowsPerPage = 20;
  const rowPages = [];
  for (let index = 0; index < Math.max(1, rows.length); index += rowsPerPage) {
    rowPages.push(rows.slice(index, index + rowsPerPage));
  }
  const objects = [];
  const pageObjectIds = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  rowPages.forEach((pageRows, pageIndex) => {
    const commands = buildParentReportPdfPage({
      pageWidth,
      pageHeight,
      margin,
      title,
      rangeLabel,
      summary,
      rows: pageRows,
      pageIndex,
      pageCount: rowPages.length,
    });
    const resources = `/Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >>`;
    const contentId = addObject(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects[pageId - 1] = objects[pageId - 1].replace(`/Font << /F1 ${fontId} 0 R >>`, resources);
    pageObjectIds.push(pageId);
  });

  const kids = pageObjectIds.map((id) => `${id} 0 R`).join(" ");
  const pagesId = addObject(`<< /Type /Pages /Kids [${kids}] /Count ${pageObjectIds.length} >>`);
  pageObjectIds.forEach((pageId) => {
    objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
  });
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildParentReportPdfPage({ pageWidth, pageHeight, margin, title, rangeLabel, summary, rows, pageIndex, pageCount }) {
  const commands = [];
  const text = (value, x, y, size = 10, font = "F1", color = "0.12 0.06 0.18 rg") => {
    commands.push(`${color} BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
  };
  const rect = (x, y, width, height, color, stroke = false) => {
    commands.push(`${color} ${x} ${y} ${width} ${height} re ${stroke ? "B" : "f"}`);
  };
  const line = (x1, y1, x2, y2, color = "0.72 0.66 0.76 RG") => {
    commands.push(`${color} ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  rect(0, pageHeight - 92, pageWidth, 92, "0.15 0.06 0.25 rg");
  text("PRO TUTORS HUB", margin, pageHeight - 42, 18, "F2", "1 1 1 rg");
  text("Professional Parent Monitoring Report", margin, pageHeight - 62, 10, "F1", "1 1 1 rg");
  text("info@protutorshub.com | www.protutorshub.com", margin, pageHeight - 78, 9, "F1", "1 1 1 rg");
  text(title, margin, pageHeight - 122, 16, "F2");
  text(`Range: ${rangeLabel}`, margin, pageHeight - 140, 10);
  text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 156, 9);

  const summaryY = pageHeight - 214;
  const boxWidth = 82;
  summary.slice(0, 6).forEach(([label, value], index) => {
    const x = margin + index * (boxWidth + 6);
    rect(x, summaryY, boxWidth, 42, "0.95 0.91 0.99 rg", true);
    text(String(label), x + 7, summaryY + 25, 7, "F2");
    text(String(value), x + 7, summaryY + 10, 10, "F2");
  });

  const tableTop = pageIndex === 0 ? pageHeight - 258 : pageHeight - 126;
  const columns = [
    ["Date", 56],
    ["Time", 48],
    ["Activity", 88],
    ["Page", 82],
    ["Topic", 116],
    ["Duration", 58],
    ["Score", 42],
    ["Status", 52],
  ];
  let x = margin;
  rect(margin, tableTop, pageWidth - margin * 2, 24, "0.15 0.06 0.25 rg");
  columns.forEach(([label, width]) => {
    text(label, x + 4, tableTop + 8, 7, "F2", "1 1 1 rg");
    x += width;
  });

  let y = tableTop - 20;
  const rowHeight = 24;
  const printableRows = rows.length ? rows : [{ date: "-", time: "-", activity: "No activity", page: "-", topic: "-", duration: "-", score: "-", status: "-" }];
  printableRows.forEach((row, index) => {
    if (index % 2 === 0) rect(margin, y - 6, pageWidth - margin * 2, rowHeight, "0.98 0.96 0.99 rg");
    x = margin;
    [row.date, row.time, row.activity, row.page, row.topic, row.duration, row.score, row.status].forEach((cell, cellIndex) => {
      text(truncatePdfCell(cell, cellIndex === 4 ? 24 : 16), x + 4, y + 2, 7);
      x += columns[cellIndex][1];
    });
    line(margin, y - 8, pageWidth - margin, y - 8, "0.82 0.78 0.86 RG");
    y -= rowHeight;
  });

  line(margin, 54, pageWidth - margin, 54, "0.15 0.06 0.25 RG");
  text("This report is prepared on Pro Tutors Hub letterhead for parent monitoring records.", margin, 38, 8);
  text(`Page ${pageIndex + 1} of ${pageCount}`, pageWidth - margin - 60, 38, 8);
  return commands.join("\n");
}

function truncatePdfCell(value, maxLength) {
  const text = String(value || "-");
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3))}...` : text;
}

function escapePdfText(value = "") {
  return String(value)
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join("")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadFlutterwaveInlineScript() {
  if (window.FlutterwaveCheckout) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector("script[data-flutterwave-inline='true']");
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Flutterwave could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.dataset.flutterwaveInline = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Flutterwave could not load."));
    document.body.appendChild(script);
  });
}

function InsightCard({ title, value }) {
  return (
    <article className="premium-panel insight-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function PreferenceToggle({ label, checked, disabled, onChange }) {
  return (
    <label className="monitoring-toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
