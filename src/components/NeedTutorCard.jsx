import React from "react";

export default function NeedTutorCard({ onClick, parentMode = false }) {
  return (
    <section className="premium-panel need-tutor-card">
      <div>
        <span className="result-eyebrow">Need a tutor?</span>
        <h2>{parentMode ? "Request Personal Tutorials" : "Get Personal Tutor Help"}</h2>
        <p>
          {parentMode
            ? "Ask Pro Tutors Hub about one-on-one lessons, revision support or a personal plan for your child."
            : "Ask Pro Tutors Hub for one-on-one support, revision help or guidance on difficult topics."}
        </p>
      </div>
      <button type="button" className="primary-button compact-button" onClick={onClick}>
        Tutor Help
      </button>
    </section>
  );
}