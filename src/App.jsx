import React, { useEffect, useRef, useState } from "react";
import {
  Authenticator,
  Button,
  Heading,
  Flex,
  View,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import outputs from "./amplify_outputs.json";
import { useAuthenticator } from "@aws-amplify/ui-react";

Amplify.configure(outputs);

/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */
const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const cyberRef = useRef(null);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [userProfiles, setUserProfiles] = useState([]);
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  // ⏰ Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🕹️ Mouse interaction and online status listeners
  useEffect(() => {
    const el = cyberRef.current;
    function handleMove(e) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      el.style.setProperty("--mx", `${(x - 0.5) * 40}px`);
      el.style.setProperty("--my", `${(y - 0.5) * 20}px`);
    }
    function handleClick(e) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const pulse = document.createElement("div");
      pulse.className = "click-pulse";
      pulse.style.left = px + "px";
      pulse.style.top = py + "px";
      el.appendChild(pulse);
      setTimeout(() => pulse.remove(), 1200);
    }
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    if (el) {
      el.addEventListener("mousemove", handleMove);
      el.addEventListener("click", handleClick);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      if (el) {
        el.removeEventListener("mousemove", handleMove);
        el.removeEventListener("click", handleClick);
      }
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ☁️ Cloud quote fetcher
  async function fetchQuote() {
    setLoadingQuote(true);
    try {
      const res = await fetch("https://api.quotable.io/random?tags=technology|science|innovation");
      const data = await res.json();
      setQuote(data);
    } catch {
      setQuote({ content: "Push your limits — and your code — to the cloud.", author: "CS642" });
    } finally {
      setLoadingQuote(false);
    }
  }

  // 🔄 Load DynamoDB UserProfiles
  async function fetchUserProfiles() {
    try {
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserProfiles();
    }
  }, [user]);

  // ------------------ UI ------------------
  return (
    <div className="auth-wrapper">
      {/* Left: Main Content */}
      <div className="left-side">
        <div className="auth-card">
          <div className="card-head">
            <div
              className={`status-dot ${online ? "online" : "offline"}`}
              title={online ? "Online" : "Offline"}
            />
            <h1 className="welcome-title">
              {user ? `Welcome, ${user.username}` : "Welcome"}
            </h1>
          </div>

          <p className="course-info">CS 642/442 — Cloud Computing Portal</p>

          {/* Authenticator OR Data Dashboard */}
          <div className="form-wrapper">
            <Authenticator>
              {({ signOut, user }) => (
                <main className="profile-section">
                  <Heading level={2}>My Profile</Heading>
                  <Divider />
                  <Grid
                    margin="2rem 0"
                    autoFlow="column"
                    justifyContent="center"
                    gap="1.5rem"
                    alignContent="center"
                  >
                    {userProfiles.map((profile) => (
                      <Flex
                        key={profile.id || profile.email}
                        direction="column"
                        justifyContent="center"
                        alignItems="center"
                        border="1px solid #ccc"
                        padding="1.5rem"
                        borderRadius="8px"
                        className="box"
                      >
                        <View>
                          <Heading level={4}>{profile.email}</Heading>
                          <p>{profile.profileOwner}</p>
                        </View>
                      </Flex>
                    ))}
                  </Grid>

                  <Button onClick={signOut}>Sign Out</Button>
                </main>
              )}
            </Authenticator>
          </div>

          <div className="interactive-row">
            <button className="mini-btn" onClick={fetchQuote} disabled={loadingQuote}>
              {loadingQuote ? "Loading..." : "Get Cloud Tip"}
            </button>
            <div className="clock">{time}</div>
          </div>

          {quote && (
            <div className="quote-box">
              <p className="quote">“{quote.content}”</p>
              <p className="quote-author">— {quote.author}</p>
            </div>
          )}

          <p className="university">University of Nevada, Reno</p>
        </div>
      </div>

      {/* Right: Cyber Grid */}
      <div className="right-side">
        <div className="cyber-bg" ref={cyberRef}>
          <div className="nebula" />
          <div className="grid" />
          <div className="click-hint">Try clicking anywhere on the grid</div>
          <div className="glow" />
        </div>
      </div>
    </div>
  );
}
