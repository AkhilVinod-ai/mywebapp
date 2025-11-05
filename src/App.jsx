import { useEffect, useMemo, useState } from "react";
import {
  Button, Heading, Flex, View, Grid, Divider, Text, Badge, SwitchField
} from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import "./App.css";

Amplify.configure(outputs);

const client = generateClient({ authMode: "userPool" });

// --- configurable bits ---
const COURSE = "CS442/642";
const END_DATE = new Date("2025-12-17");              // Dec 17
const CLASS_DAYS = [1, 3];                            // Monday=1, Wednesday=3
const ADMIN_EMAILS = ["you@unr.edu"];                 // add instructor emails here
// --------------------------

function toYMD(d) { return d.toISOString().slice(0,10); }

function buildSessions(from = new Date(), to = END_DATE) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const sessions = [];
  for (let d = new Date(start); d <= to; d.setDate(d.getDate()+1)) {
    const dow = d.getDay();
    if (CLASS_DAYS.includes(dow)) sessions.push(toYMD(new Date(d)));
  }
  return sessions;
}

export default function App() {
  const { user, signOut } = useAuthenticator((ctx) => [ctx.user]);
  const email = user?.signInDetails?.loginId || user?.username || "unknown";
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [attendances, setAttendances] = useState([]);     // this user only (owner)
  const [marking, setMarking] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const isAdmin = ADMIN_EMAILS.includes(email);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // fetch this user's attendance records
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await client.models.Attendance.list({
          filter: { attendeeEmail: { eq: email }, courseCode: { eq: COURSE } },
        });
        if (mounted) setAttendances(data || []);
      } catch (e) {
        console.error("Attendance model not found or not deployed yet.", e);
      }
    })();
    return () => { mounted = false; };
  }, [email]);

  const sessions = useMemo(() => buildSessions(new Date(), END_DATE), []);
  const todayYMD = toYMD(new Date());
  const isClassToday = sessions.includes(todayYMD) && new Date() <= END_DATE;
  const alreadyMarkedToday = attendances.some(a => a.classDate === todayYMD);

  async function markToday() {
    if (!isClassToday || alreadyMarkedToday) return;
    setMarking(true);
    try {
      const now = new Date().toISOString();
      const { data: created } = await client.models.Attendance.create({
        attendeeEmail: email,
        profileOwner: user?.username,   // for @auth owner rule
        courseCode: COURSE,
        classDate: todayYMD,
        status: "Present",
        markedAt: now,
      });
      setAttendances(prev => [created, ...prev]);
      // confetti pulse
      const el = document.querySelector(".pulse-ring");
      if (el) { el.classList.remove("go"); void el.offsetWidth; el.classList.add("go"); }
    } catch (e) {
      console.error("Mark attendance failed:", e);
      alert("Could not mark attendance. Is the Attendance model deployed?");
    } finally {
      setMarking(false);
    }
  }

  // Admin: fetch today’s attendees
  const [todayList, setTodayList] = useState([]);
  useEffect(() => {
    if (!(adminMode && isAdmin)) return;
    (async () => {
      try {
        const { data } = await client.models.Attendance.list({
          filter: { courseCode: { eq: COURSE }, classDate: { eq: todayYMD } },
        });
        setTodayList(data || []);
      } catch (e) {
        setTodayList([]);
      }
    })();
  }, [adminMode, isAdmin, todayYMD]);

  function exportCsv() {
    const rows = [["email","classDate","status","markedAt"]];
    todayList.forEach(a => rows.push([a.attendeeEmail, a.classDate, a.status, a.markedAt]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `attendance_${todayYMD}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="cyber-bg">
      <div className="cyber-overlay"></div>
      <Flex className="App" justifyContent="center" alignItems="center" direction="column" width="90%" margin="0 auto" minHeight="100vh">
        <div className="header">
          <Heading level={2} className="title-glow">👾 Cyber Profile Portal</Heading>
          <Text className="clock">{time}</Text>
        </div>

        <Divider className="divider" />

        {/* Attendance Card */}
        <div className="attendance-card">
          <Heading level={4} className="subhead">{COURSE} • Attendance</Heading>
          <Text className="hint">Classes: Monday & Wednesday • through {END_DATE.toLocaleDateString()}</Text>

          <div className="today-row">
            <Badge variation={isClassToday ? "info" : "warning"}>{isClassToday ? "Class Today" : "No Class Today"}</Badge>
            <Text className="today-date">{todayYMD}</Text>
          </div>

          <div className="mark-wrap">
            <div className={`pulse-ring ${(!isClassToday || alreadyMarkedToday) ? "disabled" : ""}`}></div>
            <Button
              className="mark-btn"
              isDisabled={!isClassToday || alreadyMarkedToday || marking}
              onClick={markToday}
            >
              {alreadyMarkedToday ? "Already Marked" : (marking ? "Marking..." : "Mark Attendance")}
            </Button>
          </div>

          <Grid gap="0.75rem" className="chips">
            {sessions.slice(0, 12).map(d => {
              const rec = attendances.find(a => a.classDate === d);
              return (
                <Badge key={d} variation={rec ? "success" : (d > todayYMD ? "neutral" : "error")}>
                  {d} • {rec ? "Present" : (d > todayYMD ? "Upcoming" : "Absent")}
                </Badge>
              );
            })}
          </Grid>
        </div>

        {/* Admin toggle & panel */}
        {isAdmin && (
          <div className="admin-panel">
            <SwitchField
              label="Admin mode"
              isChecked={adminMode}
              onChange={(e) => setAdminMode(e.target.checked)}
            />
            {adminMode && (
              <View className="admin-card">
                <Heading level={5}>Today’s Check-ins ({todayYMD})</Heading>
                <Grid className="table">
                  <div className="row head"><span>Email</span><span>Status</span><span>Marked At</span></div>
                  {todayList.map(r => (
                    <div className="row" key={r.id}>
                      <span>{r.attendeeEmail}</span>
                      <span>{r.status}</span>
                      <span>{new Date(r.markedAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {todayList.length === 0 && <div className="row empty">No check-ins yet</div>}
                </Grid>
                <Button onClick={exportCsv} className="export-btn">Export CSV</Button>
              </View>
            )}
          </div>
        )}

        <Button className="signout-btn" onClick={signOut}>Sign Out</Button>
      </Flex>
    </div>
  );
}