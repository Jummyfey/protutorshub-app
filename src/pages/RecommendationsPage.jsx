import React, { useState } from "react";
import { sendOwnerRecommendation } from "../services/recommendations";

export default function RecommendationsPage({
  HeaderComponent,
  userName,
  userEmail,
  role = "Student",
  pageContext = "General",
  parentMode = false,
  onBack,
  onPrevious,
  onNext,
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submitRecommendation = async () => {
    setBusy(true);
    setStatus("");
    setError("");

    try {
      await sendOwnerRecommendation({
        name: userName,
        email: userEmail,
        role,
        pageContext,
        message,
      });
      setMessage("");
      setStatus("Thank you. Your recommendation has been sent to Pro Tutors Hub.");
    } catch (submitError) {
      setError(submitError.message || "Unable to send recommendation. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={`page-shell syllabus-page ${parentMode ? "parent-dashboard-page" : ""}`}>
      {React.createElement(HeaderComponent, {
        title: "Recommendations",
        onBack,
        onPrevious,
        onNext,
      })}

      <section className="premium-panel recommendation-panel">
        <span className="result-eyebrow">Recommendations</span>
        <h1>Help Us Improve Pro Tutors Hub</h1>
        <p>
          Send ideas, corrections, feature requests or complaints directly to the app owners.
          We will receive your recommendation by email.
        </p>

        <label>
          Your recommendation
          <textarea
            value={message}
            rows={8}
            placeholder="Type your recommendation here..."
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>

        <button className="primary-button" type="button" disabled={busy} onClick={submitRecommendation}>
          {busy ? "Sending..." : "Send Recommendation"}
        </button>

        {status && <div className="auth-message">{status}</div>}
        {error && <div className="auth-message error">{error}</div>}
      </section>
    </main>
  );
}