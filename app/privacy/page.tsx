export const metadata = { title: "Privacy — Before You Pay" };

export default function Privacy() {
  return (
    <article className="max-w-2xl space-y-3 text-[15px] leading-relaxed">
      <h1 className="text-3xl font-extrabold text-navy">Privacy</h1>
      <p className="text-sm text-mute">Last updated: November 14, 2026</p>
      <p><b>Your screenshot.</b> When you upload a checkout screenshot, it is sent once to our server and to Google’s Gemini model so the text can be read. We do not store the image.</p>
      <p><b>Without an account.</b> If you don’t sign in, nothing about your check is saved on our servers. Your own browser remembers how many free checks you used this month and any pack or pass code you entered; clearing your browser data removes them.</p>
      <p><b>Anonymous event log.</b> We count what people do on the site (for example “a screenshot was read,” “the pricing page was opened,” “a plan button was clicked”), with a random id per visit, the language and phone/desktop. Never the image, items, prices, store, account or IP.</p>
      <p><b>Pack and pass codes.</b> Codes are stored only as a scrambled fingerprint (SHA-256) with how many checks are left or when a pass ends. A code is not linked to your name, email or payment.</p>
      <p><b>Requesting a pack or pass.</b> If you send a request from the Pricing page, we store the plan, your Google email, an optional WhatsApp number and your consent, only to contact you about that request. Only you and the founder can see it, and you can delete it from the Pricing page at any time. Payment happens outside this site (bank transfer or cash); we never see or store card or bank details.</p>
      <p><b>Saved simulator scenarios.</b> If you save a scenario, we store its name and its numbers. Only you can see it, and you can delete it.</p>
      <p><b>With Google sign-in.</b> We receive your Google account’s email and name only to identify your history. If you choose “Save to my history,” we store the store name, item names, sizes, prices, the money-at-risk result, the flags and your decision. Only you can see these rows (database row-level security). You can delete any saved check from the History page.</p>
      <p><b>What we never do.</b> We don’t sell or share your data, we don’t show ads, we have no affiliate links, and no store pays us.</p>
      <p><b>Deleting your data.</b> You can delete your saved checks (History), your saved scenarios (Simulator) and your pack or pass requests (Pricing) yourself, at any time. Clearing your browser data removes the free-check counter and any code saved on your device.</p>
    </article>
  );
}
