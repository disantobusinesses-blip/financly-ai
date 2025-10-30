export default function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-gray-500 border-t">
      <div className="flex justify-center gap-6">
        <span>🔒 Bank-grade encryption</span>
        <span>⚡ Powered by Basiq</span>
        <span>💳 Secure payments with Stripe</span>
      </div>
      <p className="mt-4">&copy; {new Date().getFullYear()} MyAiBank</p>
    </footer>
  );
}
