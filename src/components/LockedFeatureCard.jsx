import { Lock } from "lucide-react";

export default function LockedFeatureCard({
  title = "Premium Analysis",
  message = "Upgrade to Standard to unlock detailed analysis.",
}) {
  return (
    <article className="locked-feature-card">
      <div className="locked-feature-icon">
        <Lock size={24} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </article>
  );
}