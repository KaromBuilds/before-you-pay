export const metadata = { title: "Privacy — Before You Pay" };

export default function Privacy() {
  return (
    <article className="max-w-2xl space-y-3 text-[15px] leading-relaxed">
      <h1 className="text-3xl font-extrabold text-navy">Privacy</h1>
      <p className="text-sm text-mute">Last updated: November 1, 2026</p>
      <p><b>Your screenshot.</b> When you upload a checkout screenshot, it is sent once to our server and to Google’s Gemini model so the text can be read. We do not store the image.</p>
      <p><b>Without an account.</b> If you don’t sign in, nothing about your check is saved anywhere.</p>
      <p><b>With Google sign-in.</b> We receive your Google account’s email and name only to identify your history. If you choose “Save to my history,” we store the store name, item names, sizes, prices, the money-at-risk result, the flags and your decision. Only you can see these rows (database row-level security). You can delete any saved check from the History page.</p>
      <p><b>What we never do.</b> We don’t sell or share your data, we don’t show ads, we have no affiliate links, and no store pays us.</p>
      <p><b>Contact.</b> karom.builds@gmail.com</p>
    </article>
  );
}
