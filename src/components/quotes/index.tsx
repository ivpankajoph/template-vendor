"use client";

import React from "react";

export default function QuoteBlock() {
  const quotes = [
    "“Your journey to success begins with a single step.”",
    "“Great businesses start with great registration.”",
    "“Empower your venture, empower yourself.”",
    "“Every detail counts in building trust.”",
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="max-w-4xl mx-auto mt-12 text-center px-4">
      <p className="text-xl md:text-2xl font-semibold text-primary">{randomQuote}</p>
      <hr className="border-t border-muted-foreground mt-4 w-24 mx-auto" />
    </div>
  );
}
