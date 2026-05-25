"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");

  return (
    <form
      className="footer-newsletter-form"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <input
        aria-label="Email"
        className="form-field"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        required
        type="email"
        value={email}
      />
      <button className="action-link action-primary" type="submit">
        Subscribe
      </button>
    </form>
  );
}
