import React from "react";
import { Globe, Mail, MessageCircle, QrCode } from "lucide-react";

const whatsappUrl = "https://wa.me/2347039745813";

const contactCards = [
  {
    title: "WhatsApp",
    detail: "+2347039745813",
    href: whatsappUrl,
    icon: MessageCircle,
    action: "Open WhatsApp",
    accent: "whatsapp",
  },
  {
    title: "Email",
    detail: "info@protutorshub.com",
    href: "mailto:info@protutorshub.com",
    icon: Mail,
    action: "Send Email",
    accent: "email",
  },
  {
    title: "Website",
    detail: "www.protutorshub.com",
    href: "https://www.protutorshub.com",
    icon: Globe,
    action: "Visit Website",
    accent: "website",
  },
  {
    title: "Instagram",
    detail: "@ProTutorsHub",
    href: "https://www.instagram.com/ProTutorsHub",
    action: "Open Instagram",
    accent: "instagram",
    platformMark: "IG",
  },
  {
    title: "Facebook",
    detail: "@ProTutorsHub",
    href: "https://www.facebook.com/ProTutorsHub",
    action: "Open Facebook",
    accent: "facebook",
    platformMark: "f",
  },
  {
    title: "Twitter/X",
    detail: "@ProTutorsHub",
    href: "https://x.com/ProTutorsHub",
    action: "Open X",
    accent: "twitter",
    platformMark: "X",
  },
];

export default function TutorHelpPage({ HeaderComponent, onBack, onPrevious, onNext }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(
    whatsappUrl,
  )}`;

  return (
    <div className="page-content">
      {React.createElement(HeaderComponent, {
        title: "Tutor Help",
        subtitle: "Direct support from Pro Tutors Hub",
        onBack,
      })}

      <section className="premium-card tutor-help-hero">
        <div>
          <p className="eyebrow">Support Desk</p>
          <h2>Need Help from Pro Tutors Hub?</h2>
          <p>
            Reach our team for tutoring support, exam preparation guidance, subscriptions, and help
            using the learning platform.
          </p>
        </div>
        <a className="primary-button tutor-hero-button" href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle size={18} />
          Open WhatsApp
        </a>
      </section>

      <section className="tutor-contact-grid">
        {contactCards.map((card) => {
          const Icon = card.icon;

          return (
            <a
              className={`premium-card tutor-contact-card ${card.accent}`}
              href={card.href}
              target={card.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={card.href.startsWith("mailto:") ? undefined : "noreferrer"}
              key={card.title}
            >
              <span className="tutor-contact-icon" aria-hidden="true">
                {Icon ? <Icon size={24} /> : <span className="tutor-platform-mark">{card.platformMark}</span>}
              </span>
              <span>
                <strong>{card.title}</strong>
                <small>{card.detail}</small>
              </span>
              <em>{card.action}</em>
            </a>
          );
        })}
      </section>

      <section className="premium-card tutor-qr-card">
        <div className="tutor-qr-copy">
          <span className="tutor-contact-icon qr" aria-hidden="true">
            <QrCode size={24} />
          </span>
          <div>
            <p className="eyebrow">Quick Contact</p>
            <h3>Scan to Contact Pro Tutors Hub</h3>
            <p>Scan this QR code with any phone camera to open our WhatsApp chat directly.</p>
          </div>
        </div>
        <a className="tutor-qr-link" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Open WhatsApp QR chat">
          <img className="tutor-qr-image" src={qrCodeUrl} alt="QR code linking to Pro Tutors Hub WhatsApp chat" />
        </a>
      </section>

      <div className="navigation-buttons">
        <button type="button" className="secondary-button" onClick={onPrevious}>
          Previous
        </button>
        <button type="button" className="primary-button" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}