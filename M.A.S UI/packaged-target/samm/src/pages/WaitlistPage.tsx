import WaitlistScreen from "@/components/public/WaitlistScreen";

export default function WaitlistPage() {
  return (
    <WaitlistScreen
      loginHref="/login"
      homeHref="/"
      title="Request a demo"
      subtitle="Tell us about your current content workflow and we will follow up with a walkthrough."
    />
  );
}
